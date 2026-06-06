import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Eye, Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { ActionType, NormalizedMedia } from "../types";
import { AddToListControl } from "./AddToListControl";
import { LogModal } from "./LogModal";
import { StarRating } from "./StarRating";
import { useToast } from "./Toast";

export const PosterCard = ({ media }: { media: NormalizedMedia }) => {
  const [modalAction, setModalAction] = useState<ActionType | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logs = useQuery({ queryKey: ["my-logs"], queryFn: api.myLogs, enabled: Boolean(user) });
  const mediaLogs = (logs.data?.logs ?? []).filter(
    (log) => log.external_media_id === media.external_media_id && log.media_type === media.media_type
  );
  const diaryLog = mediaLogs.find((log) => log.action_type === "diary_entry");
  const watchlistLog = mediaLogs.find((log) => log.action_type === "watchlist");
  const likeLog = mediaLogs.find((log) => log.action_type === "like");
  const ratingLog = mediaLogs.find((log) => log.action_type === "rating_only");
  const visibleRating = diaryLog?.rating ?? ratingLog?.rating ?? null;
  const isConsumed = Boolean(diaryLog);
  const isQueued = Boolean(watchlistLog);
  const isLiked = Boolean(likeLog);

  const requireLogin = (): boolean => {
    if (user) return true;
    showToast("Please log in or sign up first");
    navigate("/login");
    return false;
  };

  const quickLog = async (action: ActionType) => {
    if (!requireLogin()) return;
    try {
      await api.saveLog({
        external_media_id: media.external_media_id,
        media_type: media.media_type,
        action_type: action,
        is_rewatch: false,
        has_spoilers: false,
        tags: []
      });
      queryClient.invalidateQueries({ queryKey: ["my-logs"] });
      showToast(action === "watchlist" ? "Added to queue" : "Updated");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
    }
  };

  const removeLog = async (id: string, message: string) => {
    if (!requireLogin()) return;
    try {
      await api.deleteLog(id);
      queryClient.invalidateQueries({ queryKey: ["my-logs"] });
      showToast(message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-md bg-zinc-900">
      <Link to={`/media/${media.media_type}/${encodeURIComponent(media.external_media_id)}`}>
        <img src={media.poster_url} alt={media.title} className="aspect-[2/3] w-full object-cover" />
      </Link>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-black/80 p-2 opacity-0 transition group-hover:opacity-100">
        <div className="text-xs font-medium text-white">{media.title}</div>
        <div className="pointer-events-auto space-y-2">
          <div className="flex justify-center">
            <StarRating score={visibleRating} compact onChange={(score) => {
              if (!requireLogin()) return;
              api.saveLog({ external_media_id: media.external_media_id, media_type: media.media_type, action_type: diaryLog ? "diary_entry" : "rating_only", rating: score, is_rewatch: diaryLog?.is_rewatch ?? false, has_spoilers: diaryLog?.has_spoilers ?? false, tags: diaryLog?.tags ?? [] }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["my-logs"] });
                showToast("Rating saved");
              }).catch((error: Error) => showToast(error.message));
            }} />
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              title={isConsumed ? "Edit watched/read log" : "Watched or read"}
              onClick={() => { if (requireLogin()) setModalAction("diary_entry"); }}
              className={isConsumed ? "rounded bg-emerald-700 p-2 text-white" : "rounded bg-zinc-800 p-2 hover:bg-emerald-700"}
            >
              {media.media_type === "book" ? <BookOpen className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button type="button" title={isLiked ? "Unlike" : "Like"} onClick={() => { if (likeLog) removeLog(likeLog.id, "Removed like"); else quickLog("like"); }} className={isLiked ? "rounded bg-rose-700 p-2 text-white" : "rounded bg-zinc-800 p-2 hover:bg-rose-700"}>
              <Heart className="h-4 w-4" />
            </button>
            <button type="button" title="Rate" onClick={() => { if (requireLogin()) setModalAction("rating_only"); }} className="rounded bg-zinc-800 p-2 text-xs hover:bg-amber-700">
              <Star className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={isQueued ? "Remove from watchlist / TBR" : "Watchlist or TBR"}
              onClick={() => { if (watchlistLog) removeLog(watchlistLog.id, "Removed from queue"); else if (!isConsumed) quickLog("watchlist"); }}
              className={isConsumed || isQueued ? "rounded bg-sky-700 p-2 text-white" : "rounded bg-zinc-800 p-2 hover:bg-sky-700"}
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
          {(isConsumed || isQueued || isLiked || visibleRating) && (
            <div className="flex flex-wrap gap-1 text-[11px] text-zinc-200">
              {isConsumed && <span className="rounded bg-emerald-700 px-1.5 py-0.5">Logged</span>}
              {!isConsumed && isQueued && <span className="rounded bg-sky-700 px-1.5 py-0.5">Queued</span>}
              {isLiked && <span className="rounded bg-rose-700 px-1.5 py-0.5">Liked</span>}
              {visibleRating && <span className="rounded bg-amber-700 px-1.5 py-0.5">{(visibleRating / 2).toFixed(1)}</span>}
            </div>
          )}
          <AddToListControl mediaId={media.external_media_id} mediaType={media.media_type} compact />
        </div>
      </div>
      <div className="p-2">
        <h3 className="truncate text-sm font-medium"><Link to={`/media/${media.media_type}/${encodeURIComponent(media.external_media_id)}`} className="hover:text-emerald-400">{media.title}</Link></h3>
        <p className="text-xs capitalize text-zinc-500">{media.media_type} {media.release_year ? `- ${media.release_year}` : ""}</p>
      </div>
      {modalAction && (
        <LogModal
          mediaId={media.external_media_id}
          mediaType={media.media_type}
          title={media.title}
          initialAction={modalAction}
          initialLog={modalAction === "diary_entry" ? diaryLog : ratingLog}
          onClose={() => setModalAction(null)}
        />
      )}
    </article>
  );
};
