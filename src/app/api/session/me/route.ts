import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookie, currentUser } from "@/lib/auth/server";

export async function GET() {
  const token = (await cookies()).get(accessCookie)?.value;
  if (!token)
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const user = await currentUser(token);
  if (!user || user.status !== "ACTIVE")
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  return NextResponse.json({ user });
}
