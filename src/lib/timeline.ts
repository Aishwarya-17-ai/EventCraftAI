/**
 * EventCraft AI - Adaptive Timeline Generator
 * Dynamically builds an adaptive planning schedule from TODAY to the event date.
 * Never schedules anything in the past. Schedules critical tasks first,
 * flags at-risk tasks with quick alternatives, and adapts plan styles to days left.
 */

import {
  AdaptiveTimeline,
  EventType,
  PlanStyle,
  TaskPriority,
  TimelineMilestone,
  TimelineTask,
} from './types';

export interface TaskDefinition {
  title: string;
  priority: TaskPriority;
  minLeadDays: number;
  quickAlternative?: string;
  category: 'venue' | 'catering' | 'vendors' | 'logistics' | 'decor' | 'program';
  eventTypes?: EventType[]; // if omitted, applies to all
}

/**
 * Master catalog of planning tasks with priorities, minimum required lead times,
 * and agile quick alternatives.
 */
export const TASK_CATALOG: TaskDefinition[] = [
  // CRITICAL TASKS (Must be scheduled first)
  {
    title: 'Lock in primary venue & event space contracts',
    priority: 'critical',
    minLeadDays: 60,
    quickAlternative: 'Reserve a private dining room, community hall, turnkey loft, or host at a scenic home / backyard.',
    category: 'venue',
  },
  {
    title: 'Confirm catering menu, beverage packages & food permits',
    priority: 'critical',
    minLeadDays: 45,
    quickAlternative: 'Opt for premier drop-off restaurant catering, gourmet food trucks, or curated family-style buffet platters.',
    category: 'catering',
  },
  {
    title: 'Book lead photographer / videographer for documentation',
    priority: 'critical',
    minLeadDays: 30,
    quickAlternative: 'Hire a talented local photographer on an hourly basis, or set up a collaborative digital QR photo album for guests.',
    category: 'vendors',
  },
  {
    title: 'Secure key entertainment (DJ, live band, or speaker setup)',
    priority: 'critical',
    minLeadDays: 30,
    quickAlternative: 'Rent high-output Bluetooth party speakers and stream a pre-curated celebration playlist.',
    category: 'vendors',
  },

  // HIGH PRIORITY TASKS
  {
    title: 'Send formal invitations & launch digital RSVP tracking',
    priority: 'high',
    minLeadDays: 21,
    quickAlternative: 'Broadcast digital animated invitations with instant RSVP links via WhatsApp, SMS, and email.',
    category: 'logistics',
  },
  {
    title: 'Order statement floral arrangements, lighting & focal backdrops',
    priority: 'high',
    minLeadDays: 14,
    quickAlternative: 'Utilize potted botanical greenery, warm-white LED fairy lights, and rental candle lanterns.',
    category: 'decor',
  },
  {
    title: 'Finalize audio-visual equipment, microphones & power distribution',
    priority: 'high',
    minLeadDays: 14,
    quickAlternative: 'Rent an all-in-one portable PA system with wireless handheld microphones.',
    category: 'vendors',
  },
  {
    title: 'Confirm guest seating plan & print table place cards / directional signs',
    priority: 'high',
    minLeadDays: 7,
    quickAlternative: 'Use open lounge seating with an easel-mounted welcome board and digital table assignments.',
    category: 'logistics',
  },

  // NORMAL PRIORITY TASKS
  {
    title: 'Finalize attire, hair & makeup styling details',
    priority: 'normal',
    minLeadDays: 14,
    quickAlternative: 'Select elegant off-the-rack attire or utilize express evening-wear rental services.',
    category: 'logistics',
  },
  {
    title: 'Order celebration cake, dessert station & party favors',
    priority: 'normal',
    minLeadDays: 10,
    quickAlternative: 'Order artisanal cupcakes and gourmet pastries from a local bakery with same-week notice.',
    category: 'catering',
  },
  {
    title: 'Pack day-of emergency supply kit (first-aid, chargers, tape, tools)',
    priority: 'normal',
    minLeadDays: 3,
    quickAlternative: 'Assemble a compact survival pouch with essentials, safety pins, phone chargers, and stain remover.',
    category: 'logistics',
  },
  {
    title: 'Deliver final confirmed guest count to caterer & venue team',
    priority: 'normal',
    minLeadDays: 5,
    quickAlternative: 'Send an updated headcount spreadsheet directly to the caterer via text / call with a 5% buffer.',
    category: 'catering',
  },
  {
    title: 'Conduct day-of rehearsal & coordinate run-of-show schedule',
    priority: 'normal',
    minLeadDays: 2,
    quickAlternative: 'Hold a 15-minute virtual briefing or quick morning walk-through with key leads.',
    category: 'program',
  },
  {
    title: 'Execute final setup, audiovisual soundcheck & welcome guests',
    priority: 'critical',
    minLeadDays: 0,
    quickAlternative: 'Designate a trusted coordinator or co-host to manage day-of vendor arrivals and guest check-in.',
    category: 'program',
  },
];

/**
 * Event-type specific extra tasks to enrich the schedule.
 */
export const EVENT_SPECIFIC_TASKS: Record<EventType, TaskDefinition[]> = {
  wedding: [
    {
      title: 'Obtain marriage license and finalize legal ceremony vows',
      priority: 'critical',
      minLeadDays: 30,
      quickAlternative: 'Schedule an expedited appointment with the local city clerk and prepare standardized legal vows.',
      category: 'program',
    },
    {
      title: 'Schedule final wedding dress / suit fittings and accessory styling',
      priority: 'high',
      minLeadDays: 21,
      quickAlternative: 'Opt for ready-to-wear tailored pieces with quick in-house alterations.',
      category: 'logistics',
    },
    {
      title: 'Plan ceremony rehearsal, processional order & wedding party gifts',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Run a brief 20-minute rehearsal on the morning of the wedding or night before.',
      category: 'program',
    },
  ],
  engagement: [
    {
      title: 'Coordinate ring presentation, champagne toast & announcement speech',
      priority: 'critical',
      minLeadDays: 14,
      quickAlternative: 'Prepare personal heartfelt toasts with sparkling cider / prosecco for all guests.',
      category: 'program',
    },
    {
      title: 'Arrange intimate photo session capturing the couple with guests',
      priority: 'high',
      minLeadDays: 10,
      quickAlternative: 'Set up an instant polaroid photo corner with a decorative guest sign-in book.',
      category: 'vendors',
    },
  ],
  reception: [
    {
      title: 'Curate high-energy dance playlist and coordinate master of ceremonies (MC)',
      priority: 'critical',
      minLeadDays: 20,
      quickAlternative: 'Assign an outgoing friend to MC key milestones (toasts, first dance, cake cut).',
      category: 'program',
    },
    {
      title: 'Coordinate late-night snack service or dessert table display',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Arrange gourmet sliders, warm pretzels, or pizza delivery towards party conclusion.',
      category: 'catering',
    },
  ],
  birthday: [
    {
      title: 'Confirm custom birthday cake design, candles & sparklers',
      priority: 'high',
      minLeadDays: 10,
      quickAlternative: 'Pick up a beautiful ready-made bakery centerpiece cake with personalized custom topper.',
      category: 'catering',
    },
    {
      title: 'Plan engaging celebration games, trivia, or guest performer acts',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Run an interactive 10-question trivia game about the celebrant using guests’ smartphones.',
      category: 'program',
    },
  ],
  baby_shower: [
    {
      title: 'Establish baby gift registry & coordinate themed shower games',
      priority: 'high',
      minLeadDays: 14,
      quickAlternative: 'Set up an online universal registry link and host classic guessing / advice games.',
      category: 'program',
    },
    {
      title: 'Arrange themed pastel balloon garland and keepsake guestbook',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Assemble a DIY balloon kit and offer wooden milestone blocks for guests to sign.',
      category: 'decor',
    },
  ],
  anniversary: [
    {
      title: 'Curate retrospective photo montage & memory milestone video',
      priority: 'high',
      minLeadDays: 14,
      quickAlternative: 'Create a digital photo carousel on a TV screen or display framed vintage photos.',
      category: 'program',
    },
    {
      title: 'Prepare commemorative jubilee toast & honor special guests',
      priority: 'normal',
      minLeadDays: 5,
      quickAlternative: 'Print keepsake menu cards with the original wedding / milestone date.',
      category: 'program',
    },
  ],
  housewarming: [
    {
      title: 'Plan guided home tours & curate ambient background lounge acoustics',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Allow guests to explore freely with welcome notes and room scent diffusers.',
      category: 'program',
    },
    {
      title: 'Prepare drop-off buffet finger foods, charcuterie & beverage cooler stations',
      priority: 'high',
      minLeadDays: 10,
      quickAlternative: 'Stock assorted artisanal cheese boards, flatbreads, and chilled self-serve beverages.',
      category: 'catering',
    },
  ],
  graduation: [
    {
      title: 'Display academic honors, graduation cap/gown & senior portraits',
      priority: 'high',
      minLeadDays: 10,
      quickAlternative: 'Set up an achievement table with degree certificate, framed senior photos, and card box.',
      category: 'decor',
    },
    {
      title: 'Coordinate congratulations toast and collegiate celebration playlist',
      priority: 'normal',
      minLeadDays: 5,
      quickAlternative: 'Draft brief speech celebrating future endeavors followed by a group photo.',
      category: 'program',
    },
  ],
  corporate: [
    {
      title: 'Confirm keynote speakers, presentation slide decks & tech rehearsal',
      priority: 'critical',
      minLeadDays: 30,
      quickAlternative: 'Collect presenter slides via cloud drive 48 hours prior and conduct a virtual mic check.',
      category: 'program',
    },
    {
      title: 'Print delegate name badges, program agendas & sponsor signage',
      priority: 'high',
      minLeadDays: 14,
      quickAlternative: 'Provide digital QR code agendas and sleek branded adhesive badges printed on site.',
      category: 'logistics',
    },
    {
      title: 'Set up professional live-streaming / recording infrastructure',
      priority: 'normal',
      minLeadDays: 10,
      quickAlternative: 'Utilize high-definition webcam on a sturdy tripod connected to Zoom / YouTube Live.',
      category: 'vendors',
    },
  ],
  festival: [
    {
      title: 'Secure municipal assembly permits, sound ordinances & emergency services',
      priority: 'critical',
      minLeadDays: 45,
      quickAlternative: 'Partner with established community parks that hold pre-approved public assembly licenses.',
      category: 'venue',
    },
    {
      title: 'Manage artisan stall vendor logistics, power drop lines & sanitation bins',
      priority: 'high',
      minLeadDays: 20,
      quickAlternative: 'Mark stall spaces with field chalk and assign shared recycling / waste stations.',
      category: 'logistics',
    },
    {
      title: 'Coordinate performer stage call sheets & public address safety system',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Distribute a digital call-sheet group chat for all scheduled stage acts.',
      category: 'program',
    },
  ],
  community: [
    {
      title: 'Submit park / street closure permits & notify local civic authorities',
      priority: 'critical',
      minLeadDays: 45,
      quickAlternative: 'Hold event in a community center courtyard or church lawn requiring no public road closures.',
      category: 'venue',
    },
    {
      title: 'Organize volunteer team assignments, safety vests & briefing packs',
      priority: 'high',
      minLeadDays: 14,
      quickAlternative: 'Host a 30-minute virtual volunteer huddle and print 1-page pocket duty rosters.',
      category: 'logistics',
    },
    {
      title: 'Arrange portable restrooms, trash receptacles & cleanup volunteer shifts',
      priority: 'normal',
      minLeadDays: 10,
      quickAlternative: 'Enlist local community groups with designated post-event cleanup bags.',
      category: 'logistics',
    },
  ],
  charity: [
    {
      title: 'Secure high-value donor auction items, pledges & sponsor packages',
      priority: 'critical',
      minLeadDays: 35,
      quickAlternative: 'Focus on donated gift baskets, experiences, and direct donation match appeals.',
      category: 'program',
    },
    {
      title: 'Finalize fundraising gala program, impact video presentation & guest speakers',
      priority: 'high',
      minLeadDays: 21,
      quickAlternative: 'Share a concise 3-minute beneficiary story video followed by an auctioneer appeal.',
      category: 'program',
    },
    {
      title: 'Test mobile bidding platform, merchant credit card terminals & donor receipting',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Use square readers and simplified silent auction paper bidding sheets with QR payments.',
      category: 'logistics',
    },
  ],
  others: [
    {
      title: 'Tailor custom program flow, participant announcements & key activities',
      priority: 'high',
      minLeadDays: 14,
      quickAlternative: 'Draft a simple bulleted 1-page timeline and designate a reliable lead announcer.',
      category: 'program',
    },
    {
      title: 'Confirm custom supplies, signage, and hospitality essentials',
      priority: 'normal',
      minLeadDays: 7,
      quickAlternative: 'Procure supplies from local retail stores or Amazon Prime express delivery.',
      category: 'logistics',
    },
  ],
};

/**
 * Format a Date object to YYYY-MM-DD
 */
export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a midday Date object (avoids timezone/DST shifts)
 */
export function parseDateSafe(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Adds an integer number of days to a Date object.
 */
export function addDays(base: Date, days: number): Date {
  const copy = new Date(base.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Calculates daysLeft from reference date to event date.
 * Returns non-negative integer (0 if today or past).
 */
export function calculateDaysLeft(eventDateStr: string, referenceDateStr?: string): number {
  const eventDate = parseDateSafe(eventDateStr);
  const refDate = referenceDateStr ? parseDateSafe(referenceDateStr) : new Date();
  refDate.setHours(12, 0, 0, 0);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const rawDiff = Math.round((eventDate.getTime() - refDate.getTime()) / MS_PER_DAY);
  return Math.max(0, rawDiff);
}

/**
 * Determines plan style from daysLeft based on specification:
 * 180+ = Full plan
 * 60-179 = Compressed plan
 * 15-59 = Rush plan
 * 4-14 = Sprint plan
 * 1-3 = Day-by-day emergency plan
 * 0 = Event-day checklist only
 */
export function getPlanStyle(daysLeft: number): PlanStyle {
  if (daysLeft >= 180) return 'Full plan';
  if (daysLeft >= 60) return 'Compressed plan';
  if (daysLeft >= 15) return 'Rush plan';
  if (daysLeft >= 4) return 'Sprint plan';
  if (daysLeft >= 1) return 'Day-by-day emergency plan';
  return 'Event-day checklist';
}

interface MilestoneSlot {
  id: string;
  title: string;
  timeframe: string;
  dayOffsetFromToday: number; // 0 = today, daysLeft = event day
  isToday?: boolean;
  isEventDay?: boolean;
}

/**
 * Builds milestone slots spanning from today (0) to event date (daysLeft).
 * Strictly guarantees:
 * 1. Never before today (offset >= 0)
 * 2. Never after event date (offset <= daysLeft)
 * 3. Chronological strictly ascending order
 */
function buildMilestoneSlots(daysLeft: number, planStyle: PlanStyle): MilestoneSlot[] {
  if (daysLeft === 0) {
    return [
      {
        id: 'ms-event-day',
        title: 'Event Day Checklist',
        timeframe: 'Today • Execution',
        dayOffsetFromToday: 0,
        isToday: true,
        isEventDay: true,
      },
    ];
  }

  if (daysLeft <= 3) {
    // Day-by-day emergency plan
    const slots: MilestoneSlot[] = [];
    for (let day = 0; day <= daysLeft; day++) {
      const remainingFromEvent = daysLeft - day;
      const isToday = day === 0;
      const isEventDay = day === daysLeft;

      let title = isToday ? 'Today — Immediate Triage' : isEventDay ? 'Event Day — Execution' : `Day ${day} Countdown`;
      let timeframe = isToday ? 'Immediate Actions' : isEventDay ? 'The Big Day' : `${remainingFromEvent} day${remainingFromEvent === 1 ? '' : 's'} to event`;

      slots.push({
        id: `ms-day-${day}`,
        title,
        timeframe,
        dayOffsetFromToday: day,
        isToday,
        isEventDay,
      });
    }
    return slots;
  }

  if (daysLeft <= 14) {
    // Sprint plan: steps every 2 days
    const offsets: number[] = [0]; // Today
    for (let o = 2; o < daysLeft - 1; o += 2) {
      offsets.push(o);
    }
    if (daysLeft > 1 && !offsets.includes(daysLeft - 1)) {
      offsets.push(daysLeft - 1); // Eve of event
    }
    offsets.push(daysLeft); // Event day

    return offsets.map((offset, idx) => {
      const isToday = offset === 0;
      const isEventDay = offset === daysLeft;
      const rem = daysLeft - offset;

      let title: string;
      let timeframe: string;

      if (isToday) {
        title = 'Sprint Launch — Critical Bookings';
        timeframe = 'Today (Day 0)';
      } else if (isEventDay) {
        title = 'Event Day — Execution';
        timeframe = 'Event Day';
      } else if (offset === daysLeft - 1) {
        title = 'Eve of Event — Final Staging';
        timeframe = '1 Day Out';
      } else {
        title = `Sprint Checkpoint ${idx}`;
        timeframe = `${rem} Days Out`;
      }

      return {
        id: `ms-sprint-${offset}`,
        title,
        timeframe,
        dayOffsetFromToday: offset,
        isToday,
        isEventDay,
      };
    });
  }

  if (daysLeft <= 59) {
    // Rush plan: weekly steps
    const offsets: number[] = [0]; // Today
    const weekSpan = 7;
    for (let o = weekSpan; o < daysLeft - 2; o += weekSpan) {
      offsets.push(o);
    }
    if (!offsets.includes(daysLeft - 1)) {
      offsets.push(daysLeft - 1); // Eve
    }
    offsets.push(daysLeft); // Event day

    return offsets.map((offset, idx) => {
      const isToday = offset === 0;
      const isEventDay = offset === daysLeft;
      const rem = daysLeft - offset;

      let title: string;
      let timeframe: string;

      if (isToday) {
        title = 'Rush Kickoff — Rapid Securing';
        timeframe = 'Today • Day 0';
      } else if (isEventDay) {
        title = 'Event Day — Execution';
        timeframe = 'Event Day';
      } else if (offset === daysLeft - 1) {
        title = 'Eve of Event — Final Readiness';
        timeframe = '1 Day Out';
      } else {
        const weeksOut = Math.round(rem / 7);
        title = `Rush Milestone: Week ${idx}`;
        timeframe = weeksOut > 0 ? `~${weeksOut} Week${weeksOut === 1 ? '' : 's'} Out` : `${rem} Days Out`;
      }

      return {
        id: `ms-rush-${offset}`,
        title,
        timeframe,
        dayOffsetFromToday: offset,
        isToday,
        isEventDay,
      };
    });
  }

  if (daysLeft <= 179) {
    // Compressed plan: bi-weekly / monthly checkpoints
    const offsets = [
      0, // Today
      Math.round(daysLeft * 0.25),
      Math.round(daysLeft * 0.5),
      Math.round(daysLeft * 0.75),
      Math.max(0, daysLeft - 7),
      Math.max(0, daysLeft - 1),
      daysLeft,
    ];

    // Filter unique, strictly ascending
    const uniqueOffsets = Array.from(new Set(offsets)).sort((a, b) => a - b);

    return uniqueOffsets.map((offset, idx) => {
      const isToday = offset === 0;
      const isEventDay = offset === daysLeft;
      const rem = daysLeft - offset;

      let title: string;
      let timeframe: string;

      if (isToday) {
        title = 'Today — Immediate Critical Actions';
        timeframe = 'Today';
      } else if (isEventDay) {
        title = 'Event Day — Execution';
        timeframe = 'Event Day';
      } else if (offset === daysLeft - 1) {
        title = 'Eve of Event — Final Staging';
        timeframe = '1 Day Out';
      } else if (rem <= 7) {
        title = 'Final Week Polish';
        timeframe = '1 Week Out';
      } else {
        const months = (rem / 30).toFixed(1);
        title = `Checkpoint ${idx}: Foundation & Coordination`;
        timeframe = `~${months} Months Out (${rem}d)`;
      }

      return {
        id: `ms-comp-${offset}`,
        title,
        timeframe,
        dayOffsetFromToday: offset,
        isToday,
        isEventDay,
      };
    });
  }

  // Full plan (180+ days): 6 months, 3 months, 1 month, 1 week, 1 day, event day
  // Starting from TODAY!
  const targetDaysBefore = [180, 90, 30, 7, 1, 0];
  const targetOffsets = [
    0, // Today (always start today!)
    ...targetDaysBefore
      .filter((b) => b < daysLeft && b > 0)
      .map((b) => daysLeft - b),
    daysLeft,
  ];

  const uniqueOffsets = Array.from(new Set(targetOffsets)).sort((a, b) => a - b);

  return uniqueOffsets.map((offset, idx) => {
    const isToday = offset === 0;
    const isEventDay = offset === daysLeft;
    const rem = daysLeft - offset;

    let title: string;
    let timeframe: string;

    if (isToday) {
      title = 'Today — Master Vision & First Bookings';
      timeframe = 'Today • Kickoff';
    } else if (isEventDay) {
      title = 'Event Day — Execution';
      timeframe = 'The Big Day';
    } else if (offset === daysLeft - 1) {
      title = '1 Day Before — Final Rehearsal';
      timeframe = 'Eve of Event';
    } else if (rem <= 7) {
      title = '1 Week Before — Final Logistics';
      timeframe = '~1 Week Out';
    } else if (rem <= 35) {
      title = '1 Month Before — Details & Final Fittings';
      timeframe = '~1 Month Out';
    } else if (rem <= 100) {
      title = '3 Months Before — Tastings & Invitations';
      timeframe = '~3 Months Out';
    } else {
      const months = Math.round(rem / 30);
      title = `${months} Months Before — Venue & Major Vendors`;
      timeframe = `~${months} Months Out`;
    }

    return {
      id: `ms-full-${offset}`,
      title,
      timeframe,
      dayOffsetFromToday: offset,
      isToday,
      isEventDay,
    };
  });
}

/**
 * Pure, deterministic Adaptive Timeline generator.
 * Never schedules tasks before today.
 * Critical tasks are scheduled first.
 * Flags tasks whose minLeadDays > daysLeft as At Risk with quick alternatives.
 */
export function generateAdaptiveTimeline(
  eventType: EventType,
  eventDateStr: string,
  referenceDateStr?: string,
  customEventType?: string
): AdaptiveTimeline {
  const refDate = referenceDateStr ? parseDateSafe(referenceDateStr) : new Date();
  refDate.setHours(12, 0, 0, 0);

  const daysLeft = calculateDaysLeft(eventDateStr, referenceDateStr);
  const planStyle = getPlanStyle(daysLeft);

  // 1. Collect all eligible task definitions
  const baseCatalog = [...TASK_CATALOG];
  const specificCatalog = EVENT_SPECIFIC_TASKS[eventType] || EVENT_SPECIFIC_TASKS.others;

  // Merge tasks, prioritizing critical tasks first
  const allDefinitions = [...baseCatalog, ...specificCatalog];

  // Distinct by title
  const taskMap = new Map<string, TaskDefinition>();
  for (const def of allDefinitions) {
    if (!taskMap.has(def.title)) {
      taskMap.set(def.title, def);
    }
  }
  const uniqueDefs = Array.from(taskMap.values());

  // Strict priority ordering: critical first, then high, then normal
  const priorityWeight: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
  };
  uniqueDefs.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

  // 2. Build milestone slots from Today (0) to Event Day (daysLeft)
  const milestoneSlots = buildMilestoneSlots(daysLeft, planStyle);

  // 3. Distribute tasks into milestones
  // Critical tasks must be scheduled in the earliest milestone slots (Today / first checkpoints)
  // Day-of tasks belong to event day
  const distributedTasks: { slotIndex: number; def: TaskDefinition }[] = [];

  for (const def of uniqueDefs) {
    let targetSlotIndex = 0;

    if (milestoneSlots.length === 1) {
      targetSlotIndex = 0;
    } else if (def.minLeadDays === 0) {
      // Event-day execution task
      targetSlotIndex = milestoneSlots.length - 1;
    } else if (def.priority === 'critical') {
      // Critical tasks schedule in the earliest slots (Today or slot 1)
      targetSlotIndex = 0;
    } else if (def.priority === 'high') {
      // Schedule in early to middle slots
      const earlySlot = Math.min(1, milestoneSlots.length - 2);
      targetSlotIndex = Math.max(0, earlySlot);
    } else {
      // Normal tasks distributed across middle to later slots
      if (def.minLeadDays <= 2) {
        targetSlotIndex = Math.max(0, milestoneSlots.length - 2); // Eve / near event
      } else {
        const midSlot = Math.floor(milestoneSlots.length / 2);
        targetSlotIndex = Math.min(midSlot, milestoneSlots.length - 2);
      }
    }

    distributedTasks.push({ slotIndex: targetSlotIndex, def });
  }

  // 4. Construct final TimelineMilestone array
  let atRiskCount = 0;
  let totalTasks = 0;

  const milestones: TimelineMilestone[] = milestoneSlots.map((slot, sIdx) => {
    const slotTargetDate = addDays(refDate, slot.dayOffsetFromToday);
    const targetDateStr = toDateString(slotTargetDate);
    const daysRemaining = slot.dayOffsetFromToday;

    // Filter tasks for this slot
    const slotDefs = distributedTasks.filter((dt) => dt.slotIndex === sIdx).map((dt) => dt.def);

    // Sort tasks within milestone: critical first, then high, then normal
    slotDefs.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

    const tasks: TimelineTask[] = slotDefs.map((def, tIdx) => {
      totalTasks++;
      const isAtRisk = def.minLeadDays > daysLeft;
      if (isAtRisk) {
        atRiskCount++;
      }

      return {
        id: `${slot.id}-task-${tIdx}`,
        title: def.title,
        priority: def.priority,
        minLeadDays: def.minLeadDays,
        quickAlternative: def.quickAlternative,
        dueDate: targetDateStr,
        daysRemaining,
        isAtRisk,
        completed: false,
        category: def.category,
      };
    });

    return {
      id: slot.id,
      title: slot.title,
      timeframe: slot.timeframe,
      targetDate: targetDateStr,
      daysRemaining,
      isToday: slot.isToday,
      isEventDay: slot.isEventDay,
      tasks,
    };
  });

  return {
    daysLeft,
    planStyle,
    eventDate: eventDateStr,
    referenceDate: toDateString(refDate),
    milestones,
    atRiskCount,
    totalTasks,
  };
}

/**
 * Backward compatibility wrapper returning TimelineMilestone[]
 * for components or tests that consume the milestone list directly.
 */
export function generateTimeline(
  eventType: EventType,
  eventDateStr: string,
  referenceDateStr?: string
): TimelineMilestone[] {
  const result = generateAdaptiveTimeline(eventType, eventDateStr, referenceDateStr);
  return result.milestones;
}
