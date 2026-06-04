import { config } from "../config.js";
import type { MediaDetail, MediaType, NormalizedMedia } from "../types.js";
import { PLACEHOLDER_POSTER, posterFromImdb } from "./omdb.js";

interface TraktIds {
  trakt?: number;
  imdb?: string;
  slug?: string;
}

interface TraktMovie {
  title?: string;
  year?: number;
  overview?: string;
  rating?: number;
  ids?: TraktIds;
}

interface TraktShow {
  title?: string;
  year?: number;
  overview?: string;
  rating?: number;
  ids?: TraktIds;
}

interface TraktSearchItem {
  type?: "movie" | "show";
  movie?: TraktMovie;
  show?: TraktShow;
}

interface TraktPerson {
  person?: { name?: string };
}

const traktHeaders = {
  "trakt-api-key": config.traktApiKey,
  "trakt-api-version": "2",
  "Content-Type": "application/json",
  "User-Agent": "OmniLog/1.0"
};

const mediaId = (ids: TraktIds | undefined): string => String(ids?.imdb ?? ids?.trakt ?? ids?.slug ?? "");

const normalizeTrakt = async (item: TraktSearchItem): Promise<NormalizedMedia | null> => {
  const source = item.type === "show" ? item.show : item.movie;
  const id = mediaId(source?.ids);
  if (!source?.title || !id) return null;
  return {
    external_media_id: id,
    title: source.title,
    poster_url: await posterFromImdb(source.ids?.imdb ?? null),
    release_year: source.year ?? null,
    media_type: item.type === "show" ? "tv" : "movie"
  };
};

export const searchTrakt = async (query: string, type: "movie" | "tv" | "movie,tv"): Promise<NormalizedMedia[]> => {
  const traktType = type.replace("tv", "show");
  const params = new URLSearchParams({ query, limit: "12" });
  const response = await fetch(`https://api.trakt.tv/search/${traktType}?${params.toString()}`, {
    headers: traktHeaders
  });
  if (!response.ok) throw new Error(`Trakt search failed with status ${response.status}`);
  const data = (await response.json()) as TraktSearchItem[];
  const normalized = await Promise.all(data.map(normalizeTrakt));
  return normalized.filter((item): item is NormalizedMedia => item !== null);
};

export const getTraktDetail = async (type: Exclude<MediaType, "book">, id: string): Promise<MediaDetail> => {
  const endpoint = type === "tv" ? "shows" : "movies";
  const response = await fetch(`https://api.trakt.tv/${endpoint}/${encodeURIComponent(id)}?extended=full`, {
    headers: traktHeaders
  });
  if (!response.ok) throw new Error(`Trakt detail failed with status ${response.status}`);
  const data = (await response.json()) as TraktMovie | TraktShow;

  const castResponse = await fetch(`https://api.trakt.tv/${endpoint}/${encodeURIComponent(id)}/people`, {
    headers: traktHeaders
  });
  const castPayload = castResponse.ok ? ((await castResponse.json()) as { cast?: TraktPerson[] }) : { cast: [] };

  return {
    external_media_id: id,
    title: data.title ?? "Untitled",
    poster_url: await posterFromImdb(data.ids?.imdb ?? null),
    release_year: data.year ?? null,
    media_type: type,
    description: data.overview ?? null,
    cast: castPayload.cast?.map((entry) => entry.person?.name).filter((name): name is string => Boolean(name)).slice(0, 12) ?? [],
    global_rating: data.rating ?? null
  };
};

export const popularTrakt = async (type: Exclude<MediaType, "book">): Promise<NormalizedMedia[]> => {
  const endpoint = type === "tv" ? "shows" : "movies";
  const response = await fetch(`https://api.trakt.tv/${endpoint}/popular?limit=12`, { headers: traktHeaders });
  if (!response.ok) throw new Error(`Trakt popular failed with status ${response.status}`);
  const data = (await response.json()) as Array<TraktMovie | TraktShow>;
  const media = await Promise.all(
    data.map(async (item) => ({
      external_media_id: mediaId(item.ids),
      title: item.title ?? "Untitled",
      poster_url: item.ids?.imdb ? await posterFromImdb(item.ids.imdb) : PLACEHOLDER_POSTER,
      release_year: item.year ?? null,
      media_type: type
    }))
  );
  return media.filter((item) => item.external_media_id.length > 0);
};
