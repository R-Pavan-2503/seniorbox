import { config } from "../config.js";

interface OmdbResponse {
  Poster?: string;
}

export const PLACEHOLDER_POSTER = "https://placehold.co/400x600/111827/9ca3af?text=No+Poster";

export const posterFromImdb = async (imdbId: string | null): Promise<string> => {
  if (!imdbId) return PLACEHOLDER_POSTER;
  const params = new URLSearchParams({ i: imdbId, apikey: config.omdbApiKey });
  const response = await fetch(`http://www.omdbapi.com/?${params.toString()}`);
  if (!response.ok) return PLACEHOLDER_POSTER;
  const data = (await response.json()) as OmdbResponse;
  return data.Poster && data.Poster !== "N/A" ? data.Poster : PLACEHOLDER_POSTER;
};
