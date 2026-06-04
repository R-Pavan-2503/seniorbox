import { useState } from "react";

export const SpoilerText = ({ text, hasSpoilers }: { text: string; hasSpoilers: boolean }) => {
  const [revealed, setRevealed] = useState(!hasSpoilers);
  if (revealed) return <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{text}</p>;
  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-400 blur-sm transition hover:blur-none"
    >
      Reveal spoiler
    </button>
  );
};
