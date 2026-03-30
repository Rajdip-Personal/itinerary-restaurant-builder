// __tests__/hooks/useNetworkStatus.test.tsx
// Tests for useNetworkStatus hook

import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from 'hooks/useNetworkStatus';

// Mock the network monitor service
jest.mock('services/networkMonitor', () => ({
  checkConnectivity: jest.fn(),
  onStatusChange: jest.fn(),
  getNetworkStatus: jest.fn(),
}));

import { checkConnectivity, onStatusChange, getNetworkStatus } from 'services/networkMonitor';
const mockCheckConnectivity = checkConnectivity as jest.MockedFunction<typeof checkConnectivity>;
const mockOnStatusChange = onStatusChange as jest.MockedFunction<typeof onStatusChange>;
const mockGetNetworkStatus = getNetworkStatus as jest.MockedFunction<typeof getNetworkStatus>;

describe('useNetworkStatus', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUnsubscribe = jest.fn();
    mockOnStatusChange.mockReturnValue(mockUnsubscribe);
    mockGetNetworkStatus.mockReturnValue({ isOnline: true, lastChecked: 1000 });
    mockCheckConnectivity.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with current network status', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.lastChecked).toBe(1000);
  });

  it('subscribes to status changes on mount', () => {
    renderHook(() => useNetworkStatus());

    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
    expect(typeof mockOnStatusChange.mock.calls[0][0]).toBe('function');
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('updates state when checkNow is called', async () => {
    mockCheckConnectivity.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      await result.current.checkNow();
    });

    expect(result.current.isOnline).toBe(false);
    expect(mockCheckConnectivity).toHaveBeenCalled();
  });

  it('updates state when status change callback fires', () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Get the callback that was registered
    const callback = mockOnStatusChange.mock.calls[0][0];

    act(() => {
      callback({ isOnline: false, lastChecked: 2000 });
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.lastChecked).toBe(2000);
  });
});
