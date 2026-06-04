import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../components/Toast";
import type { ListItem, UserList, Visibility } from "../types";

export const ListsPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRanked, setIsRanked] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const lists = useQuery({ queryKey: ["my-lists"], queryFn: api.myLists });
  const create = useMutation({
    mutationFn: () => api.createList({ title, description: description || null, is_ranked: isRanked, visibility }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["my-lists"] });
      showToast("List created");
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-semibold">Your lists</h1>
      <div className="mb-6 rounded-md border bg-zinc-950 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto]">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="rounded-md border bg-zinc-900 px-3 py-2" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="rounded-md border bg-zinc-900 px-3 py-2" />
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} className="rounded-md border bg-zinc-900 px-3 py-2">
            <option value="public">public</option>
            <option value="private">private</option>
            <option value="unlisted">unlisted</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isRanked} onChange={(event) => setIsRanked(event.target.checked)} /> Ranked</label>
          <button type="button" onClick={() => create.mutate()} className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Create</button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(lists.data?.lists ?? []).map((list) => <EditableList key={list.id} list={list} />)}
      </div>
    </div>
  );
};

const EditableList = ({ list }: { list: UserList }) => {
  const queryClient = useQueryClient();
  const remove = useMutation({ mutationFn: () => api.deleteList(list.id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-lists"] }) });
  const updateItem = useMutation({ mutationFn: ({ id, item }: { id: string; item: Partial<ListItem> }) => api.updateListItem(id, item), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-lists"] }) });
  const items = [...(list.list_items ?? [])].sort((a, b) => (a.rank_position ?? 9999) - (b.rank_position ?? 9999));

  const reorder = (sourceId: string, targetId: string) => {
    const sourceIndex = items.findIndex((entry) => entry.id === sourceId);
    const targetIndex = items.findIndex((entry) => entry.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...items];
    const [source] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, source);
    next.forEach((item, index) => updateItem.mutate({ id: item.id, item: { rank_position: index + 1 } }));
  };

  return (
    <article className="rounded-md border bg-zinc-950 p-4">
      <div className="mb-3 flex justify-between gap-3">
        <Link to={`/lists/${list.id}`} className="font-semibold hover:text-emerald-400">{list.title}</Link>
        <button type="button" onClick={() => remove.mutate()} className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
      </div>
      <p className="mb-3 text-sm text-zinc-400">{list.description ?? "No description"} · {list.visibility}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            draggable={list.is_ranked}
            onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => reorder(event.dataTransfer.getData("text/plain"), item.id)}
            className="flex items-center gap-2 rounded bg-zinc-900 p-2 text-sm"
          >
            <GripVertical className="h-4 w-4 text-zinc-500" />
            <span className="flex-1">{item.media_type} #{item.external_media_id}</span>
            <input
              value={item.user_note ?? ""}
              onChange={(event) => updateItem.mutate({ id: item.id, item: { user_note: event.target.value } })}
              placeholder="Note"
              className="w-28 rounded border bg-zinc-950 px-2 py-1"
            />
          </div>
        ))}
      </div>
    </article>
  );
};
