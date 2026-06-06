import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { MediaGrid } from "../components/MediaGrid";
import { SkeletonGrid } from "../components/SkeletonGrid";
import { useDebounce } from "../hooks/useDebounce";
import type { MediaType, NormalizedMedia } from "../types";

export const SearchPage = () => {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState<"all" | MediaType>("all");
  const debounced = useDebounce(query, 300);
  const normalizedQuery = debounced.trim();
  const canSearch = normalizedQuery.length > 1;
  const search = useQuery({
    queryKey: ["search", normalizedQuery, type],
    queryFn: () => api.search(normalizedQuery, type),
    enabled: canSearch
  });
  const options = useMemo<Array<"all" | MediaType>>(() => ["all", "movie", "tv", "book"], []);
  const results = search.data?.results ?? [];

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 rounded-md border bg-zinc-900 px-3 py-2" placeholder="Search OmniLog" />
        <select value={type} onChange={(event) => setType(event.target.value as "all" | MediaType)} className="rounded-md border bg-zinc-900 px-3 py-2">
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
      {!canSearch ? (
        <p className="text-sm text-zinc-400">Type at least 2 characters to search.</p>
      ) : search.isLoading ? (
        <SkeletonGrid />
      ) : type === "all" ? (
        <CategorizedResults items={results} />
      ) : (
        <SearchResults items={results} />
      )}
    </div>
  );
};

const SearchResults = ({ items }: { items: NormalizedMedia[] }) => (
  items.length > 0 ? <MediaGrid items={items} /> : <p className="text-sm text-zinc-400">No results found.</p>
);

const CategorizedResults = ({ items }: { items: NormalizedMedia[] }) => {
  const groups: Array<{ type: MediaType; title: string }> = [
    { type: "movie", title: "Movies" },
    { type: "tv", title: "Shows" },
    { type: "book", title: "Books" }
  ];

  if (items.length === 0) return <p className="text-sm text-zinc-400">No results found.</p>;

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.media_type === group.type);
        if (groupItems.length === 0) return null;
        return (
          <section key={group.type}>
            <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
            <MediaGrid items={groupItems} />
          </section>
        );
      })}
    </div>
  );
};
