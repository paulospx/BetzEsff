import type { Match, Player, Prediction, RaceStep, Week, WeekStandingSnapshot } from "./types";
import { scorePrediction } from "./scoring";
import { scoreDisplay } from "./format";

export interface RaceSource {
  players: Player[];
  weeks: Week[];
  matches: Match[];
  predictions: Prediction[];
  step?: RaceStep;
}

/**
 * Standings after each finished week, or after each finished match.
 * Match frames follow week order (by start date), then kickoff, so the
 * last match of a week shows the same cumulative table as that week.
 */
export function buildRaceSnapshots(source: RaceSource): WeekStandingSnapshot[] {
  const step = source.step ?? "week";
  const weeks = [...source.weeks].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  const weekById = new Map(weeks.map((week) => [week.id, week]));

  const predictionsByMatch = new Map<string, Prediction[]>();
  for (const prediction of source.predictions) {
    const list = predictionsByMatch.get(prediction.matchId);
    if (list) list.push(prediction);
    else predictionsByMatch.set(prediction.matchId, [prediction]);
  }

  const finishedByWeek = new Map<string, Match[]>();
  for (const match of source.matches) {
    if (match.status !== "finished" || !weekById.has(match.weekId)) continue;
    const list = finishedByWeek.get(match.weekId);
    if (list) list.push(match);
    else finishedByWeek.set(match.weekId, [match]);
  }
  for (const list of finishedByWeek.values()) list.sort(compareMatches);

  const cumulative: Record<string, number> = {};
  for (const player of source.players) cumulative[player.id] = 0;

  const snapshots: WeekStandingSnapshot[] = [];

  for (const week of weeks) {
    const weekMatches = finishedByWeek.get(week.id) ?? [];
    if (weekMatches.length === 0) continue;

    if (step === "match") {
      for (const match of weekMatches) {
        const points = pointsForMatches([match], source.players, predictionsByMatch);
        addPoints(cumulative, source.players, points);
        snapshots.push({
          weekId: week.id,
          weekLabel: week.label,
          matchId: match.id,
          matchLabel: fixtureLabel(match),
          standings: toStandings(source.players, points, cumulative),
        });
      }
      continue;
    }

    const points = pointsForMatches(weekMatches, source.players, predictionsByMatch);
    addPoints(cumulative, source.players, points);
    snapshots.push({
      weekId: week.id,
      weekLabel: week.label,
      standings: toStandings(source.players, points, cumulative),
    });
  }

  return snapshots;
}

/** Where to land so switching step stays inside the week on screen. */
export function indexAfterStepChange(
  from: WeekStandingSnapshot[],
  fromIndex: number,
  to: WeekStandingSnapshot[],
  toStep: RaceStep
): number {
  if (to.length === 0) return 0;
  const current = from[fromIndex];
  if (!current) return 0;

  if (toStep === "match") {
    let lastInWeek = -1;
    for (let i = 0; i < to.length; i++) {
      if (to[i].weekId === current.weekId) lastInWeek = i;
    }
    return lastInWeek < 0 ? 0 : lastInWeek;
  }

  const weekIndex = to.findIndex((snapshot) => snapshot.weekId === current.weekId);
  return weekIndex < 0 ? 0 : weekIndex;
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), length - 1);
}

export function raceFrameTitle(snapshot: WeekStandingSnapshot): string {
  return snapshot.matchLabel ?? snapshot.weekLabel;
}

export function racePositionLabel(
  step: RaceStep,
  index: number,
  total: number
): string {
  const noun = step === "match" ? "Match" : "Week";
  return `${noun} ${index + 1} of ${total}`;
}

export function raceValueCaption(step: RaceStep, showCumulative: boolean): string {
  if (step === "match" && showCumulative) {
    return "Running total, and the points this match added.";
  }
  if (step === "match") return "Points earned on this match only";
  if (showCumulative) return "Cumulative points after this week";
  return "Points earned this week only";
}

export function racePeriodToggleLabel(
  step: RaceStep,
  showCumulative: boolean
): string {
  if (!showCumulative) return "Show cumulative";
  return step === "match" ? "Show this match" : "Show weekly";
}

export function raceHelp(step: RaceStep, chart: "bars" | "lines"): string {
  if (step === "match" && chart === "lines") {
    return "Each step is a finished match. Drag the timeline, pick a match from the list, press Play, or tap a name to isolate their line.";
  }
  if (step === "match") {
    return "Each step is a finished match, in week order. Drag the timeline, pick a match from the list, or press Play.";
  }
  if (chart === "lines") {
    return "Lines grow week by week. Press Play to walk forward, drag the slider to any week, or tap a name to isolate their line.";
  }
  return "Bars move week by week. Press Play to walk forward, or drag the slider to any week.";
}

export function raceJumpLabel(snapshot: WeekStandingSnapshot): string {
  if (snapshot.matchLabel) return `${snapshot.weekLabel} — ${snapshot.matchLabel}`;
  return snapshot.weekLabel;
}

/** Axis text. Dense match races label the week, not every fixture. */
export function raceAxisLabel(
  snapshot: WeekStandingSnapshot,
  index: number,
  snapshots: WeekStandingSnapshot[]
): string {
  if (!snapshot.matchId) return shortWeek(snapshot.weekLabel);
  const weekStart =
    index === 0 || snapshots[index - 1]?.weekId !== snapshot.weekId;
  if (snapshots.length > 12) return weekStart ? shortWeek(snapshot.weekLabel) : "";
  return abbrevFixture(snapshot.matchLabel ?? snapshot.weekLabel);
}

function shortWeek(label: string): string {
  const trimmed = label.replace(/^Jornada\s+/i, "J");
  return trimmed.length > 10 ? `${trimmed.slice(0, 9)}…` : trimmed;
}

function abbrevFixture(label: string): string {
  const parts = label.match(/^(.+?) \d+ – \d+ (.+)$/);
  if (!parts) return shortWeek(label);
  return `${parts[1].slice(0, 3)}–${parts[2].slice(0, 3)}`;
}

function compareMatches(a: Match, b: Match): number {
  const kickoff = a.kickoff.localeCompare(b.kickoff);
  if (kickoff !== 0) return kickoff;
  const home = a.homeTeam.localeCompare(b.homeTeam);
  if (home !== 0) return home;
  return a.id.localeCompare(b.id);
}

function fixtureLabel(match: Match): string {
  return `${match.homeTeam} ${scoreDisplay(match.homeScore, match.awayScore)} ${match.awayTeam}`;
}

function pointsForMatches(
  matches: Match[],
  players: Player[],
  predictionsByMatch: Map<string, Prediction[]>
): Record<string, number> {
  const points: Record<string, number> = {};
  for (const player of players) points[player.id] = 0;
  for (const match of matches) {
    for (const prediction of predictionsByMatch.get(match.id) ?? []) {
      const scored = scorePrediction(prediction, match);
      points[prediction.playerId] =
        (points[prediction.playerId] ?? 0) + scored.points;
    }
  }
  return points;
}

function addPoints(
  cumulative: Record<string, number>,
  players: Player[],
  points: Record<string, number>
) {
  for (const player of players) {
    cumulative[player.id] =
      (cumulative[player.id] ?? 0) + (points[player.id] ?? 0);
  }
}

function toStandings(
  players: Player[],
  points: Record<string, number>,
  cumulative: Record<string, number>
): WeekStandingSnapshot["standings"] {
  return players
    .map((player) => ({
      playerId: player.id,
      playerName: player.name,
      color: player.color,
      points: points[player.id] ?? 0,
      cumulativePoints: cumulative[player.id] ?? 0,
    }))
    .sort((a, b) => b.cumulativePoints - a.cumulativePoints);
}
