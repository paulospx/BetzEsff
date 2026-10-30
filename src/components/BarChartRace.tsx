"use client";

import { useMemo } from "react";
import type { RaceStep, WeekStandingSnapshot } from "@/lib/types";
import {
  HOLD_MS,
  RaceChrome,
  raceMotionMs,
  usePrefersReducedMotion,
  useRaceAutoplay,
} from "./RaceChrome";

interface Props {
  snapshots: WeekStandingSnapshot[];
  step: RaceStep;
  index: number;
  playing: boolean;
  showCumulative: boolean;
  onIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onToggleCumulative: () => void;
}

export function BarChartRace({
  snapshots,
  step,
  index,
  playing,
  showCumulative,
  onIndexChange,
  onPlayingChange,
  onToggleCumulative,
}: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const motionMs = raceMotionMs(reduceMotion);

  useRaceAutoplay({
    playing,
    index,
    length: snapshots.length,
    delay: motionMs + HOLD_MS,
    onIndexChange,
    onPlayingChange,
  });

  const frame = snapshots[index];
  const maxPoints = useMemo(() => {
    if (!snapshots.length) return 1;
    let max = 1;
    for (const snapshot of snapshots) {
      for (const row of snapshot.standings) {
        const value = showCumulative ? row.cumulativePoints : row.points;
        if (value > max) max = value;
      }
    }
    return max;
  }, [snapshots, showCumulative]);

  const ranked = frame
    ? [...frame.standings].sort((a, b) =>
        showCumulative
          ? b.cumulativePoints - a.cumulativePoints
          : b.points - a.points || b.cumulativePoints - a.cumulativePoints
      )
    : [];

  return (
    <RaceChrome
      snapshots={snapshots}
      index={index}
      step={step}
      chart="bars"
      playing={playing}
      showCumulative={showCumulative}
      onIndexChange={onIndexChange}
      onPlayingChange={onPlayingChange}
      onToggleCumulative={onToggleCumulative}
    >
      {frame ? (
        <div
          className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6"
          role="img"
          aria-label={ranked
            .map((row, rank) => {
              const value = showCumulative ? row.cumulativePoints : row.points;
              const gained =
                step === "match" && showCumulative ? `, gained ${row.points}` : "";
              return `${rank + 1}. ${row.playerName} ${value}${gained}`;
            })
            .join(". ")}
        >
          {ranked.map((row, rank) => {
            const value = showCumulative ? row.cumulativePoints : row.points;
            const widthPct = Math.max(4, (value / maxPoints) * 100);
            const showGain = step === "match" && showCumulative;
            return (
              <div
                key={row.playerId}
                className="grid grid-cols-[1.75rem_minmax(4.75rem,8.5rem)_1fr_3.25rem] items-center gap-2 sm:grid-cols-[2.25rem_minmax(5.5rem,9rem)_1fr_3.75rem] sm:gap-3"
              >
                <span className="text-right text-sm font-bold tabular-nums text-[var(--muted)]">
                  {rank + 1}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-semibold text-[var(--ink)]">
                    {row.playerName}
                  </span>
                </span>
                <div className="relative h-8">
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl ease-out"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: row.color,
                      transitionProperty: "width",
                      transitionDuration: `${motionMs}ms`,
                    }}
                  />
                </div>
                <span
                  className="text-right leading-tight text-[var(--ink)]"
                  style={{ transitionDuration: `${motionMs}ms` }}
                >
                  <span className="block text-base font-bold tabular-nums">
                    {value}
                  </span>
                  {showGain ? (
                    <span
                      className={`block text-xs font-semibold tabular-nums ${
                        row.points > 0
                          ? "text-[var(--accent-ink)]"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {row.points > 0 ? `+${row.points}` : "+0"}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </RaceChrome>
  );
}
