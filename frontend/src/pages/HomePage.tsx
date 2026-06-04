import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { MediaGrid } from "../components/MediaGrid";
import { SkeletonGrid } from "../components/SkeletonGrid";
import type { MediaType } from "../types";

const sections: MediaType[] = ["movie", "tv", "book"];

export const HomePage = () => (
  <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
    {sections.map((type) => (
      <PopularSection key={type} type={type} />
    ))}
  </div>
);

const PopularSection = ({ type }: { type: MediaType }) => {
  const query = useQuery({ queryKey: ["popular", type], queryFn: () => api.popular(type) });
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold capitalize">Popular {type === "tv" ? "shows" : `${type}s`}</h2>
      {query.isLoading ? <SkeletonGrid /> : <MediaGrid items={query.data?.results ?? []} />}
    </section>
  );
};
