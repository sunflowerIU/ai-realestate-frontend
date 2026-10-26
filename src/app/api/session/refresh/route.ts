import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  backendAuthUrl,
  clearSession,
  currentUser,
  refreshCookie,
  setSession,
  validRequestOrigin,
} from "@/lib/auth/server";

export async function POST(request: Request) {
  if (!validRequestOrigin(request))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  const token = (await cookies()).get(refreshCookie)?.value;
  if (!token)
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  try {
    const backend = await fetch(`${backendAuthUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!backend.ok) {
      await clearSession();
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }
    const result = (await backend.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!result.accessToken || !result.refreshToken) {
      await clearSession();
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }
    const user = await currentUser(result.accessToken);
    if (!user || user.status !== "ACTIVE") {
      await clearSession();
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }
    await setSession(result.accessToken, result.refreshToken);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Could not renew session." },
      { status: 502 },
    );
  }
}
