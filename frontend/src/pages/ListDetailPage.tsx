import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

export const ListDetailPage = () => {
  const { id = "" } = useParams();
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["list", id, Boolean(user)], queryFn: () => api.list(id, Boolean(user)) });
  const like = useMutation({
    mutationFn: async (liked: boolean) => {
      if (liked) await api.unlikeList(id);
      else await api.likeList(id);
    },
    onSuccess: (_data, wasLiked) => {
      queryClient.invalidateQueries({ queryKey: ["list", id, Boolean(user)] });
      showToast(wasLiked ? "List unliked" : "List liked");
    }
  });
  const commentMutation = useMutation({
    mutationFn: () => api.commentList(id, comment),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["list", id] });
      showToast("Comment posted");
    }
  });
  const list = query.data?.list;

  if (query.isLoading) return <div className="mx-auto max-w-4xl px-4 py-6 text-zinc-400">Loading list...</div>;
  if (!list) return <div className="mx-auto max-w-4xl px-4 py-6 text-zinc-400">List not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{list.title}</h1>
          <p className="text-sm text-zinc-400">by {list.profiles?.username ?? "user"} · {list.visibility}</p>
          <p className="mt-2 text-zinc-300">{list.description ?? "No description"}</p>
        </div>
        {user && list.visibility === "public" && (
          <button
            type="button"
            onClick={() => like.mutate(Boolean(list.liked_by_me))}
            className={list.liked_by_me ? "flex items-center gap-2 rounded-md border border-rose-700 bg-rose-700 px-3 py-2 text-sm text-white" : "flex items-center gap-2 rounded-md border px-3 py-2 text-sm"}
          >
            <Heart className="h-4 w-4" /> {list.liked_by_me ? "Unlike" : "Like"}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {(list.list_items ?? []).map((item) => (
          <Link key={item.id} to={`/media/${item.media_type}/${item.external_media_id}`} className="block rounded-md border bg-zinc-950 p-3 hover:bg-zinc-900">
            <span className="font-medium">{item.rank_position ? `${item.rank_position}. ` : ""}{item.media_type} #{item.external_media_id}</span>
            {item.user_note && <p className="mt-1 text-sm text-zinc-400">{item.user_note}</p>}
          </Link>
        ))}
      </div>
      {list.visibility === "public" && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Comments</h2>
          <div className="mb-4 flex gap-2">
            <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" className="flex-1 rounded-md border bg-zinc-900 px-3 py-2" />
            <button type="button" onClick={() => commentMutation.mutate()} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Post</button>
          </div>
          <div className="space-y-2">
            {(list.list_comments ?? []).map((entry) => (
              <div key={entry.id} className="rounded-md border bg-zinc-950 p-3 text-sm">
                <span className="text-zinc-400">{entry.profiles?.username ?? "user"}: </span>{entry.body}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
