/**
 * PARKIN — Smart Campus Parking
 * Utils: Recommendation Logic
 *
 * Priority:
 * 1. Most available slots
 * 2. Lowest occupancy percentage
 * 3. Distance (placeholder for future GPS integration)
 *
 * Replace with ML/API-based recommendation in Sprint 02.
 */

import { ParkingArea } from '../data/parkingData';

export interface Recommendation {
  area: ParkingArea;
  reason: string;
  score: number;
}

/**
 * Calculate recommendation score for a parking area.
 * Higher score = better recommendation.
 * Prototype logic — replace with ML model in Sprint 02.
 */
function calculateScore(area: ParkingArea): number {
  const cap = Math.max(1, area.capacity);
  const availabilityScore = (area.available / cap) * 60; // 60% weight
  const occupancyPercent = typeof area.occupancy === 'number' ? area.occupancy : (area.occupied / cap) * 100;
  const occupancyScore = Math.max(0, (1 - occupancyPercent / 100)) * 40; // 40% weight
  return availabilityScore + occupancyScore;
}

/**
 * Get top N parking recommendations sorted by score.
 */
export function getRecommendations(
  areas: ParkingArea[],
  topN: number = 3,
): Recommendation[] {
  const scored = areas
    .filter((a) => a.available > 0) // exclude full areas
    .map((area) => ({
      area,
      score: calculateScore(area),
      reason: buildReason(area),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

/** Build a human-friendly reason string for the recommendation */
function buildReason(area: ParkingArea): string {
  const percent = typeof area.occupancy === 'number' ? area.occupancy : Math.round((area.occupied / (area.capacity || 1)) * 100);
  if (percent <= 40) return `Sangat lengang — ${area.available} slot tersedia (${percent}% terisi)`;
  if (percent <= 60) return `Cukup tersedia — ${area.available} slot tersedia (${percent}% terisi)`;
  if (percent <= 80) return `${area.available} slot tersedia (${percent}% terisi)`;
  return `Terbatas — hanya ${area.available} slot tersisa (${percent}% terisi)`;
}

/** Get top 1 recommendation as the "primary" suggestion */
export function getPrimaryRecommendation(
  areas: ParkingArea[],
): Recommendation | null {
  const recs = getRecommendations(areas, 1);
  return recs.length > 0 ? recs[0] : null;
}
