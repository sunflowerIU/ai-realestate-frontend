import { NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/auth/server";

export async function GET() {
  try {
    const response = await fetch(`${backendApiUrl}/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Backend is not ready");
    const result: unknown = await response.json();
    if (
      !result ||
      typeof result !== "object" ||
      !("status" in result) ||
      result.status !== "ready"
    ) throw new Error("Unexpected backend health response");
    return NextResponse.json({ status: "connected" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
