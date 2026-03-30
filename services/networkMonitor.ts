// services/networkMonitor.ts
// Network connectivity monitoring
// PRD rule: assume online on detection failure (avoid false offline blocking)

import type { NetworkStatus } from 'types/index';

const HEALTH_CHECK_URL = 'http://localhost:3000/health';
const CHECK_TIMEOUT_MS = 3000;

type StatusCallback = (status: NetworkStatus) => void;

let currentStatus: NetworkStatus = {
  isOnline: true,
  lastChecked: 0,
};

const listeners: Set<StatusCallback> = new Set();

/**
 * Get the current network status.
 */
export function getNetworkStatus(): NetworkStatus {
  return { ...currentStatus };
}

/**
 * Check connectivity by pinging the backend health endpoint.
 * Returns true if online. Assumes online on failure (PRD rule).
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    const response = await fetch(HEALTH_CHECK_URL, { signal: controller.signal });
    clearTimeout(timeout);

    const online = response.ok;
    updateStatus(online);
    return online;
  } catch {
    // PRD rule: assume online on fetch failure or timeout
    console.warn('[NetworkMonitor] Connectivity check failed, assuming online');
    updateStatus(true);
    return true;
  }
}

/**
 * Simple check: is the app currently online?
 */
export function isOnline(): boolean {
  return currentStatus.isOnline;
}

/**
 * Subscribe to status changes. Returns an unsubscribe function.
 */
export function onStatusChange(callback: StatusCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Reset the network monitor to defaults (for testing).
 */
export function resetNetworkMonitor(): void {
  currentStatus = { isOnline: true, lastChecked: 0 };
  listeners.clear();
}

function updateStatus(online: boolean): void {
  const previousOnline = currentStatus.isOnline;
  currentStatus = {
    isOnline: online,
    lastChecked: Date.now(),
  };

  if (previousOnline !== online) {
    console.log(`[NetworkMonitor] Status changed: ${online ? 'online' : 'offline'}`);
    for (const listener of listeners) {
      listener({ ...currentStatus });
    }
  }
}
