// 인증 API — api_spec.md §2.
import { api } from "../../lib/api";
import type { AuthUser } from "../../stores/auth-store";

interface RefreshResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export async function refreshAccessToken(): Promise<RefreshResponse | null> {
  try {
    return await api.post("auth/refresh").json<RefreshResponse>();
  } catch {
    return null;
  }
}

export async function fetchMe(): Promise<AuthUser> {
  return api.get("auth/me").json<AuthUser>();
}

export async function logout(): Promise<void> {
  await api.post("auth/logout");
}

/** OAuth 인가 URL (BE 302 redirect 진입점). */
export function oauthLoginUrl(provider: "kakao" | "google"): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "/api";
  return `${base.replace(/\/$/, "")}/auth/login/${provider}`;
}
