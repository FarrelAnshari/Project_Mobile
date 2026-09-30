/**
 * PARKIN — Smart Campus Parking
 * Utils: Parking Status Logic
 *
 * NOTE: This is a prototype status calculation.
 * Replace with ML model predictions in the next sprint.
 */

import { Colors } from '../constants/theme';
import { ParkingStatus } from '../data/parkingData';

/**
 * Determine parking status from occupancy percentage.
 * Prototype logic — replace with ML API in Sprint 02.
 *
 * 0–50%   = AVAILABLE
 * 51–79%  = BUSY
 * 80–97%  = NEAR FULL
 * 98–100% = FULL
 */
export function getStatusFromOccupancy(occupancyPercent: number): ParkingStatus {
  if (occupancyPercent <= 50) return 'AVAILABLE';
  if (occupancyPercent <= 79) return 'BUSY';
  if (occupancyPercent <= 97) return 'NEAR FULL';
  return 'FULL';
}

export function getOccupancyPercent(occupied: number, capacity: number): number {
  if (capacity === 0) return 0;
  return Math.round((occupied / capacity) * 100);
}

/** Returns color associated with the parking status */
export function getStatusColor(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE': return Colors.available;
    case 'BUSY':      return Colors.busy;
    case 'NEAR FULL': return Colors.nearFull;
    case 'FULL':      return Colors.full;
    default:          return Colors.textSecondary;
  }
}

/** Returns background color for status badge */
export function getStatusBgColor(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE': return Colors.availableBg;
    case 'BUSY':      return Colors.busyBg;
    case 'NEAR FULL': return Colors.nearFullBg;
    case 'FULL':      return Colors.fullBg;
    default:          return Colors.borderLight;
  }
}

/** Returns a simple text indicator for status (no emoji) */
export function getStatusIcon(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE': return '✓';
    case 'BUSY':      return '~';
    case 'NEAR FULL': return '!';
    case 'FULL':      return '✕';
    default:          return '-';
  }
}

/** Returns accessibility label for status (for screen readers) */
export function getStatusA11yLabel(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE': return 'Status: Tersedia. Area parkir masih sangat tersedia.';
    case 'BUSY':      return 'Status: Sedang Sibuk. Area parkir cukup tersedia.';
    case 'NEAR FULL': return 'Status: Hampir Penuh. Segera cari alternatif.';
    case 'FULL':      return 'Status: Penuh. Tidak ada slot tersedia.';
    default:          return 'Status tidak diketahui.';
  }
}

/** Returns bar color for occupancy bar */
export function getOccupancyBarColor(percent: number): string {
  if (percent <= 50) return Colors.available;
  if (percent <= 79) return Colors.busy;
  if (percent <= 97) return Colors.nearFull;
  return Colors.full;
}

/** Returns whether an area needs an alert */
export function needsAlert(occupancyPercent: number): boolean {
  return occupancyPercent >= 80;
}
