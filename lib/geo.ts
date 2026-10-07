export const EARTH_RADIUS_METERS = 6_371_000;

export type CompassDirection =
  | "North"
  | "North-East"
  | "East"
  | "South-East"
  | "South"
  | "South-West"
  | "West"
  | "North-West";

export const COMPASS_DIRECTIONS: readonly CompassDirection[] = [
  "North",
  "North-East",
  "East",
  "South-East",
  "South",
  "South-West",
  "West",
  "North-West",
] as const;

export interface GeoJsonPoint {
  type?: "Point";
  coordinates: [number, number] | [number, number, number] | number[];
}

export type PointLike = GeoJsonPoint | [number, number] | number[];

export function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function extractCoordinates(point: PointLike): [number, number] {
  if (Array.isArray(point)) {
    if (point.length < 2) {
      throw new Error("Coordinates array must contain at least [longitude, latitude].");
    }
    return [point[0], point[1]];
  }

  if (point && typeof point === "object" && Array.isArray(point.coordinates)) {
    if (point.coordinates.length < 2) {
      throw new Error("GeoJSON Point coordinates must contain at least [longitude, latitude].");
    }
    return [point.coordinates[0], point.coordinates[1]];
  }

  throw new Error(
    "Invalid GeoJSON point format. Expected { type: 'Point', coordinates: [longitude, latitude] }.",
  );
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeBearing(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Calculates the great-circle distance in meters between two GeoJSON points using the Haversine formula.
 */
export function calculateDistance(from: PointLike, to: PointLike): number {
  const [fromLon, fromLat] = extractCoordinates(from);
  const [toLon, toLat] = extractCoordinates(to);

  const phi1 = toRadians(fromLat);
  const phi2 = toRadians(toLat);
  const deltaPhi = toRadians(toLat - fromLat);
  const deltaLambda = toRadians(toLon - fromLon);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the initial bearing in degrees (0 - 360) from one GeoJSON point to another.
 */
export function calculateBearingDegrees(from: PointLike, to: PointLike): number {
  const [fromLon, fromLat] = extractCoordinates(from);
  const [toLon, toLat] = extractCoordinates(to);

  const phi1 = toRadians(fromLat);
  const phi2 = toRadians(toLat);
  const deltaLambda = toRadians(toLon - fromLon);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return normalizeBearing(toDegrees(Math.atan2(y, x)));
}

/**
 * Converts a bearing in degrees into an 8-wind compass direction (e.g., North, South-West).
 */
export function compassDirection(bearingDegrees: number): CompassDirection {
  const normalized = normalizeBearing(bearingDegrees);
  const index = Math.round(normalized / 45) % COMPASS_DIRECTIONS.length;

  return COMPASS_DIRECTIONS[index];
}

/**
 * Calculates the compass bearing (e.g., North, South-West) from one GeoJSON point to another.
 */
export function calculateBearing(from: PointLike, to: PointLike): CompassDirection {
  const degrees = calculateBearingDegrees(from, to);
  return compassDirection(degrees);
}

// Aliases for convenience and flexibility
export const calculateCompassBearing = calculateBearing;
export const getCompassBearing = calculateBearing;
export const getBearing = calculateBearing;
export const compassBearing = calculateBearing;

export const haversineDistance = calculateDistance;
export const calculateDistanceMeters = calculateDistance;
export const getDistance = calculateDistance;
