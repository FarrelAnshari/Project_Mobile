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
  if (occupancyPercent <= 40) return 'Sepi';
  if (occupancyPercent <= 60) return 'Sedang';
  if (occupancyPercent <= 80) return 'Ramai';
  if (occupancyPercent <= 95) return 'Hampir Penuh';
  return 'Penuh';
}

export function getOccupancyPercent(occupied: number, capacity: number): number {
  if (capacity === 0) return 0;
  return Math.round((occupied / capacity) * 100);
}

/** Returns color associated with the parking status */
export function getStatusColor(status: ParkingStatus): string {
  switch (status) {
    case 'Sepi':        return Colors.sepi;
    case 'Sedang':      return Colors.sedang;
    case 'Ramai':       return Colors.ramai;
    case 'Hampir Penuh': return Colors.hampirPenuh;
    case 'Penuh':       return Colors.penuh;
    default:            return Colors.textSecondary;
  }
}

/** Returns background color for status badge */
export function getStatusBgColor(status: ParkingStatus): string {
  switch (status) {
    case 'Sepi':        return Colors.sepiBg;
    case 'Sedang':      return Colors.sedangBg;
    case 'Ramai':       return Colors.ramaiBg;
    case 'Hampir Penuh': return Colors.hampirPenuhBg;
    case 'Penuh':       return Colors.penuhBg;
    default:            return Colors.borderLight;
  }
}

/** Returns emoji icon for status (screen-reader friendly via accessibilityLabel) */
export function getStatusIcon(status: ParkingStatus): string {
  switch (status) {
    case 'Sepi':        return '🟢';
    case 'Sedang':      return '🔵';
    case 'Ramai':       return '🟡';
    case 'Hampir Penuh': return '🟠';
    case 'Penuh':       return '🔴';
    default:            return '⚪';
  }
}

/** Returns accessibility label for status (for screen readers) */
export function getStatusA11yLabel(status: ParkingStatus): string {
  switch (status) {
    case 'Sepi':        return 'Status: Sepi. Area parkir masih sangat tersedia.';
    case 'Sedang':      return 'Status: Sedang. Area parkir cukup tersedia.';
    case 'Ramai':       return 'Status: Ramai. Area parkir mulai padat.';
    case 'Hampir Penuh': return 'Status: Hampir Penuh. Segera cari alternatif.';
    case 'Penuh':       return 'Status: Penuh. Tidak ada slot tersedia.';
    default:            return 'Status tidak diketahui.';
  }
}

/** Returns bar color for occupancy bar */
export function getOccupancyBarColor(percent: number): string {
  if (percent <= 40) return Colors.success;
  if (percent <= 60) return Colors.info;
  if (percent <= 80) return Colors.warning;
  if (percent <= 95) return Colors.hampirPenuh;
  return Colors.danger;
}

/** Returns whether an area needs an alert */
export function needsAlert(occupancyPercent: number): boolean {
  return occupancyPercent >= 80;
}
