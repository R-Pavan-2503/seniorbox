import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { SpoilerText } from "../components/SpoilerText";
import { formatStars } from "../utils/rating";

export const DiaryPage = () => {
  const { username = "" } = useParams();
  const query = useQuery({ queryKey: ["profile", username], queryFn: () => api.userProfile(username) });
  const entries = (query.data?.logs ?? []).filter((log) => log.action_type === "diary_entry");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-semibold">@{username} diary</h1>
      <div className="space-y-4">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-md border bg-zinc-950 p-4">
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-zinc-400">
              <Link to={`/media/${entry.media_type}/${entry.external_media_id}`} className="font-medium text-zinc-100">{entry.media_type} #{entry.external_media_id}</Link>
              <span>{entry.date_consumed ?? entry.created_at.slice(0, 10)} · {formatStars(entry.rating)}</span>
            </div>
            {entry.review_text && <SpoilerText text={entry.review_text} hasSpoilers={entry.has_spoilers} />}
          </article>
        ))}
      </div>
    </div>
  );
};
