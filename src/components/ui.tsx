"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { copyToClipboard } from "@/lib/clipboard";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted-ink)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "accent" | "exact";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--surface-2)] text-[var(--muted-ink)]",
    success: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-900",
    danger: "bg-rose-50 text-rose-800",
    accent: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
    exact: "bg-violet-50 text-violet-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:brightness-110 shadow-sm disabled:opacity-50",
    secondary:
      "bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--border)]/40 disabled:opacity-50",
    ghost:
      "bg-transparent text-[var(--muted-ink)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] disabled:opacity-50",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-[var(--ink)]"
      >
        {children}
      </label>
      {hint ? (
        <span className="text-xs text-[var(--muted)]">{hint}</span>
      ) : null}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 disabled:bg-[var(--surface-2)] disabled:text-[var(--muted)] ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-sm text-rose-700" role="alert">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center py-12 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-2xl"
        aria-hidden
      >
        📋
      </div>
      <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-ink)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--muted-ink)]">{label}</p>
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    error: "border-rose-200 bg-rose-50 text-rose-950",
  };
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function ScoreStepper({
  value,
  onChange,
  disabled,
  id,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  id: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-lg font-bold text-[var(--ink)] transition hover:bg-[var(--border)]/50 disabled:cursor-not-allowed disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          min={0}
          max={20}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isNaN(n)) onChange(0);
            else onChange(Math.min(20, Math.max(0, n)));
          }}
          className="h-12 w-14 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center text-xl font-bold tabular-nums text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 disabled:opacity-50"
          aria-label={label}
        />
        <button
          type="button"
          disabled={disabled || value >= 20}
          onClick={() => onChange(Math.min(20, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-lg font-bold text-[var(--ink)] transition hover:bg-[var(--border)]/50 disabled:cursor-not-allowed disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function PointsChip({ points }: { points: number }) {
  if (points === 5) return <Badge tone="exact">+5 exact</Badge>;
  if (points === 3) return <Badge tone="success">+3 result</Badge>;
  return <Badge tone="neutral">0 pts</Badge>;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1"
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.hint ? `${opt.label}. ${opt.hint}` : opt.label}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              selected
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  className = "",
  disabled,
  title,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied && !failed) return;
    const id = window.setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 1800);
    return () => window.clearTimeout(id);
  }, [copied, failed]);

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={disabled || !text}
      title={title ?? "Copy to clipboard"}
      aria-live="polite"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setCopied(ok);
        setFailed(!ok);
      }}
    >
      <CopyIcon />
      {failed ? "Copy failed" : copied ? copiedLabel : label}
    </Button>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
