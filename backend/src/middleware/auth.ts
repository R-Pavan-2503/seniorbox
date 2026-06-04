import type { NextFunction, Response } from "express";
import type { AuthedRequest } from "../types.js";
import { supabaseForToken } from "../supabase.js";

export const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const scopedClient = supabaseForToken(token);
  const { data, error } = await scopedClient.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  req.user = data.user;
  req.supabase = scopedClient;
  next();
};
