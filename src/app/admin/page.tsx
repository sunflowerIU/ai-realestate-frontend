import type { Metadata } from "next";
import { AdminOverview } from "@/features/admin/admin-overview";

export const metadata: Metadata = {
  title: "Platform overview",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <AdminOverview />;
}
