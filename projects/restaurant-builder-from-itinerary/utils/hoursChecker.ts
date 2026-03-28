// utils/hoursChecker.ts
// Check if a restaurant is currently open based on weekly hours

import type { WeeklyHours as ImportedWeeklyHours } from 'types/index';

// Re-export WeeklyHours so data files can import from here
export type WeeklyHours = ImportedWeeklyHours;

const DAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday',
] as const;

/**
 * Check if a restaurant is open at the given date/time.
 * Looks up the day of week in weeklyHours and checks time windows.
 */
export function isRestaurantOpen(weeklyHours: WeeklyHours, date: Date): boolean {
  const dayName = DAY_NAMES[date.getDay()];
  const daySchedule = weeklyHours[dayName];

  if (!daySchedule || daySchedule === 'closed') {
    return false;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  for (const slot of daySchedule) {
    const [openH, openM] = slot.open.split(':').map(Number);
    const [closeH, closeM] = slot.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;

    // Handle overnight hours (e.g., open 19:00, close 02:00)
    if (closeMinutes <= openMinutes) {
      closeMinutes += 24 * 60;
    }

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return true;
    }

    // Also check if we're in the overnight portion (after midnight)
    if (closeMinutes > 24 * 60 && currentMinutes < closeMinutes - 24 * 60) {
      return true;
    }
  }

  return false;
}
