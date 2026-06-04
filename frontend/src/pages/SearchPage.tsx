import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { MediaGrid } from "../components/MediaGrid";
import { SkeletonGrid } from "../components/SkeletonGrid";
import { useDebounce } from "../hooks/useDebounce";
import type { MediaType } from "../types";

export const SearchPage = () => {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState<"all" | MediaType>("all");
  const debounced = useDebounce(query, 300);
  const canSearch = debounced.trim().length > 1;
  const search = useQuery({
    queryKey: ["search", debounced, type],
    queryFn: () => api.search(debounced, type),
    enabled: canSearch
  });
  const options = useMemo<Array<"all" | MediaType>>(() => ["all", "movie", "tv", "book"], []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 rounded-md border bg-zinc-900 px-3 py-2" placeholder="Search OmniLog" />
        <select value={type} onChange={(event) => setType(event.target.value as "all" | MediaType)} className="rounded-md border bg-zinc-900 px-3 py-2">
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      {search.isLoading ? <SkeletonGrid /> : <MediaGrid items={search.data?.results ?? []} />}
    </div>
  );
};
