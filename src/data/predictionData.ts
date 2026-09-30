/**
 * PARKIN — Smart Campus Parking
 * Mock Data: Prediction & History
 *
 * NOTE: Prototype / simulation data.
 * Label: "Prediksi berdasarkan data historis/simulasi"
 * Uses standard statuses: AVAILABLE, BUSY, NEAR FULL, FULL
 */

import { ParkingStatus } from './parkingData';

export interface PredictionPoint {
  time: string;
  occupancy: number; // 0–100 (%)
  label: ParkingStatus;
}

export interface HistoryPoint {
  time: string;
  occupancy: number;
}

export interface DayHistory {
  date: string;
  label: string;
  points: HistoryPoint[];
  avgOccupancy: number;
  peakTime: string;
  quietTime: string;
}

/** Prediction data for today (typical weekday pattern) */
export const predictionDataToday: PredictionPoint[] = [
  { time: '07:00', occupancy: 30, label: 'AVAILABLE' },
  { time: '08:00', occupancy: 45, label: 'AVAILABLE' },
  { time: '09:00', occupancy: 58, label: 'BUSY' },
  { time: '10:00', occupancy: 71, label: 'BUSY' },
  { time: '11:00', occupancy: 84, label: 'NEAR FULL' },
  { time: '12:00', occupancy: 92, label: 'NEAR FULL' },
  { time: '13:00', occupancy: 88, label: 'NEAR FULL' },
  { time: '14:00', occupancy: 70, label: 'BUSY' },
  { time: '15:00', occupancy: 55, label: 'BUSY' },
  { time: '16:00', occupancy: 40, label: 'AVAILABLE' },
  { time: '17:00', occupancy: 25, label: 'AVAILABLE' },
  { time: '18:00', occupancy: 15, label: 'AVAILABLE' },
];

/** Prediction data for tomorrow */
export const predictionDataTomorrow: PredictionPoint[] = [
  { time: '07:00', occupancy: 25, label: 'AVAILABLE' },
  { time: '08:00', occupancy: 40, label: 'AVAILABLE' },
  { time: '09:00', occupancy: 55, label: 'BUSY' },
  { time: '10:00', occupancy: 68, label: 'BUSY' },
  { time: '11:00', occupancy: 80, label: 'NEAR FULL' },
  { time: '12:00', occupancy: 88, label: 'NEAR FULL' },
  { time: '13:00', occupancy: 85, label: 'NEAR FULL' },
  { time: '14:00', occupancy: 65, label: 'BUSY' },
  { time: '15:00', occupancy: 50, label: 'AVAILABLE' },
  { time: '16:00', occupancy: 35, label: 'AVAILABLE' },
  { time: '17:00', occupancy: 20, label: 'AVAILABLE' },
  { time: '18:00', occupancy: 10, label: 'AVAILABLE' },
];

/** History data per day */
export const historyData: DayHistory[] = [
  {
    date: '2026-09-27',
    label: 'Kemarin',
    points: [
      { time: '07:00', occupancy: 28 },
      { time: '08:00', occupancy: 43 },
      { time: '09:00', occupancy: 60 },
      { time: '10:00', occupancy: 75 },
      { time: '11:00', occupancy: 89 },
      { time: '12:00', occupancy: 95 },
      { time: '13:00', occupancy: 91 },
      { time: '14:00', occupancy: 72 },
      { time: '15:00', occupancy: 56 },
      { time: '16:00', occupancy: 38 },
      { time: '17:00', occupancy: 22 },
      { time: '18:00', occupancy: 12 },
    ],
    avgOccupancy: 57,
    peakTime: '12:00',
    quietTime: '18:00',
  },
  {
    date: '2026-09-26',
    label: '2 Hari Lalu',
    points: [
      { time: '07:00', occupancy: 32 },
      { time: '08:00', occupancy: 48 },
      { time: '09:00', occupancy: 62 },
      { time: '10:00', occupancy: 78 },
      { time: '11:00', occupancy: 86 },
      { time: '12:00', occupancy: 90 },
      { time: '13:00', occupancy: 85 },
      { time: '14:00', occupancy: 68 },
      { time: '15:00', occupancy: 52 },
      { time: '16:00', occupancy: 35 },
      { time: '17:00', occupancy: 18 },
      { time: '18:00', occupancy: 10 },
    ],
    avgOccupancy: 55,
    peakTime: '12:00',
    quietTime: '18:00',
  },
  {
    date: '2026-09-25',
    label: '3 Hari Lalu',
    points: [
      { time: '07:00', occupancy: 20 },
      { time: '08:00', occupancy: 35 },
      { time: '09:00', occupancy: 50 },
      { time: '10:00', occupancy: 65 },
      { time: '11:00', occupancy: 80 },
      { time: '12:00', occupancy: 88 },
      { time: '13:00', occupancy: 82 },
      { time: '14:00', occupancy: 65 },
      { time: '15:00', occupancy: 48 },
      { time: '16:00', occupancy: 30 },
      { time: '17:00', occupancy: 15 },
      { time: '18:00', occupancy: 8 },
    ],
    avgOccupancy: 49,
    peakTime: '12:00',
    quietTime: '18:00',
  },
];

/** Weekly summary for the chart */
export const weeklyData = [
  { day: 'Sen', avgOccupancy: 72 },
  { day: 'Sel', avgOccupancy: 68 },
  { day: 'Rab', avgOccupancy: 75 },
  { day: 'Kam', avgOccupancy: 80 },
  { day: 'Jum', avgOccupancy: 65 },
  { day: 'Sab', avgOccupancy: 35 },
  { day: 'Min', avgOccupancy: 20 },
];
