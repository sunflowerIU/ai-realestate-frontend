import { NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/schema";
import {
  backendAuthUrl,
  isLoginResult,
  setSession,
  validRequestOrigin,
} from "@/lib/auth/server";

export async function POST(request: Request) {
  if (!validRequestOrigin(request))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid email and password." },
      { status: 400 },
    );
  try {
    const backend = await fetch(`${backendAuthUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (backend.status === 401)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    if (!backend.ok)
      return NextResponse.json(
        { error: "Sign in is unavailable right now. Please try again." },
        { status: 502 },
      );
    const result: unknown = await backend.json();
    if (!isLoginResult(result))
      return NextResponse.json(
        { error: "Unexpected sign in response." },
        { status: 502 },
      );
    if (result.user.status !== "ACTIVE")
      return NextResponse.json(
        { error: "This account is not active." },
        { status: 403 },
      );
    await setSession(result.accessToken, result.refreshToken);
    return NextResponse.json({
      ok: true,
      destination:
        result.user.role === "PLATFORM_ADMIN" ? "/admin" : "/workspace",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the sign in service. Please try again." },
      { status: 502 },
    );
  }
}
