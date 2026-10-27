import type { Metadata } from "next";
import { AgentManagement } from "@/features/admin/agent-management";

export const metadata: Metadata = {
  title: "Manage agents",
  robots: { index: false, follow: false },
};
export default function AgentsPage() {
  return <AgentManagement />;
}
