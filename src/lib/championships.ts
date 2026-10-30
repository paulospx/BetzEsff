import type {
  Championship,
  ChampionshipStatus,
  Database,
  Match,
  PlayerStanding,
  Prediction,
  Week,
} from "./types";

export const LIGA_CHAMPIONSHIP_ID = "champ-liga-portugal";
export const EURO_CHAMPIONSHIP_ID = "champ-euro-qualificacao";

export const CHAMPIONSHIP_COLORS = [
  "#14532d",
  "#1d4ed8",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#0f766e",
  "#0369a1",
  "#4f46e5",
];

export function championshipPath(slug: string, rest = ""): string {
  const suffix = !rest ? "" : rest.startsWith("/") ? rest : `/${rest}`;
  return `/c/${slug}${suffix}`;
}

export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "championship";
}

export function uniqueSlug(
  name: string,
  existing: Championship[],
  ignoreId?: string
): string {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (
    existing.some((c) => c.slug === slug && c.id !== ignoreId)
  ) {
    slug = `${base}-${n}`.slice(0, 56);
    n += 1;
  }
  return slug;
}

export function nextChampionshipColor(championships: Championship[]): string {
  return CHAMPIONSHIP_COLORS[championships.length % CHAMPIONSHIP_COLORS.length];
}

export function defaultChampionships(now: string): Championship[] {
  return [
    {
      id: LIGA_CHAMPIONSHIP_ID,
      slug: "liga-portugal",
      name: "Liga Portugal",
      shortName: "Liga",
      season: "2025/26",
      description: "Primeira Liga matchweeks — the main prediction poll.",
      color: CHAMPIONSHIP_COLORS[0],
      status: "active",
      createdAt: now,
    },
    {
      id: EURO_CHAMPIONSHIP_ID,
      slug: "euro-qualificacao",
      name: "EURO Qualificação",
      shortName: "EURO",
      season: "2026",
      description: "European Championship qualifiers — a separate poll and table.",
      color: CHAMPIONSHIP_COLORS[1],
      status: "active",
      createdAt: now,
    },
  ];
}

export function scopeDatabase(
  db: Database,
  championshipId: string
): Database {
  const weeks = db.weeks.filter((w) => w.championshipId === championshipId);
  const weekIds = new Set(weeks.map((w) => w.id));
  const matches = db.matches.filter((m) => weekIds.has(m.weekId));
  const matchIds = new Set(matches.map((m) => m.id));
  const predictions = db.predictions.filter((p) => matchIds.has(p.matchId));
  return { ...db, weeks, matches, predictions };
}

function inferChampionshipId(
  label: string,
  championships: Championship[]
): string {
  const euro =
    championships.find((c) => c.id === EURO_CHAMPIONSHIP_ID) ??
    championships.find((c) => /euro/i.test(c.name) || /euro/i.test(c.slug));
  const liga =
    championships.find((c) => c.id === LIGA_CHAMPIONSHIP_ID) ??
    championships[0];
  if (/euro/i.test(label) && euro) return euro.id;
  return liga?.id ?? championships[0]?.id ?? LIGA_CHAMPIONSHIP_ID;
}

type LooseDb = Omit<Database, "championships" | "weeks"> & {
  championships?: Championship[];
  weeks: Array<Week & { championshipId?: string }>;
};

/** Idempotent upgrade of a single-poll database to multi-championship. */
export function migrateDatabase(raw: LooseDb): {
  db: Database;
  dirty: boolean;
} {
  let dirty = false;
  const now = new Date().toISOString();
  const championships = Array.isArray(raw.championships)
    ? [...raw.championships]
    : [];

  if (championships.length === 0) {
    championships.push(...defaultChampionships(now));
    dirty = true;
  }

  const weeks: Week[] = raw.weeks.map((week) => {
    if (week.championshipId) return week as Week;
    dirty = true;
    return {
      ...week,
      championshipId: inferChampionshipId(week.label, championships),
    };
  });

  return {
    db: {
      ...raw,
      championships,
      weeks,
    },
    dirty,
  };
}

export function sortChampionships(list: Championship[]): Championship[] {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function isValidChampionshipStatus(
  value: string
): value is ChampionshipStatus {
  return value === "active" || value === "archived";
}

export interface ChampionshipSummary {
  championship: Championship;
  weekCount: number;
  matchCount: number;
  openMatches: Match[];
  finishedCount: number;
  nextWeek: Week | null;
  myOpenPicks: number;
  leader: PlayerStanding | null;
  myStanding: PlayerStanding | null;
  myRank: number | null;
}

export function summarizeChampionship(args: {
  championship: Championship;
  weeks: Week[];
  matches: Match[];
  predictions: Prediction[];
  standings: PlayerStanding[];
  playerId: string | null;
}): ChampionshipSummary {
  const weeks = args.weeks.filter(
    (w) => w.championshipId === args.championship.id
  );
  const weekIds = new Set(weeks.map((w) => w.id));
  const matches = args.matches.filter((m) => weekIds.has(m.weekId));
  const openMatches = matches
    .filter((m) => m.status === "open")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const finishedCount = matches.filter((m) => m.status === "finished").length;
  const nextWeek = openMatches.length
    ? (weeks.find((w) => w.id === openMatches[0].weekId) ?? null)
    : null;

  let myOpenPicks = 0;
  if (args.playerId) {
    const openIds = new Set(openMatches.map((m) => m.id));
    myOpenPicks = args.predictions.filter(
      (p) => p.playerId === args.playerId && openIds.has(p.matchId)
    ).length;
  }

  const standings = args.standings;
  const leader = standings[0] ?? null;
  const myIndex = args.playerId
    ? standings.findIndex((s) => s.player.id === args.playerId)
    : -1;

  return {
    championship: args.championship,
    weekCount: weeks.length,
    matchCount: matches.length,
    openMatches,
    finishedCount,
    nextWeek,
    myOpenPicks,
    leader,
    myStanding: myIndex >= 0 ? standings[myIndex] : null,
    myRank: myIndex >= 0 ? myIndex + 1 : null,
  };
}
