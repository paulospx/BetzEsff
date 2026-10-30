"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useChampionshipScope } from "@/context/AppContext";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { formatKickoff, scoreDisplay } from "@/lib/format";

export default function ChampionshipHomePage() {
  const {
    championship,
    weeks,
    matches,
    standings,
    currentPlayer,
    predictions,
    href,
  } = useChampionshipScope();

  const openMatches = useMemo(
    () =>
      matches
        .filter((m) => m.status === "open")
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches]
  );

  const recentFinished = useMemo(
    () =>
      matches
        .filter((m) => m.status === "finished")
        .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
        .slice(0, 3),
    [matches]
  );

  const nextWeek = useMemo(() => {
    if (!openMatches.length) return null;
    return weeks.find((w) => w.id === openMatches[0].weekId) ?? null;
  }, [openMatches, weeks]);

  const myOpenPredictions = useMemo(() => {
    if (!currentPlayer) return 0;
    const openIds = new Set(openMatches.map((m) => m.id));
    return predictions.filter(
      (p) => p.playerId === currentPlayer.id && openIds.has(p.matchId)
    ).length;
  }, [currentPlayer, openMatches, predictions]);

  const myStanding = useMemo(() => {
    if (!currentPlayer) return null;
    return standings.find((s) => s.player.id === currentPlayer.id) ?? null;
  }, [currentPlayer, standings]);

  if (!championship) return null;

  return (
    <div>
      <PageHeader
        title={championship.name}
        description={
          championship.description ||
          `${championship.season ? `${championship.season} · ` : ""}This poll has its own fixtures, table, and race.`
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Open fixtures
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--ink)]">
            {openMatches.length}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-ink)]">
            {nextWeek ? nextWeek.label : "No open week"}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Your picks
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--ink)]">
            {currentPlayer
              ? `${myOpenPredictions}/${openMatches.length}`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-ink)]">
            {currentPlayer
              ? "Saved for open matches"
              : "Select who you are first"}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Your points
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--ink)]">
            {myStanding ? myStanding.totalPoints : "—"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-ink)]">
            {myStanding
              ? `#${standings.findIndex((s) => s.player.id === currentPlayer?.id) + 1} in ${championship.shortName}`
              : "After results land"}
          </p>
        </Card>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={href("/predict")}
          className="group rounded-2xl border border-[var(--border)] bg-[var(--pitch)] p-5 text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Next step
          </div>
          <div className="mt-1 text-lg font-bold">Place your predictions</div>
          <p className="mt-1 text-sm text-white/80">
            Enter scores for open {championship.shortName} matches before they kick off.
          </p>
        </Link>
        <Link
          href={href("/picks")}
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            This week
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--ink)]">
            Week board
          </div>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">
            See every pick for a week — copy to clipboard to share.
          </p>
        </Link>
        <Link
          href={href("/race")}
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:col-span-2 lg:col-span-1"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Fun
          </div>
          <div className="mt-1 text-lg font-bold text-[var(--ink)]">
            Standings race
          </div>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">
            Bar and line race of who leads after each week.
          </p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="open-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="open-heading"
              className="text-base font-bold text-[var(--ink)]"
            >
              Open matches
            </h2>
            <Link
              href={href("/predict")}
              className="text-sm font-semibold text-[var(--accent-ink)] hover:underline"
            >
              Predict all
            </Link>
          </div>
          {openMatches.length === 0 ? (
            <EmptyState
              title="No open matches"
              description="An admin can add fixtures for this championship when you're ready."
              action={
                <Link
                  href="/admin"
                  className="text-sm font-semibold text-[var(--accent-ink)] underline"
                >
                  Go to admin
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {openMatches.map((m) => (
                <Card as="li" key={m.id} className="!p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {m.homeTeam}{" "}
                        <span className="font-normal text-[var(--muted)]">
                          vs
                        </span>{" "}
                        {m.awayTeam}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {formatKickoff(m.kickoff)}
                      </p>
                    </div>
                    <Badge tone="accent">Open</Badge>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="table-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="table-heading"
              className="text-base font-bold text-[var(--ink)]"
            >
              Leaderboard
            </h2>
            <Link
              href={href("/results")}
              className="text-sm font-semibold text-[var(--accent-ink)] hover:underline"
            >
              Full results
            </Link>
          </div>
          {standings.length === 0 ? (
            <EmptyState
              title="No players yet"
              description="Add yourself on the Who are you? screen."
            />
          ) : (
            <Card className="!p-0 overflow-hidden">
              <ol className="divide-y divide-[var(--border)]">
                {standings.map((row, i) => (
                  <li
                    key={row.player.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      row.player.id === currentPlayer?.id
                        ? "bg-[var(--accent-soft)]/50"
                        : ""
                    }`}
                  >
                    <span className="w-6 text-sm font-bold tabular-nums text-[var(--muted)]">
                      {i + 1}
                    </span>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: row.player.color }}
                      aria-hidden
                    >
                      {row.player.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--ink)]">
                        {row.player.name}
                        {row.player.id === currentPlayer?.id ? (
                          <span className="ml-1.5 text-xs font-medium text-[var(--accent-ink)]">
                            you
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {row.exactScores} exact · {row.correctOutcomes} results
                      </p>
                    </div>
                    <span className="text-lg font-bold tabular-nums text-[var(--ink)]">
                      {row.totalPoints}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {recentFinished.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold text-[var(--ink)]">
                Latest results
              </h3>
              <ul className="space-y-2">
                {recentFinished.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-[var(--ink)]">
                      {m.homeTeam} vs {m.awayTeam}
                    </span>
                    <span className="font-bold tabular-nums text-[var(--ink)]">
                      {scoreDisplay(m.homeScore, m.awayScore)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
