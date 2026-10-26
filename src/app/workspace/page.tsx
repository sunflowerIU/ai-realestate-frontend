import type { Metadata } from "next";
import { Dashboard } from "@/features/app/dashboard";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default function WorkspacePage() {
  return <Dashboard />;
}
