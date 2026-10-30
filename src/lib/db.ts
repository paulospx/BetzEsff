import { promises as fs } from "fs";
import path from "path";
import type {
  Championship,
  Database,
  Match,
  Player,
  Prediction,
  Week,
} from "./types";
import { scorePrediction } from "./scoring";
import { buildRaceSnapshots } from "./race";
import type { PlayerStanding, WeekStandingSnapshot } from "./types";
import {
  defaultChampionships,
  EURO_CHAMPIONSHIP_ID,
  LIGA_CHAMPIONSHIP_ID,
  migrateDatabase,
  scopeDatabase,
} from "./championships";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const PLAYER_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#db2777",
  "#4f46e5",
  "#059669",
];

function seedDb(): Database {
  const now = new Date().toISOString();
  const week1Id = "week-1";
  const week2Id = "week-2";

  const players: Player[] = [
    {
      id: "player-alex",
      name: "Alex",
      color: PLAYER_COLORS[0],
      createdAt: now,
    },
    {
      id: "player-sam",
      name: "Sam",
      color: PLAYER_COLORS[1],
      createdAt: now,
    },
    {
      id: "player-jordan",
      name: "Jordan",
      color: PLAYER_COLORS[2],
      createdAt: now,
    },
    {
      id: "player-riley",
      name: "Riley",
      color: PLAYER_COLORS[3],
      createdAt: now,
    },
  ];

  const championships: Championship[] = defaultChampionships(now);
  const weekEuroId = "week-euro-1";

  const weeks: Week[] = [
    {
      id: week1Id,
      championshipId: LIGA_CHAMPIONSHIP_ID,
      label: "Week 1",
      startDate: "2026-03-07",
      endDate: "2026-03-09",
      createdAt: now,
    },
    {
      id: week2Id,
      championshipId: LIGA_CHAMPIONSHIP_ID,
      label: "Week 2",
      startDate: "2026-03-14",
      endDate: "2026-03-16",
      createdAt: now,
    },
    {
      id: weekEuroId,
      championshipId: EURO_CHAMPIONSHIP_ID,
      label: "Qualifiers 1",
      startDate: "2026-03-21",
      endDate: "2026-03-23",
      createdAt: now,
    },
  ];

  const matches: Match[] = [
    {
      id: "m1",
      weekId: week1Id,
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      kickoff: "2026-03-07T15:00:00.000Z",
      homeScore: 2,
      awayScore: 1,
      status: "finished",
      createdAt: now,
    },
    {
      id: "m2",
      weekId: week1Id,
      homeTeam: "Liverpool",
      awayTeam: "Man City",
      kickoff: "2026-03-07T17:30:00.000Z",
      homeScore: 1,
      awayScore: 1,
      status: "finished",
      createdAt: now,
    },
    {
      id: "m3",
      weekId: week1Id,
      homeTeam: "Tottenham",
      awayTeam: "Newcastle",
      kickoff: "2026-03-08T14:00:00.000Z",
      homeScore: 0,
      awayScore: 2,
      status: "finished",
      createdAt: now,
    },
    {
      id: "m4",
      weekId: week2Id,
      homeTeam: "Man United",
      awayTeam: "Aston Villa",
      kickoff: "2026-03-14T15:00:00.000Z",
      homeScore: null,
      awayScore: null,
      status: "open",
      createdAt: now,
    },
    {
      id: "m5",
      weekId: week2Id,
      homeTeam: "Brighton",
      awayTeam: "West Ham",
      kickoff: "2026-03-14T17:30:00.000Z",
      homeScore: null,
      awayScore: null,
      status: "open",
      createdAt: now,
    },
    {
      id: "m6",
      weekId: week2Id,
      homeTeam: "Everton",
      awayTeam: "Fulham",
      kickoff: "2026-03-15T14:00:00.000Z",
      homeScore: null,
      awayScore: null,
      status: "open",
      createdAt: now,
    },
    {
      id: "m7",
      weekId: weekEuroId,
      homeTeam: "Portugal",
      awayTeam: "Hungary",
      kickoff: "2026-03-21T19:45:00.000Z",
      homeScore: null,
      awayScore: null,
      status: "open",
      createdAt: now,
    },
    {
      id: "m8",
      weekId: weekEuroId,
      homeTeam: "Spain",
      awayTeam: "Ireland",
      kickoff: "2026-03-22T19:45:00.000Z",
      homeScore: null,
      awayScore: null,
      status: "open",
      createdAt: now,
    },
  ];

  const predictions: Prediction[] = [
    // Week 1 – finished matches with varied accuracy
    {
      id: "p1",
      matchId: "m1",
      playerId: "player-alex",
      homeScore: 2,
      awayScore: 1,
      updatedAt: now,
    },
    {
      id: "p2",
      matchId: "m1",
      playerId: "player-sam",
      homeScore: 1,
      awayScore: 0,
      updatedAt: now,
    },
    {
      id: "p3",
      matchId: "m1",
      playerId: "player-jordan",
      homeScore: 0,
      awayScore: 1,
      updatedAt: now,
    },
    {
      id: "p4",
      matchId: "m1",
      playerId: "player-riley",
      homeScore: 2,
      awayScore: 2,
      updatedAt: now,
    },
    {
      id: "p5",
      matchId: "m2",
      playerId: "player-alex",
      homeScore: 2,
      awayScore: 1,
      updatedAt: now,
    },
    {
      id: "p6",
      matchId: "m2",
      playerId: "player-sam",
      homeScore: 1,
      awayScore: 1,
      updatedAt: now,
    },
    {
      id: "p7",
      matchId: "m2",
      playerId: "player-jordan",
      homeScore: 0,
      awayScore: 0,
      updatedAt: now,
    },
    {
      id: "p8",
      matchId: "m2",
      playerId: "player-riley",
      homeScore: 3,
      awayScore: 1,
      updatedAt: now,
    },
    {
      id: "p9",
      matchId: "m3",
      playerId: "player-alex",
      homeScore: 1,
      awayScore: 2,
      updatedAt: now,
    },
    {
      id: "p10",
      matchId: "m3",
      playerId: "player-sam",
      homeScore: 0,
      awayScore: 2,
      updatedAt: now,
    },
    {
      id: "p11",
      matchId: "m3",
      playerId: "player-jordan",
      homeScore: 2,
      awayScore: 0,
      updatedAt: now,
    },
    {
      id: "p12",
      matchId: "m3",
      playerId: "player-riley",
      homeScore: 1,
      awayScore: 1,
      updatedAt: now,
    },
  ];

  return {
    championships,
    players,
    weeks,
    matches,
    predictions,
    settings: {
      adminPin: "1234",
      appName: "ESFF",
    },
  };
}

async function ensureDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(seedDb(), null, 2), "utf-8");
  }
}

export async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Database;
    const { db, dirty } = migrateDatabase(parsed);
    if (dirty) await writeDb(db);
    return db;
  } catch {
    const fresh = seedDb();
    await writeDb(fresh);
    return fresh;
  }
}

export async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nextPlayerColor(db: Database): string {
  return PLAYER_COLORS[db.players.length % PLAYER_COLORS.length];
}

export function computeStandings(
  db: Database,
  championshipId?: string
): PlayerStanding[] {
  const scoped = championshipId ? scopeDatabase(db, championshipId) : db;
  return scoped.players
    .map((player) => {
      const playerPreds = scoped.predictions.filter(
        (p) => p.playerId === player.id
      );
      let totalPoints = 0;
      let exactScores = 0;
      let correctOutcomes = 0;
      const weeklyPoints: Record<string, number> = {};

      for (const pred of playerPreds) {
        const match = scoped.matches.find((m) => m.id === pred.matchId);
        if (!match || match.status !== "finished") continue;
        const scored = scorePrediction(pred, match);
        totalPoints += scored.points;
        if (scored.exact) exactScores += 1;
        else if (scored.correctOutcome) correctOutcomes += 1;
        weeklyPoints[match.weekId] =
          (weeklyPoints[match.weekId] ?? 0) + scored.points;
      }

      return {
        player,
        totalPoints,
        exactScores,
        correctOutcomes,
        predictionsCount: playerPreds.length,
        weeklyPoints,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      return a.player.name.localeCompare(b.player.name);
    });
}

/** Cumulative standings after each week (chronological) for the standings race. */
export function computeRaceSnapshots(
  db: Database,
  championshipId?: string
): WeekStandingSnapshot[] {
  const scoped = championshipId ? scopeDatabase(db, championshipId) : db;
  return buildRaceSnapshots({
    players: scoped.players,
    weeks: scoped.weeks,
    matches: scoped.matches,
    predictions: scoped.predictions,
    step: "week",
  });
}

export async function resetToSeed(): Promise<Database> {
  const db = seedDb();
  await writeDb(db);
  return db;
}

export function computeAllChampionshipTables(db: Database): {
  standingsByChampionship: Record<string, PlayerStanding[]>;
  raceByChampionship: Record<string, WeekStandingSnapshot[]>;
} {
  const standingsByChampionship: Record<string, PlayerStanding[]> = {};
  const raceByChampionship: Record<string, WeekStandingSnapshot[]> = {};
  for (const championship of db.championships) {
    standingsByChampionship[championship.id] = computeStandings(
      db,
      championship.id
    );
    raceByChampionship[championship.id] = computeRaceSnapshots(
      db,
      championship.id
    );
  }
  return { standingsByChampionship, raceByChampionship };
}

export type { Database, Match, Player, Prediction, Week, Championship };
