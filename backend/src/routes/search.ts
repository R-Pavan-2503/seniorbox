import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { searchBooks } from "../services/openLibrary.js";
import { searchTrakt } from "../services/trakt.js";

const router = Router();

const querySchema = z.object({
  q: z.string().trim().min(1),
  type: z.enum(["all", "movie", "tv", "book"]).default("all")
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, type } = querySchema.parse(req.query);
    const tasks = [
      type === "all" || type === "book" ? searchBooks(q) : Promise.resolve([]),
      type === "all" || type === "movie" ? searchTrakt(q, "movie") : Promise.resolve([]),
      type === "all" || type === "tv" ? searchTrakt(q, "tv") : Promise.resolve([])
    ];
    const results = (await Promise.all(tasks)).flat();
    res.json({ results });
  })
);

export default router;
