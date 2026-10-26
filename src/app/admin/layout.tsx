import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { accessCookie, refreshCookie } from "@/lib/auth/server";
import { AppProviders } from "@/features/app/providers";
import { AppShell } from "@/features/app/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  if (!jar.has(accessCookie) && !jar.has(refreshCookie)) redirect("/login");
  return (
    <AppProviders>
      <AppShell role="PLATFORM_ADMIN">{children}</AppShell>
    </AppProviders>
  );
}
