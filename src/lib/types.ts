/** Core domain types for BetzEsff football prediction league */

export type MatchStatus = "open" | "locked" | "finished";

export type ChampionshipStatus = "active" | "archived";

export interface Player {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

/** A championship is its own prediction poll: fixtures, table, and race. */
export interface Championship {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  season: string;
  description: string;
  color: string;
  status: ChampionshipStatus;
  createdAt: string;
}

export interface Match {
  id: string;
  weekId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string; // ISO datetime
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  createdAt: string;
}

export interface Week {
  id: string;
  championshipId: string;
  label: string; // e.g. "Week 12" or "2026-03-15"
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;
  createdAt: string;
}

export interface Prediction {
  id: string;
  matchId: string;
  playerId: string;
  homeScore: number;
  awayScore: number;
  updatedAt: string;
}

export interface Database {
  championships: Championship[];
  players: Player[];
  weeks: Week[];
  matches: Match[];
  predictions: Prediction[];
  settings: {
    adminPin: string;
    appName: string;
  };
}

export type Outcome = "home" | "away" | "draw";

export interface ScoredPrediction {
  prediction: Prediction;
  points: number;
  exact: boolean;
  correctOutcome: boolean;
}

export interface PlayerStanding {
  player: Player;
  totalPoints: number;
  exactScores: number;
  correctOutcomes: number;
  predictionsCount: number;
  weeklyPoints: Record<string, number>; // weekId -> points
}

/** How finely the standings race advances. */
export type RaceStep = "week" | "match";

export interface WeekStandingSnapshot {
  weekId: string;
  weekLabel: string;
  /**
   * Set when this frame is one finished match.
   * Absent on week frames, which sum every finished match in the week.
   */
  matchId?: string;
  /** Fixture and score, e.g. "Benfica 2 – 1 Porto". */
  matchLabel?: string;
  standings: Array<{
    playerId: string;
    playerName: string;
    color: string;
    /** Points on this step: the week, or this match alone. */
    points: number;
    cumulativePoints: number;
  }>;
}
