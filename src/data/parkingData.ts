/**
 * PARKIN — Smart Campus Parking
 * Mock Data: Parking Areas (PARKIRAN 1–5)
 *
 * NOTE: Prototype mock data.
 * Replace with REST API calls in Sprint 02.
 *
 * Status thresholds (prototype logic):
 *   0–50%   = AVAILABLE
 *   51–79%  = BUSY
 *   80–99%  = NEAR FULL
 *   100%    = FULL
 */

export type ParkingStatus = 'Sepi' | 'Sedang' | 'Ramai' | 'Hampir Penuh' | 'Penuh';

export interface ParkingArea {
  id: number;
  name: string;          // e.g. "PARKIRAN 1"
  capacity: number;
  occupied: number;
  available: number;
  status: ParkingStatus;
  lastUpdated: string;
  coordinates: { x: number; y: number }; // relative 0–1, for visual map
  description: string;
}

export const parkingAreas: ParkingArea[] = [
  {
    id: 1,
    name: 'PARKIRAN 1',
    capacity: 100,
    occupied: 72,
    available: 28,
    status: 'Ramai',
    lastUpdated: '2 menit lalu',
    coordinates: { x: 0.22, y: 0.28 },
    description: 'Area parkir utama, dekat pintu masuk kampus.',
  },
  {
    id: 2,
    name: 'PARKIRAN 2',
    capacity: 80,
    occupied: 35,
    available: 45,
    status: 'Sepi',
    lastUpdated: '2 menit lalu',
    coordinates: { x: 0.62, y: 0.22 },
    description: 'Area parkir dekat Fakultas Teknik.',
  },
  {
    id: 3,
    name: 'PARKIRAN 3',
    capacity: 90,
    occupied: 88,
    available: 2,
    status: 'Hampir Penuh',
    lastUpdated: '1 menit lalu',
    coordinates: { x: 0.78, y: 0.58 },
    description: 'Area parkir dekat Kantin Pusat.',
  },
  {
    id: 4,
    name: 'PARKIRAN 4',
    capacity: 120,
    occupied: 58,
    available: 62,
    status: 'Sedang',
    lastUpdated: '3 menit lalu',
    coordinates: { x: 0.42, y: 0.72 },
    description: 'Area parkir terbuka, kapasitas terbesar.',
  },
  {
    id: 5,
    name: 'PARKIRAN 5',
    capacity: 70,
    occupied: 56,
    available: 14,
    status: 'Hampir Penuh',
    lastUpdated: '2 menit lalu',
    coordinates: { x: 0.18, y: 0.65 },
    description: 'Area parkir dekat Gedung Rektorat.',
  },
];

/** Calculate total campus stats from area array */
export function getCampusStats(areas: ParkingArea[]) {
  const totalCapacity = areas.reduce((s, a) => s + a.capacity, 0);
  const totalOccupied  = areas.reduce((s, a) => s + a.occupied,  0);
  const totalAvailable = areas.reduce((s, a) => s + a.available, 0);
  const occupancyPercent = Math.round((totalOccupied / totalCapacity) * 100);
  return { totalCapacity, totalOccupied, totalAvailable, occupancyPercent };
}
