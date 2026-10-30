"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { championshipPath } from "@/lib/championships";
import { ChampionshipSwitcher } from "./ChampionshipSwitcher";

export function Nav() {
  const pathname = usePathname();
  const { currentPlayer, appName, currentChampionship } = useApp();
  const inChampionship = Boolean(currentChampionship);

  const links = inChampionship && currentChampionship
    ? [
        {
          href: championshipPath(currentChampionship.slug),
          label: "Home",
          hint: "This championship",
          exact: true,
        },
        {
          href: championshipPath(currentChampionship.slug, "/predict"),
          label: "Predict",
          hint: "Place bets",
        },
        {
          href: championshipPath(currentChampionship.slug, "/picks"),
          label: "Picks",
          hint: "Week board — copy predictions",
        },
        {
          href: championshipPath(currentChampionship.slug, "/results"),
          label: "Results",
          hint: "Scores & points",
        },
        {
          href: championshipPath(currentChampionship.slug, "/race"),
          label: "Race",
          hint: "Bar and line standings race",
        },
        { href: "/admin", label: "Admin", hint: "Manage championships" },
      ]
    : [
        {
          href: "/",
          label: "Championships",
          hint: "All prediction polls",
          exact: true,
        },
        { href: "/admin", label: "Admin", hint: "Manage championships" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            title="All championships"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pitch)] text-sm font-bold text-white shadow-sm"
              aria-hidden
            >
              ⚽
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold tracking-tight text-[var(--ink)]">
                {appName.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim() ||
                  appName}
              </div>
              <div className="text-xs text-[var(--muted)]">
                {currentChampionship
                  ? currentChampionship.season || "Prediction poll"
                  : "Prediction league"}
              </div>
            </div>
          </Link>
          <ChampionshipSwitcher />
        </div>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main"
        >
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.hint}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                    : "text-[var(--muted-ink)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {currentPlayer ? (
            <Link
              href="/who"
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] py-1 pl-1 pr-3 text-sm outline-none transition hover:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              title="Switch player"
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: currentPlayer.color }}
                aria-hidden
              >
                {currentPlayer.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[7rem] truncate font-medium text-[var(--ink)]">
                {currentPlayer.name}
              </span>
            </Link>
          ) : (
            <Link
              href="/who"
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Who are you?
            </Link>
          )}
        </div>
      </div>

      {/* Mobile / tablet nav – recognition over recall, always visible labels */}
      <nav
        className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-2 py-1.5 lg:hidden"
        aria-label="Main mobile"
      >
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                  : "text-[var(--muted-ink)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
