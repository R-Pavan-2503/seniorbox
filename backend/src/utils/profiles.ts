import { supabaseAdmin } from "../supabase.js";

export interface EmbeddedProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const attachProfiles = async <T extends { user_id: string }>(rows: T[]): Promise<Array<T & { profiles: EmbeddedProfile | null }>> => {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return rows.map((row) => ({ ...row, profiles: null }));

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .in("id", userIds);

  if (error) throw new Error(error.message);

  const profiles = new Map(
    (data ?? []).map((profile) => [
      profile.id as string,
      {
        id: profile.id as string,
        username: profile.username as string,
        display_name: profile.display_name as string | null,
        avatar_url: profile.avatar_url as string | null
      }
    ])
  );

  return rows.map((row) => ({ ...row, profiles: profiles.get(row.user_id) ?? null }));
};
