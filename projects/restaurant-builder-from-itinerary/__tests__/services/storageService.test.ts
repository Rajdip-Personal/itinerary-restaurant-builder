// __tests__/services/storageService.test.ts
// Tests for unified storage abstraction with TTL

import {
  setItem,
  getItem,
  removeItem,
  clear,
  getStorageStats,
  findByPrefix,
} from 'services/storageService';

beforeEach(() => {
  clear();
});

describe('setItem / getItem', () => {
  it('stores and retrieves a value', () => {
    setItem('key1', { name: 'test' });
    expect(getItem('key1')).toEqual({ name: 'test' });
  });

  it('returns null for non-existent key', () => {
    expect(getItem('missing')).toBeNull();
  });

  it('overwrites existing value', () => {
    setItem('key1', 'old');
    setItem('key1', 'new');
    expect(getItem('key1')).toBe('new');
  });

  it('stores and retrieves primitive values', () => {
    setItem('num', 42);
    setItem('str', 'hello');
    setItem('bool', true);
    expect(getItem('num')).toBe(42);
    expect(getItem('str')).toBe('hello');
    expect(getItem('bool')).toBe(true);
  });
});

describe('TTL expiry', () => {
  it('returns null for expired items', () => {
    // Set with 1ms TTL
    setItem('expiring', 'data', 1);
    // Wait for expiry
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }
    expect(getItem('expiring')).toBeNull();
  });

  it('returns value for non-expired items', () => {
    setItem('lasting', 'data', 60000); // 60 second TTL
    expect(getItem('lasting')).toBe('data');
  });

  it('returns value when no TTL is set (infinite)', () => {
    setItem('permanent', 'data');
    expect(getItem('permanent')).toBe('data');
  });
});

describe('removeItem', () => {
  it('removes an existing item', () => {
    setItem('key1', 'val');
    removeItem('key1');
    expect(getItem('key1')).toBeNull();
  });

  it('does not throw for non-existent key', () => {
    expect(() => removeItem('missing')).not.toThrow();
  });
});

describe('clear', () => {
  it('removes all items', () => {
    setItem('a', 1);
    setItem('b', 2);
    clear();
    expect(getItem('a')).toBeNull();
    expect(getItem('b')).toBeNull();
  });
});

describe('getStorageStats', () => {
  it('counts total items', () => {
    setItem('a', 1);
    setItem('b', 2);
    const stats = getStorageStats();
    expect(stats.totalItems).toBe(2);
  });

  it('counts expired items', () => {
    setItem('expired', 'data', 1);
    setItem('valid', 'data', 60000);
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }
    const stats = getStorageStats();
    expect(stats.expiredItems).toBe(1);
    expect(stats.totalItems).toBe(2);
  });

  it('returns zero stats when empty', () => {
    const stats = getStorageStats();
    expect(stats.totalItems).toBe(0);
    expect(stats.expiredItems).toBe(0);
  });
});

describe('findByPrefix', () => {
  it('finds all items matching key prefix', () => {
    setItem('rec:paris:lunch', 'data1');
    setItem('rec:paris:dinner', 'data2');
    setItem('geo:louvre', 'data3');

    const results = findByPrefix('rec:paris');
    expect(results.size).toBe(2);
    expect(results.get('rec:paris:lunch')).toBe('data1');
    expect(results.get('rec:paris:dinner')).toBe('data2');
  });

  it('returns empty map when no matches', () => {
    setItem('other:key', 'val');
    const results = findByPrefix('rec:');
    expect(results.size).toBe(0);
  });

  it('excludes expired items from prefix search', () => {
    setItem('prefix:a', 'data', 1);
    setItem('prefix:b', 'data', 60000);
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }
    const results = findByPrefix('prefix:');
    expect(results.size).toBe(1);
    expect(results.has('prefix:b')).toBe(true);
  });
});
