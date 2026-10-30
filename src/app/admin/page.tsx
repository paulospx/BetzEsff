"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  LoadingScreen,
  PageHeader,
  Select,
} from "@/components/ui";
import { formatKickoff, scoreDisplay } from "@/lib/format";
import {
  CHAMPIONSHIP_COLORS,
  championshipPath,
} from "@/lib/championships";
import {
  getStoredAdminPin,
  setStoredAdminPin,
  clearStoredAdminPin,
} from "@/lib/player-session";

export default function AdminPage() {
  const { loading, weeks, matches, championships, refresh } = useApp();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    tone: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const [adminChampionshipOverride, setAdminChampionshipOverride] =
    useState("");
  const [champName, setChampName] = useState("");
  const [champShort, setChampShort] = useState("");
  const [champSeason, setChampSeason] = useState("");
  const [champDescription, setChampDescription] = useState("");
  const [champColor, setChampColor] = useState(CHAMPIONSHIP_COLORS[0]);

  // New week form
  const [weekLabel, setWeekLabel] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  // New match form
  const [matchWeekId, setMatchWeekId] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [kickoff, setKickoff] = useState("");

  // Result entry
  const [resultDrafts, setResultDrafts] = useState<
    Record<string, { home: string; away: string }>
  >({});

  useEffect(() => {
    const stored = getStoredAdminPin();
    if (!stored) return;
    void (async () => {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: stored }),
      });
      if (res.ok) {
        setPin(stored);
        setAuthed(true);
      } else {
        clearStoredAdminPin();
      }
    })();
  }, []);

  const adminChampionshipId =
    adminChampionshipOverride &&
    championships.some((c) => c.id === adminChampionshipOverride)
      ? adminChampionshipOverride
      : (championships.find((c) => c.status === "active") ??
          championships[0]
        )?.id ?? "";

  const championshipWeeks = useMemo(
    () =>
      [...weeks]
        .filter((w) =>
          adminChampionshipId
            ? w.championshipId === adminChampionshipId
            : true
        )
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [weeks, adminChampionshipId]
  );

  const resolvedMatchWeekId =
    matchWeekId && championshipWeeks.some((w) => w.id === matchWeekId)
      ? matchWeekId
      : (championshipWeeks[0]?.id ?? "");

  const sortedWeeks = championshipWeeks;

  const workingChampionship = championships.find(
    (c) => c.id === adminChampionshipId
  );

  const sortedMatches = useMemo(
    () => {
      const weekIds = new Set(championshipWeeks.map((w) => w.id));
      return [...matches]
        .filter((m) => weekIds.has(m.weekId))
        .sort((a, b) => b.kickoff.localeCompare(a.kickoff));
    },
    [matches, championshipWeeks]
  );

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Invalid PIN.");
        return;
      }
      setStoredAdminPin(pin);
      setAuthed(true);
    } catch {
      setAuthError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearStoredAdminPin();
    setAuthed(false);
    setPin("");
  }

  async function createChampionship(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          name: champName,
          shortName: champShort,
          season: champSeason,
          description: champDescription,
          color: champColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          tone: "error",
          text: data.error ?? "Failed to create championship.",
        });
        return;
      }
      setChampName("");
      setChampShort("");
      setChampSeason("");
      setChampDescription("");
      setAdminChampionshipOverride(data.id);
      await refresh();
      setBanner({
        tone: "success",
        text: `Championship “${data.name}” created. Add weeks below.`,
      });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function patchChampionship(
    championshipId: string,
    body: Record<string, unknown>,
    successMsg: string
  ) {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/championships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, championshipId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          tone: "error",
          text: data.error ?? "Update failed.",
        });
        return;
      }
      await refresh();
      setBanner({ tone: "success", text: successMsg });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteChampionship(championshipId: string, label: string) {
    if (
      !confirm(
        `Delete ${label}? Only empty championships can be deleted. Archive instead if it has weeks.`
      )
    ) {
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/championships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, championshipId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          tone: "error",
          text: data.error ?? "Delete failed.",
        });
        return;
      }
      if (adminChampionshipOverride === championshipId) {
        setAdminChampionshipOverride("");
      }
      await refresh();
      setBanner({ tone: "success", text: `Deleted ${label}.` });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function createWeek(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          championshipId: adminChampionshipId,
          label: weekLabel,
          startDate: weekStart,
          endDate: weekEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ tone: "error", text: data.error ?? "Failed to create week." });
        return;
      }
      setWeekLabel("");
      setWeekStart("");
      setWeekEnd("");
      setMatchWeekId(data.id);
      await refresh();
      setBanner({
        tone: "success",
        text: `Week “${data.label}” created. Add matches below anytime.`,
      });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function createMatch(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          weekId: resolvedMatchWeekId,
          homeTeam,
          awayTeam,
          kickoff,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ tone: "error", text: data.error ?? "Failed to add match." });
        return;
      }
      setHomeTeam("");
      setAwayTeam("");
      await refresh();
      setBanner({
        tone: "success",
        text: `Added ${data.homeTeam} vs ${data.awayTeam}. Players can predict while status is Open.`,
      });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function patchMatch(
    matchId: string,
    body: Record<string, unknown>,
    successMsg: string
  ) {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, matchId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ tone: "error", text: data.error ?? "Update failed." });
        return;
      }
      await refresh();
      setBanner({ tone: "success", text: successMsg });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteMatch(matchId: string, label: string) {
    if (!confirm(`Delete ${label}? Predictions for this match will be removed.`)) {
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ tone: "error", text: data.error ?? "Delete failed." });
        return;
      }
      await refresh();
      setBanner({ tone: "success", text: `Deleted ${label}.` });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function saveResult(matchId: string) {
    const draft = resultDrafts[matchId];
    if (!draft) return;
    const home = parseInt(draft.home, 10);
    const away = parseInt(draft.away, 10);
    if (Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
      setBanner({
        tone: "error",
        text: "Enter whole-number scores (0 or more) for both teams.",
      });
      return;
    }
    await patchMatch(
      matchId,
      { homeScore: home, awayScore: away, status: "finished" },
      "Final score saved. Points recalculated for all players."
    );
  }

  async function resetDemo() {
    if (
      !confirm(
        "Reset to demo data? This replaces all players, weeks, matches, and predictions."
      )
    ) {
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({ tone: "error", text: data.error ?? "Reset failed." });
        return;
      }
      await refresh();
      setBanner({
        tone: "info",
        text: "Demo data restored (Liga + EURO polls, Week 1 finished).",
      });
    } catch {
      setBanner({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader
          title="Admin"
          description="Each championship is a separate poll. Unlock to create championships, then add weeks and fixtures inside them."
        />
        <Card>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="pin" hint="Default demo PIN: 1234">
                Admin PIN
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                required
              />
              <FieldError>{authError}</FieldError>
            </div>
            <Button type="submit" disabled={busy || !pin}>
              {busy ? "Checking…" : "Unlock admin"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Work in one championship at a time. Create a poll, add weeks when you need them, then lock betting and enter finals."
        action={
          <Button type="button" variant="ghost" onClick={logout}>
            Lock admin
          </Button>
        }
      />

      {banner ? (
        <div className="mb-5">
          <Alert tone={banner.tone}>{banner.text}</Alert>
        </div>
      ) : null}

      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <Label htmlFor="working-championship">Working on</Label>
            <Select
              id="working-championship"
              value={adminChampionshipId}
              onChange={(e) => setAdminChampionshipOverride(e.target.value)}
              disabled={championships.length === 0}
            >
              {championships.length === 0 ? (
                <option value="">Create a championship first</option>
              ) : (
                championships.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.season ? ` · ${c.season}` : ""}
                    {c.status === "archived" ? " (archived)" : ""}
                  </option>
                ))
              )}
            </Select>
          </div>
          {workingChampionship ? (
            <Link
              href={championshipPath(workingChampionship.slug)}
              className="text-sm font-semibold text-[var(--accent-ink)] hover:underline"
            >
              Open poll
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">
          Weeks, matches, and results below apply only to this championship — other polls stay untouched.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-base font-bold text-[var(--ink)]">
          0. Championships
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          A championship is one prediction poll (Liga, cup, qualifiers…). Players are shared; tables are not.
        </p>
        {championships.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {championships.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--ink)]">
                      {c.name}
                      {c.status === "archived" ? (
                        <span className="ml-2 text-xs font-medium text-[var(--muted)]">
                          Archived
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {c.season || "No season"} · /c/{c.slug}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status === "active" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void patchChampionship(
                          c.id,
                          { status: "archived" },
                          `${c.name} archived. It stays available but leaves the main list.`
                        )
                      }
                    >
                      Archive
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void patchChampionship(
                          c.id,
                          { status: "active" },
                          `${c.name} is active again.`
                        )
                      }
                    >
                      Unarchive
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void deleteChampionship(c.id, c.name)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted-ink)]">
            None yet — create the first poll below.
          </p>
        )}
        <form
          onSubmit={createChampionship}
          className="mt-4 space-y-3 border-t border-[var(--border)] pt-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="champ-name">Name</Label>
              <Input
                id="champ-name"
                placeholder="e.g. Taça de Portugal"
                value={champName}
                onChange={(e) => setChampName(e.target.value)}
                required
                maxLength={40}
              />
            </div>
            <div>
              <Label htmlFor="champ-short" hint="Optional">
                Short name
              </Label>
              <Input
                id="champ-short"
                placeholder="e.g. Taça"
                value={champShort}
                onChange={(e) => setChampShort(e.target.value)}
                maxLength={16}
              />
            </div>
            <div>
              <Label htmlFor="champ-season" hint="Optional">
                Season
              </Label>
              <Input
                id="champ-season"
                placeholder="e.g. 2025/26"
                value={champSeason}
                onChange={(e) => setChampSeason(e.target.value)}
                maxLength={16}
              />
            </div>
            <div>
              <Label htmlFor="champ-desc" hint="Optional">
                Description
              </Label>
              <Input
                id="champ-desc"
                placeholder="Shown on the championship card"
                value={champDescription}
                onChange={(e) => setChampDescription(e.target.value)}
                maxLength={160}
              />
            </div>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-[var(--ink)]">
              Color
            </legend>
            <div className="flex flex-wrap gap-2">
              {CHAMPIONSHIP_COLORS.map((color) => {
                const selected = champColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    aria-pressed={selected}
                    onClick={() => setChampColor(color)}
                    className={`h-8 w-8 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      selected ? "ring-2 ring-[var(--ink)]" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
          </fieldset>
          <Button type="submit" disabled={busy || !champName.trim()}>
            Create championship
          </Button>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create week */}
        <Card>
          <h2 className="text-base font-bold text-[var(--ink)]">
            1. Add a week
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">
            Added to {workingChampionship?.name ?? "the selected championship"} — only when you need one.
          </p>
          <form onSubmit={createWeek} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="week-label">Label</Label>
              <Input
                id="week-label"
                placeholder="e.g. Week 3 or Cup Final"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="week-start">Start</Label>
                <Input
                  id="week-start"
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="week-end">End</Label>
                <Input
                  id="week-end"
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy || !adminChampionshipId}
            >
              Create week
            </Button>
          </form>
        </Card>

        {/* Create match */}
        <Card>
          <h2 className="text-base font-bold text-[var(--ink)]">
            2. Add a match
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">
            Fixtures open for predictions immediately in {workingChampionship?.shortName ?? "this poll"}.
          </p>
          <form onSubmit={createMatch} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="match-week">Week</Label>
              <Select
                id="match-week"
                value={resolvedMatchWeekId}
                onChange={(e) => setMatchWeekId(e.target.value)}
                required
                disabled={sortedWeeks.length === 0}
              >
                {sortedWeeks.length === 0 ? (
                  <option value="">Create a week first</option>
                ) : (
                  sortedWeeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))
                )}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="home">Home team</Label>
                <Input
                  id="home"
                  placeholder="Team A"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="away">Away team</Label>
                <Input
                  id="away"
                  placeholder="Team B"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="kickoff">Kickoff</Label>
              <Input
                id="kickoff"
                type="datetime-local"
                value={kickoff}
                onChange={(e) => setKickoff(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={busy || sortedWeeks.length === 0}
            >
              Add match
            </Button>
          </form>
        </Card>
      </div>

      {/* Match list & results */}
      <section className="mt-8" aria-labelledby="manage-heading">
        <h2
          id="manage-heading"
          className="mb-3 text-base font-bold text-[var(--ink)]"
        >
          3. Manage matches & enter results
          {workingChampionship ? ` — ${workingChampionship.name}` : ""}
        </h2>
        {sortedMatches.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted-ink)]">
              No matches yet. Create a week and add fixtures above.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sortedMatches.map((m) => {
              const week = weeks.find((w) => w.id === m.weekId);
              const draft = resultDrafts[m.id] ?? {
                home:
                  m.homeScore !== null ? String(m.homeScore) : "",
                away:
                  m.awayScore !== null ? String(m.awayScore) : "",
              };
              return (
                <Card as="li" key={m.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[var(--ink)]">
                          {m.homeTeam} vs {m.awayTeam}
                        </p>
                        {m.status === "open" ? (
                          <Badge tone="accent">Open</Badge>
                        ) : m.status === "locked" ? (
                          <Badge tone="warn">Locked</Badge>
                        ) : (
                          <Badge tone="success">
                            Final {scoreDisplay(m.homeScore, m.awayScore)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {week?.label ?? "Week"} · {formatKickoff(m.kickoff)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.status === "open" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void patchMatch(
                                m.id,
                                { status: "locked" },
                                "Predictions locked for this match."
                              )
                            }
                          >
                            Lock predictions
                          </Button>
                        ) : null}
                        {m.status === "locked" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void patchMatch(
                                m.id,
                                { status: "open" },
                                "Match reopened for predictions."
                              )
                            }
                          >
                            Reopen
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            void deleteMatch(
                              m.id,
                              `${m.homeTeam} vs ${m.awayTeam}`
                            )
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 sm:min-w-[16rem]">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Final score
                      </p>
                      <div className="flex items-end gap-2">
                        <div>
                          <Label htmlFor={`${m.id}-rh`}>{m.homeTeam}</Label>
                          <Input
                            id={`${m.id}-rh`}
                            type="number"
                            min={0}
                            className="w-16 text-center font-bold"
                            value={draft.home}
                            onChange={(e) =>
                              setResultDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, home: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <span className="pb-2.5 font-bold text-[var(--muted)]">
                          –
                        </span>
                        <div>
                          <Label htmlFor={`${m.id}-ra`}>{m.awayTeam}</Label>
                          <Input
                            id={`${m.id}-ra`}
                            type="number"
                            min={0}
                            className="w-16 text-center font-bold"
                            value={draft.away}
                            onChange={(e) =>
                              setResultDrafts((prev) => ({
                                ...prev,
                                [m.id]: { ...draft, away: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveResult(m.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <Card className="mt-10 border-dashed">
        <h2 className="text-sm font-bold text-[var(--ink)]">Demo tools</h2>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          Reset the database to the sample league (4 players, Liga + EURO polls,
          Week 1 finished). Admin PIN remains{" "}
          <code className="font-mono">1234</code>.
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-3"
          disabled={busy}
          onClick={() => void resetDemo()}
        >
          Reset to demo data
        </Button>
      </Card>
    </div>
  );
}
