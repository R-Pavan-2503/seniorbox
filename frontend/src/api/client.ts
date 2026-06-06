import { supabase } from "../lib/supabase";
import type { ActionType, ActivityPayload, LogEntry, MediaDetail, MediaType, NormalizedMedia, PinnedMedia, UserList, UserProfilePayload, Visibility } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

interface SearchResponse {
  results: NormalizedMedia[];
}

interface DetailResponse {
  detail: MediaDetail;
  reviews: LogEntry[];
}

interface ListsResponse {
  lists: UserList[];
}

interface ListResponse {
  list: UserList;
}

export interface LogPayload {
  external_media_id: string;
  media_type: MediaType;
  action_type: ActionType;
  rating?: number | null;
  review_text?: string | null;
  date_consumed?: string | null;
  is_rewatch?: boolean;
  has_spoilers?: boolean;
  tags?: string[];
}

export interface ListPayload {
  title: string;
  description?: string | null;
  is_ranked: boolean;
  visibility: Visibility;
}

export interface ListItemPayload {
  external_media_id: string;
  media_type: MediaType;
  rank_position?: number | null;
  user_note?: string | null;
}

const token = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

type AuthMode = boolean | "optional";

const request = async <T>(path: string, init: RequestInit = {}, authed: AuthMode = false): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (authed) {
    const accessToken = await token();
    if (!accessToken && authed === true) throw new Error("Please log in to continue");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const api = {
  search: (query: string, type: "all" | MediaType) =>
    request<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}&type=${type}`),
  popular: (type: MediaType) => request<SearchResponse>(`/api/media/popular/${type}`),
  mediaDetail: (type: MediaType, id: string) => request<DetailResponse>(`/api/media/${type}/${encodeURIComponent(id)}`),
  myLogs: () => request<{ logs: LogEntry[] }>("/api/logs/me", {}, true),
  saveLog: (payload: LogPayload) => request<{ log: LogEntry }>("/api/logs", { method: "POST", body: JSON.stringify(payload) }, true),
  deleteLog: (id: string) => request<void>(`/api/logs/${id}`, { method: "DELETE" }, true),
  userProfile: (username: string) => request<UserProfilePayload>(`/api/users/${encodeURIComponent(username)}`),
  updateProfile: (payload: Partial<{ username: string; display_name: string | null; avatar_url: string | null; bio: string | null; top_four: PinnedMedia[] }>) =>
    request<{ profile: UserProfilePayload["profile"] }>("/api/users/me/profile", { method: "PUT", body: JSON.stringify(payload) }, true),
  follow: (id: string) => request<{ following: boolean }>(`/api/users/${id}/follow`, { method: "POST" }, true),
  unfollow: (id: string) => request<void>(`/api/users/${id}/follow`, { method: "DELETE" }, true),
  publicLists: () => request<ListsResponse>("/api/lists/public"),
  myLists: () => request<ListsResponse>("/api/lists/mine/all", {}, true),
  list: (id: string, includePrivate = false) => request<ListResponse>(`/api/lists/${id}`, {}, includePrivate ? "optional" : false),
  createList: (payload: ListPayload) => request<ListResponse>("/api/lists", { method: "POST", body: JSON.stringify(payload) }, true),
  updateList: (id: string, payload: Partial<ListPayload>) =>
    request<ListResponse>(`/api/lists/${id}`, { method: "PUT", body: JSON.stringify(payload) }, true),
  deleteList: (id: string) => request<void>(`/api/lists/${id}`, { method: "DELETE" }, true),
  addListItem: (id: string, payload: ListItemPayload) =>
    request<{ item: ListItemPayload & { id: string } }>(`/api/lists/${id}/items`, { method: "POST", body: JSON.stringify(payload) }, true),
  updateListItem: (id: string, payload: Partial<ListItemPayload>) =>
    request<{ item: ListItemPayload & { id: string } }>(`/api/lists/items/${id}`, { method: "PUT", body: JSON.stringify(payload) }, true),
  deleteListItem: (id: string) => request<void>(`/api/lists/items/${id}`, { method: "DELETE" }, true),
  likeList: (id: string) => request<{ liked: boolean }>(`/api/lists/${id}/like`, { method: "POST" }, true),
  unlikeList: (id: string) => request<void>(`/api/lists/${id}/like`, { method: "DELETE" }, true),
  commentList: (id: string, body: string) =>
    request<{ comment: unknown }>(`/api/lists/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }, true),
  activity: () => request<ActivityPayload>("/api/activity"),
  feed: () => request<ActivityPayload>("/api/feed", {}, true)
};
