/**
 * PARKIN — Smart Campus Parking
 * Hook: useNetwork (Week 6 — Task 03 Handle Offline)
 *
 * Hook reaktif untuk memantau status online/offline perangkat.
 */

import { useState, useEffect, useCallback } from 'react';
import { isNetworkAvailable, subscribeNetworkChange, getNetworkDetails } from '../services/networkService';

export interface UseNetworkResult {
  isOnline: boolean;
  isOffline: boolean;
  networkType?: string;
  refreshNetwork: () => Promise<boolean>;
}

export function useNetwork(): UseNetworkResult {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<string | undefined>(undefined);

  const checkStatus = useCallback(async () => {
    const online = await isNetworkAvailable();
    const details = await getNetworkDetails();
    setIsOnline(online);
    setNetworkType(details.type);
    return online;
  }, []);

  useEffect(() => {
    // Initial check
    checkStatus();

    // Subscribe to network connectivity changes
    const unsubscribe = subscribeNetworkChange((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, [checkStatus]);

  return {
    isOnline,
    isOffline: !isOnline,
    networkType,
    refreshNetwork: checkStatus,
  };
}

export default useNetwork;
