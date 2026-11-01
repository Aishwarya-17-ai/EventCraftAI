import { describe, it, expect } from 'vitest';
import {
  calculateDaysLeft,
  generateAdaptiveTimeline,
  generateTimeline,
  getPlanStyle,
} from '../lib/timeline';
import { EventType } from '../lib/types';

describe('Adaptive Timeline Generator', () => {
  const refDate = '2027-01-01';

  it.each([
    { days: 0, expectedStyle: 'Event-day checklist' },
    { days: 1, expectedStyle: 'Day-by-day emergency plan' },
    { days: 3, expectedStyle: 'Day-by-day emergency plan' },
    { days: 7, expectedStyle: 'Sprint plan' },
    { days: 20, expectedStyle: 'Rush plan' },
    { days: 60, expectedStyle: 'Compressed plan' },
    { days: 200, expectedStyle: 'Full plan' },
  ])('calculates daysLeft and correct plan style for $days days left', ({ days, expectedStyle }) => {
    // Generate event date string exactly 'days' after refDate
    const ref = new Date('2027-01-01T12:00:00Z');
    const target = new Date(ref.getTime() + days * 24 * 60 * 60 * 1000);
    const eventDateStr = target.toISOString().split('T')[0];

    const computedDays = calculateDaysLeft(eventDateStr, refDate);
    expect(computedDays).toBe(days);

    const style = getPlanStyle(computedDays);
    expect(style).toBe(expectedStyle);

    const timeline = generateAdaptiveTimeline('wedding', eventDateStr, refDate);
    expect(timeline.daysLeft).toBe(days);
    expect(timeline.planStyle).toBe(expectedStyle);
    expect(timeline.milestones.length).toBeGreaterThan(0);
  });

  it('strictly guarantees no milestone or task is dated before today across all plan styles', () => {
    const testDayOffsets = [0, 1, 3, 7, 20, 60, 200];
    const ref = new Date('2027-01-01T12:00:00Z');
    const refTime = ref.getTime();

    testDayOffsets.forEach((days) => {
      const target = new Date(refTime + days * 24 * 60 * 60 * 1000);
      const eventDateStr = target.toISOString().split('T')[0];

      const timeline = generateAdaptiveTimeline('corporate', eventDateStr, refDate);

      timeline.milestones.forEach((m) => {
        const mTime = new Date(`${m.targetDate}T12:00:00Z`).getTime();
        expect(mTime).toBeGreaterThanOrEqual(refTime);

        m.tasks.forEach((t) => {
          const tTime = new Date(`${t.dueDate}T12:00:00Z`).getTime();
          expect(tTime).toBeGreaterThanOrEqual(refTime);
          expect(t.daysRemaining).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  it('schedules critical tasks before normal tasks in priority and milestone sequencing', () => {
    const eventDate = '2027-06-01'; // 151 days away
    const timeline = generateAdaptiveTimeline('wedding', eventDate, refDate);

    // Across the first milestone, critical tasks should appear first
    const firstMilestone = timeline.milestones[0];
    expect(firstMilestone.tasks.length).toBeGreaterThan(0);

    const priorities = firstMilestone.tasks.map((t) => t.priority);
    const priorityRank = { critical: 0, high: 1, normal: 2 };

    for (let i = 1; i < priorities.length; i++) {
      expect(priorityRank[priorities[i]]).toBeGreaterThanOrEqual(
        priorityRank[priorities[i - 1]]
      );
    }

    // Critical tasks should contain venue, caterer, or key vendor bookings
    const criticalTitles = firstMilestone.tasks
      .filter((t) => t.priority === 'critical')
      .map((t) => t.title.toLowerCase());

    expect(criticalTitles.some((t) => t.includes('venue') || t.includes('catering'))).toBe(true);
  });

  it('sets at-risk flag and provides quickAlternative when minLeadDays > daysLeft', () => {
    // Event is only 7 days away (sprint plan)
    // Venue (60d lead), Catering (45d lead), Photo (30d lead) are at risk
    const eventDate = '2027-01-08';
    const timeline = generateAdaptiveTimeline('wedding', eventDate, refDate);

    expect(timeline.daysLeft).toBe(7);
    expect(timeline.atRiskCount).toBeGreaterThan(0);

    const atRiskTasks = timeline.milestones.flatMap((m) => m.tasks.filter((t) => t.isAtRisk));
    expect(atRiskTasks.length).toBeGreaterThan(0);

    atRiskTasks.forEach((t) => {
      expect(t.minLeadDays).toBeGreaterThan(7);
      expect(t.isAtRisk).toBe(true);
      expect(typeof t.quickAlternative).toBe('string');
      expect(t.quickAlternative!.length).toBeGreaterThan(0);
    });
  });

  it('correctly handles leap-year dates without errors (e.g. 2028-02-29)', () => {
    const leapYearDate = '2028-02-29';
    const reference = '2028-02-01'; // 28 days away in leap year 2028
    const timeline = generateAdaptiveTimeline('festival', leapYearDate, reference);

    expect(timeline.daysLeft).toBe(28);
    expect(timeline.planStyle).toBe('Rush plan');

    const lastMilestone = timeline.milestones[timeline.milestones.length - 1];
    expect(lastMilestone.targetDate).toBe(leapYearDate);
    expect(lastMilestone.isEventDay).toBe(true);
  });

  it('includes event-type specific tasks across diverse categories', () => {
    const corporateTimeline = generateAdaptiveTimeline('corporate', '2027-10-10', refDate);
    const corporateTitles = corporateTimeline.milestones
      .flatMap((m) => m.tasks.map((t) => t.title.toLowerCase()));
    expect(corporateTitles.some((t) => t.includes('keynote') || t.includes('streaming') || t.includes('badge'))).toBe(true);

    const babyShowerTimeline = generateAdaptiveTimeline('baby_shower', '2027-10-10', refDate);
    const babyTitles = babyShowerTimeline.milestones
      .flatMap((m) => m.tasks.map((t) => t.title.toLowerCase()));
    expect(babyTitles.some((t) => t.includes('registry') || t.includes('balloon') || t.includes('cake'))).toBe(true);
  });

  it('backward-compatibility generateTimeline returns milestone array', () => {
    const milestones = generateTimeline('wedding', '2027-05-18', refDate);
    expect(Array.isArray(milestones)).toBe(true);
    expect(milestones.length).toBeGreaterThan(0);
    expect(milestones[0].tasks[0].title).toBeDefined();
  });
});
