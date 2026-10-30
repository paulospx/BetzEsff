"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useChampionshipScope } from "@/context/AppContext";
import {
  Badge,
  Card,
  CopyButton,
  EmptyState,
  Label,
  PageHeader,
  PointsChip,
  Select,
} from "@/components/ui";
import { formatKickoff, scoreDisplay } from "@/lib/format";
import { copyToClipboard } from "@/lib/clipboard";
import {
  formatMatchPredictionsText,
  formatPlayerWeekText,
  formatSinglePredictionText,
  formatWeekPredictionsText,
} from "@/lib/copy-predictions";
import { scorePrediction } from "@/lib/scoring";

export default function PicksPage() {
  const {
    championship,
    weeks,
    matches,
    predictions,
    players,
    currentPlayer,
  } = useChampionshipScope();

  const weeksWithMatches = useMemo(() => {
    const ids = new Set(matches.map((m) => m.weekId));
    return [...weeks]
      .filter((w) => ids.has(w.id))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [weeks, matches]);

  const defaultWeekId = useMemo(() => {
    const withOpen = weeksWithMatches.find((w) =>
      matches.some((m) => m.weekId === w.id && m.status === "open")
    );
    return withOpen?.id ?? weeksWithMatches[0]?.id ?? "";
  }, [weeksWithMatches, matches]);

  const [weekOverride, setWeekOverride] = useState("");
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const weekId = weekOverride || defaultWeekId;

  const week = weeks.find((w) => w.id === weekId);
  const weekMatches = useMemo(
    () =>
      matches
        .filter((m) => m.weekId === weekId)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches, weekId]
  );

  const weekPredictions = useMemo(
    () =>
      predictions.filter((p) => weekMatches.some((m) => m.id === p.matchId)),
    [predictions, weekMatches]
  );

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (currentPlayer && a.id === currentPlayer.id) return -1;
      if (currentPlayer && b.id === currentPlayer.id) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [players, currentPlayer]);

  const filled = useMemo(() => {
    const total = weekMatches.length * players.length;
    if (total === 0) return { count: 0, total: 0 };
    return { count: weekPredictions.length, total };
  }, [weekMatches.length, players.length, weekPredictions.length]);

  const weekCopy = week
    ? formatWeekPredictionsText(
        week.label,
        weekMatches,
        sortedPlayers,
        weekPredictions
      )
    : "";

  useEffect(() => {
    if (!copiedCell) return;
    const id = window.setTimeout(() => setCopiedCell(null), 1600);
    return () => window.clearTimeout(id);
  }, [copiedCell]);

  if (weeksWithMatches.length === 0) {
    return (
      <div>
        <PageHeader
          title="Week board"
          description={`See every pick for a ${championship?.shortName ?? "championship"} week, then copy them to share.`}
        />
        <EmptyState
          title="No fixtures yet"
          description="Ask an admin to add matches. The board fills in as people save predictions."
          action={
            <Link
              href="/admin"
              className="text-sm font-semibold text-[var(--accent-ink)] underline"
            >
              Open admin
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Week board"
        description="Every match, every player, one week. Tap a score to copy it. Use Copy week to paste the whole sheet into chat."
        action={
          <CopyButton
            text={weekCopy}
            label="Copy week"
            copiedLabel="Week copied"
            variant="primary"
            disabled={weekMatches.length === 0}
            title="Copy all predictions for this week"
          />
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-end">
        <div>
          <Label htmlFor="picks-week">Week</Label>
          <Select
            id="picks-week"
            value={weekId}
            onChange={(e) => setWeekOverride(e.target.value)}
          >
            {weeksWithMatches.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-sm text-[var(--muted-ink)] sm:pb-2.5">
          {filled.count} of {filled.total} picks in
          {weekMatches.some((m) => m.status === "open")
            ? " · Open matches can still change"
            : ""}
        </p>
      </div>

      {weekMatches.length === 0 ? (
        <EmptyState
          title="No matches this week"
          description="Pick another week from the list."
        />
      ) : players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Someone needs to join before there are predictions to show."
          action={
            <Link
              href="/who"
              className="text-sm font-semibold text-[var(--accent-ink)] underline"
            >
              Who are you?
            </Link>
          }
        />
      ) : (
        <>
          <Card className="mb-4 !p-3 sm:!p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Copy one player
            </p>
            <ul className="flex flex-wrap gap-2">
              {sortedPlayers.map((p) => (
                <li key={p.id}>
                  <CopyButton
                    text={
                      week
                        ? formatPlayerWeekText(
                            week.label,
                            p,
                            weekMatches,
                            weekPredictions
                          )
                        : ""
                    }
                    label={p.name}
                    copiedLabel={`${p.name} copied`}
                    variant="ghost"
                    className="!px-3 !py-1.5"
                    title={`Copy ${p.name}'s picks for ${week?.label ?? "this week"}`}
                  />
                </li>
              ))}
            </ul>
          </Card>

          {/* Desktop / wide: match × player matrix */}
          <Card className="hidden !p-0 overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <caption className="sr-only">
                  Predictions for {week?.label}. Columns are players, rows are
                  matches. Each score is a button that copies that pick.
                </caption>
                <thead>
                  <tr className="bg-[var(--surface-2)] text-left">
                    <th
                      scope="col"
                      className="sticky left-0 z-10 min-w-[12rem] bg-[var(--surface-2)] px-4 py-3 font-semibold text-[var(--ink)]"
                    >
                      Match
                    </th>
                    {sortedPlayers.map((p) => (
                      <th
                        key={p.id}
                        scope="col"
                        className={`min-w-[6.5rem] px-3 py-3 text-center font-semibold ${
                          p.id === currentPlayer?.id
                            ? "bg-[var(--accent-soft)]/50 text-[var(--accent-ink)]"
                            : "text-[var(--ink)]"
                        }`}
                      >
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                            aria-hidden
                          />
                          {p.name}
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="w-12 px-2 py-3">
                      <span className="sr-only">Copy match</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {weekMatches.map((match) => (
                    <tr key={match.id}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-[var(--surface)] px-4 py-3 text-left font-medium"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[var(--ink)]">
                            {match.homeTeam}{" "}
                            <span className="font-normal text-[var(--muted)]">
                              vs
                            </span>{" "}
                            {match.awayTeam}
                          </span>
                          <MatchStatus match={match} />
                        </div>
                        <p className="mt-0.5 text-xs font-normal text-[var(--muted)]">
                          {formatKickoff(match.kickoff)}
                          {match.status === "finished"
                            ? ` · Final ${scoreDisplay(match.homeScore, match.awayScore)}`
                            : ""}
                        </p>
                      </th>
                      {sortedPlayers.map((player) => {
                        const pred = weekPredictions.find(
                          (p) =>
                            p.playerId === player.id && p.matchId === match.id
                        );
                        const cellId = `${match.id}:${player.id}`;
                        const scored = pred
                          ? scorePrediction(pred, match)
                          : null;
                        return (
                          <td
                            key={player.id}
                            className={`px-2 py-2 text-center ${
                              player.id === currentPlayer?.id
                                ? "bg-[var(--accent-soft)]/30"
                                : ""
                            }`}
                          >
                            {pred ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await copyToClipboard(
                                    formatSinglePredictionText(
                                      player,
                                      match,
                                      pred
                                    )
                                  );
                                  if (ok) setCopiedCell(cellId);
                                }}
                                title={`Copy ${player.name}: ${pred.homeScore}–${pred.awayScore}`}
                                className="mx-auto flex flex-col items-center gap-1 rounded-lg px-2 py-1 outline-none transition hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                              >
                                <span className="text-base font-bold tabular-nums text-[var(--ink)]">
                                  {copiedCell === cellId
                                    ? "Copied"
                                    : `${pred.homeScore}–${pred.awayScore}`}
                                </span>
                                {match.status === "finished" && scored ? (
                                  <PointsChip points={scored.points} />
                                ) : null}
                              </button>
                            ) : (
                              <span className="text-[var(--muted)]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2">
                        <CopyButton
                          text={formatMatchPredictionsText(
                            match,
                            sortedPlayers,
                            weekPredictions
                          )}
                          label="Copy"
                          copiedLabel="OK"
                          variant="ghost"
                          className="!px-2 !py-1.5 text-xs"
                          title={`Copy all picks for ${match.homeTeam} vs ${match.awayTeam}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile: one card per match — easier to scan than a wide table */}
          <ul className="space-y-3 md:hidden">
            {weekMatches.map((match) => (
              <Card as="li" key={match.id}>
                <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[var(--ink)]">
                        {match.homeTeam}{" "}
                        <span className="font-normal text-[var(--muted)]">
                          vs
                        </span>{" "}
                        {match.awayTeam}
                      </h3>
                      <MatchStatus match={match} />
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {formatKickoff(match.kickoff)}
                      {match.status === "finished"
                        ? ` · Final ${scoreDisplay(match.homeScore, match.awayScore)}`
                        : ""}
                    </p>
                  </div>
                  <CopyButton
                    text={formatMatchPredictionsText(
                      match,
                      sortedPlayers,
                      weekPredictions
                    )}
                    label="Copy"
                    copiedLabel="Copied"
                    variant="ghost"
                    className="!px-2.5 !py-1.5 text-xs"
                  />
                </div>
                <ul className="mt-2 divide-y divide-[var(--border)]">
                  {sortedPlayers.map((player) => {
                    const pred = weekPredictions.find(
                      (p) =>
                        p.playerId === player.id && p.matchId === match.id
                    );
                    const cellId = `${match.id}:${player.id}`;
                    const scored = pred
                      ? scorePrediction(pred, match)
                      : null;
                    return (
                      <li
                        key={player.id}
                        className={`flex items-center justify-between gap-2 py-2.5 ${
                          player.id === currentPlayer?.id
                            ? "rounded-lg bg-[var(--accent-soft)]/30 px-2"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: player.color }}
                            aria-hidden
                          >
                            {player.name.slice(0, 1)}
                          </span>
                          <span className="text-sm font-semibold text-[var(--ink)]">
                            {player.name}
                          </span>
                        </div>
                        {pred ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await copyToClipboard(
                                formatSinglePredictionText(player, match, pred)
                              );
                              if (ok) setCopiedCell(cellId);
                            }}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            title={`Copy ${player.name}: ${pred.homeScore}–${pred.awayScore}`}
                          >
                            <span className="font-bold tabular-nums text-[var(--ink)]">
                              {copiedCell === cellId
                                ? "Copied"
                                : `${pred.homeScore}–${pred.awayScore}`}
                            </span>
                            {match.status === "finished" && scored ? (
                              <PointsChip points={scored.points} />
                            ) : null}
                          </button>
                        ) : (
                          <span className="text-sm text-[var(--muted)]">
                            No pick
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </ul>

        </>
      )}
    </div>
  );
}

function MatchStatus({
  match,
}: {
  match: { status: "open" | "locked" | "finished" };
}) {
  if (match.status === "open") return <Badge tone="accent">Open</Badge>;
  if (match.status === "finished") return <Badge tone="success">Final</Badge>;
  return <Badge tone="warn">Locked</Badge>;
}
