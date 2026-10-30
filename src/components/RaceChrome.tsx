"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { RaceStep, WeekStandingSnapshot } from "@/lib/types";
import {
  raceFrameTitle,
  raceHelp,
  raceJumpLabel,
  racePeriodToggleLabel,
  racePositionLabel,
  raceValueCaption,
} from "@/lib/race";
import { Button, Label, Select } from "./ui";

const BAR_MS = 1800;
export const HOLD_MS = 900;

export function usePrefersReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduceMotion;
}

export function raceMotionMs(reduceMotion: boolean): number {
  return reduceMotion ? 0 : BAR_MS;
}

export function useRaceAutoplay({
  playing,
  index,
  length,
  delay,
  onIndexChange,
  onPlayingChange,
}: {
  playing: boolean;
  index: number;
  length: number;
  delay: number;
  onIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
}) {
  useEffect(() => {
    if (!playing || length === 0) return;
    if (index >= length - 1) {
      onPlayingChange(false);
      return;
    }
    const timer = setTimeout(() => onIndexChange(index + 1), delay);
    return () => clearTimeout(timer);
  }, [playing, index, length, delay, onIndexChange, onPlayingChange]);
}

export function RaceEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-6 py-16 text-center">
      <p className="font-semibold text-[var(--ink)]">No race data yet</p>
      <p className="mt-1 text-sm text-[var(--muted-ink)]">
        Finish at least one match to animate the standings race.
      </p>
    </div>
  );
}

export function RaceChrome({
  snapshots,
  index,
  step,
  chart,
  playing,
  showCumulative,
  onIndexChange,
  onPlayingChange,
  onToggleCumulative,
  children,
}: {
  snapshots: WeekStandingSnapshot[];
  index: number;
  step: RaceStep;
  chart: "bars" | "lines";
  playing: boolean;
  showCumulative: boolean;
  onIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onToggleCumulative: () => void;
  children: ReactNode;
}) {
  const frame = snapshots[index];
  if (!frame) return <RaceEmpty />;

  const atStart = index === 0;
  const atEnd = index >= snapshots.length - 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div aria-live={playing ? "off" : "polite"} aria-atomic="true">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {racePositionLabel(step, index, snapshots.length)}
          </p>
          <h2 className="text-balance text-xl font-bold text-[var(--ink)]">
            {raceFrameTitle(frame)}
          </h2>
          <p className="text-sm text-[var(--muted-ink)]">
            {frame.matchId ? `${frame.weekLabel} · ` : ""}
            {raceValueCaption(step, showCumulative)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onToggleCumulative}
            aria-pressed={showCumulative}
          >
            {racePeriodToggleLabel(step, showCumulative)}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onPlayingChange(false);
              onIndexChange(0);
            }}
            disabled={atStart && !playing}
          >
            Restart
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onPlayingChange(false);
              onIndexChange(Math.max(0, index - 1));
            }}
            disabled={atStart}
          >
            Prev
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (atEnd) {
                onIndexChange(0);
                onPlayingChange(true);
              } else {
                onPlayingChange(!playing);
              }
            }}
          >
            {playing ? "Pause" : atEnd ? "Replay" : "Play"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onPlayingChange(false);
              onIndexChange(Math.min(snapshots.length - 1, index + 1));
            }}
            disabled={atEnd}
          >
            Next
          </Button>
        </div>
      </div>

      <div>
        <label htmlFor="race-scrub" className="sr-only">
          {step === "match" ? "Scrub through matches" : "Scrub through weeks"}
        </label>
        <input
          id="race-scrub"
          type="range"
          min={0}
          max={Math.max(0, snapshots.length - 1)}
          value={index}
          aria-valuetext={`${raceFrameTitle(frame)}, ${index + 1} of ${snapshots.length}`}
          onChange={(e) => {
            onPlayingChange(false);
            onIndexChange(Number(e.target.value));
          }}
          className="w-full accent-[var(--accent)]"
        />
        <div className="mt-1 flex justify-between gap-3 text-xs text-[var(--muted)]">
          <span className="min-w-0 truncate">{raceFrameTitle(snapshots[0])}</span>
          <span className="min-w-0 truncate text-right">
            {raceFrameTitle(snapshots[snapshots.length - 1])}
          </span>
        </div>
      </div>

      {step === "match" ? (
        <div>
          <Label htmlFor="race-jump" hint={`${snapshots.length} played`}>
            Go to match
          </Label>
          <Select
            id="race-jump"
            value={String(index)}
            onChange={(e) => {
              onPlayingChange(false);
              onIndexChange(Number(e.target.value));
            }}
          >
            {snapshots.map((snapshot, i) => (
              <option key={snapshot.matchId ?? `${snapshot.weekId}-${i}`} value={i}>
                {raceJumpLabel(snapshot)}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {children}

      <p className="text-center text-xs text-[var(--muted)]">{raceHelp(step, chart)}</p>
    </div>
  );
}


