// __tests__/utils/hoursChecker.test.ts
// Tests for isRestaurantOpen utility

import { isRestaurantOpen } from 'utils/hoursChecker';
import type { WeeklyHours } from 'types/index';

const standardHours: WeeklyHours = {
  monday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
  tuesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
  wednesday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
  thursday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:00' }],
  friday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:30' }],
  saturday: [{ open: '12:00', close: '15:00' }, { open: '19:00', close: '23:30' }],
  sunday: 'closed',
};

describe('isRestaurantOpen', () => {
  it('should return true during open hours (lunch)', () => {
    // Monday 12:30
    const date = new Date(2025, 3, 14, 12, 30); // Monday
    expect(isRestaurantOpen(standardHours, date)).toBe(true);
  });

  it('should return true during open hours (dinner)', () => {
    // Monday 20:00
    const date = new Date(2025, 3, 14, 20, 0);
    expect(isRestaurantOpen(standardHours, date)).toBe(true);
  });

  it('should return false between lunch and dinner', () => {
    // Monday 16:00
    const date = new Date(2025, 3, 14, 16, 0);
    expect(isRestaurantOpen(standardHours, date)).toBe(false);
  });

  it('should return false on closed day', () => {
    // Sunday 12:00
    const date = new Date(2025, 3, 13, 12, 0);
    expect(isRestaurantOpen(standardHours, date)).toBe(false);
  });

  it('should return false before opening', () => {
    // Monday 8:00
    const date = new Date(2025, 3, 14, 8, 0);
    expect(isRestaurantOpen(standardHours, date)).toBe(false);
  });

  it('should return false after closing', () => {
    // Monday 23:30
    const date = new Date(2025, 3, 14, 23, 30);
    expect(isRestaurantOpen(standardHours, date)).toBe(false);
  });

  it('should return false at exactly closing time', () => {
    // Monday at 15:00 exactly (close boundary)
    const date = new Date(2025, 3, 14, 15, 0);
    expect(isRestaurantOpen(standardHours, date)).toBe(false);
  });

  it('should return true at exactly opening time', () => {
    // Monday at 12:00 exactly (open boundary)
    const date = new Date(2025, 3, 14, 12, 0);
    expect(isRestaurantOpen(standardHours, date)).toBe(true);
  });

  it('should handle empty hours object', () => {
    const date = new Date(2025, 3, 14, 12, 0);
    expect(isRestaurantOpen({}, date)).toBe(false);
  });

  it('should handle overnight hours', () => {
    const overnightHours: WeeklyHours = {
      friday: [{ open: '19:00', close: '02:00' }],
      saturday: [{ open: '19:00', close: '02:00' }],
    };
    // Friday 23:30 — should be open
    const date = new Date(2025, 3, 18, 23, 30); // Friday
    expect(isRestaurantOpen(overnightHours, date)).toBe(true);
  });
});
