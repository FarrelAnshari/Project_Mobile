/**
 * PARKIN — Smart Campus Parking
 * Mock Data: Parking Areas (PARKIRAN 1–5)
 *
 * Implements the reusable ParkingArea data model.
 * Prepared for REST API integration in TASK 02.
 */

import { ParkingArea, ParkingStatus } from '../models/parking';

export { ParkingArea, ParkingStatus };

export const parkingAreas: ParkingArea[] = [
  {
    id: '1',
    name: 'PARKIRAN 1',
    capacity: 100,
    occupied: 72,
    available: 28,
    occupancy: 72,
    status: 'BUSY',
    updated_at: '2026-10-07T10:00:00.000Z',
    coordinates: { x: 0.22, y: 0.28 },
    description: 'Area parkir utama, dekat pintu masuk kampus.',
    lastUpdated: '2 menit lalu',
  },
  {
    id: '2',
    name: 'PARKIRAN 2',
    capacity: 80,
    occupied: 35,
    available: 45,
    occupancy: 44,
    status: 'AVAILABLE',
    updated_at: '2026-10-07T10:00:00.000Z',
    coordinates: { x: 0.62, y: 0.22 },
    description: 'Area parkir dekat Fakultas Teknik.',
    lastUpdated: '2 menit lalu',
  },
  {
    id: '3',
    name: 'PARKIRAN 3',
    capacity: 90,
    occupied: 88,
    available: 2,
    occupancy: 98,
    status: 'NEAR FULL',
    updated_at: '2026-10-07T10:00:00.000Z',
    coordinates: { x: 0.78, y: 0.58 },
    description: 'Area parkir dekat Kantin Pusat.',
    lastUpdated: '1 menit lalu',
  },
  {
    id: '4',
    name: 'PARKIRAN 4',
    capacity: 120,
    occupied: 58,
    available: 62,
    occupancy: 48,
    status: 'AVAILABLE',
    updated_at: '2026-10-07T10:00:00.000Z',
    coordinates: { x: 0.42, y: 0.72 },
    description: 'Area parkir terbuka, kapasitas terbesar.',
    lastUpdated: '3 menit lalu',
  },
  {
    id: '5',
    name: 'PARKIRAN 5',
    capacity: 70,
    occupied: 56,
    available: 14,
    occupancy: 80,
    status: 'BUSY',
    updated_at: '2026-10-07T10:00:00.000Z',
    coordinates: { x: 0.18, y: 0.65 },
    description: 'Area parkir dekat Gedung Rektorat.',
    lastUpdated: '2 menit lalu',
  },
];

/** Calculate total campus stats from area array */
export function getCampusStats(areas: ParkingArea[]) {
  const totalCapacity = areas.reduce((s, a) => s + a.capacity, 0);
  const totalOccupied = areas.reduce((s, a) => s + a.occupied, 0);
  const totalAvailable = areas.reduce((s, a) => s + a.available, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  return { totalCapacity, totalOccupied, totalAvailable, occupancyPercent };
}
