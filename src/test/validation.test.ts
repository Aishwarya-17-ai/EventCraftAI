import { describe, it, expect } from 'vitest';
import { validateEventForm, isFutureOrTodayDate, MAX_LENGTHS } from '../lib/validation';
import { EventFormData } from '../lib/types';

describe('Event Form Validation', () => {
  const validBaseData: EventFormData = {
    eventType: 'wedding',
    name: 'Maya and Arjun Wedding',
    date: '2028-12-25',
    guestCount: 150,
    totalBudget: 25000,
    currency: 'USD',
    city: 'New York',
    theme: 'Rustic Autumn',
    notes: 'Vegetarian and vegan meals required',
  };

  it('approves complete and valid event input', () => {
    const result = validateEventForm(validBaseData, '2027-01-01');
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('rejects empty or whitespace-only event name', () => {
    const emptyResult = validateEventForm({ ...validBaseData, name: '' }, '2027-01-01');
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.name).toBeDefined();

    const spaceResult = validateEventForm({ ...validBaseData, name: '    ' }, '2027-01-01');
    expect(spaceResult.isValid).toBe(false);
    expect(spaceResult.errors.name).toBeDefined();
  });

  it('rejects over-long event name exceeding 200 characters', () => {
    const longName = 'A'.repeat(MAX_LENGTHS.name + 1);
    const result = validateEventForm({ ...validBaseData, name: longName }, '2027-01-01');
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toContain('200');
  });

  it('rejects past dates relative to reference date', () => {
    const pastDate = '2025-01-01';
    const refDate = '2026-06-01';
    expect(isFutureOrTodayDate(pastDate, refDate)).toBe(false);

    const result = validateEventForm({ ...validBaseData, date: pastDate }, refDate);
    expect(result.isValid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  it('accepts today or future date', () => {
    const today = '2027-05-10';
    expect(isFutureOrTodayDate(today, today)).toBe(true);
    expect(isFutureOrTodayDate('2027-05-11', today)).toBe(true);
  });

  it('rejects guest counts of 0 and greater than 10,000', () => {
    const zeroGuests = validateEventForm({ ...validBaseData, guestCount: 0 }, '2027-01-01');
    expect(zeroGuests.isValid).toBe(false);
    expect(zeroGuests.errors.guestCount).toBeDefined();

    const tooManyGuests = validateEventForm({ ...validBaseData, guestCount: 10001 }, '2027-01-01');
    expect(tooManyGuests.isValid).toBe(false);
    expect(tooManyGuests.errors.guestCount).toBeDefined();
  });

  it('rejects negative or zero total budget', () => {
    const zeroBudget = validateEventForm({ ...validBaseData, totalBudget: 0 }, '2027-01-01');
    expect(zeroBudget.isValid).toBe(false);
    expect(zeroBudget.errors.totalBudget).toBeDefined();

    const negativeBudget = validateEventForm({ ...validBaseData, totalBudget: -500 }, '2027-01-01');
    expect(negativeBudget.isValid).toBe(false);
    expect(negativeBudget.errors.totalBudget).toBeDefined();
  });

  it('rejects total budget of 1,000,000,000 or greater', () => {
    const billionBudget = validateEventForm({ ...validBaseData, totalBudget: 1000000000 }, '2027-01-01');
    expect(billionBudget.isValid).toBe(false);
    expect(billionBudget.errors.totalBudget).toBeDefined();
  });

  it('rejects over-long city exceeding 150 characters', () => {
    const longCity = 'C'.repeat(MAX_LENGTHS.city + 1);
    const result = validateEventForm({ ...validBaseData, city: longCity }, '2027-01-01');
    expect(result.isValid).toBe(false);
    expect(result.errors.city).toBeDefined();
  });

  it('rejects over-long theme exceeding 500 characters', () => {
    const longTheme = 'T'.repeat(MAX_LENGTHS.theme + 1);
    const result = validateEventForm({ ...validBaseData, theme: longTheme }, '2027-01-01');
    expect(result.isValid).toBe(false);
    expect(result.errors.theme).toBeDefined();
  });

  it('rejects over-long notes exceeding 1000 characters', () => {
    const longNotes = 'N'.repeat(MAX_LENGTHS.notes + 1);
    const result = validateEventForm({ ...validBaseData, notes: longNotes }, '2027-01-01');
    expect(result.isValid).toBe(false);
    expect(result.errors.notes).toBeDefined();
  });

  it('accepts all 13 supported event types', () => {
    const allTypes = [
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
    ] as const;

    allTypes.forEach((type) => {
      const data: EventFormData = {
        ...validBaseData,
        eventType: type,
        customEventType: type === 'others' ? 'Board Game Night' : undefined,
      };
      const result = validateEventForm(data, '2027-01-01');
      expect(result.isValid).toBe(true);
    });
  });

  it('enforces customEventType validation when eventType is others', () => {
    // Missing / empty custom event description
    const emptyResult = validateEventForm(
      { ...validBaseData, eventType: 'others', customEventType: '' },
      '2027-01-01'
    );
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.customEventType).toBeDefined();

    // Whitespace only
    const spaceResult = validateEventForm(
      { ...validBaseData, eventType: 'others', customEventType: '    ' },
      '2027-01-01'
    );
    expect(spaceResult.isValid).toBe(false);
    expect(spaceResult.errors.customEventType).toBeDefined();

    // Over 60 characters
    const over60 = 'A'.repeat(61);
    const longResult = validateEventForm(
      { ...validBaseData, eventType: 'others', customEventType: over60 },
      '2027-01-01'
    );
    expect(longResult.isValid).toBe(false);
    expect(longResult.errors.customEventType).toContain('60');

    // Exactly 60 characters -> valid
    const exactly60 = 'B'.repeat(60);
    const valid60Result = validateEventForm(
      { ...validBaseData, eventType: 'others', customEventType: exactly60 },
      '2027-01-01'
    );
    expect(valid60Result.isValid).toBe(true);
  });
});
