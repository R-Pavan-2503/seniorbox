import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { SpoilerText } from "../components/SpoilerText";
import { useAuth } from "../context/AuthContext";
import type { ActionType, LogEntry, MediaType, PinnedMedia } from "../types";
import { formatStars } from "../utils/rating";

type Tab = "Films" | "Shows" | "Books" | "Diary" | "Lists" | "Watchlist";

export const ProfilePage = () => {
  const { username = "" } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Films");
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["profile", username], queryFn: () => api.userProfile(username) });
  const follow = useMutation({
    mutationFn: (id: string) => api.follow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] })
  });
  const data = query.data;

  const stats = useMemo(() => {
    const consumed = (type: MediaType) => (data?.logs ?? []).filter((log) => log.media_type === type && log.action_type === "diary_entry").length;
    return { movies: consumed("movie"), shows: consumed("tv"), books: consumed("book") };
  }, [data]);

  if (query.isLoading) return <div className="mx-auto max-w-7xl px-4 py-6 text-zinc-400">Loading profile...</div>;
  if (!data) return <div className="mx-auto max-w-7xl px-4 py-6 text-zinc-400">Profile not found.</div>;

  const filtered = logsForTab(data.logs, tab);
  const ownProfile = user?.id === data.profile.id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <img src={data.profile.avatar_url ?? "https://placehold.co/160x160/18181b/a1a1aa?text=User"} alt={data.profile.username} className="h-24 w-24 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{data.profile.display_name ?? data.profile.username}</h1>
          <p className="text-zinc-400">@{data.profile.username}</p>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300">{data.profile.bio ?? "No bio yet."}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
            <span>{data.follower_count} followers</span>
            <span>{data.following_count} following</span>
            <span>{stats.movies} movies</span>
            <span>{stats.shows} shows</span>
            <span>{stats.books} books</span>
          </div>
        </div>
        {!ownProfile && user && <button type="button" onClick={() => follow.mutate(data.profile.id)} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Follow</button>}
      </header>
      <section className="py-5">
        <h2 className="mb-3 font-semibold">Top 4</h2>
        {ownProfile ? <TopFourEditor username={username} profileId={data.profile.id} initial={data.profile.top_four ?? []} logs={data.logs} /> : <TopFourView items={data.profile.top_four ?? []} />}
      </section>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["Films", "Shows", "Books", "Diary", "Lists", "Watchlist"] as Tab[]).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? "rounded-md bg-emerald-600 px-3 py-2 text-sm" : "rounded-md border px-3 py-2 text-sm text-zinc-300"}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Lists" ? <ListSummary lists={data.lists} /> : <LogSummary logs={filtered} />}
    </div>
  );
};

const logsForTab = (logs: LogEntry[], tab: Tab): LogEntry[] => {
  const mapping: Record<Tab, { type?: MediaType; action?: ActionType }> = {
    Films: { type: "movie", action: "diary_entry" },
    Shows: { type: "tv", action: "diary_entry" },
    Books: { type: "book", action: "diary_entry" },
    Diary: { action: "diary_entry" },
    Lists: {},
    Watchlist: { action: "watchlist" }
  };
  const filter = mapping[tab];
  return logs.filter((log) => (!filter.type || log.media_type === filter.type) && (!filter.action || log.action_type === filter.action));
};

const LogSummary = ({ logs }: { logs: LogEntry[] }) => (
  <div className="space-y-3">
    {logs.map((log) => (
      <article key={log.id} className="rounded-md border bg-zinc-950 p-4">
        <div className="mb-2 flex justify-between text-sm text-zinc-400">
          <Link to={`/media/${log.media_type}/${log.external_media_id}`} className="font-medium text-zinc-100">{log.media_type} #{log.external_media_id}</Link>
          <span>{formatStars(log.rating)}</span>
        </div>
        {log.review_text && <SpoilerText text={log.review_text} hasSpoilers={log.has_spoilers} />}
      </article>
    ))}
  </div>
);

const TopFourView = ({ items }: { items: PinnedMedia[] }) => (
  <div className="grid grid-cols-4 gap-3 sm:max-w-md">
    {Array.from({ length: 4 }).map((_, index) => {
      const item = items[index];
      return (
        <div key={index} className="aspect-[2/3] rounded-md border bg-zinc-900 p-2 text-xs text-zinc-500">
          {item ? <Link to={`/media/${item.media_type}/${item.external_media_id}`}>{item.media_type} #{item.external_media_id}</Link> : "Empty"}
        </div>
      );
    })}
  </div>
);

const TopFourEditor = ({ username, initial, logs }: { username: string; profileId: string; initial: PinnedMedia[]; logs: LogEntry[] }) => {
  const [items, setItems] = useState<PinnedMedia[]>(initial);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (next: PinnedMedia[]) => api.updateProfile({ top_four: next.slice(0, 4) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] })
  });
  const candidates = logs.filter((log) => log.action_type === "diary_entry" || log.action_type === "like").slice(0, 24);

  const save = (next: PinnedMedia[]) => {
    setItems(next.slice(0, 4));
    mutation.mutate(next.slice(0, 4));
  };

  return (
    <div className="space-y-3">
      <TopFourView items={items} />
      <div className="flex flex-wrap gap-2">
        {candidates.map((log) => (
          <button
            key={log.id}
            type="button"
            onClick={() => save([...items.filter((item) => item.external_media_id !== log.external_media_id || item.media_type !== log.media_type), { external_media_id: log.external_media_id, media_type: log.media_type }])}
            className="rounded-md border px-2 py-1 text-xs text-zinc-300"
          >
            Pin {log.media_type} #{log.external_media_id}
          </button>
        ))}
      </div>
    </div>
  );
};

const ListSummary = ({ lists }: { lists: { id: string; title: string; description: string | null }[] }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {lists.map((list) => (
      <Link key={list.id} to={`/lists/${list.id}`} className="rounded-md border bg-zinc-950 p-4 hover:bg-zinc-900">
        <h3 className="font-semibold">{list.title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{list.description ?? "No description"}</p>
      </Link>
    ))}
  </div>
);
