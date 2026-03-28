// services/storageService.ts
// Unified in-memory storage abstraction with TTL support

interface StorageEntry {
  value: unknown;
  ttl?: number;       // TTL in milliseconds (undefined = infinite)
  storedAt: number;
}

const store = new Map<string, StorageEntry>();

function isExpired(entry: StorageEntry): boolean {
  if (entry.ttl === undefined) return false;
  return Date.now() - entry.storedAt > entry.ttl;
}

/**
 * Store a value with optional TTL (milliseconds).
 */
export function setItem(key: string, value: unknown, ttlMs?: number): void {
  store.set(key, {
    value,
    ttl: ttlMs,
    storedAt: Date.now(),
  });
}

/**
 * Retrieve a value. Returns null if not found or expired.
 */
export function getItem<T = unknown>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (isExpired(entry)) return null;
  return entry.value as T;
}

/**
 * Remove an item by key.
 */
export function removeItem(key: string): void {
  store.delete(key);
}

/**
 * Clear all items.
 */
export function clear(): void {
  store.clear();
}

/**
 * Get storage statistics.
 */
export function getStorageStats(): { totalItems: number; expiredItems: number } {
  let expiredItems = 0;
  for (const entry of store.values()) {
    if (isExpired(entry)) expiredItems++;
  }
  return { totalItems: store.size, expiredItems };
}

/**
 * Find all non-expired items whose key starts with the given prefix.
 */
export function findByPrefix<T = unknown>(prefix: string): Map<string, T> {
  const results = new Map<string, T>();
  for (const [key, entry] of store) {
    if (key.startsWith(prefix) && !isExpired(entry)) {
      results.set(key, entry.value as T);
    }
  }
  return results;
}
