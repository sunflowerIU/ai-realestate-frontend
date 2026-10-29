import type { Metadata } from "next";
import { RequirementDetail } from "@/features/crm/requirement-detail";

export const metadata: Metadata = {
  title: "Buyer requirement",
  robots: { index: false, follow: false },
};

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RequirementDetail id={id} />;
}
