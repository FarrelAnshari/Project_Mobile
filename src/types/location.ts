/**
 * PARKIN — Smart Campus Parking
 * Types: Location-Based Services (Week 10)
 */

export type PermissionStatusType = 'undetermined' | 'granted' | 'denied';

export type AccuracyMode = 'balanced' | 'high';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude?: number | null;
  timestamp: number;
}

export interface AddressData {
  formattedAddress: string;
  street?: string;
  district?: string;
  city?: string;
  region?: string;
  postalCode?: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export type GeofenceStatus = 'inside' | 'outside' | 'unknown';

export interface GeofenceLogItem {
  id: string;
  type: 'ENTER' | 'EXIT';
  zoneName: string;
  distanceMeters: number;
  timestamp: number;
  isSimulated?: boolean;
}

export interface BatteryOptimizationConfig {
  accuracyMode: AccuracyMode;
  timeIntervalMs: number;
  distanceIntervalMeters: number;
}

export interface GeofenceBannerEvent {
  type: 'ENTER' | 'EXIT';
  message: string;
  distanceMeters: number;
  timestamp: number;
  isSimulated?: boolean;
}
