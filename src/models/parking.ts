/**
 * PARKIN — Smart Campus Parking
 * Model: ParkingArea Data Model
 *
 * Reusable TypeScript interface and types for parking areas.
 * Structured as a clean JSON-serializable model for REST API integration in TASK 02.
 */

export type ParkingStatus = 'AVAILABLE' | 'BUSY' | 'NEAR FULL' | 'FULL' | string;

export interface ParkingArea {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancy: number;
  status: ParkingStatus;
  updated_at: string;

  // Optional fields for UI enhancement & backward compatibility
  coordinates?: { x: number; y: number };
  description?: string;
  lastUpdated?: string;
}
