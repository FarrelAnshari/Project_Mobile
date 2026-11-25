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
    coordinates: { x: 0.23, y: 0.24 },
    geo: { latitude: -7.921062, longitude: 112.596141 },
    description: 'Parkiran Masjid AR Fachruddin, area utama utara UMM Kampus III.',
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
    coordinates: { x: 0.18, y: 0.43 },
    geo: { latitude: -7.921462, longitude: 112.596922 },
    description: 'Parkiran Utama UMM Kampus III, dekat gerbang utama & Helipad.',
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
    coordinates: { x: 0.46, y: 0.76 },
    geo: { latitude: -7.923387, longitude: 112.598078 },
    description: 'Parkiran Baru UMM Kampus III, sisi tenggara dekat Jl. Raya Tlogomas.',
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
    coordinates: { x: 0.73, y: 0.25 },
    geo: { latitude: -7.921088, longitude: 112.600314 },
    description: 'Parkiran Belakang UMM, sisi barat Jl. Karyawiguna dekat Gerbang Belakang.',
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
    coordinates: { x: 0.82, y: 0.40 },
    geo: { latitude: -7.921784, longitude: 112.601103 },
    description: 'Parkiran Jl. Karyawiguna Timur, dekat Stadion Sepak Bola UMM.',
    lastUpdated: '2 menit lalu',
  },
];

export function getCampusStats(areas: ParkingArea[]) {
  const totalCapacity = areas.reduce((s, a) => s + a.capacity, 0);
  const totalOccupied = areas.reduce((s, a) => s + a.occupied, 0);
  const totalAvailable = areas.reduce((s, a) => s + a.available, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  return { totalCapacity, totalOccupied, totalAvailable, occupancyPercent };
}
