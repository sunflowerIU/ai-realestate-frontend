export type Coordinates = { latitude: number; longitude: number };

export const KATHMANDU: Coordinates = { latitude: 27.7172, longitude: 85.3240 };

export function propertyCoordinates(latitude: unknown, longitude: unknown): Coordinates | null {
  if (latitude === null || latitude === undefined || latitude === "" ||
      longitude === null || longitude === undefined || longitude === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    Number.isFinite(lng) && lng >= -180 && lng <= 180
    ? { latitude: lat, longitude: lng }
    : null;
}
