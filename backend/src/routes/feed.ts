import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { supabaseAdmin } from "../supabase.js";
import type { AuthedRequest } from "../types.js";
import { attachProfiles } from "../utils/profiles.js";

const router = Router();

router.get(
  "/activity",
  asyncHandler(async (_req, res) => {
    const [logs, lists] = await Promise.all([
      supabaseAdmin
        .from("logs")
        .select("*")
        .eq("action_type", "diary_entry")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("lists")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50)
    ]);
    if (logs.error) throw new HttpError(500, logs.error.message);
    if (lists.error) throw new HttpError(500, lists.error.message);
    res.json({
      logs: await attachProfiles((logs.data ?? []) as Array<{ user_id: string }>),
      lists: await attachProfiles((lists.data ?? []) as Array<{ user_id: string }>)
    });
  })
);

router.get(
  "/feed",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const follows = await req.supabase!.from("follows").select("following_id").eq("follower_id", req.user!.id);
    if (follows.error) throw new HttpError(500, follows.error.message);
    const ids = (follows.data ?? []).map((row) => row.following_id as string);
    if (ids.length === 0) {
      res.json({ logs: [], lists: [] });
      return;
    }
    const [logs, lists] = await Promise.all([
      req.supabase!
        .from("logs")
        .select("*")
        .in("user_id", ids)
        .eq("action_type", "diary_entry")
        .order("created_at", { ascending: false })
        .limit(50),
      req.supabase!
        .from("lists")
        .select("*")
        .in("user_id", ids)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50)
    ]);
    if (logs.error) throw new HttpError(500, logs.error.message);
    if (lists.error) throw new HttpError(500, lists.error.message);
    res.json({
      logs: await attachProfiles((logs.data ?? []) as Array<{ user_id: string }>),
      lists: await attachProfiles((lists.data ?? []) as Array<{ user_id: string }>)
    });
  })
);

export default router;
