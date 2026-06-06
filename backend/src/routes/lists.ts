import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { supabaseAdmin, supabaseForToken } from "../supabase.js";
import type { AuthedRequest } from "../types.js";
import { attachProfiles } from "../utils/profiles.js";

const router = Router();

const listBody = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  is_ranked: z.boolean().default(false),
  visibility: z.enum(["public", "private", "unlisted"]).default("public")
});

const itemBody = z.object({
  external_media_id: z.string().min(1),
  media_type: z.enum(["movie", "tv", "book"]),
  rank_position: z.number().int().positive().nullable().optional(),
  user_note: z.string().max(1000).nullable().optional()
});

router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from("lists")
      .select("*,list_items(*)")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, error.message);
    res.json({ lists: await attachProfiles((data ?? []) as Array<{ user_id: string }>) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
    const authedUser = bearer ? (await supabaseForToken(bearer).auth.getUser(bearer)).data.user : null;
    const { data, error } = await supabaseAdmin
      .from("lists")
      .select("*,list_items(*)")
      .eq("id", id)
      .single();
    if (error) throw new HttpError(404, "List not found");
    if (data.visibility !== "public" && data.user_id !== authedUser?.id) throw new HttpError(403, "This list is not public");
    const comments = await supabaseAdmin.from("list_comments").select("*").eq("list_id", id).order("created_at", { ascending: false });
    if (comments.error) throw new HttpError(500, comments.error.message);
    const likedByMe = authedUser
      ? await supabaseAdmin.from("list_likes").select("user_id").eq("list_id", id).eq("user_id", authedUser.id).maybeSingle()
      : { data: null, error: null };
    if (likedByMe.error) throw new HttpError(500, likedByMe.error.message);
    const [list] = await attachProfiles([data] as Array<{ user_id: string }>);
    res.json({
      list: {
        ...list,
        liked_by_me: Boolean(likedByMe.data),
        list_comments: await attachProfiles((comments.data ?? []) as Array<{ user_id: string }>)
      }
    });
  })
);

router.use(requireAuth);

router.get(
  "/mine/all",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { data, error } = await req.supabase!
      .from("lists")
      .select("*,list_items(*)")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, error.message);
    res.json({ lists: data ?? [] });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = listBody.parse(req.body);
    const { data, error } = await req.supabase!.from("lists").insert({ ...body, user_id: req.user!.id }).select().single();
    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ list: data });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = listBody.partial().parse(req.body);
    const { data, error } = await req.supabase!.from("lists").update(body).eq("id", id).eq("user_id", req.user!.id).select().single();
    if (error) throw new HttpError(500, error.message);
    res.json({ list: data });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { error } = await req.supabase!.from("lists").delete().eq("id", id).eq("user_id", req.user!.id);
    if (error) throw new HttpError(500, error.message);
    res.status(204).send();
  })
);

router.post(
  "/:id/items",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = itemBody.parse(req.body);
    const { data, error } = await req.supabase!.from("list_items").insert({ ...body, list_id: id }).select().single();
    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ item: data });
  })
);

router.put(
  "/items/:itemId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { itemId } = z.object({ itemId: z.string().uuid() }).parse(req.params);
    const body = itemBody.partial().parse(req.body);
    const { data, error } = await req.supabase!.from("list_items").update(body).eq("id", itemId).select().single();
    if (error) throw new HttpError(500, error.message);
    res.json({ item: data });
  })
);

router.delete(
  "/items/:itemId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { itemId } = z.object({ itemId: z.string().uuid() }).parse(req.params);
    const { error } = await req.supabase!.from("list_items").delete().eq("id", itemId);
    if (error) throw new HttpError(500, error.message);
    res.status(204).send();
  })
);

router.post(
  "/:id/like",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { error } = await req.supabase!.from("list_likes").upsert({ list_id: id, user_id: req.user!.id });
    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ liked: true });
  })
);

router.delete(
  "/:id/like",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { error } = await req.supabase!.from("list_likes").delete().eq("list_id", id).eq("user_id", req.user!.id);
    if (error) throw new HttpError(500, error.message);
    res.status(204).send();
  })
);

router.post(
  "/:id/comments",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { body } = z.object({ body: z.string().trim().min(1).max(1500) }).parse(req.body);
    const { data, error } = await req.supabase!.from("list_comments").insert({ list_id: id, user_id: req.user!.id, body }).select().single();
    if (error) throw new HttpError(500, error.message);
    res.status(201).json({ comment: data });
  })
);

export default router;
