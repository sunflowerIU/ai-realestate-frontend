import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  accessCookie,
  backendAuthUrl,
  clearSession,
  refreshCookie,
  validRequestOrigin,
} from "@/lib/auth/server";

export async function POST(request: Request) {
  if (!validRequestOrigin(request))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  const jar = await cookies();
  const refreshToken = jar.get(refreshCookie)?.value;
  const accessToken = jar.get(accessCookie)?.value;
  if (refreshToken && accessToken) {
    try {
      await fetch(`${backendAuthUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      /* Local session is still cleared. */
    }
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
