"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { EmptyState, LoadingScreen } from "./ui";

export function ChampionshipShell({ children }: { children: ReactNode }) {
  const { loading, error, currentChampionship, championships } = useApp();

  if (loading) return <LoadingScreen label="Loading championship…" />;

  if (error) {
    return (
      <EmptyState
        title="Could not load championships"
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

  if (!currentChampionship) {
    return (
      <EmptyState
        title="Championship not found"
        description={
          championships.length
            ? "That poll does not exist. Pick a championship from the list."
            : "No championships yet. An admin can create the first poll."
        }
        action={
          <Link
            href={championships.length ? "/" : "/admin"}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {championships.length ? "All championships" : "Go to admin"}
          </Link>
        }
      />
    );
  }

  return children;
}
