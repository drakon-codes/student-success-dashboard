import { api } from "./api";

const SESSION_KEY = "student-management.auth-session";

export interface AuthSession {
  accessToken: string;
  expiresAtUtc: string;
}

interface LoginResponse extends AuthSession {
  adminUserId: number;
  email: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function isTokenExpired(expiresAtUtc: string, now = Date.now()): boolean {
  const expiresAt = Date.parse(expiresAtUtc);
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

export function clearSession(): void {
  getStorage()?.removeItem(SESSION_KEY);
}

export function saveSession(session: AuthSession): void {
  const storage = getStorage();
  if (!storage || !session.accessToken || isTokenExpired(session.expiresAtUtc)) {
    clearSession();
    throw new Error("The server returned an invalid or expired session.");
  }
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function readSession(): AuthSession | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof value.accessToken !== "string" ||
      typeof value.expiresAtUtc !== "string" ||
      isTokenExpired(value.expiresAtUtc)
    ) {
      clearSession();
      return null;
    }
    return { accessToken: value.accessToken, expiresAtUtc: value.expiresAtUtc };
  } catch {
    clearSession();
    return null;
  }
}

export function getCurrentToken(): string | null {
  return readSession()?.accessToken ?? null;
}

export async function loginAdmin(email: string, password: string): Promise<AuthSession> {
  // Never persist the request body or password; only the returned session is stored.
  const { data } = await api.post<LoginResponse>("/api/Auth/login", {
    email: email.trim(),
    password,
  });
  const session = { accessToken: data.accessToken, expiresAtUtc: data.expiresAtUtc };
  saveSession(session);
  return session;
}

export function logoutAdmin(): void {
  clearSession();
}

