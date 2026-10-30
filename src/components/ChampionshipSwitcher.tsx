"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { championshipPath } from "@/lib/championships";

function pathAfterChampionship(pathname: string): string {
  const match = pathname.match(/^\/c\/[^/]+(\/.*)?$/);
  if (!match) return "";
  return match[1] ?? "";
}

export function ChampionshipSwitcher() {
  const { championships, currentChampionship, lastChampionship } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openForPath, setOpenForPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  if (openForPath !== pathname) {
    setOpenForPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (championships.length === 0) return null;
  if (pathname === "/") return null;

  const suffix = pathAfterChampionship(pathname);
  const shown = currentChampionship ?? lastChampionship ?? championships[0];
  const label = currentChampionship
    ? currentChampionship.shortName || currentChampionship.name
    : "Championships";

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[11rem] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-left outline-none transition hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:max-w-[16rem]"
        title={shown ? `${shown.name}${shown.season ? ` · ${shown.season}` : ""}` : "Championships"}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: shown?.color ?? "var(--muted)" }}
          aria-hidden
        />
        <span className="min-w-0 truncate text-sm font-semibold text-[var(--ink)]">
          {label}
        </span>
        <span className="ml-auto shrink-0 text-[10px] text-[var(--muted)]" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Championships"
          className="absolute left-0 z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
        >
          <ul className="max-h-72 overflow-y-auto py-1">
            {championships.map((c) => {
              const selected = c.id === currentChampionship?.id;
              const dest =
                suffix && pathname.startsWith("/c/")
                  ? championshipPath(c.slug, suffix)
                  : championshipPath(c.slug);
              return (
                <li key={c.id} role="presentation">
                  <Link
                    role="option"
                    aria-selected={selected}
                    href={dest}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm outline-none transition hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)] ${
                      selected ? "bg-[var(--accent-soft)]/60" : ""
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[var(--ink)]">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-[var(--muted)]">
                        {[c.season, c.status === "archived" ? "Archived" : null]
                          .filter(Boolean)
                          .join(" · ") || "Prediction poll"}
                      </span>
                    </span>
                    {selected ? (
                      <span className="text-xs font-semibold text-[var(--accent-ink)]">
                        Current
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-[var(--border)]">
            <Link
              href="/"
              className="block px-3 py-2.5 text-sm font-semibold text-[var(--accent-ink)] outline-none hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]"
            >
              All championships
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
