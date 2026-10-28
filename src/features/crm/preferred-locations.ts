export type PreferredLocation = {
  province: string;
  district: string;
  municipality: string;
  localities: string[];
};

export function parsePreferredLocations(value: unknown): PreferredLocation[] {
  let input = value;
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(input)) return [];
  return input.map((item) => ({
    province: typeof item?.province === "string" ? item.province : "",
    district: typeof item?.district === "string" ? item.district : "",
    municipality: typeof item?.municipality === "string" ? item.municipality : "",
    localities: Array.isArray(item?.localities)
      ? item.localities.filter((locality: unknown): locality is string => typeof locality === "string")
      : [],
  }));
}

export function preferredLocationsError(value: string): string | null {
  const locations = parsePreferredLocations(value);
  if (locations.length > 20) return "Use no more than 20 preferred areas.";
  for (const location of locations) {
    if (!location.province.trim() || !location.district.trim() || !location.municipality.trim())
      return "Choose a province, district, and municipality for each area.";
    if ([location.province, location.district, location.municipality].some((part) => part.trim().length > 100))
      return "Place names must be 100 characters or fewer.";
    if (location.localities.length > 20)
      return "Use no more than 20 localities in one area.";
    if (location.localities.some((locality) => locality.trim().length > 100))
      return "Locality names must be 100 characters or fewer.";
  }
  return null;
}
