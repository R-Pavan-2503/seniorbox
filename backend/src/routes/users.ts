import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { supabaseAdmin } from "../supabase.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

router.get(
  "/:username",
  asyncHandler(async (req, res) => {
    const { username } = z.object({ username: z.string().min(1) }).parse(req.params);
    const { data: profile, error } = await supabaseAdmin.from("profiles").select("*").eq("username", username).single();
    if (error || !profile) throw new HttpError(404, "User not found");
    const [logs, lists, followers, following] = await Promise.all([
      supabaseAdmin.from("logs").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("lists").select("*,list_items(*)").eq("user_id", profile.id).eq("visibility", "public"),
      supabaseAdmin.from("follows").select("follower_id").eq("following_id", profile.id),
      supabaseAdmin.from("follows").select("following_id").eq("follower_id", profile.id)
    ]);
    res.json({
      profile,
      logs: logs.data ?? [],
      lists: lists.data ?? [],
      follower_count: followers.data?.length ?? 0,
      following_count: following.data?.length ?? 0
    });
  })
);

router.use(requireAuth);

router.put(
  "/me/profile",
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = z
      .object({
        username: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/).optional(),
        display_name: z.string().max(80).nullable().optional(),
        avatar_url: z.string().url().nullable().optional(),
        bio: z.string().max(500).nullable().optional(),
        top_four: z.array(z.object({ external_media_id: z.string(), media_type: z.enum(["movie", "tv", "book"]) })).max(4).optional()
      })
      .parse(req.body);
    const { data, error } = await req.supabase!.from("profiles").update(body).eq("id", req.user!.id).select().single();
    if (error) throw new HttpError(500, error.message);
    res.json({ profile: data });
  })
);

router.post(
  "/:id/follow",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    if (id === req.user!.id) throw new HttpError(400, "Cannot follow yourself");
    const { error } = await req.supabase!.from("follows").upsert({ follower_id: req.user!.id, following_id: id });
    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ following: true });
  })
);

router.delete(
  "/:id/follow",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { error } = await req.supabase!.from("follows").delete().eq("follower_id", req.user!.id).eq("following_id", id);
    if (error) throw new HttpError(500, error.message);
    res.status(204).send();
  })
);

export default router;
