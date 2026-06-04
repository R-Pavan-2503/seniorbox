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
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  top_four: PinnedMedia[];
}

export interface PinnedMedia {
  external_media_id: string;
  media_type: MediaType;
}

export interface LogEntry {
  id: string;
  user_id: string;
  external_media_id: string;
  media_type: MediaType;
  action_type: ActionType;
  rating: number | null;
  review_text: string | null;
  date_consumed: string | null;
  is_rewatch: boolean;
  has_spoilers: boolean;
  tags: string[];
  created_at: string;
  profiles?: Profile;
}

export interface ListItem {
  id: string;
  list_id: string;
  external_media_id: string;
  media_type: MediaType;
  rank_position: number | null;
  user_note: string | null;
}

export interface UserList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_ranked: boolean;
  visibility: Visibility;
  created_at: string;
  list_items?: ListItem[];
  profiles?: Profile;
}

export interface ListComment {
  id: string;
  list_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface UserProfilePayload {
  profile: Profile;
  logs: LogEntry[];
  lists: UserList[];
  follower_count: number;
  following_count: number;
}

export interface ActivityPayload {
  logs: LogEntry[];
  lists: UserList[];
}
