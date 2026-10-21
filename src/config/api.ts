/**
 * PARKIN — Smart Campus Parking
 * Configuration: REST API Endpoints & Base URL
 *
 * Configurable via environment variable: EXPO_PUBLIC_API_URL
 * Defaults to production/staging campus API domain.
 */

import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator maps 10.0.2.2 to host machine localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const API_CONFIG = {
  /** Base URL for all REST API requests */
  BASE_URL: getBaseUrl(),

  /** Online testing endpoint to verify REST API connectivity */
  TEST_URL: 'https://jsonplaceholder.typicode.com/posts/1',

  /** Request timeout in milliseconds */
  TIMEOUT_MS: 10000,

  /** API Endpoints */
  ENDPOINTS: {
    LOGIN: '/login',
    PROGRAMS: '/programs',
    TEST_CONNECTIVITY: '/posts/1',
    PARKING_AREAS: '/parking-areas',
    PARKING_AREA_DETAIL: (id: string) => `/parking-areas/${id}`,
  },

  /** Standard headers for JSON requests */
  DEFAULT_HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
} as const;

