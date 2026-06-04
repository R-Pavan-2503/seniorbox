import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

const logBody = z.object({
  external_media_id: z.string().min(1),
  media_type: z.enum(["movie", "tv", "book"]),
  action_type: z.enum(["diary_entry", "watchlist", "like", "rating_only"]),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  review_text: z.string().max(5000).nullable().optional(),
  date_consumed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  is_rewatch: z.boolean().default(false),
  has_spoilers: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1)).default([])
});

router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { data, error } = await req.supabase!
      .from("logs")
      .select("*")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, error.message);
    res.json({ logs: data ?? [] });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = logBody.parse(req.body);
    const { data, error } = await req.supabase!
      .from("logs")
      .upsert({ ...body, user_id: req.user!.id }, { onConflict: "user_id,external_media_id,media_type,action_type" })
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ log: data });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { error } = await req.supabase!.from("logs").delete().eq("id", id).eq("user_id", req.user!.id);
    if (error) throw new HttpError(500, error.message);
    res.status(204).send();
  })
);

export default router;
