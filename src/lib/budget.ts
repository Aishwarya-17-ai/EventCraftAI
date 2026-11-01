/**
 * EventCraft AI - Budget Planner
 * Pure function budget calculation with exact 100% distribution and integer cents.
 * Supports all 13 event types with tailored category tables and catering guest-shifts.
 */

import { formatCurrencyFromCents } from './formatters';
import { BudgetCategory, BudgetSummary, CurrencyCode, EventType } from './types';

export interface BaseCategoryRule {
  id: string;
  name: string;
  basePercent: number;
  description: string;
  color: string;
  isCatering?: boolean;
  isFlexDeduction?: boolean;
  isContingency?: boolean;
}

export const BUDGET_RULES_BY_TYPE: Record<EventType, BaseCategoryRule[]> = {
  wedding: [
    { id: 'venue', name: 'Venue & Rentals', basePercent: 25, description: 'Ceremony & reception spaces, tables, chairs, lighting', color: '#9D174D' },
    { id: 'catering', name: 'Catering & Bar', basePercent: 30, description: 'Plated dinner, cocktail hour, bar service & staff', color: '#C2410C', isCatering: true },
    { id: 'photo', name: 'Photography & Video', basePercent: 12, description: 'Full day coverage, edited album, highlight reel', color: '#E8563F' },
    { id: 'decor', name: 'Decor & Florals', basePercent: 10, description: 'Centerpieces, bouquets, arches & stage decor', color: '#F59E0B', isFlexDeduction: true },
    { id: 'music', name: 'Music & Entertainment', basePercent: 8, description: 'DJ, live band, sound setup, MC', color: '#8B5CF6' },
    { id: 'attire', name: 'Attire & Beauty', basePercent: 7, description: 'Bridal gown, suit/tux, hair, makeup styling', color: '#EC4899' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Reserved buffer for last-minute needs or surge fees', color: '#10B981', isContingency: true },
  ],
  engagement: [
    { id: 'venue', name: 'Venue & Space Rental', basePercent: 25, description: 'Banquet hall, restaurant terrace or private lounge', color: '#86198F' },
    { id: 'catering', name: 'Catering & Cocktails', basePercent: 32, description: 'Appetizers, dinner buffet, champagne toast', color: '#C2410C', isCatering: true },
    { id: 'photo', name: 'Photography & Portraits', basePercent: 13, description: 'Couple portraits and candid celebration coverage', color: '#E8563F' },
    { id: 'decor', name: 'Decor & Ambient Florals', basePercent: 12, description: 'Floral ring arch, candlelight, table centerpieces', color: '#F59E0B', isFlexDeduction: true },
    { id: 'attire', name: 'Attire, Styling & Favors', basePercent: 10, description: 'Couples styling, invitations & personalized favors', color: '#EC4899' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for last-minute RSVPs or weather provisions', color: '#10B981', isContingency: true },
  ],
  reception: [
    { id: 'venue', name: 'Reception Venue Rental', basePercent: 24, description: 'Grand hall or ballroom, stage, dance floor & lighting', color: '#9D174D' },
    { id: 'catering', name: 'Banquet Feast & Bar', basePercent: 34, description: 'Multi-course dinner, open bar, dessert station', color: '#C2410C', isCatering: true },
    { id: 'music', name: 'DJ, Band & Live Lighting', basePercent: 12, description: 'Live sound, dance floor lighting and MC hosting', color: '#8B5CF6' },
    { id: 'photo', name: 'Evening Photography', basePercent: 12, description: 'Speeches, toasts, first dance and guest candids', color: '#E8563F' },
    { id: 'decor', name: 'Evening Decor & Stage', basePercent: 10, description: 'Stage backdrop, table runners, statement flowers', color: '#F59E0B', isFlexDeduction: true },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for overtime charges or vendor surges', color: '#10B981', isContingency: true },
  ],
  birthday: [
    { id: 'catering', name: 'Food & Refreshments', basePercent: 35, description: 'Appetizers, buffet/mains, soft drinks & bar', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Venue & Space Rental', basePercent: 20, description: 'Party hall, club house, lounge or outdoor park', color: '#6D28D9' },
    { id: 'entertainment', name: 'Entertainment & Games', basePercent: 15, description: 'DJ, performer, arcade rentals, party host', color: '#8B5CF6' },
    { id: 'decor', name: 'Decor & Balloons', basePercent: 12, description: 'Themed backdrops, balloon garlands, table runners', color: '#F59E0B', isFlexDeduction: true },
    { id: 'cake', name: 'Cake & Sweet Treats', basePercent: 10, description: 'Custom themed cake, dessert bar, party favors', color: '#EC4899' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for overtime, extra guests, or emergencies', color: '#10B981', isContingency: true },
  ],
  baby_shower: [
    { id: 'catering', name: 'Brunch & Mocktails', basePercent: 34, description: 'Finger foods, mocktail mimosa bar, sweet pastries', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Venue / Tea Room Rental', basePercent: 20, description: 'Cozy garden patio, cafe room, or private studio', color: '#BE185D' },
    { id: 'decor', name: 'Pastel Balloons & Florals', basePercent: 16, description: 'Organic balloon garland, baby blocks, photo backdrop', color: '#F59E0B', isFlexDeduction: true },
    { id: 'games', name: 'Games, Favors & Keepsakes', basePercent: 12, description: 'Baby bingo, customized favors, advice cards', color: '#8B5CF6' },
    { id: 'cake', name: 'Specialty Cake & Treats', basePercent: 10, description: 'Custom themed cake, macarons, cookie packs', color: '#EC4899' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for surprise guests or last-minute supplies', color: '#10B981', isContingency: true },
  ],
  anniversary: [
    { id: 'catering', name: 'Gourmet Dinner & Wine', basePercent: 34, description: 'Plated dinner, fine wine pairings, anniversary toast', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Private Dining / Venue', basePercent: 22, description: 'Intimate dining room, rooftop or historic hall', color: '#86198F' },
    { id: 'photo', name: 'Photo & Memory Video', basePercent: 14, description: 'Family milestone portraits & anniversary recap video', color: '#E8563F' },
    { id: 'decor', name: 'Floral Arrangements & Ambience', basePercent: 12, description: 'Lush floral centerpieces, votive candles, table linens', color: '#F59E0B', isFlexDeduction: true },
    { id: 'music', name: 'Live Acoustic Music / DJ', basePercent: 10, description: 'Violin, jazz trio, or nostalgic anniversary playlist', color: '#8B5CF6' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for special vintage bottles or overtime', color: '#10B981', isContingency: true },
  ],
  housewarming: [
    { id: 'catering', name: 'Catering & Beverages', basePercent: 38, description: 'Artisanal grazing boards, sliders, craft beer & wine', color: '#C2410C', isCatering: true },
    { id: 'decor', name: 'Home Styling & Accent Plants', basePercent: 20, description: 'Potted plants, entry floral displays, mood lighting', color: '#B45309', isFlexDeduction: true },
    { id: 'rentals', name: 'Party Rentals & Barware', basePercent: 12, description: 'Cocktail highboys, extra glassware, ice chests', color: '#8B5CF6' },
    { id: 'favors', name: 'Invitations & Guest Favors', basePercent: 12, description: 'Custom housewarming cookies, mini succulents', color: '#EC4899' },
    { id: 'cleaning', name: 'Pre & Post Event Cleaning', basePercent: 10, description: 'Professional cleaning service before and after', color: '#3B82F6' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for supply restocks and spill contingencies', color: '#10B981', isContingency: true },
  ],
  graduation: [
    { id: 'catering', name: 'Buffet Feast & Refreshments', basePercent: 36, description: 'Hearty crowd favorites, celebration punch, sweets', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Venue / Patio Rental', basePercent: 22, description: 'Clubhouse, backyard tent, or banquet hall space', color: '#4338CA' },
    { id: 'photo', name: 'Photo Booth & Portraits', basePercent: 14, description: 'Cap & gown photobooth, memory album prints', color: '#E8563F' },
    { id: 'decor', name: 'School Colors Decor & Banners', basePercent: 10, description: 'Custom school color pennants, balloons, yard signs', color: '#F59E0B', isFlexDeduction: true },
    { id: 'music', name: 'Sound System & DJ Playlist', basePercent: 10, description: 'DJ or high-power PA system rental and playlists', color: '#8B5CF6' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for weather tent sidewalls or extra food', color: '#10B981', isContingency: true },
  ],
  corporate: [
    { id: 'catering', name: 'Catering & Coffee Breaks', basePercent: 30, description: 'Executive breakfast, coffee bars, lunch, networking cocktails', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Conference Facility & AV Tech', basePercent: 28, description: 'Auditorium, break-out rooms, high-speed WiFi', color: '#1D4ED8' },
    { id: 'speakers', name: 'Keynote & Presentation Tech', basePercent: 14, description: 'Speaker honorariums, stage management, lapel mics', color: '#8B5CF6' },
    { id: 'branding', name: 'Badges, Agendas & Swag', basePercent: 10, description: 'Lanyards, printed schedules, sponsor booth banners', color: '#E8563F', isFlexDeduction: true },
    { id: 'streaming', name: 'Hybrid Streaming & Recording', basePercent: 10, description: 'Live broadcast video cameras, recording archive', color: '#3B82F6' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for technical redundancy and attendee surges', color: '#10B981', isContingency: true },
  ],
  festival: [
    { id: 'catering', name: 'Food & Beverage Concessions', basePercent: 30, description: 'Food truck staging, festival water & refreshment hubs', color: '#C2410C', isCatering: true },
    { id: 'av', name: 'Stage, Sound & AV Production', basePercent: 25, description: 'Covered performance stage, line-array speakers, lights', color: '#0F766E' },
    { id: 'permits', name: 'City Permits, Safety & Security', basePercent: 17, description: 'Municipal assembly permits, EMS first-aid, security detail', color: '#3730A3' },
    { id: 'promotion', name: 'Wayfinding, Banners & Promo', basePercent: 10, description: 'Large format festival banners, schedule boards, flyers', color: '#E8563F', isFlexDeduction: true },
    { id: 'art', name: 'Art Installations & Workshops', basePercent: 10, description: 'Interactive community art, family activity booths', color: '#F59E0B' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Reserved buffer for weather adjustments or generator fuel', color: '#10B981', isContingency: true },
  ],
  community: [
    { id: 'catering', name: 'Community Refreshments', basePercent: 32, description: 'Food trucks, community feast, drinks & water stations', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Venue & City Permits', basePercent: 25, description: 'Park permits, pavilion rental, sanitization, security', color: '#0F766E' },
    { id: 'av', name: 'AV & Stage Production', basePercent: 15, description: 'Microphones, stage, speakers, generator, lighting', color: '#8B5CF6' },
    { id: 'promotion', name: 'Signage & Promotion', basePercent: 10, description: 'Flyers, directional signs, banners, badges', color: '#E8563F' },
    { id: 'activities', name: 'Activities & Supplies', basePercent: 10, description: 'Workshops, sports equipment, booth setups', color: '#F59E0B', isFlexDeduction: true },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Reserved contingency for bad weather or permit shifts', color: '#10B981', isContingency: true },
  ],
  charity: [
    { id: 'catering', name: 'Gala Banquet & Bar Service', basePercent: 28, description: 'Seated dinner, wine service, welcome cocktail reception', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Gala Venue & Audio-Visual', basePercent: 24, description: 'Ballroom rental, stage, spotlights, auction screens', color: '#047857' },
    { id: 'collateral', name: 'Donor Collateral & Media PR', basePercent: 16, description: 'Program books, donor tribute screens, invitation suite', color: '#8B5CF6', isFlexDeduction: true },
    { id: 'auction', name: 'Auctioneer & Live Entertainment', basePercent: 14, description: 'Professional charity auctioneer, live band or orchestra', color: '#E8563F' },
    { id: 'production', name: 'Video Production & Storytelling', basePercent: 10, description: 'Beneficiary impact video, presentation graphics', color: '#3B82F6' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'Buffer for auction payment fees or technical overhead', color: '#10B981', isContingency: true },
  ],
  others: [
    { id: 'catering', name: 'Food & Refreshments', basePercent: 32, description: 'Curated catering, appetizers, beverages & service staff', color: '#C2410C', isCatering: true },
    { id: 'venue', name: 'Venue & Space Rental', basePercent: 26, description: 'Dedicated event space, facility permits, equipment', color: '#334155' },
    { id: 'entertainment', name: 'Entertainment & Audio-Visual', basePercent: 14, description: 'Music, microphone system, presenter tech, activities', color: '#8B5CF6' },
    { id: 'decor', name: 'Decor, Ambience & Signage', basePercent: 10, description: 'Signage, thematic decorations, directional markers', color: '#F59E0B', isFlexDeduction: true },
    { id: 'supplies', name: 'Event Supplies & Favors', basePercent: 10, description: 'Event packs, materials, attendee gifts or collateral', color: '#EC4899' },
    { id: 'contingency', name: 'Emergency Contingency', basePercent: 8, description: 'General buffer for unpredictable expenses or surge needs', color: '#10B981', isContingency: true },
  ],
};

/**
 * Calculates guest-based catering percentage shift.
 * Shifts up to 5 points towards catering as guest count grows from 50 to 200.
 */
export function calculateGuestShift(guestCount: number): number {
  if (guestCount <= 50) return 0;
  if (guestCount >= 200) return 5;
  const progress = (guestCount - 50) / 150;
  return Math.round(progress * 5);
}

/**
 * Pure function to calculate event budget breakdown.
 * Enforces:
 * 1. Percentages sum to exactly 100 for every event type.
 * 2. Integer cents sum to exactly the total cents (no penny lost).
 * 3. Contingency strictly between 5% and 10%.
 * 4. Catering share grows by up to 5 points as guest count rises from 50 to 200.
 */
export function calculateBudget(
  eventType: EventType,
  totalBudget: number,
  guestCount: number,
  currency: CurrencyCode
): BudgetSummary {
  const safeBudget = Math.max(0, totalBudget);
  const safeGuests = Math.max(1, guestCount);
  const totalCents = Math.round(safeBudget * 100);

  // Pick rule set for the event type (fallback to 'others')
  const rules = BUDGET_RULES_BY_TYPE[eventType] || BUDGET_RULES_BY_TYPE.others;

  // Calculate shift towards catering
  const shift = calculateGuestShift(safeGuests);

  // Apply shift: add to catering, subtract from flex deduction
  const adjustedPercentages = rules.map((r) => {
    if (r.isCatering) {
      return { ...r, percent: r.basePercent + shift };
    }
    if (r.isFlexDeduction) {
      return { ...r, percent: Math.max(0, r.basePercent - shift) };
    }
    return { ...r, percent: r.basePercent };
  });

  // Verify percentage sum
  const percentSum = adjustedPercentages.reduce((acc, c) => acc + c.percent, 0);
  if (percentSum !== 100) {
    const diff = 100 - percentSum;
    // Adjust first non-contingency, non-catering category
    const targetIdx = adjustedPercentages.findIndex((c) => !c.isContingency && !c.isCatering);
    if (targetIdx >= 0) {
      adjustedPercentages[targetIdx].percent += diff;
    } else {
      adjustedPercentages[0].percent += diff;
    }
  }

  // Integer cents allocation using remainder redistribution
  const baseCentsList = adjustedPercentages.map((cat) => {
    const rawCents = (totalCents * cat.percent) / 100;
    const floorCents = Math.floor(rawCents);
    const fractionalPart = rawCents - floorCents;
    return {
      cat,
      floorCents,
      fractionalPart,
    };
  });

  const allocatedCentsSum = baseCentsList.reduce((acc, item) => acc + item.floorCents, 0);
  const remainderCents = totalCents - allocatedCentsSum;

  // Distribute remainder cents to items with highest fractional part
  const sortedByFraction = [...baseCentsList].sort((a, b) => b.fractionalPart - a.fractionalPart);

  const finalCentsMap = new Map<string, number>();
  for (const item of baseCentsList) {
    finalCentsMap.set(item.cat.id, item.floorCents);
  }

  for (let i = 0; i < remainderCents; i++) {
    const target = sortedByFraction[i % sortedByFraction.length];
    const current = finalCentsMap.get(target.cat.id) || 0;
    finalCentsMap.set(target.cat.id, current + 1);
  }

  // Construct categories
  const categories: BudgetCategory[] = adjustedPercentages.map((cat) => {
    const amountCents = finalCentsMap.get(cat.id) || 0;
    const costPerGuestCents = Math.round(amountCents / safeGuests);
    return {
      id: cat.id,
      name: cat.name,
      percent: cat.percent,
      amountCents,
      amountFormatted: formatCurrencyFromCents(amountCents, currency),
      costPerGuestCents,
      costPerGuestFormatted: formatCurrencyFromCents(costPerGuestCents, currency),
      description: cat.description,
      color: cat.color,
    };
  });

  const contingencyCategory =
    categories.find((c) => c.id === 'contingency') || categories[categories.length - 1];
  const costPerGuestCents = Math.round(totalCents / safeGuests);

  return {
    totalBudget: safeBudget,
    totalCents,
    currency,
    guestCount: safeGuests,
    costPerGuestCents,
    costPerGuestFormatted: formatCurrencyFromCents(costPerGuestCents, currency),
    contingencyPercent: contingencyCategory.percent,
    contingencyCents: contingencyCategory.amountCents,
    contingencyFormatted: contingencyCategory.amountFormatted,
    categories,
  };
}
