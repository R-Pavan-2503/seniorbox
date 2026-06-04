import type { NormalizedMedia } from "../types";
import { PosterCard } from "./PosterCard";

export const MediaGrid = ({ items }: { items: NormalizedMedia[] }) => (
  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
    {items.map((item) => (
      <PosterCard key={`${item.media_type}-${item.external_media_id}`} media={item} />
    ))}
  </div>
);
