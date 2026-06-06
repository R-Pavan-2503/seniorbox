import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { ActionType, LogEntry } from "../types";
import { formatStars } from "../utils/rating";

type LibraryTab = "seen" | "queue" | "liked" | "rated";

const tabs: Array<{ id: LibraryTab; label: string; action: ActionType }> = [
  { id: "seen", label: "Seen / Read", action: "diary_entry" },
  { id: "queue", label: "Queue", action: "watchlist" },
  { id: "liked", label: "Liked", action: "like" },
  { id: "rated", label: "Rated", action: "rating_only" }
];

export const LibraryPage = () => {
  const [tab, setTab] = useState<LibraryTab>("seen");
  const query = useQuery({ queryKey: ["my-logs"], queryFn: api.myLogs });
  const active = tabs.find((item) => item.id === tab) ?? tabs[0];
  const logs = (query.data?.logs ?? []).filter((log) => log.action_type === active.action);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-semibold">My library</h1>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tab === item.id ? "rounded-md bg-emerald-600 px-3 py-2 text-sm text-white" : "rounded-md border px-3 py-2 text-sm text-zinc-300"}
          >
            {item.label}
          </button>
        ))}
      </div>
      {query.isLoading ? <p className="text-zinc-400">Loading library...</p> : <LogList logs={logs} empty={`No ${active.label.toLowerCase()} items yet.`} />}
    </div>
  );
};

const LogList = ({ logs, empty }: { logs: LogEntry[]; empty: string }) => {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-logs"] })
  });

  if (logs.length === 0) return <p className="text-sm text-zinc-400">{empty}</p>;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article key={log.id} className="flex items-start justify-between gap-3 rounded-md border bg-zinc-950 p-4">
          <div>
            <Link to={`/media/${log.media_type}/${encodeURIComponent(log.external_media_id)}`} className="font-medium text-zinc-100 hover:text-emerald-400">
              {log.media_type} #{log.external_media_id}
            </Link>
            <p className="mt-1 text-sm text-zinc-400">
              {log.date_consumed ?? log.created_at.slice(0, 10)}
              {log.rating ? ` - ${formatStars(log.rating)}` : ""}
            </p>
            {log.review_text && <p className="mt-2 text-sm text-zinc-300">{log.has_spoilers ? "Spoiler review" : log.review_text}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove.mutate(log.id)}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-red-400"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </article>
      ))}
    </div>
  );
};
