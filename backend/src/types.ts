import type { Request } from "express";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type MediaType = "movie" | "tv" | "book";
export type ActionType = "diary_entry" | "watchlist" | "like" | "rating_only";
export type Visibility = "public" | "private" | "unlisted";

export interface NormalizedMedia {
  external_media_id: string;
  title: string;
  poster_url: string;
  release_year: number | null;
  media_type: MediaType;
}

export interface MediaDetail extends NormalizedMedia {
  description: string | null;
  cast: string[];
  global_rating: number | null;
  source_url: string | null;
  imdb_url?: string | null;
}

export interface AuthedRequest extends Request {
  user?: User;
  supabase?: SupabaseClient;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}
