import { Star } from "lucide-react";
import { scoreToStars, starsToScore } from "../utils/rating";

interface StarRatingProps {
  score: number | null;
  onChange?: (score: number) => void;
  compact?: boolean;
}

export const StarRating = ({ score, onChange, compact = false }: StarRatingProps) => {
  const selected = scoreToStars(score) ?? 0;
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const half = event.clientX - rect.left < rect.width / 2 ? star - 0.5 : star;
    onChange(starsToScore(half));
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          onClick={(event) => handleClick(star, event)}
          disabled={!onChange}
          className={compact ? "h-5 w-5 text-amber-400" : "h-7 w-7 text-amber-400"}
        >
          <Star className={star <= Math.ceil(selected) ? "fill-current" : ""} />
        </button>
      ))}
    </div>
  );
};
