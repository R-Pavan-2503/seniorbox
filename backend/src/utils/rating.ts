export const scoreToStars = (score: number | null): number | null => {
  if (score === null) return null;
  return score / 2;
};

export const starsToScore = (stars: number): number => {
  const score = Math.round(stars * 2);
  return Math.min(10, Math.max(1, score));
};
