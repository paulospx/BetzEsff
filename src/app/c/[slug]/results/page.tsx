"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useChampionshipScope } from "@/context/AppContext";
import {
  Badge,
  Card,
  EmptyState,
  Label,
  PageHeader,
  PointsChip,
  Select,
} from "@/components/ui";
import { formatKickoff, scoreDisplay } from "@/lib/format";
import { scorePrediction } from "@/lib/scoring";

export default function ResultsPage() {
  const {
    championship,
    weeks,
    matches,
    predictions,
    players,
    standings,
    currentPlayer,
    href,
  } = useChampionshipScope();

  const finishedWeeks = useMemo(() => {
    const ids = new Set(
      matches.filter((m) => m.status === "finished").map((m) => m.weekId)
    );
    return [...weeks]
      .filter((w) => ids.has(w.id))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [weeks, matches]);

  const [weekId, setWeekId] = useState<string>("all");
  const [playerFilter, setPlayerFilter] = useState<string>("all");

  const displayMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === "finished")
      .filter((m) => (weekId === "all" ? true : m.weekId === weekId))
      .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
  }, [matches, weekId]);

  if (displayMatches.length === 0 && finishedWeeks.length === 0) {
    return (
      <div>
        <PageHeader
          title="Results"
          description={`Final scores and how everyone scored in ${championship?.name ?? "this poll"}.`}
        />
        <EmptyState
          title="No finished matches yet"
          description="Once an admin enters final scores, points appear here automatically — only for this championship."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Results"
        description="Compare predictions to final scores. Exact = 5 · Correct result = 3 · Miss = 0."
        action={
          <Link
            href={href("/picks")}
            className="text-sm font-semibold text-[var(--accent-ink)] hover:underline"
          >
            Open week board
          </Link>
        }
      />

      <Card className="mb-6 !p-0 overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            {championship?.name ?? "Championship"} standings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">#</th>
                <th className="px-4 py-2.5 font-semibold">Player</th>
                <th className="px-4 py-2.5 font-semibold">Points</th>
                <th className="px-4 py-2.5 font-semibold">Exact</th>
                <th className="px-4 py-2.5 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {standings.map((row, i) => (
                <tr
                  key={row.player.id}
                  className={
                    row.player.id === currentPlayer?.id
                      ? "bg-[var(--accent-soft)]/40"
                      : ""
                  }
                >
                  <td className="px-4 py-2.5 tabular-nums text-[var(--muted)]">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-[var(--ink)]">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.player.color }}
                        aria-hidden
                      />
                      {row.player.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold tabular-nums">
                    {row.totalPoints}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {row.exactScores}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {row.correctOutcomes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="week-filter">Week</Label>
          <Select
            id="week-filter"
            value={weekId}
            onChange={(e) => setWeekId(e.target.value)}
          >
            <option value="all">All finished weeks</option>
            {finishedWeeks.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="player-filter">Highlight player</Label>
          <Select
            id="player-filter"
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
          >
            <option value="all">Everyone</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ul className="space-y-4">
        {displayMatches.map((match) => {
          const week = weeks.find((w) => w.id === match.weekId);
          const matchPreds = predictions
            .filter((p) => p.matchId === match.id)
            .map((p) => ({
              ...scorePrediction(p, match),
              player: players.find((pl) => pl.id === p.playerId),
            }))
            .filter((x) => x.player)
            .sort((a, b) => b.points - a.points);

          return (
            <Card as="li" key={match.id}>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--muted)]">
                    {week?.label ?? "Week"} · {formatKickoff(match.kickoff)}
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold text-[var(--ink)]">
                    {match.homeTeam}{" "}
                    <span className="text-[var(--muted)] font-semibold">
                      {scoreDisplay(match.homeScore, match.awayScore)}
                    </span>{" "}
                    {match.awayTeam}
                  </h3>
                </div>
                <Badge tone="success">Final</Badge>
              </div>

              {matchPreds.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-ink)]">
                  No predictions for this match.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--border)]">
                  {matchPreds.map((row) => {
                    const highlight =
                      playerFilter !== "all"
                        ? row.player!.id === playerFilter
                        : row.player!.id === currentPlayer?.id;
                    return (
                      <li
                        key={row.prediction.id}
                        className={`flex flex-wrap items-center justify-between gap-2 py-2.5 ${
                          highlight
                            ? "rounded-lg bg-[var(--accent-soft)]/30 px-2"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: row.player!.color }}
                            aria-hidden
                          >
                            {row.player!.name.slice(0, 1)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">
                              {row.player!.name}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              Predicted{" "}
                              <span className="font-semibold tabular-nums text-[var(--ink)]">
                                {row.prediction.homeScore}–
                                {row.prediction.awayScore}
                              </span>
                            </p>
                          </div>
                        </div>
                        <PointsChip points={row.points} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </ul>
    </div>
  );
}
