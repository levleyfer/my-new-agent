/**
 * Formats a coarse distance for display. Never show raw coordinates or a
 * "~0 km" reading — sub-1km distances are rounded up to a friendly floor
 * instead of a number that could be mistaken for a precise location.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return 'Less than 1 km';
  return `~${Math.round(distanceKm)} km`;
}
