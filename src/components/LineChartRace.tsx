"use client";

import { useMemo, useState } from "react";
import type { RaceStep, WeekStandingSnapshot } from "@/lib/types";
import { raceAxisLabel } from "@/lib/race";
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

const WIDTH = 800;
const HEIGHT = 400;
const PAD = { top: 20, right: 128, bottom: 52, left: 44 };

export function LineChartRace({
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
  const duration = raceMotionMs(reduceMotion);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useRaceAutoplay({
    playing,
    index,
    length: snapshots.length,
    delay: duration + HOLD_MS,
    onIndexChange,
    onPlayingChange,
  });

  const frame = snapshots[index];

  const maxPoints = useMemo(() => {
    let max = 1;
    const last = Math.min(index, Math.max(0, snapshots.length - 1));
    for (let i = 0; i <= last; i++) {
      const snapshot = snapshots[i];
      if (!snapshot) continue;
      for (const row of snapshot.standings) {
        const value = showCumulative ? row.cumulativePoints : row.points;
        if (value > max) max = value;
      }
    }
    return niceCeiling(max);
  }, [snapshots, index, showCumulative]);

  const players = useMemo(() => {
    if (!snapshots[0]) return [];
    return snapshots[0].standings.map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      color: row.color,
    }));
  }, [snapshots]);

  const series = useMemo(() => {
    return players.map((player) => {
      const values = snapshots.map((snapshot) => {
        const row = snapshot.standings.find((r) => r.playerId === player.playerId);
        if (!row) return 0;
        return showCumulative ? row.cumulativePoints : row.points;
      });
      return { ...player, values };
    });
  }, [players, snapshots, showCumulative]);

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const n = snapshots.length;
  const dense = step === "match" && n > 16;

  const xAt = (i: number) =>
    n <= 1 ? PAD.left + plotW / 2 : PAD.left + (i / (n - 1)) * plotW;
  const yAt = (v: number) => PAD.top + plotH - (v / maxPoints) * plotH;
  const yTicks = [0, Math.round(maxPoints / 2), maxPoints];

  const ranked = frame
    ? [...frame.standings].sort((a, b) =>
        showCumulative
          ? b.cumulativePoints - a.cumulativePoints
          : b.points - a.points || b.cumulativePoints - a.cumulativePoints
      )
    : [];

  const endLabels = frame
    ? uncollide(
        ranked.map((row) => {
          const value = showCumulative ? row.cumulativePoints : row.points;
          return {
            playerId: row.playerId,
            playerName: row.playerName,
            color: row.color,
            value,
            y: yAt(value),
          };
        }),
        16
      )
    : [];

  return (
    <RaceChrome
      snapshots={snapshots}
      index={index}
      step={step}
      chart="lines"
      playing={playing}
      showCumulative={showCumulative}
      onIndexChange={onIndexChange}
      onPlayingChange={onPlayingChange}
      onToggleCumulative={onToggleCumulative}
    >
      {frame ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full min-w-[28rem]"
              role="img"
              aria-label={ranked
                .map((row, rank) => {
                  const value = showCumulative ? row.cumulativePoints : row.points;
                  const gained =
                    step === "match" && showCumulative
                      ? `, gained ${row.points}`
                      : "";
                  return `${rank + 1}. ${row.playerName} ${value}${gained}`;
                })
                .join(". ")}
            >
              {yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    x2={WIDTH - PAD.right}
                    y1={yAt(tick)}
                    y2={yAt(tick)}
                    stroke="currentColor"
                    className="text-[var(--border)]"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={PAD.left - 8}
                    y={yAt(tick) + 4}
                    textAnchor="end"
                    className="fill-[var(--muted)]"
                    fontSize="11"
                  >
                    {tick}
                  </text>
                </g>
              ))}

              {step === "match"
                ? snapshots.map((snapshot, i) => {
                    if (i === 0 || snapshot.weekId === snapshots[i - 1]?.weekId) {
                      return null;
                    }
                    return (
                      <line
                        key={`week-${snapshot.weekId}`}
                        x1={xAt(i)}
                        x2={xAt(i)}
                        y1={PAD.top}
                        y2={HEIGHT - PAD.bottom}
                        stroke="currentColor"
                        className="text-[var(--border)]"
                        strokeDasharray="2 6"
                      />
                    );
                  })
                : null}

              <line
                x1={xAt(index)}
                x2={xAt(index)}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="currentColor"
                className="text-[var(--accent)]"
                strokeWidth="1.5"
                strokeDasharray="3 5"
              />

              {snapshots.map((snapshot, i) => {
                const label = raceAxisLabel(snapshot, i, snapshots);
                return (
                  <g key={snapshot.matchId ?? snapshot.weekId}>
                    <line
                      x1={xAt(i)}
                      x2={xAt(i)}
                      y1={HEIGHT - PAD.bottom}
                      y2={HEIGHT - PAD.bottom + 5}
                      stroke="currentColor"
                      className="text-[var(--border)]"
                    />
                    {label ? (
                      <text
                        x={xAt(i)}
                        y={HEIGHT - 16}
                        textAnchor="middle"
                        className={
                          i === index
                            ? "fill-[var(--accent-ink)]"
                            : "fill-[var(--muted)]"
                        }
                        fontSize="10"
                        fontWeight={i === index ? 700 : 500}
                      >
                        {label}
                      </text>
                    ) : null}
                  </g>
                );
              })}

              {series.map((player) => {
                const visible = player.values.slice(0, index + 1);
                const d = visible
                  .map((value, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(value)}`)
                  .join(" ");
                const dimmed = focusedId !== null && focusedId !== player.playerId;
                return (
                  <g
                    key={player.playerId}
                    opacity={dimmed ? 0.18 : 1}
                    style={{ transition: `opacity ${duration}ms ease` }}
                  >
                    <path
                      d={d}
                      fill="none"
                      stroke={player.color}
                      strokeWidth={focusedId === player.playerId ? 4 : 2.75}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {visible.map((value, i) => {
                      const weekStart =
                        i === 0 || snapshots[i]?.weekId !== snapshots[i - 1]?.weekId;
                      if (dense && i !== index && !weekStart) return null;
                      return (
                        <circle
                          key={i}
                          cx={xAt(i)}
                          cy={yAt(value)}
                          r={i === index ? 5.5 : 3.5}
                          fill={player.color}
                          stroke="var(--surface)"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </g>
                );
              })}

              {endLabels.map((label) => {
                const dimmed = focusedId !== null && focusedId !== label.playerId;
                return (
                  <g
                    key={label.playerId}
                    opacity={dimmed ? 0.25 : 1}
                    transform={`translate(${WIDTH - PAD.right + 10}, ${label.y})`}
                  >
                    <circle cx="0" cy="0" r="4" fill={label.color} />
                    <text
                      x="10"
                      y="4"
                      fontSize="12"
                      fontWeight="700"
                      className="fill-[var(--ink)]"
                    >
                      {label.playerName}{" "}
                      <tspan className="fill-[var(--muted-ink)]" fontWeight="600">
                        {label.value}
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Tap a player to isolate their line
            </p>
            <ul className="flex flex-wrap gap-2">
              {ranked.map((row, rank) => {
                const value = showCumulative ? row.cumulativePoints : row.points;
                const active = focusedId === row.playerId;
                return (
                  <li key={row.playerId}>
                    <button
                      type="button"
                      onClick={() =>
                        setFocusedId((id) =>
                          id === row.playerId ? null : row.playerId
                        )
                      }
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <span className="tabular-nums text-[var(--muted)]">
                        {rank + 1}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                        aria-hidden
                      />
                      <span className="font-semibold text-[var(--ink)]">
                        {row.playerName}
                      </span>
                      <span className="tabular-nums font-bold text-[var(--ink)]">
                        {value}
                      </span>
                      {step === "match" && showCumulative ? (
                        <span
                          className={`tabular-nums text-xs font-semibold ${
                            row.points > 0
                              ? "text-[var(--accent-ink)]"
                              : "text-[var(--muted)]"
                          }`}
                        >
                          {row.points > 0 ? `+${row.points}` : "+0"}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </RaceChrome>
  );
}

function niceCeiling(value: number): number {
  const padded = Math.max(1, value);
  if (padded <= 5) return 5;
  const step = padded <= 20 ? 5 : padded <= 50 ? 10 : 20;
  return Math.ceil(padded / step) * step;
}

function uncollide<T extends { y: number }>(items: T[], minGap: number): T[] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < minGap) {
      sorted[i] = { ...sorted[i], y: sorted[i - 1].y + minGap };
    }
  }
  return sorted;
}
