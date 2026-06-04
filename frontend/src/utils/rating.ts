export const scoreToStars = (score: number | null): number | null => {
  if (score === null) return null;
  return score / 2;
};

export const starsToScore = (stars: number): number => {
  const score = Math.round(stars * 2);
  return Math.min(10, Math.max(1, score));
};

export const formatStars = (score: number | null): string => {
  const stars = scoreToStars(score);
  return stars === null ? "Unrated" : `${stars.toFixed(1)} stars`;
};
