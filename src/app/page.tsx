"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ChampionshipCard } from "@/components/ChampionshipCard";
import {
  EmptyState,
  LoadingScreen,
  PageHeader,
} from "@/components/ui";
import { summarizeChampionship } from "@/lib/championships";

export default function ChampionshipsHubPage() {
  const {
    loading,
    error,
    championships,
    weeks,
    matches,
    predictions,
    standingsByChampionship,
    currentPlayer,
  } = useApp();

  const summaries = useMemo(() => {
    return championships.map((championship) =>
      summarizeChampionship({
        championship,
        weeks,
        matches,
        predictions,
        standings: standingsByChampionship[championship.id] ?? [],
        playerId: currentPlayer?.id ?? null,
      })
    );
  }, [
    championships,
    weeks,
    matches,
    predictions,
    standingsByChampionship,
    currentPlayer?.id,
  ]);

  const active = summaries.filter((s) => s.championship.status === "active");
  const archived = summaries.filter((s) => s.championship.status === "archived");

  const rankedActive = [...active].sort((a, b) => {
    if (a.openMatches.length !== b.openMatches.length) {
      return b.openMatches.length - a.openMatches.length;
    }
    return a.championship.name.localeCompare(b.championship.name);
  });

  if (loading) return <LoadingScreen label="Loading championships…" />;

  if (error) {
    return (
      <EmptyState
        title="Could not load the league"
        description={error}
        action={
          <button
            type="button"
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Championships"
        description="Each championship is its own poll — fixtures, table, and race stay separate. Pick one to continue."
      />

      {rankedActive.length === 0 && archived.length === 0 ? (
        <EmptyState
          title="No championships yet"
          description="An admin creates a championship (Liga, cup, qualifiers…), then adds weeks and matches inside it."
          action={
            <Link
              href="/admin"
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Go to admin
            </Link>
          }
        />
      ) : (
        <>
          {rankedActive.length > 0 ? (
            <section aria-labelledby="active-heading">
              <h2 id="active-heading" className="sr-only">
                Active championships
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {rankedActive.map((summary) => (
                  <ChampionshipCard
                    key={summary.championship.id}
                    summary={summary}
                    signedIn={Boolean(currentPlayer)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              title="No active championships"
              description="Archived polls are listed below. An admin can create a new championship or unarchive one."
            />
          )}

          {archived.length > 0 ? (
            <section className="mt-10" aria-labelledby="archived-heading">
              <h2
                id="archived-heading"
                className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted)]"
              >
                Archived
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {archived.map((summary) => (
                  <ChampionshipCard
                    key={summary.championship.id}
                    summary={summary}
                    signedIn={Boolean(currentPlayer)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
