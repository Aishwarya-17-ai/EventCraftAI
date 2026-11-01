/**
 * EventCraft AI - Form Validation
 * Robust, schema-safe validation rules linked to accessible inline errors.
 * Supports all 13 event types and custom event description validation for 'others'.
 */

import { EventFormData, EventType, ValidationErrors } from './types';

export const MAX_LENGTHS = {
  name: 200,
  city: 150,
  theme: 500,
  notes: 1000,
  customEventType: 60,
} as const;

export const LIMITS = {
  minGuests: 1,
  maxGuests: 10000,
  minBudget: 1, // must be > 0
  maxBudget: 999999999.99, // under 1,000,000,000
} as const;

export const VALID_EVENT_TYPES: EventType[] = [
  'wedding',
  'engagement',
  'reception',
  'birthday',
  'baby_shower',
  'anniversary',
  'housewarming',
  'graduation',
  'corporate',
  'festival',
  'community',
  'charity',
  'others',
];

/**
 * Validates whether a date string is today or in the future.
 * Accepts optional referenceDate (YYYY-MM-DD) for deterministic testing.
 */
export function isFutureOrTodayDate(dateString: string, referenceDateString?: string): boolean {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const [y, m, d] = dateString.split('-').map(Number);
  // End of day to guarantee today's date is valid across all timezones
  const target = new Date(y, m - 1, d, 23, 59, 59, 999);

  if (isNaN(target.getTime())) {
    return false;
  }

  let ref: Date;
  if (referenceDateString && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateString)) {
    const [ry, rm, rd] = referenceDateString.split('-').map(Number);
    ref = new Date(ry, rm - 1, rd, 0, 0, 0, 0);
  } else {
    ref = new Date();
    ref.setHours(0, 0, 0, 0);
  }

  return target.getTime() >= ref.getTime();
}

/**
 * Validates the event form data.
 * Returns an object with isValid flag and field-specific error strings.
 */
export function validateEventForm(
  data: Partial<EventFormData>,
  referenceDateString?: string
): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  // Event Type
  if (!data.eventType || !VALID_EVENT_TYPES.includes(data.eventType)) {
    errors.eventType = 'Please select a valid event category.';
  }

  // "Others" custom description
  if (data.eventType === 'others') {
    const trimmedCustom = (data.customEventType || '').trim();
    if (!trimmedCustom) {
      errors.customEventType = 'Please describe your custom event.';
    } else if (trimmedCustom.length > MAX_LENGTHS.customEventType) {
      errors.customEventType = `Custom event description must be ${MAX_LENGTHS.customEventType} characters or fewer.`;
    }
  }

  // Event Name
  const trimmedName = (data.name || '').trim();
  if (!trimmedName) {
    errors.name = 'Event name is required.';
  } else if (trimmedName.length > MAX_LENGTHS.name) {
    errors.name = `Event name must be ${MAX_LENGTHS.name} characters or fewer.`;
  }

  // Event Date
  if (!data.date) {
    errors.date = 'Event date is required.';
  } else if (!isFutureOrTodayDate(data.date, referenceDateString)) {
    errors.date = 'Event date must be today or in the future.';
  }

  // Guest Count
  const guests = data.guestCount !== undefined ? Number(data.guestCount) : NaN;
  if (isNaN(guests) || !Number.isInteger(guests)) {
    errors.guestCount = 'Guest count must be a whole number.';
  } else if (guests < LIMITS.minGuests || guests > LIMITS.maxGuests) {
    errors.guestCount = `Guest count must be between ${LIMITS.minGuests} and ${LIMITS.maxGuests.toLocaleString()}.`;
  }

  // Total Budget
  const budget = data.totalBudget !== undefined ? Number(data.totalBudget) : NaN;
  if (isNaN(budget)) {
    errors.totalBudget = 'Budget must be a valid number.';
  } else if (budget <= 0) {
    errors.totalBudget = 'Budget must be greater than 0.';
  } else if (budget >= 1000000000) {
    errors.totalBudget = 'Budget must be under 1,000,000,000.';
  }

  // City
  const trimmedCity = (data.city || '').trim();
  if (!trimmedCity) {
    errors.city = 'City or location is required.';
  } else if (trimmedCity.length > MAX_LENGTHS.city) {
    errors.city = `City must be ${MAX_LENGTHS.city} characters or fewer.`;
  }

  // Theme / Preferences (Optional string length limit)
  if (data.theme && data.theme.length > MAX_LENGTHS.theme) {
    errors.theme = `Theme description must be ${MAX_LENGTHS.theme} characters or fewer.`;
  }

  // Notes (Optional string length limit)
  if (data.notes && data.notes.length > MAX_LENGTHS.notes) {
    errors.notes = `Notes must be ${MAX_LENGTHS.notes} characters or fewer.`;
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}
