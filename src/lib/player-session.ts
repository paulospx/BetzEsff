const KEY = "betzesff-player-id";

export function getStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setStoredPlayerId(id: string): void {
  localStorage.setItem(KEY, id);
}

export function clearStoredPlayerId(): void {
  localStorage.removeItem(KEY);
}

const CHAMPIONSHIP_KEY = "betzesff-championship-slug";

export function getStoredChampionshipSlug(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CHAMPIONSHIP_KEY);
}

export function setStoredChampionshipSlug(slug: string): void {
  localStorage.setItem(CHAMPIONSHIP_KEY, slug);
}

const ADMIN_KEY = "betzesff-admin-pin";

export function getStoredAdminPin(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_KEY);
}

export function setStoredAdminPin(pin: string): void {
  sessionStorage.setItem(ADMIN_KEY, pin);
}

export function clearStoredAdminPin(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}
