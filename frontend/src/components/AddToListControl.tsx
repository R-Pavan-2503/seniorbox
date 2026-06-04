import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListPlus } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { MediaType } from "../types";
import { useToast } from "./Toast";

export const AddToListControl = ({ mediaId, mediaType, compact = false }: { mediaId: string; mediaType: MediaType; compact?: boolean }) => {
  const { user } = useAuth();
  const [listId, setListId] = useState("");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const lists = useQuery({ queryKey: ["my-lists"], queryFn: api.myLists, enabled: Boolean(user) });
  const containingLists = (lists.data?.lists ?? []).filter((list) =>
    (list.list_items ?? []).some((item) => item.external_media_id === mediaId && item.media_type === mediaType)
  );
  const selectedList = lists.data?.lists.find((entry) => entry.id === listId);
  const selectedAlreadyContains = Boolean(
    selectedList?.list_items?.some((item) => item.external_media_id === mediaId && item.media_type === mediaType)
  );
  const mutation = useMutation({
    mutationFn: () => {
      const list = lists.data?.lists.find((entry) => entry.id === listId);
      const rank = list?.is_ranked ? (list.list_items?.length ?? 0) + 1 : null;
      return api.addListItem(listId, { external_media_id: mediaId, media_type: mediaType, rank_position: rank, user_note: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-lists"] });
      showToast("Added to list");
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Could not add to list");
    }
  });

  if (!user) return null;

  return (
    <div className={compact ? "grid grid-cols-[1fr_auto] gap-1" : "flex flex-wrap gap-2"}>
      <select value={listId} onChange={(event) => setListId(event.target.value)} className="min-w-0 rounded-md border bg-zinc-900 px-2 py-2 text-xs">
        <option value="">Choose list</option>
        {(lists.data?.lists ?? []).map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}
      </select>
      <button
        type="button"
        disabled={!listId || selectedAlreadyContains || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ListPlus className="h-4 w-4" />
        {!compact && (selectedAlreadyContains ? "Already in list" : "Add to list")}
      </button>
      {containingLists.length > 0 && (
        <p className={compact ? "col-span-2 truncate text-[11px] text-emerald-300" : "w-full text-xs text-emerald-300"}>
          In {containingLists.map((list) => list.title).join(", ")}
        </p>
      )}
    </div>
  );
};
