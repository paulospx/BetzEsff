"use client";

import Link from "next/link";
import { championshipPath } from "@/lib/championships";
import type { ChampionshipSummary } from "@/lib/championships";
import { Badge } from "./ui";

export function ChampionshipCard({
  summary,
  signedIn,
}: {
  summary: ChampionshipSummary;
  signedIn: boolean;
}) {
  const { championship } = summary;
  const href = championshipPath(championship.slug);
  const predictHref = championshipPath(championship.slug, "/predict");
  const hasOpen = summary.openMatches.length > 0;
  const primaryHref = hasOpen ? predictHref : href;
  const primaryLabel = hasOpen
    ? signedIn && summary.myOpenPicks < summary.openMatches.length
      ? "Continue predictions"
      : "Place predictions"
    : "Open championship";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div
        className="h-1.5"
        style={{ backgroundColor: championship.color }}
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">
              <Link
                href={href}
                className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {championship.name}
              </Link>
            </h2>
            <p className="mt-0.5 text-sm text-[var(--muted-ink)]">
              {[championship.season, championship.status === "archived" ? "Archived" : "Prediction poll"]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {hasOpen ? (
            <Badge tone="accent">Open</Badge>
          ) : championship.status === "archived" ? (
            <Badge tone="neutral">Archived</Badge>
          ) : summary.finishedCount > 0 ? (
            <Badge tone="success">In play</Badge>
          ) : (
            <Badge tone="neutral">No fixtures</Badge>
          )}
        </div>

        {championship.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-ink)]">
            {championship.description}
          </p>
        ) : null}

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Open
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--ink)]">
              {summary.openMatches.length}
            </dd>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Your picks
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--ink)]">
              {signedIn && hasOpen
                ? `${summary.myOpenPicks}/${summary.openMatches.length}`
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] px-2 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Leader
            </dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-[var(--ink)]">
              {summary.leader ? summary.leader.player.name : "—"}
            </dd>
          </div>
        </dl>

        {summary.nextWeek && hasOpen ? (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Next: {summary.nextWeek.label}
            {signedIn && summary.myRank
              ? ` · You are #${summary.myRank}`
              : ""}
          </p>
        ) : summary.myRank ? (
          <p className="mt-3 text-xs text-[var(--muted)]">
            You are #{summary.myRank}
            {summary.myStanding
              ? ` with ${summary.myStanding.totalPoints} pts`
              : ""}
          </p>
        ) : (
          <p className="mt-3 text-xs text-[var(--muted)]">
            {summary.matchCount === 0
              ? "No fixtures yet — an admin can add weeks anytime."
              : `${summary.finishedCount} finished match${summary.finishedCount === 1 ? "" : "es"}`}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            {primaryLabel}
          </Link>
          <Link
            href={championshipPath(championship.slug, "/results")}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] outline-none transition hover:bg-[var(--border)]/40 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Table
          </Link>
        </div>
      </div>
    </article>
  );
}
