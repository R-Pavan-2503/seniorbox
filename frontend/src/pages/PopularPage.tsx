import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { MediaGrid } from "../components/MediaGrid";
import { SkeletonGrid } from "../components/SkeletonGrid";
import type { MediaType } from "../types";

export const PopularPage = () => {
  const { type = "movie" } = useParams();
  const mediaType = (["movie", "tv", "book"].includes(type) ? type : "movie") as MediaType;
  const query = useQuery({ queryKey: ["popular", mediaType], queryFn: () => api.popular(mediaType) });
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold capitalize">Popular {mediaType === "tv" ? "shows" : `${mediaType}s`}</h1>
      {query.isLoading ? <SkeletonGrid /> : <MediaGrid items={query.data?.results ?? []} />}
    </div>
  );
};
