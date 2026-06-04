import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { AddToListControl } from "../components/AddToListControl";
import { LogModal } from "../components/LogModal";
import { SpoilerText } from "../components/SpoilerText";
import { StarRating } from "../components/StarRating";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import type { ActionType, MediaType } from "../types";
import { formatStars } from "../utils/rating";

export const MediaDetailPage = () => {
  const { type = "movie", id = "" } = useParams();
  const mediaType = type as MediaType;
  const [modalAction, setModalAction] = useState<ActionType | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["media", mediaType, id], queryFn: () => api.mediaDetail(mediaType, id) });
  const logs = useQuery({ queryKey: ["my-logs"], queryFn: api.myLogs, enabled: Boolean(user) });
  const detail = query.data?.detail;

  if (query.isLoading) return <div className="mx-auto max-w-7xl px-4 py-6 text-zinc-400">Loading media...</div>;
  if (!detail) return <div className="mx-auto max-w-7xl px-4 py-6 text-zinc-400">Media not found.</div>;

  const requireLogin = (): boolean => {
    if (user) return true;
    showToast("Please log in or sign up first");
    navigate("/login");
    return false;
  };

  const mediaLogs = (logs.data?.logs ?? []).filter(
    (log) => log.external_media_id === detail.external_media_id && log.media_type === detail.media_type
  );
  const diaryLog = mediaLogs.find((log) => log.action_type === "diary_entry");
  const watchlistLog = mediaLogs.find((log) => log.action_type === "watchlist");
  const likeLog = mediaLogs.find((log) => log.action_type === "like");
  const ratingLog = mediaLogs.find((log) => log.action_type === "rating_only");
  const visibleRating = diaryLog?.rating ?? ratingLog?.rating ?? null;
  const isConsumed = Boolean(diaryLog);
  const isQueued = Boolean(watchlistLog);
  const isLiked = Boolean(likeLog);

  const quick = async (action: ActionType) => {
    if (!requireLogin()) return;
    try {
      await api.saveLog({ external_media_id: detail.external_media_id, media_type: detail.media_type, action_type: action, is_rewatch: false, has_spoilers: false, tags: [] });
      queryClient.invalidateQueries({ queryKey: ["my-logs"] });
      showToast("Updated");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <img src={detail.poster_url} alt={detail.title} className="aspect-[2/3] w-full max-w-[220px] rounded-md object-cover" />
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-400">{detail.media_type} {detail.release_year ?? ""}</p>
          <h1 className="text-3xl font-semibold">{detail.title}</h1>
          <p className="mt-2 text-zinc-400">{detail.description ?? "No description available."}</p>
          <p className="mt-3 text-sm text-zinc-400">Global rating: {detail.global_rating ? detail.global_rating.toFixed(1) : "Unavailable"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { if (!isConsumed && requireLogin()) setModalAction("diary_entry"); }}
              className={isConsumed ? "rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white" : "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"}
            >
              {isConsumed ? "Logged" : "Log"}
            </button>
            <button type="button" onClick={() => { if (!isLiked) quick("like"); }} className={isLiked ? "flex items-center gap-2 rounded-md border border-rose-700 bg-rose-700 px-4 py-2 text-sm text-white" : "flex items-center gap-2 rounded-md border px-4 py-2 text-sm"}><Heart className="h-4 w-4" /> {isLiked ? "Liked" : "Like"}</button>
            <button
              type="button"
              onClick={() => { if (!isConsumed && !isQueued) quick("watchlist"); }}
              className={isConsumed || isQueued ? "flex items-center gap-2 rounded-md border border-sky-700 bg-sky-700 px-4 py-2 text-sm text-white" : "flex items-center gap-2 rounded-md border px-4 py-2 text-sm"}
            >
              <Clock className="h-4 w-4" /> {isConsumed ? "Consumed" : isQueued ? "Queued" : "Queue"}
            </button>
            <StarRating score={visibleRating} onChange={(score) => {
              if (!requireLogin()) return;
              api.saveLog({ external_media_id: detail.external_media_id, media_type: detail.media_type, action_type: diaryLog ? "diary_entry" : "rating_only", rating: score, is_rewatch: diaryLog?.is_rewatch ?? false, has_spoilers: diaryLog?.has_spoilers ?? false, tags: diaryLog?.tags ?? [] }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["my-logs"] });
                showToast("Rating saved");
              }).catch((error: Error) => showToast(error.message));
            }} />
            <AddToListControl mediaId={detail.external_media_id} mediaType={detail.media_type} />
          </div>
          <div className="mt-5">
            <h2 className="mb-2 font-semibold">Cast / Subjects</h2>
            <div className="flex flex-wrap gap-2">{detail.cast.map((person) => <span key={person} className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300">{person}</span>)}</div>
          </div>
        </div>
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">Public reviews</h2>
        <div className="space-y-3">
          {(query.data?.reviews ?? []).map((review) => (
            <article key={review.id} className="rounded-md border bg-zinc-950 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                <span>{review.profiles?.display_name ?? review.profiles?.username ?? "User"}</span>
                <span>{formatStars(review.rating)}</span>
              </div>
              {review.review_text && <SpoilerText text={review.review_text} hasSpoilers={review.has_spoilers} />}
            </article>
          ))}
        </div>
      </section>
      {modalAction && <LogModal mediaId={detail.external_media_id} mediaType={detail.media_type} title={detail.title} initialAction={modalAction} onClose={() => setModalAction(null)} />}
    </div>
  );
};
