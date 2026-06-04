import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ActivityPayload } from "../types";
import { formatStars } from "../utils/rating";

export const ActivityPage = ({ followedOnly = false }: { followedOnly?: boolean }) => {
  const query = useQuery({ queryKey: [followedOnly ? "feed" : "activity"], queryFn: followedOnly ? api.feed : api.activity });
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-semibold">{followedOnly ? "Feed" : "Global activity"}</h1>
      {query.isLoading ? <p className="text-zinc-400">Loading activity...</p> : <ActivityList data={query.data ?? { logs: [], lists: [] }} />}
    </div>
  );
};

const ActivityList = ({ data }: { data: ActivityPayload }) => {
  const entries = [
    ...data.logs.map((log) => ({ kind: "log" as const, date: log.created_at, log })),
    ...data.lists.map((list) => ({ kind: "list" as const, date: list.created_at, list }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3">
      {entries.map((entry) =>
        entry.kind === "log" ? (
          <article key={`log-${entry.log.id}`} className="rounded-md border bg-zinc-950 p-4">
            <p className="text-sm text-zinc-400">{entry.log.profiles?.username ?? "user"} logged {entry.log.media_type} #{entry.log.external_media_id} · {formatStars(entry.log.rating)}</p>
            {entry.log.review_text && <p className="mt-2 text-sm text-zinc-300">{entry.log.has_spoilers ? "Spoiler review" : entry.log.review_text}</p>}
          </article>
        ) : (
          <Link key={`list-${entry.list.id}`} to={`/lists/${entry.list.id}`} className="block rounded-md border bg-zinc-950 p-4 hover:bg-zinc-900">
            <p className="font-medium">{entry.list.profiles?.username ?? "user"} created {entry.list.title}</p>
            <p className="text-sm text-zinc-400">{entry.list.description ?? "No description"}</p>
          </Link>
        )
      )}
    </div>
  );
};
