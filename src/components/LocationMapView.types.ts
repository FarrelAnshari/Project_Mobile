/**
 * PARKIN — Smart Campus Parking
 * Types: LocationMapView Shared Props (Week 10)
 */

import { ParkingArea } from '../models/parking';
import { GeofenceStatus, GeofenceZone, LocationData } from '../types/location';

export interface LocationMapViewProps {
  userLocation: LocationData | null;
  parkingAreas: ParkingArea[];
  geofenceZone: GeofenceZone;
  geofenceStatus: GeofenceStatus;
  onSelectParkingArea?: (area: ParkingArea) => void;
  height?: number;
}
