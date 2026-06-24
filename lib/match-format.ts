// Match format helpers — validation and labels.
import type { MatchFormat } from "@/lib/supabase/types";

export const MATCH_FORMATS: {
  value: MatchFormat;
  label: string;
  description: string;
  maxWinner: number;
  validLoserScores: readonly number[];
}[] = [
  {
    value: "bo5",
    label: "Mejor de 5",
    description: "Primero en ganar 3 juegos",
    maxWinner: 3,
    validLoserScores: [0, 1, 2],
  },
  {
    value: "bo3",
    label: "Mejor de 3",
    description: "Primero en ganar 2 juegos",
    maxWinner: 2,
    validLoserScores: [0, 1],
  },
  {
    value: "first_to_5",
    label: "Primero en 5",
    description: "Primero en ganar 5 juegos",
    maxWinner: 5,
    validLoserScores: [0, 1, 2, 3, 4],
  },
];

export function getFormat(value: MatchFormat) {
  return MATCH_FORMATS.find((f) => f.value === value) ?? MATCH_FORMATS[0];
}

export function isValidScore(
  format: MatchFormat,
  winnerScore: number,
  loserScore: number,
): boolean {
  const f = getFormat(format);
  return (
    winnerScore === f.maxWinner && f.validLoserScores.includes(loserScore)
  );
}
