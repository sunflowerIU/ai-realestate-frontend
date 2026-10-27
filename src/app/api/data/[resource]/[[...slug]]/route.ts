import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  accessCookie,
  backendApiUrl,
  currentUser,
  validRequestOrigin,
} from "@/lib/auth/server";

type Context = { params: Promise<{ resource: string; slug?: string[] }> };
const agentResources = new Set([
  "clients",
  "properties",
  "requirements",
  "activities",
  "visits",
  "deals",
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const adminActions = new Set(["suspend", "ban", "activate", "revoke-sessions"]);

function allowed(resource: string, slug: string[], method: string) {
  if (agentResources.has(resource)) {
    if (slug.length === 0) return method === "GET" || method === "POST";
    if (resource === "properties" && slug.length === 1 && slug[0] === "archived")
      return method === "GET";
    if (slug.length === 1 && uuid.test(slug[0]))
      return (
        ["GET", "PATCH", "DELETE"].includes(method) &&
        (method !== "DELETE" || ["clients", "activities"].includes(resource))
      );
    return (
      resource === "properties" &&
      slug.length === 2 &&
      uuid.test(slug[0]) &&
      ((slug[1] === "archive" && method === "POST") ||
        (slug[1] === "delete" && method === "DELETE"))
    );
  }
  if (resource === "admin-agents") {
    if (slug.length === 0) return method === "GET" || method === "POST";
    if (slug.length === 1) return uuid.test(slug[0]) && method === "GET";
    return (
      slug.length === 2 &&
      uuid.test(slug[0]) &&
      adminActions.has(slug[1]) &&
      method === "POST"
    );
  }
  return false;
}

async function handle(request: Request, context: Context) {
  const { resource, slug = [] } = await context.params;
  if (!allowed(resource, slug, request.method))
    return NextResponse.json(
      { error: "Route not available." },
      { status: 404 },
    );
  if (request.method !== "GET" && !validRequestOrigin(request))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  const token = (await cookies()).get(accessCookie)?.value;
  if (!token)
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const user = await currentUser(token);
  if (!user || user.status !== "ACTIVE")
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  if (resource === "admin-agents" && user.role !== "PLATFORM_ADMIN")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (resource !== "admin-agents" && user.role !== "AGENT")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const url = new URL(request.url);
  const endpoint = resource === "admin-agents" ? "admin/agents" : resource;
  const target = `${backendApiUrl}/${endpoint}${slug.length ? `/${slug.join("/")}` : ""}${url.search}`;
  const body = request.method === "GET" ? undefined : await request.text();
  if (body && body.length > 100_000)
    return NextResponse.json(
      { error: "Request is too large." },
      { status: 413 },
    );
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 204) return new Response(null, { status: 204 });
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The service is unavailable. Please try again." },
      { status: 502 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
