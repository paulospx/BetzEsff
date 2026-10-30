"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";
import type {
  Championship,
  Match,
  Player,
  PlayerStanding,
  Prediction,
  Week,
  WeekStandingSnapshot,
} from "@/lib/types";
import {
  championshipPath,
  sortChampionships,
} from "@/lib/championships";
import {
  clearStoredPlayerId,
  getStoredChampionshipSlug,
  getStoredPlayerId,
  setStoredChampionshipSlug,
  setStoredPlayerId,
} from "@/lib/player-session";

interface BootstrapData {
  championships: Championship[];
  players: Player[];
  weeks: Week[];
  matches: Match[];
  predictions: Prediction[];
  settings: { appName: string };
  standingsByChampionship: Record<string, PlayerStanding[]>;
  raceByChampionship: Record<string, WeekStandingSnapshot[]>;
}

interface AppContextValue {
  loading: boolean;
  error: string | null;
  championships: Championship[];
  players: Player[];
  weeks: Week[];
  matches: Match[];
  predictions: Prediction[];
  standingsByChampionship: Record<string, PlayerStanding[]>;
  raceByChampionship: Record<string, WeekStandingSnapshot[]>;
  appName: string;
  currentPlayer: Player | null;
  currentChampionship: Championship | null;
  lastChampionship: Championship | null;
  setCurrentPlayerId: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const params = useParams<{ slug?: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : null;

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load league data.");
      const json = (await res.json()) as BootstrapData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (typeof window !== "undefined" && !sessionHydrated) {
    setPlayerId(getStoredPlayerId());
    setSessionHydrated(true);
  }

  useEffect(() => {
    // Bootstrap fetch on mount; state updates happen in the fetch callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const championships = useMemo(
    () => sortChampionships(data?.championships ?? []),
    [data?.championships]
  );

  const currentChampionship = useMemo(() => {
    if (!slug) return null;
    return championships.find((c) => c.slug === slug) ?? null;
  }, [championships, slug]);

  useEffect(() => {
    if (!currentChampionship) return;
    setStoredChampionshipSlug(currentChampionship.slug);
  }, [currentChampionship]);

  const lastChampionship = useMemo(() => {
    if (currentChampionship) return currentChampionship;
    const stored =
      typeof window === "undefined" ? null : getStoredChampionshipSlug();
    return (
      championships.find((c) => c.slug === stored) ??
      championships.find((c) => c.status === "active") ??
      championships[0] ??
      null
    );
  }, [championships, currentChampionship]);

  const setCurrentPlayerId = useCallback((id: string | null) => {
    if (id) setStoredPlayerId(id);
    else clearStoredPlayerId();
    setPlayerId(id);
  }, []);

  const currentPlayer = useMemo(() => {
    if (!data || !playerId) return null;
    return data.players.find((p) => p.id === playerId) ?? null;
  }, [data, playerId]);

  const value: AppContextValue = {
    loading,
    error,
    championships,
    players: data?.players ?? [],
    weeks: data?.weeks ?? [],
    matches: data?.matches ?? [],
    predictions: data?.predictions ?? [],
    standingsByChampionship: data?.standingsByChampionship ?? {},
    raceByChampionship: data?.raceByChampionship ?? {},
    appName: data?.settings.appName ?? "BetzEsff",
    currentPlayer,
    currentChampionship,
    lastChampionship,
    setCurrentPlayerId,
    refresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useChampionshipScope() {
  const app = useApp();
  const championship = app.currentChampionship;

  const weeks = useMemo(() => {
    if (!championship) return [];
    return app.weeks.filter((w) => w.championshipId === championship.id);
  }, [app.weeks, championship]);

  const matches = useMemo(() => {
    const weekIds = new Set(weeks.map((w) => w.id));
    return app.matches.filter((m) => weekIds.has(m.weekId));
  }, [app.matches, weeks]);

  const predictions = useMemo(() => {
    const matchIds = new Set(matches.map((m) => m.id));
    return app.predictions.filter((p) => matchIds.has(p.matchId));
  }, [app.predictions, matches]);

  const standings = championship
    ? (app.standingsByChampionship[championship.id] ?? [])
    : [];
  const race = championship
    ? (app.raceByChampionship[championship.id] ?? [])
    : [];

  const href = useCallback(
    (rest = "") =>
      championship ? championshipPath(championship.slug, rest) : "/",
    [championship]
  );

  return {
    ...app,
    championship,
    weeks,
    matches,
    predictions,
    standings,
    race,
    href,
  };
}
