// __tests__/hooks/useItinerary.test.tsx
// Tests for useItinerary hook

import { renderHook, act } from '@testing-library/react';
import { useItinerary } from 'hooks/useItinerary';
import { MOCK_PARSED_ITINERARY, MOCK_ITINERARY_TEXT } from '__tests__/fixtures/components';

// Mock the itinerary parser service
jest.mock('services/itineraryParser', () => ({
  parseItinerary: jest.fn(),
}));

import { parseItinerary } from 'services/itineraryParser';
const mockParseItinerary = parseItinerary as jest.MockedFunction<typeof parseItinerary>;

describe('useItinerary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null itinerary and no loading/error', () => {
    const { result } = renderHook(() => useItinerary());

    expect(result.current.itinerary).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error for empty text input', async () => {
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText('   ');
    });

    expect(result.current.error).toBe('Itinerary text cannot be empty');
    expect(result.current.itinerary).toBeNull();
    expect(mockParseItinerary).not.toHaveBeenCalled();
  });

  it('parses itinerary text successfully', async () => {
    mockParseItinerary.mockResolvedValueOnce(MOCK_PARSED_ITINERARY);
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT);
    });

    expect(result.current.itinerary).toEqual(MOCK_PARSED_ITINERARY);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockParseItinerary).toHaveBeenCalledWith(MOCK_ITINERARY_TEXT, undefined);
  });

  it('passes cityName to parser when provided', async () => {
    mockParseItinerary.mockResolvedValueOnce(MOCK_PARSED_ITINERARY);
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT, 'paris');
    });

    expect(mockParseItinerary).toHaveBeenCalledWith(MOCK_ITINERARY_TEXT, 'paris');
  });

  it('sets error when parsing fails', async () => {
    mockParseItinerary.mockRejectedValueOnce(new Error('API timeout'));
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT);
    });

    expect(result.current.error).toBe('API timeout');
    expect(result.current.itinerary).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets generic error for non-Error exceptions', async () => {
    mockParseItinerary.mockRejectedValueOnce('unknown failure');
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT);
    });

    expect(result.current.error).toBe('Failed to parse itinerary');
  });

  it('clears itinerary, error, and loading state', async () => {
    mockParseItinerary.mockResolvedValueOnce(MOCK_PARSED_ITINERARY);
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT);
    });
    expect(result.current.itinerary).not.toBeNull();

    act(() => {
      result.current.clearItinerary();
    });

    expect(result.current.itinerary).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('clears previous error on new successful parse', async () => {
    mockParseItinerary.mockRejectedValueOnce(new Error('First fail'));
    const { result } = renderHook(() => useItinerary());

    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT);
    });
    expect(result.current.error).toBe('First fail');

    mockParseItinerary.mockResolvedValueOnce(MOCK_PARSED_ITINERARY);
    await act(async () => {
      await result.current.parseItineraryText(MOCK_ITINERARY_TEXT);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.itinerary).toEqual(MOCK_PARSED_ITINERARY);
  });
});
