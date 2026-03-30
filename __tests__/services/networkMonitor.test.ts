// __tests__/services/networkMonitor.test.ts
// Tests for network connectivity monitoring

import {
  getNetworkStatus,
  checkConnectivity,
  isOnline,
  onStatusChange,
  resetNetworkMonitor,
} from 'services/networkMonitor';
import { MOCK_NETWORK_ONLINE, MOCK_NETWORK_OFFLINE } from '__tests__/fixtures/index';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

beforeEach(() => {
  resetNetworkMonitor();
  mockFetch.mockReset();
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getNetworkStatus', () => {
  it('returns default online status', () => {
    const status = getNetworkStatus();
    expect(status.isOnline).toBe(true);
  });
});

describe('checkConnectivity', () => {
  it('returns true when backend responds', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const online = await checkConnectivity();
    expect(online).toBe(true);
  });

  it('assumes online on fetch failure (PRD rule)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const online = await checkConnectivity();
    expect(online).toBe(true);
  });

  it('assumes online on abort/timeout (PRD rule)', async () => {
    // Simulate AbortError (what AbortController triggers)
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    mockFetch.mockRejectedValue(abortError);
    const online = await checkConnectivity();
    expect(online).toBe(true);
  });

  it('updates lastChecked timestamp', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const before = Date.now();
    await checkConnectivity();
    const status = getNetworkStatus();
    expect(status.lastChecked).toBeGreaterThanOrEqual(before);
  });

  it('sets offline when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    const online = await checkConnectivity();
    expect(online).toBe(false);
    expect(getNetworkStatus().isOnline).toBe(false);
  });
});

describe('isOnline', () => {
  it('returns true by default', () => {
    expect(isOnline()).toBe(true);
  });

  it('reflects last checkConnectivity result', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await checkConnectivity();
    expect(isOnline()).toBe(false);
  });
});

describe('onStatusChange', () => {
  it('calls callback when status changes', async () => {
    const callback = jest.fn();
    onStatusChange(callback);

    // Go offline
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await checkConnectivity();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ isOnline: false }));
  });

  it('returns unsubscribe function', async () => {
    const callback = jest.fn();
    const unsubscribe = onStatusChange(callback);
    unsubscribe();

    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await checkConnectivity();
    // Should NOT be called after unsubscribe
    expect(callback).not.toHaveBeenCalled();
  });
});
