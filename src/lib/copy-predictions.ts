import type { Match, Player, Prediction } from "./types";
import { scorePrediction } from "./scoring";

function score(home: number, away: number): string {
  return `${home}–${away}`;
}

function predFor(
  predictions: Prediction[],
  playerId: string,
  matchId: string
): Prediction | undefined {
  return predictions.find(
    (p) => p.playerId === playerId && p.matchId === matchId
  );
}

function matchTitle(match: Match): string {
  if (
    match.status === "finished" &&
    match.homeScore !== null &&
    match.awayScore !== null
  ) {
    return `${match.homeTeam} vs ${match.awayTeam} (final ${score(match.homeScore, match.awayScore)})`;
  }
  return `${match.homeTeam} vs ${match.awayTeam}`;
}

function pickLine(player: Player, pred: Prediction | undefined, match: Match): string {
  if (!pred) return `  ${player.name}  —`;
  const scored = scorePrediction(pred, match);
  const pts =
    match.status === "finished" ? `  (+${scored.points})` : "";
  return `  ${player.name}  ${score(pred.homeScore, pred.awayScore)}${pts}`;
}

/** Full week board — every match, every player. Ready to paste into chat. */
export function formatWeekPredictionsText(
  weekLabel: string,
  matches: Match[],
  players: Player[],
  predictions: Prediction[]
): string {
  const lines: string[] = [`📋 ${weekLabel}`, ""];

  for (const match of matches) {
    lines.push(matchTitle(match));
    for (const player of players) {
      lines.push(pickLine(player, predFor(predictions, player.id, match.id), match));
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/** One player's sheet for the week. */
export function formatPlayerWeekText(
  weekLabel: string,
  player: Player,
  matches: Match[],
  predictions: Prediction[]
): string {
  const lines: string[] = [`⚽ ${player.name} — ${weekLabel}`];

  for (const match of matches) {
    const pred = predFor(predictions, player.id, match.id);
    if (pred) {
      lines.push(
        `${match.homeTeam} ${score(pred.homeScore, pred.awayScore)} ${match.awayTeam}`
      );
    } else {
      lines.push(`${match.homeTeam} vs ${match.awayTeam} — no pick`);
    }
  }

  return lines.join("\n");
}

/** Everyone's pick for a single match. */
export function formatMatchPredictionsText(
  match: Match,
  players: Player[],
  predictions: Prediction[]
): string {
  const lines: string[] = [matchTitle(match)];
  for (const player of players) {
    lines.push(pickLine(player, predFor(predictions, player.id, match.id), match));
  }
  return lines.join("\n");
}

/** One scoreline, with match context — good for a single tap. */
export function formatSinglePredictionText(
  player: Player,
  match: Match,
  pred: Prediction
): string {
  return `${player.name}: ${match.homeTeam} ${score(pred.homeScore, pred.awayScore)} ${match.awayTeam}`;
}
