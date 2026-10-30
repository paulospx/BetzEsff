export function formatKickoff(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T12:00:00");
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function scoreDisplay(
  home: number | null,
  away: number | null
): string {
  if (home === null || away === null) return "– : –";
  return `${home} – ${away}`;
}
