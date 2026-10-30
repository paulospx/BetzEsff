"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChampionshipScope } from "@/context/AppContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  LoadingScreen,
  PageHeader,
  ScoreStepper,
  Select,
  Label,
} from "@/components/ui";
import { formatKickoff } from "@/lib/format";
import { formatPlayerWeekText } from "@/lib/copy-predictions";

type Draft = Record<string, { home: number; away: number }>;

export default function PredictPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading fixtures…" />}>
      <PredictPageContent />
    </Suspense>
  );
}

function PredictPageContent() {
  const {
    championship,
    weeks,
    matches,
    predictions,
    players,
    currentPlayer,
    setCurrentPlayerId,
    refresh,
    href,
  } = useChampionshipScope();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || null;

  const tokenPlayer = useMemo(() => {
    if (!token) return null;
    return players.find((p) => p.id === token) ?? null;
  }, [token, players]);

  const tokenInvalid = Boolean(
    token && !tokenPlayer && players.length > 0
  );

  useEffect(() => {
    if (!tokenPlayer) return;
    if (currentPlayer?.id === tokenPlayer.id) return;
    setCurrentPlayerId(tokenPlayer.id);
  }, [tokenPlayer, currentPlayer?.id, setCurrentPlayerId]);

  const activePlayer = tokenPlayer ?? currentPlayer;

  const weeksWithOpen = useMemo(() => {
    const openWeekIds = new Set(
      matches.filter((m) => m.status === "open").map((m) => m.weekId)
    );
    return [...weeks]
      .filter(
        (w) =>
          openWeekIds.has(w.id) || matches.some((m) => m.weekId === w.id)
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [weeks, matches]);

  const defaultWeekId = useMemo(() => {
    const withOpen = weeksWithOpen.find((w) =>
      matches.some((m) => m.weekId === w.id && m.status === "open")
    );
    return withOpen?.id ?? weeksWithOpen[weeksWithOpen.length - 1]?.id ?? "";
  }, [weeksWithOpen, matches]);

  const [weekOverride, setWeekOverride] = useState("");
  const weekId = weekOverride || defaultWeekId;
  const [draft, setDraft] = useState<Draft>({});
  const [hydratedFor, setHydratedFor] = useState("");
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const weekMatches = useMemo(
    () =>
      matches
        .filter((m) => m.weekId === weekId)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches, weekId]
  );

  const hydrateKey = `${activePlayer?.id ?? ""}:${weekId}:${weekMatches
    .map((m) => m.id)
    .join(",")}`;

  if (activePlayer && weekId && hydratedFor !== hydrateKey) {
    const next: Draft = {};
    for (const m of weekMatches) {
      const existing = predictions.find(
        (p) => p.playerId === activePlayer.id && p.matchId === m.id
      );
      next[m.id] = {
        home: existing?.homeScore ?? 0,
        away: existing?.awayScore ?? 0,
      };
    }
    setDraft(next);
    setHydratedFor(hydrateKey);
    setMessage(null);
  }

  const selectedWeek = weeks.find((w) => w.id === weekId);
  const myPicksCopy = useMemo(() => {
    if (!activePlayer) return "";
    const fromDraft = weekMatches.map((m) => {
      const d = draft[m.id];
      const existing = predictions.find(
        (p) => p.playerId === activePlayer.id && p.matchId === m.id
      );
      return {
        id: existing?.id ?? `draft-${m.id}`,
        matchId: m.id,
        playerId: activePlayer.id,
        homeScore: d?.home ?? existing?.homeScore ?? 0,
        awayScore: d?.away ?? existing?.awayScore ?? 0,
        updatedAt: existing?.updatedAt ?? "",
      };
    });
    return formatPlayerWeekText(
      selectedWeek?.label ?? "This week",
      activePlayer,
      weekMatches,
      fromDraft
    );
  }, [activePlayer, draft, predictions, selectedWeek?.label, weekMatches]);

  if (tokenInvalid) {
    return (
      <EmptyState
        title="Invalid player link"
        description="This prediction link does not match any player. Check the token in the URL or pick your name instead."
        action={
          <Link
            href="/who"
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Who are you?
          </Link>
        }
      />
    );
  }

  if (!activePlayer) {
    return (
      <EmptyState
        title="Choose who you are"
        description="We need to know which player is placing predictions so scores are saved correctly."
        action={
          <Link
            href="/who"
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Who are you?
          </Link>
        }
      />
    );
  }

  if (weeksWithOpen.length === 0) {
    return (
      <EmptyState
        title={`No ${championship?.shortName ?? "championship"} fixtures yet`}
        description="Ask an admin to add matches for this championship. You can add them anytime — not only weekly."
        action={
          <Link
            href="/admin"
            className="text-sm font-semibold text-[var(--accent-ink)] underline"
          >
            Open admin
          </Link>
        }
      />
    );
  }

  const openCount = weekMatches.filter((m) => m.status === "open").length;

  async function handleSave() {
    if (!activePlayer) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = weekMatches
        .filter((m) => m.status === "open")
        .map((m) => ({
          matchId: m.id,
          homeScore: draft[m.id]?.home ?? 0,
          awayScore: draft[m.id]?.away ?? 0,
        }));

      if (payload.length === 0) {
        setMessage({
          tone: "error",
          text: "No open matches to save for this week.",
        });
        return;
      }

      const res = await fetch("/api/predictions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: activePlayer.id,
          predictions: payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          tone: "error",
          text: data.error ?? "Could not save predictions.",
        });
        return;
      }
      await refresh();
      const errNote =
        data.errors?.length > 0 ? ` (${data.errors.length} skipped)` : "";
      setMessage({
        tone: "success",
        text: `Saved ${data.saved?.length ?? 0} prediction(s)${errNote}. You can change them until the match is locked.`,
      });
    } catch {
      setMessage({ tone: "error", text: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Place predictions"
        description={`Predicting as ${activePlayer.name} in ${championship?.name ?? "this poll"}. Exact score = 5 pts · Correct winner/draw = 3 pts.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              text={myPicksCopy}
              label="Copy my picks"
              copiedLabel="Picks copied"
              disabled={weekMatches.length === 0}
              title="Copy your saved scores for this week"
            />
            <Link
              href="/who"
              className="text-sm font-semibold text-[var(--accent-ink)] hover:underline"
            >
              Switch player
            </Link>
          </div>
        }
      />

      <div className="mb-6 max-w-xs">
        <Label htmlFor="week">Week</Label>
        <Select
          id="week"
          value={weekId}
          onChange={(e) => setWeekOverride(e.target.value)}
        >
          {weeksWithOpen.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </Select>
      </div>

      {message ? (
        <div className="mb-4">
          <Alert tone={message.tone === "success" ? "success" : "error"}>
            {message.text}
          </Alert>
        </div>
      ) : null}

      {weekMatches.length === 0 ? (
        <EmptyState
          title="No matches this week"
          description="Pick another week or ask an admin to add fixtures."
        />
      ) : (
        <ul className="space-y-3">
          {weekMatches.map((m) => {
            const locked = m.status !== "open";
            const d = draft[m.id] ?? { home: 0, away: 0 };
            const saved = predictions.find(
              (p) => p.playerId === activePlayer.id && p.matchId === m.id
            );
            return (
              <Card as="li" key={m.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[var(--ink)]">
                        {m.homeTeam}{" "}
                        <span className="font-normal text-[var(--muted)]">
                          vs
                        </span>{" "}
                        {m.awayTeam}
                      </p>
                      {m.status === "open" ? (
                        <Badge tone="accent">Open</Badge>
                      ) : m.status === "finished" ? (
                        <Badge tone="success">Finished</Badge>
                      ) : (
                        <Badge tone="warn">Locked</Badge>
                      )}
                      {saved && m.status === "open" ? (
                        <Badge tone="neutral">Saved</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatKickoff(m.kickoff)}
                      {m.status === "finished"
                        ? ` · Final ${m.homeScore}–${m.awayScore}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <ScoreStepper
                      id={`${m.id}-home`}
                      label={m.homeTeam}
                      value={d.home}
                      disabled={locked || busy}
                      onChange={(home) =>
                        setDraft((prev) => ({
                          ...prev,
                          [m.id]: { ...d, home },
                        }))
                      }
                    />
                    <span
                      className="pt-4 text-sm font-bold text-[var(--muted)]"
                      aria-hidden
                    >
                      :
                    </span>
                    <ScoreStepper
                      id={`${m.id}-away`}
                      label={m.awayTeam}
                      value={d.away}
                      disabled={locked || busy}
                      onChange={(away) =>
                        setDraft((prev) => ({
                          ...prev,
                          [m.id]: { ...d, away },
                        }))
                      }
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      {openCount > 0 ? (
        <div className="sticky bottom-4 mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted-ink)]">
            {openCount} open match{openCount === 1 ? "" : "es"} — you can edit
            until locked.
          </p>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy}
            className="shadow-lg"
          >
            {busy ? "Saving…" : "Save predictions"}
          </Button>
        </div>
      ) : weekMatches.length > 0 ? (
        <Alert tone="info">
          All matches this week are locked or finished. Check{" "}
          <Link href={href("/results")} className="font-semibold underline">
            Results
          </Link>{" "}
          for points.
        </Alert>
      ) : null}
    </div>
  );
}
