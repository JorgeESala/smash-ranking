// Elo helpers — client-side preview only. Authoritative calculation happens
// in the approve_match() Postgres function. These are useful for showing a
// "what-if" preview on the report form.
import { expected_score, k_factor } from "@/lib/elo-formula";

export type EloPreview = {
  reporterDelta: number;
  opponentDelta: number;
  reporterNew: number;
  opponentNew: number;
};

export function previewEloChange(
  reporterElo: number,
  opponentElo: number,
  reporterGames: number,
  opponentGames: number,
  reporterWins: boolean,
): EloPreview {
  const expR = expected_score(reporterElo, opponentElo);
  const expO = 1 - expR;
  const kR = k_factor(reporterGames);
  const kO = k_factor(opponentGames);
  const sR = reporterWins ? 1 : 0;
  const sO = reporterWins ? 0 : 1;
  const dR = Math.round(kR * (sR - expR));
  const dO = Math.round(kO * (sO - expO));
  return {
    reporterDelta: dR,
    opponentDelta: dO,
    reporterNew: reporterElo + dR,
    opponentNew: opponentElo + dO,
  };
}
