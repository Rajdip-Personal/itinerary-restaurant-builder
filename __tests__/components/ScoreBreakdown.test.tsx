// __tests__/components/ScoreBreakdown.test.tsx
// Tests for ScoreBreakdown component

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreBreakdown } from 'components/ScoreBreakdown';
import type { ScoreBreakdown as ScoreBreakdownType } from 'types/index';

const mockBreakdown: ScoreBreakdownType = {
  quality: 20,
  authenticity: 15,
  convenience: 30,
  timing: 10,
  curation: 5,
  total: 80,
  distanceScore: 30,
  progressionScore: 3,
  hotelBonus: 0,
};

describe('ScoreBreakdown', () => {
  it('renders total score', () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} />);
    expect(screen.getByText('Score: 80/110')).toBeTruthy();
  });

  it('renders all five score categories', () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} />);
    expect(screen.getByText('Quality')).toBeTruthy();
    expect(screen.getByText('Authenticity')).toBeTruthy();
    expect(screen.getByText('Convenience')).toBeTruthy();
    expect(screen.getByText('Timing')).toBeTruthy();
    expect(screen.getByText('Curation')).toBeTruthy();
  });

  it('displays value/max for each category', () => {
    render(<ScoreBreakdown breakdown={mockBreakdown} />);
    expect(screen.getByText('20/25')).toBeTruthy();   // quality
    expect(screen.getByText('15/20')).toBeTruthy();   // authenticity
    expect(screen.getByText('30/43')).toBeTruthy();   // convenience
    expect(screen.getByText('10/15')).toBeTruthy();   // timing
    expect(screen.getByText('5/5')).toBeTruthy();     // curation
  });

  it('renders bar fills with correct widths', () => {
    const { container } = render(<ScoreBreakdown breakdown={mockBreakdown} />);
    const qualityBar = container.querySelector('[data-testid="bar-quality"]') as HTMLElement;
    expect(qualityBar).toBeTruthy();
    expect(qualityBar.style.width).toBe('80%'); // 20/25 = 80%
  });

  it('handles zero values', () => {
    const zeroBreakdown: ScoreBreakdownType = {
      ...mockBreakdown,
      curation: 0,
      total: 75,
    };
    render(<ScoreBreakdown breakdown={zeroBreakdown} />);
    expect(screen.getByText('0/5')).toBeTruthy();
    expect(screen.getByText('Score: 75/110')).toBeTruthy();
  });
});
