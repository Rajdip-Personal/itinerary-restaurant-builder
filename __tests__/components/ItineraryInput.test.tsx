// __tests__/components/ItineraryInput.test.tsx
// Tests for ItineraryInput component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItineraryInput } from 'components/ItineraryInput';

// Mock itinerary parser for city detection
jest.mock('services/itineraryParser', () => ({
  detectCity: jest.fn((text: string) => {
    if (text.toLowerCase().includes('paris')) return 'paris';
    if (text.toLowerCase().includes('rome')) return 'rome';
    return '';
  }),
}));

describe('ItineraryInput', () => {
  const mockOnParse = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea and parse button', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={false} error={null} />);
    expect(screen.getByLabelText('Itinerary text')).toBeTruthy();
    expect(screen.getByText('Parse Itinerary')).toBeTruthy();
  });

  it('disables parse button when textarea is empty', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={false} error={null} />);
    const button = screen.getByText('Parse Itinerary') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('enables parse button when text is entered', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={false} error={null} />);
    const textarea = screen.getByLabelText('Itinerary text');
    fireEvent.change(textarea, { target: { value: 'Day 1 - Paris' } });
    const button = screen.getByText('Parse Itinerary') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('shows city detection indicator', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={false} error={null} />);
    const textarea = screen.getByLabelText('Itinerary text');
    fireEvent.change(textarea, { target: { value: 'Day 1 - Paris' } });
    expect(screen.getByText('Detected city: paris')).toBeTruthy();
  });

  it('shows loading state', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={true} error={null} />);
    expect(screen.getByText('Parsing...')).toBeTruthy();
    expect(screen.getByText('Parsing your itinerary...')).toBeTruthy();
  });

  it('shows error message', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={false} error="Parse failed" />);
    expect(screen.getByText('Parse failed')).toBeTruthy();
  });

  it('calls onParse with text and detected city when button clicked', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={false} error={null} />);
    const textarea = screen.getByLabelText('Itinerary text');
    fireEvent.change(textarea, { target: { value: 'Day 1 - Paris' } });
    fireEvent.click(screen.getByText('Parse Itinerary'));
    expect(mockOnParse).toHaveBeenCalledWith('Day 1 - Paris', 'paris');
  });

  it('does not call onParse when loading', () => {
    render(<ItineraryInput onParse={mockOnParse} isLoading={true} error={null} />);
    const textarea = screen.getByLabelText('Itinerary text');
    fireEvent.change(textarea, { target: { value: 'Day 1 - Paris' } });
    fireEvent.click(screen.getByText('Parsing...'));
    expect(mockOnParse).not.toHaveBeenCalled();
  });
});
