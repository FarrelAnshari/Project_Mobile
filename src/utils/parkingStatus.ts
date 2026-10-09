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
 * 0–40%   = Sepi
 * 41–60%  = Sedang
 * 61–80%  = Ramai
 * 81–95%  = Hampir Penuh
 * 96–100% = Penuh
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
    case 'AVAILABLE':
    case 'Sepi':
      return Colors.available ?? Colors.success;
    case 'BUSY':
    case 'Sedang':
    case 'Ramai':
      return Colors.busy ?? Colors.warning;
    case 'NEAR FULL':
    case 'Hampir Penuh':
      return Colors.nearFull ?? Colors.danger;
    case 'FULL':
    case 'Penuh':
      return Colors.full ?? Colors.danger;
    default:
      return Colors.textSecondary;
  }
}

/** Returns background color for status badge */
export function getStatusBgColor(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE':
    case 'Sepi':
      return Colors.availableBg ?? Colors.successBg;
    case 'BUSY':
    case 'Sedang':
    case 'Ramai':
      return Colors.busyBg ?? Colors.warningBg;
    case 'NEAR FULL':
    case 'Hampir Penuh':
      return Colors.nearFullBg ?? Colors.dangerBg;
    case 'FULL':
    case 'Penuh':
      return Colors.fullBg ?? Colors.dangerBg;
    default:
      return Colors.borderLight;
  }
}

/** Returns indicator icon for status */
export function getStatusIcon(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return '✓';
    case 'BUSY':
      return '~';
    case 'NEAR FULL':
      return '!';
    case 'FULL':
      return '✕';
    case 'Sepi':
      return '🟢';
    case 'Sedang':
      return '🔵';
    case 'Ramai':
      return '🟡';
    case 'Hampir Penuh':
      return '🟠';
    case 'Penuh':
      return '🔴';
    default:
      return '-';
  }
}

/** Returns accessibility label for status (for screen readers) */
export function getStatusA11yLabel(status: ParkingStatus): string {
  switch (status) {
    case 'AVAILABLE':
    case 'Sepi':
      return 'Status: Tersedia / Sepi. Area parkir masih sangat tersedia.';
    case 'BUSY':
    case 'Sedang':
    case 'Ramai':
      return 'Status: Sibuk / Ramai. Area parkir cukup padat.';
    case 'NEAR FULL':
    case 'Hampir Penuh':
      return 'Status: Hampir Penuh. Segera cari alternatif.';
    case 'FULL':
    case 'Penuh':
      return 'Status: Penuh. Tidak ada slot tersedia.';
    default:
      return `Status: ${status}`;
  }
}

/** Returns bar color for occupancy bar */
export function getOccupancyBarColor(percent: number): string {
  if (percent <= 50) return Colors.available ?? Colors.success;
  if (percent <= 79) return Colors.busy ?? Colors.warning;
  if (percent <= 97) return Colors.nearFull ?? Colors.danger;
  return Colors.full ?? Colors.danger;
}

/** Returns whether an area needs an alert */
export function needsAlert(occupancyPercent: number): boolean {
  return occupancyPercent >= 80;
}

