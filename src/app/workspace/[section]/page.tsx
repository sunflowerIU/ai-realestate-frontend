import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resources } from "@/features/crm/config";
import { EntityPage } from "@/features/crm/entity-page";

export const metadata: Metadata = {
  title: "Agent records",
  robots: { index: false, follow: false },
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const config = resources[section];
  if (!config) notFound();
  return <EntityPage config={config} />;
}
