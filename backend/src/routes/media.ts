import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { getBookDetail, popularBooks } from "../services/openLibrary.js";
import { getTraktDetail, popularTrakt } from "../services/trakt.js";
import { supabaseAdmin } from "../supabase.js";
import { attachProfiles } from "../utils/profiles.js";

const router = Router();
const mediaParams = z.object({ type: z.enum(["movie", "tv", "book"]), id: z.string().min(1) });

router.get(
  "/popular/:type",
  asyncHandler(async (req, res) => {
    const { type } = z.object({ type: z.enum(["movie", "tv", "book"]) }).parse(req.params);
    const results = type === "book" ? await popularBooks() : await popularTrakt(type);
    res.json({ results });
  })
);

router.get(
  "/:type/:id",
  asyncHandler(async (req, res) => {
    const { type, id } = mediaParams.parse(req.params);
    const detail = type === "book" ? await getBookDetail(id) : await getTraktDetail(type, id);
    const { data, error } = await supabaseAdmin
      .from("logs")
      .select("id,user_id,rating,review_text,date_consumed,has_spoilers,created_at,external_media_id,media_type,action_type,is_rewatch,tags")
      .eq("external_media_id", id)
      .eq("media_type", type)
      .eq("action_type", "diary_entry")
      .not("review_text", "is", null)
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, error.message);
    res.json({ detail, reviews: await attachProfiles((data ?? []) as Array<{ user_id: string }>) });
  })
);

export default router;
