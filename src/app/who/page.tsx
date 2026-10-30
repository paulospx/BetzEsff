"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useApp } from "@/context/AppContext";
import { championshipPath } from "@/lib/championships";
import {
  Alert,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  LoadingScreen,
  PageHeader,
} from "@/components/ui";

export default function WhoPage() {
  const router = useRouter();
  const {
    loading,
    players,
    currentPlayer,
    lastChampionship,
    setCurrentPlayerId,
    refresh,
  } = useApp();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function continueHref(playerId: string) {
    const qs = `?token=${encodeURIComponent(playerId)}`;
    if (lastChampionship) {
      return `${championshipPath(lastChampionship.slug, "/predict")}${qs}`;
    }
    return "/";
  }

  if (loading) return <LoadingScreen />;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create player.");
        return;
      }
      setCurrentPlayerId(data.id);
      await refresh();
      router.push(continueHref(data.id));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Who are you?"
        description="Pick your name so we can save your predictions. Everyone on the same device can switch player anytime."
      />

      {currentPlayer ? (
        <Alert tone="info">
          Signed in as <strong>{currentPlayer.name}</strong>. Choose another
          player below, or continue with your picks.
        </Alert>
      ) : null}

      <section className="mt-6" aria-labelledby="pick-heading">
        <h2 id="pick-heading" className="mb-3 text-sm font-bold text-[var(--ink)]">
          Existing players
        </h2>
        {players.length === 0 ? (
          <p className="text-sm text-[var(--muted-ink)]">
            No players yet — create the first one below.
          </p>
        ) : (
          <ul className="grid gap-2">
            {players.map((p) => {
              const active = p.id === currentPlayer?.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPlayerId(p.id);
                      router.push(continueHref(p.id));
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
                    }`}
                    aria-pressed={active}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    >
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex-1 font-semibold text-[var(--ink)]">
                      {p.name}
                    </span>
                    {active ? (
                      <span className="text-xs font-semibold text-[var(--accent-ink)]">
                        Selected
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">Select</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card className="mt-8">
        <h2 className="text-base font-bold text-[var(--ink)]">
          Join the league
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          New friend? Add a display name (max 24 characters).
        </p>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="name" hint="Required">
              Display name
            </Label>
            <Input
              id="name"
              name="name"
              autoComplete="nickname"
              placeholder="e.g. Alex"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "name-error" : undefined}
            />
            <FieldError>
              {error ? <span id="name-error">{error}</span> : null}
            </FieldError>
          </div>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Creating…" : "Create & continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
