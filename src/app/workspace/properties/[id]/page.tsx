import type { Metadata } from "next";
import { PropertyDetail } from "@/features/crm/property-detail";

export const metadata: Metadata = {
  title: "Property details",
  robots: { index: false, follow: false },
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PropertyDetail id={id} />;
}
