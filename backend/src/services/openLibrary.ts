import type { MediaDetail, NormalizedMedia } from "../types.js";
import { PLACEHOLDER_POSTER } from "./omdb.js";

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  first_publish_year?: number;
  cover_i?: number;
  author_name?: string[];
}

interface SearchResponse {
  docs?: OpenLibraryDoc[];
}

interface WorkResponse {
  title?: string;
  description?: string | { value?: string };
  covers?: number[];
  first_publish_date?: string;
  subjects?: string[];
}

const coverUrl = (coverId: number | undefined): string =>
  coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : PLACEHOLDER_POSTER;

export const searchBooks = async (query: string): Promise<NormalizedMedia[]> => {
  const params = new URLSearchParams({ q: query, limit: "12" });
  const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
    headers: { "User-Agent": "OmniLog/1.0" }
  });
  if (!response.ok) throw new Error("Open Library search failed");
  const data = (await response.json()) as SearchResponse;
  return (data.docs ?? []).filter((doc) => doc.key && doc.title).map((doc) => ({
    external_media_id: String(doc.key).replace("/works/", ""),
    title: String(doc.title),
    poster_url: coverUrl(doc.cover_i),
    release_year: doc.first_publish_year ?? null,
    media_type: "book"
  }));
};

export const getBookDetail = async (id: string): Promise<MediaDetail> => {
  const response = await fetch(`https://openlibrary.org/works/${encodeURIComponent(id)}.json`, {
    headers: { "User-Agent": "OmniLog/1.0" }
  });
  if (!response.ok) throw new Error("Open Library detail failed");
  const data = (await response.json()) as WorkResponse;
  const description =
    typeof data.description === "string" ? data.description : data.description?.value ?? null;
  const releaseYear = data.first_publish_date ? Number(data.first_publish_date.match(/\d{4}/)?.[0]) : null;
  return {
    external_media_id: id,
    title: data.title ?? "Untitled book",
    poster_url: coverUrl(data.covers?.[0]),
    release_year: Number.isFinite(releaseYear) ? releaseYear : null,
    media_type: "book",
    description,
    cast: data.subjects?.slice(0, 8) ?? [],
    global_rating: null
  };
};

export const popularBooks = async (): Promise<NormalizedMedia[]> =>
  searchBooks("subject:fiction").then((items) => items.slice(0, 12));
