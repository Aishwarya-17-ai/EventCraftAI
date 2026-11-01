import { describe, it, expect } from 'vitest';
import { calculateBudget, calculateGuestShift } from '../lib/budget';
import { EventType } from '../lib/types';

describe('Budget Planner', () => {
  const eventTypes: EventType[] = [
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

  it.each(eventTypes)('percentages sum to exactly 100 for %s', (type) => {
    const budget = calculateBudget(type, 50000, 100, 'USD');
    const totalPercentage = budget.categories.reduce((acc, cat) => acc + cat.percent, 0);
    expect(totalPercentage).toBe(100);
  });

  it.each(eventTypes)('category amounts in integer cents sum exactly to the total for %s', (type) => {
    const totalBudget = 42895.73;
    const budget = calculateBudget(type, totalBudget, 120, 'USD');
    const sumCents = budget.categories.reduce((acc, cat) => acc + cat.amountCents, 0);
    expect(sumCents).toBe(budget.totalCents);
    expect(sumCents).toBe(Math.round(totalBudget * 100));
  });

  it('keeps contingency strictly between 5% and 10%', () => {
    eventTypes.forEach((type) => {
      const budget = calculateBudget(type, 10000, 100, 'USD');
      expect(budget.contingencyPercent).toBeGreaterThanOrEqual(5);
      expect(budget.contingencyPercent).toBeLessThanOrEqual(10);
    });
  });

  it('handles a tiny budget without rounding discrepancy', () => {
    // $1.00 = 100 cents
    const budget = calculateBudget('wedding', 1.0, 20, 'USD');
    const sumCents = budget.categories.reduce((acc, cat) => acc + cat.amountCents, 0);
    expect(sumCents).toBe(100);
  });

  it('handles a tiny budget with odd pennies ($3.37)', () => {
    const budget = calculateBudget('birthday', 3.37, 10, 'USD');
    const sumCents = budget.categories.reduce((acc, cat) => acc + cat.amountCents, 0);
    expect(sumCents).toBe(337);
  });

  it('handles a huge budget without overflow or precision loss', () => {
    const hugeBudget = 50000000; // 50 million
    const budget = calculateBudget('community', hugeBudget, 5000, 'INR');
    const sumCents = budget.categories.reduce((acc, cat) => acc + cat.amountCents, 0);
    expect(sumCents).toBe(hugeBudget * 100);
  });

  it('catering share grows as guest count increases from 50 to 200', () => {
    expect(calculateGuestShift(40)).toBe(0);
    expect(calculateGuestShift(50)).toBe(0);
    expect(calculateGuestShift(125)).toBeGreaterThan(0);
    expect(calculateGuestShift(200)).toBe(5);
    expect(calculateGuestShift(350)).toBe(5);

    const budget50 = calculateBudget('wedding', 100000, 50, 'USD');
    const budget200 = calculateBudget('wedding', 100000, 200, 'USD');

    const catering50 = budget50.categories.find((c) => c.id === 'catering')!;
    const catering200 = budget200.categories.find((c) => c.id === 'catering')!;

    expect(catering200.percent).toBe(catering50.percent + 5);
    expect(catering200.amountCents).toBeGreaterThan(catering50.amountCents);
  });

  it('huge guest count does not produce negative or NaN values', () => {
    const budget = calculateBudget('community', 100000, 10000, 'INR');
    expect(Number.isFinite(budget.costPerGuestCents)).toBe(true);
    expect(budget.costPerGuestCents).toBeGreaterThan(0);
    budget.categories.forEach((cat) => {
      expect(cat.percent).toBeGreaterThanOrEqual(0);
      expect(cat.amountCents).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(cat.costPerGuestCents)).toBe(true);
    });
  });
});
