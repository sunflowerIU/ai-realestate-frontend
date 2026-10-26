import "server-only";
import { cookies } from "next/headers";

const base = (process.env.BACKEND_URL || "http://127.0.0.1:3030").replace(/\/$/, "");
export const backendApiUrl = `${base}/api/v1`;
export const backendAuthUrl = `${backendApiUrl}/auth`;
export const accessCookie = "ma_access";
export const refreshCookie = "ma_refresh";

export type AgentUser = { id: string; name: string; email: string; role: "AGENT" | "PLATFORM_ADMIN"; status: string };
export type LoginResult = { user: AgentUser; accessToken: string; refreshToken: string };

export function isLoginResult(value: unknown): value is LoginResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LoginResult>;
  return typeof item.accessToken === "string" && typeof item.refreshToken === "string" && !!item.user && typeof item.user.id === "string" && typeof item.user.role === "string";
}

export async function setSession(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(accessCookie, accessToken, { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: 15 * 60 });
  jar.set(refreshCookie, refreshToken, { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: 30 * 24 * 60 * 60 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(accessCookie);
  jar.delete(refreshCookie);
}

export function validRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}

export async function currentUser(token: string): Promise<AgentUser | null> {
  try {
    const response = await fetch(`${backendAuthUrl}/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    return await response.json() as AgentUser;
  } catch { return null; }
}
