import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { API_URL } from "@/constants";

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type UserProfile = {
  user_id: string;
  full_name: string;
  phone: string;
};

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
};

const SESSION_KEY = "yerix_auth_session";
let refreshRequest: Promise<string> | null = null;

async function readSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

async function saveSession(session: Omit<AuthSession, "expires_at"> & { expires_at?: number; expires_in?: number }) {
  const normalized: AuthSession = {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
  };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown; message?: unknown };
  const message =
    (typeof body.error === "string" && body.error) ||
    (typeof body.message === "string" && body.message) ||
    `${fallback} (${response.status})`;
  return new Error(message);
}

export async function signInWithGoogle(): Promise<AuthUser | null> {
  const startResponse = await fetch(`${API_URL}/api/auth/google/start`, { method: "POST" });
  if (!startResponse.ok) throw await readError(startResponse, "Could not start Google sign-in");
  const { authUrl, redirectUrl, codeVerifier } = (await startResponse.json()) as {
    authUrl: string;
    redirectUrl: string;
    codeVerifier: string;
  };

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
  if (result.type !== "success") return null;

  const callback = new URL(result.url);
  if (`${callback.protocol}//${callback.host}${callback.pathname}` !== redirectUrl) {
    throw new Error("Google sign-in returned an unexpected redirect");
  }

  const params = new URLSearchParams(callback.search);
  if (callback.hash) {
    new URLSearchParams(callback.hash.slice(1)).forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  const authError = params.get("error_description") || params.get("error");
  if (authError) throw new Error(authError);
  const code = params.get("code");
  if (!code) throw new Error("Google sign-in did not return an authorization code");

  const exchangeResponse = await fetch(`${API_URL}/api/auth/google/exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, codeVerifier }),
  });
  if (!exchangeResponse.ok) throw await readError(exchangeResponse, "Could not complete Google sign-in");
  const session = await saveSession((await exchangeResponse.json()) as AuthSession);
  return session.user;
}

export async function getAccessToken(): Promise<string> {
  const session = await readSession();
  if (!session) throw new Error("You need to sign in again");
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session.access_token;

  if (!refreshRequest) refreshRequest = refreshAccessToken(session);
  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}

async function refreshAccessToken(session: AuthSession): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refresh_token }),
  });
  if (!response.ok) {
    await signOut();
    throw await readError(response, "Your session expired; please sign in again");
  }
  const refreshed = await saveSession((await response.json()) as AuthSession);
  return refreshed.access_token;
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const session = await readSession();
  return session?.user ?? null;
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getProfile(): Promise<UserProfile | null> {
  const response = await authorizedFetch(`${API_URL}/api/profile`);
  if (!response.ok) throw await readError(response, "Could not load your profile");
  return response.json();
}

export async function saveProfile(profile: Pick<UserProfile, "full_name" | "phone">): Promise<UserProfile> {
  const response = await authorizedFetch(`${API_URL}/api/profile`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw await readError(response, "Could not save your profile");
  return response.json();
}

export async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}
