// hooks/useNetworkStatus.ts
// React hook wrapping networkMonitor service

import { useState, useCallback, useEffect } from 'react';
import { checkConnectivity, onStatusChange, getNetworkStatus } from 'services/networkMonitor';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  lastChecked: number;
  checkNow: () => Promise<void>;
}

const CHECK_INTERVAL_MS = 30000; // 30 seconds

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(() => getNetworkStatus().isOnline);
  const [lastChecked, setLastChecked] = useState(() => getNetworkStatus().lastChecked);

  const checkNow = useCallback(async () => {
    console.log('[Hook:NetworkStatus] Checking connectivity');
    const online = await checkConnectivity();
    setIsOnline(online);
    setLastChecked(Date.now());
  }, []);

  useEffect(() => {
    const unsubscribe = onStatusChange((status) => {
      setIsOnline(status.isOnline);
      setLastChecked(status.lastChecked);
    });

    const interval = setInterval(() => {
      checkConnectivity();
    }, CHECK_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { isOnline, lastChecked, checkNow };
}
