import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import type { ActionType, LogEntry, MediaType } from "../types";
import { StarRating } from "./StarRating";
import { useToast } from "./Toast";

interface LogModalProps {
  mediaId: string;
  mediaType: MediaType;
  title: string;
  initialAction: ActionType;
  initialLog?: LogEntry | null;
  onClose: () => void;
}

export const LogModal = ({ mediaId, mediaType, title, initialAction, initialLog, onClose }: LogModalProps) => {
  const [rating, setRating] = useState<number | null>(initialLog?.rating ?? null);
  const [review, setReview] = useState(initialLog?.review_text ?? "");
  const [date, setDate] = useState(initialLog?.date_consumed ?? new Date().toISOString().slice(0, 10));
  const [isRewatch, setIsRewatch] = useState(initialLog?.is_rewatch ?? false);
  const [hasSpoilers, setHasSpoilers] = useState(initialLog?.has_spoilers ?? false);
  const [tags, setTags] = useState(initialLog?.tags?.join(", ") ?? "");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      api.saveLog({
        external_media_id: mediaId,
        media_type: mediaType,
        action_type: initialAction,
        rating,
        review_text: review.trim() ? review.trim() : null,
        date_consumed: initialAction === "diary_entry" ? date : null,
        is_rewatch: isRewatch,
        has_spoilers: hasSpoilers,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast("Log saved");
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-400">{initialAction.replace("_", " ")}</p>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <StarRating score={rating} onChange={setRating} />
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-md border bg-zinc-900 px-3 py-2" />
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={6}
            placeholder="Review"
            className="w-full rounded-md border bg-zinc-900 px-3 py-2"
          />
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags, comma-separated" className="w-full rounded-md border bg-zinc-900 px-3 py-2" />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={isRewatch} onChange={(event) => setIsRewatch(event.target.checked)} className="h-4 w-4" />
            Rewatch / re-read
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={hasSpoilers} onChange={(event) => setHasSpoilers(event.target.checked)} className="h-4 w-4" />
            Contains spoilers
          </label>
          {mutation.error && <p className="text-sm text-red-400">{mutation.error.message}</p>}
          <button type="button" onClick={() => mutation.mutate()} className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
