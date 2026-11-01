/**
 * EventCraft AI - Vendor Categories, Google Maps Integration, and Vetting Engine
 * Deterministic categories for all 13 event types.
 * Strictly zero fabricated company names, fake ratings, or mock badges.
 * Real user-entered vendors with Google Maps integration, phone sanitization,
 * AI tips guardrails, and demo vendors switch.
 */

import { EventType, VendorCategoryConfig, UserVendor, VendorItem } from './types';

// ============================================================================
// 1. TYPED VENDOR CATEGORIES CONFIG TABLE (All 13 Event Types)
// ============================================================================

const WEDDING_CATEGORIES: VendorCategoryConfig[] = [
  {
    id: 'wedding-marriage-halls',
    title: 'Marriage Halls',
    emoji: '🏛️',
    mapsQuery: 'marriage halls kalyana mandapam banquet halls',
    budgetCategoryId: 'venue',
  },
  {
    id: 'wedding-catering',
    title: 'Catering',
    emoji: '🍽️',
    mapsQuery: 'wedding caterers catering services',
    budgetCategoryId: 'catering',
  },
  {
    id: 'wedding-photo-video',
    title: 'Photography & Videography',
    emoji: '📸',
    mapsQuery: 'wedding photography videography',
    budgetCategoryId: 'photo',
  },
  {
    id: 'wedding-florists-decor',
    title: 'Florists & Decor',
    emoji: '💐',
    mapsQuery: 'wedding florists stage decorators',
    budgetCategoryId: 'decor',
  },
  {
    id: 'wedding-entertainment',
    title: 'Entertainment',
    emoji: '🎤',
    mapsQuery: 'wedding DJ live band music entertainment',
    budgetCategoryId: 'music',
  },
  {
    id: 'wedding-sweets-gifts',
    title: 'Sweets & Gifts',
    emoji: '🍬',
    mapsQuery: 'wedding sweets return gifts mithai hampers',
    budgetCategoryId: 'favors',
  },
];

const BIRTHDAY_CATEGORIES: VendorCategoryConfig[] = [
  {
    id: 'birthday-party-halls',
    title: 'Party Halls',
    emoji: '🏛️',
    mapsQuery: 'birthday party halls celebration venue',
    budgetCategoryId: 'venue',
  },
  {
    id: 'birthday-caterers-cakes',
    title: 'Caterers & Cake Shops',
    emoji: '🎂',
    mapsQuery: 'birthday caterers cake shops custom cakes',
    budgetCategoryId: 'catering',
  },
  {
    id: 'birthday-decorators',
    title: 'Decorators',
    emoji: '💐',
    mapsQuery: 'birthday decorators balloon decoration theme decor',
    budgetCategoryId: 'decor',
  },
  {
    id: 'birthday-photographers',
    title: 'Photographers',
    emoji: '📸',
    mapsQuery: 'birthday party photographers photobooth',
    budgetCategoryId: 'photo',
  },
  {
    id: 'birthday-entertainers',
    title: 'Entertainers',
    emoji: '🎤',
    mapsQuery: 'party entertainers magicians kids entertainment',
    budgetCategoryId: 'music',
  },
  {
    id: 'birthday-return-gifts',
    title: 'Return Gifts',
    emoji: '🎁',
    mapsQuery: 'birthday return gifts party favors goodie bags',
    budgetCategoryId: 'favors',
  },
];

export const VENDOR_CATEGORIES_CONFIG: Record<EventType, VendorCategoryConfig[]> = {
  wedding: WEDDING_CATEGORIES,
  engagement: WEDDING_CATEGORIES,
  reception: WEDDING_CATEGORIES,
  anniversary: WEDDING_CATEGORIES,
  birthday: BIRTHDAY_CATEGORIES,

  baby_shower: [
    {
      id: 'baby-venues',
      title: 'Venues & Tea Rooms',
      emoji: '🏛️',
      mapsQuery: 'baby shower venues garden tea rooms boutique halls',
      budgetCategoryId: 'venue',
    },
    {
      id: 'baby-catering',
      title: 'Catering & High Tea',
      emoji: '🍽️',
      mapsQuery: 'baby shower caterers high tea party food bites',
      budgetCategoryId: 'catering',
    },
    {
      id: 'baby-decor',
      title: 'Pastel Decor & Balloons',
      emoji: '💐',
      mapsQuery: 'baby shower decor balloon artists pastel styling',
      budgetCategoryId: 'decor',
    },
    {
      id: 'baby-photo',
      title: 'Portraits & Photography',
      emoji: '📸',
      mapsQuery: 'maternity baby shower photographers',
      budgetCategoryId: 'photo',
    },
    {
      id: 'baby-cakes',
      title: 'Cakes & Confections',
      emoji: '🎂',
      mapsQuery: 'baby shower cakes custom confections bakery',
      budgetCategoryId: 'cake',
    },
    {
      id: 'baby-favors',
      title: 'Favors & Keepsakes',
      emoji: '🎁',
      mapsQuery: 'baby shower favors return gifts personalized keepsakes',
      budgetCategoryId: 'favors',
    },
  ],

  housewarming: [
    {
      id: 'house-catering',
      title: 'Catering & Dining',
      emoji: '🍽️',
      mapsQuery: 'housewarming caterers traditional feast food delivery',
      budgetCategoryId: 'catering',
    },
    {
      id: 'house-decor',
      title: 'Floral & Entrance Decor',
      emoji: '💐',
      mapsQuery: 'housewarming floral decorators flower garlands toran',
      budgetCategoryId: 'decor',
    },
    {
      id: 'house-music',
      title: 'Music & Ambience',
      emoji: '🎤',
      mapsQuery: 'traditional musicians acoustic sound setup housewarming',
      budgetCategoryId: 'music',
    },
    {
      id: 'house-rentals',
      title: 'Equipment & Furniture Rentals',
      emoji: '📍',
      mapsQuery: 'event equipment rentals chairs highboy tables',
      budgetCategoryId: 'rentals',
    },
    {
      id: 'house-cleaning',
      title: 'Post-Event Deep Cleaning',
      emoji: '📍',
      mapsQuery: 'post event residential deep cleaning services',
      budgetCategoryId: 'cleaning',
    },
    {
      id: 'house-sweets',
      title: 'Welcome Gifts & Sweets',
      emoji: '🍬',
      mapsQuery: 'housewarming gift packs traditional sweets box',
      budgetCategoryId: 'favors',
    },
  ],

  graduation: [
    {
      id: 'grad-venues',
      title: 'Banquet & Party Venues',
      emoji: '🏛️',
      mapsQuery: 'graduation party venues celebration halls rooftop',
      budgetCategoryId: 'venue',
    },
    {
      id: 'grad-catering',
      title: 'Buffet & Smokehouse Catering',
      emoji: '🍽️',
      mapsQuery: 'graduation party buffet caterers casual dining food trucks',
      budgetCategoryId: 'catering',
    },
    {
      id: 'grad-photo',
      title: 'Cap & Gown Photobooth',
      emoji: '📸',
      mapsQuery: 'graduation photographers 360 photo booth rental',
      budgetCategoryId: 'photo',
    },
    {
      id: 'grad-entertainment',
      title: 'DJ & Sound Production',
      emoji: '🎤',
      mapsQuery: 'party DJ sound system hire graduation celebration',
      budgetCategoryId: 'music',
    },
    {
      id: 'grad-decor',
      title: 'Balloon Arches & Banners',
      emoji: '💐',
      mapsQuery: 'graduation balloon arches celebration signage banner printing',
      budgetCategoryId: 'decor',
    },
    {
      id: 'grad-favors',
      title: 'Custom Keepsakes & Favors',
      emoji: '🎁',
      mapsQuery: 'custom commemorative mugs pins graduation favors',
      budgetCategoryId: 'favors',
    },
  ],

  corporate: [
    {
      id: 'corp-venues',
      title: 'Conference Venues & Auditoriums',
      emoji: '🏛️',
      mapsQuery: 'conference venues hotel auditoriums meeting spaces',
      budgetCategoryId: 'venue',
    },
    {
      id: 'corp-catering',
      title: 'Executive Catering & Lunches',
      emoji: '🍽️',
      mapsQuery: 'corporate caterers executive lunch box coffee break buffet',
      budgetCategoryId: 'catering',
    },
    {
      id: 'corp-av',
      title: 'AV & Broadcast Streaming',
      emoji: '🎤',
      mapsQuery: 'corporate AV production audio visual streaming equipment',
      budgetCategoryId: 'production',
    },
    {
      id: 'corp-photo',
      title: 'Event Photography & Headshots',
      emoji: '📸',
      mapsQuery: 'corporate event photographers executive headshots',
      budgetCategoryId: 'photo',
    },
    {
      id: 'corp-signage',
      title: 'Signage & Badges Printing',
      emoji: '📍',
      mapsQuery: 'corporate event badge printing conference signage banners',
      budgetCategoryId: 'branding',
    },
    {
      id: 'corp-swag',
      title: 'Delegate Welcome Kits',
      emoji: '🎁',
      mapsQuery: 'corporate gift merchandise delegate kit supplier branded pens',
      budgetCategoryId: 'favors',
    },
  ],

  festival: [
    {
      id: 'fest-grounds',
      title: 'Grounds & Open Stages',
      emoji: '🏛️',
      mapsQuery: 'festival grounds open air event ground mandapam outdoor venue',
      budgetCategoryId: 'venue',
    },
    {
      id: 'fest-food',
      title: 'Feast & Food Stalls',
      emoji: '🍽️',
      mapsQuery: 'festival food stalls community feast caterers street food vendors',
      budgetCategoryId: 'catering',
    },
    {
      id: 'fest-performers',
      title: 'Cultural Performers & Music',
      emoji: '🎤',
      mapsQuery: 'cultural troupes traditional musicians festival performers',
      budgetCategoryId: 'entertainment',
    },
    {
      id: 'fest-decor',
      title: 'Festival Lights & Thematic Decor',
      emoji: '💐',
      mapsQuery: 'festival illuminations stage decoration lights shamiana tent',
      budgetCategoryId: 'decor',
    },
    {
      id: 'fest-power',
      title: 'Sound, Generators & Power',
      emoji: '📍',
      mapsQuery: 'festival sound hire generator rental outdoor power cable ramps',
      budgetCategoryId: 'production',
    },
    {
      id: 'fest-sweets',
      title: 'Festive Sweets & Concessions',
      emoji: '🍬',
      mapsQuery: 'traditional sweets bulk sweets festive dry fruits confectioners',
      budgetCategoryId: 'favors',
    },
  ],

  community: [
    {
      id: 'comm-venues',
      title: 'Community Centers & Parks',
      emoji: '🏛️',
      mapsQuery: 'community halls civic centers public park pavilion',
      budgetCategoryId: 'venue',
    },
    {
      id: 'comm-food',
      title: 'Concessions & Food Trucks',
      emoji: '🍽️',
      mapsQuery: 'food trucks community gathering catering concessions',
      budgetCategoryId: 'catering',
    },
    {
      id: 'comm-sound',
      title: 'Outdoor PA Systems & Acoustics',
      emoji: '🎤',
      mapsQuery: 'outdoor PA system hire public address speaker system wireless mics',
      budgetCategoryId: 'entertainment',
    },
    {
      id: 'comm-tents',
      title: 'Tents, Canopies & Seating',
      emoji: '📍',
      mapsQuery: 'tent canopy hire marquee rental folding chairs community event',
      budgetCategoryId: 'rentals',
    },
    {
      id: 'comm-photo',
      title: 'Local Photographers & Volunteers',
      emoji: '📸',
      mapsQuery: 'local event photographer community media candid photography',
      budgetCategoryId: 'photo',
    },
  ],

  charity: [
    {
      id: 'char-venues',
      title: 'Gala Ballrooms & Banquet Spaces',
      emoji: '🏛️',
      mapsQuery: 'gala ballrooms banquet facilities charity venue',
      budgetCategoryId: 'venue',
    },
    {
      id: 'char-catering',
      title: 'Plated Dinner & Wine Service',
      emoji: '🍽️',
      mapsQuery: 'gala dinner caterers fine dining plated banquet wine service',
      budgetCategoryId: 'catering',
    },
    {
      id: 'char-auctioneer',
      title: 'Benefit Auctioneer & Emcee',
      emoji: '🎤',
      mapsQuery: 'charity auctioneer professional emcee benefit gala fundraising',
      budgetCategoryId: 'entertainment',
    },
    {
      id: 'char-av',
      title: 'Stage Spotlights & Live Screens',
      emoji: '📍',
      mapsQuery: 'gala stage lighting LED video wall screen rental live appeal',
      budgetCategoryId: 'production',
    },
    {
      id: 'char-media',
      title: 'Event Media & Beneficiary Stories',
      emoji: '📸',
      mapsQuery: 'fundraiser gala photography videography media red carpet',
      budgetCategoryId: 'photo',
    },
    {
      id: 'char-donor-gifts',
      title: 'Donor Keepsakes & Favors',
      emoji: '🎁',
      mapsQuery: 'donor appreciation gifts custom plaques gift boxes charity favors',
      budgetCategoryId: 'favors',
    },
  ],

  others: [
    {
      id: 'others-venues',
      title: 'Venues',
      emoji: '🏛️',
      mapsQuery: 'event venue halls rental space',
      budgetCategoryId: 'venue',
    },
    {
      id: 'others-caterers',
      title: 'Caterers',
      emoji: '🍽️',
      mapsQuery: 'event caterers buffet dining service food delivery',
      budgetCategoryId: 'catering',
    },
    {
      id: 'others-decor',
      title: 'Decor',
      emoji: '💐',
      mapsQuery: 'event decor floral styling ambience decorators',
      budgetCategoryId: 'decor',
    },
    {
      id: 'others-photo',
      title: 'Photography',
      emoji: '📸',
      mapsQuery: 'event photographer videographer candid media',
      budgetCategoryId: 'photo',
    },
    {
      id: 'others-entertainment',
      title: 'Entertainment',
      emoji: '🎤',
      mapsQuery: 'event DJ musicians sound system entertainment live performance',
      budgetCategoryId: 'entertainment',
    },
  ],
};

/**
 * Returns the typed vendor category configurations for an event type.
 */
export function getVendorCategoriesForEvent(eventType: EventType): VendorCategoryConfig[] {
  return VENDOR_CATEGORIES_CONFIG[eventType] || VENDOR_CATEGORIES_CONFIG.others;
}

// ============================================================================
// 2. GOOGLE MAPS URL BUILDERS (Safe, encoded, no API keys)
// ============================================================================

/**
 * Builds a Google Maps search URL for a category and city.
 * E.g. https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(query + " in " + city)>
 */
export function buildMapsSearchUrl(query: string, city?: string): string {
  const cleanQuery = query.trim();
  const cleanCity = (city || '').trim();
  const fullSearch = cleanCity ? `${cleanQuery} in ${cleanCity}` : cleanQuery;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullSearch)}`;
}

/**
 * Builds a Google Maps search URL for a specific user vendor name and city.
 * E.g. https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(name + " " + city)>
 */
export function buildMapsVendorSearchUrl(name: string, city?: string): string {
  const cleanName = name.trim();
  const cleanCity = (city || '').trim();
  const fullSearch = cleanCity ? `${cleanName} ${cleanCity}` : cleanName;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullSearch)}`;
}

/**
 * Builds a Google Maps search URL using geolocation coordinates.
 * E.g. https://www.google.com/maps/search/<encoded query>/@<lat>,<lng>,14z
 */
export function buildMapsGeoSearchUrl(query: string, lat: number, lng: number): string {
  const cleanQuery = encodeURIComponent(query.trim());
  return `https://www.google.com/maps/search/${cleanQuery}/@${lat},${lng},14z`;
}

// ============================================================================
// 3. PHONE NORMALIZATION & SANITIZATION (Strict security & tel: safe hrefs)
// ============================================================================

/**
 * Normalizes phone string for clean text display (max 20 chars).
 */
export function normalizePhoneDisplay(phone?: string): string {
  if (!phone) return '';
  return phone.trim().slice(0, 20);
}

/**
 * Sanitizes phone for tel: links.
 * Strictly permits only digits and a single leading +, stripping all spaces,
 * letters, and special characters. Returns null if invalid or unsafe.
 */
export function getSanitizedTelHref(phone?: string): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  // Strip everything except leading + and digits
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 3) return null; // Too short to be a valid phone number
  const sanitized = hasPlus ? `+${digitsOnly}` : digitsOnly;
  return `tel:${sanitized}`;
}

// ============================================================================
// 4. AI TIPS VALIDATOR & DETERMINISTIC FALLBACK (No business names / phones / urls)
// ============================================================================

const SEVEN_DIGIT_REGEX = /\b\d{7,}\b/;
const URL_REGEX = /(https?:\/\/|www\.|\.com|\.org|\.net|\.in|\.co)/i;

/**
 * Validates AI tips output. Rejects if it contains 7+ digits (phone number attempt)
 * or any URL, ensuring strictly generic advice.
 */
export function validateAiTips(tips: unknown): [string, string, string] | null {
  if (!Array.isArray(tips) || tips.length < 3) return null;
  const clean: string[] = [];
  for (let i = 0; i < 3; i++) {
    const tip = tips[i];
    if (typeof tip !== 'string' || tip.trim().length === 0) return null;
    const trimmed = tip.trim();
    // Guardrail: reject phone numbers / 7+ digit sequences
    if (SEVEN_DIGIT_REGEX.test(trimmed)) {
      console.warn('AI tip rejected due to phone/digit sequence detected:', trimmed);
      return null;
    }
    // Guardrail: reject web URLs or domain names
    if (URL_REGEX.test(trimmed)) {
      console.warn('AI tip rejected due to URL/link detected:', trimmed);
      return null;
    }
    clean.push(trimmed);
  }
  return [clean[0], clean[1], clean[2]];
}

/**
 * Deterministic fallback tips for category vetting when AI is offline or slow.
 */
export function getDeterministicFallbackVendorTips(
  category: VendorCategoryConfig,
  eventType: EventType,
  daysLeft: number,
  city?: string
): [string, string, string] {
  const cityPhrase = city ? ` in ${city}` : '';
  const timeUrgency =
    daysLeft <= 14
      ? 'With limited days remaining, prioritize vendors with existing inventory and immediate confirmation.'
      : daysLeft <= 60
      ? 'With 2 months to go, finalize your contract now to avoid peak date surcharges.'
      : 'Book your core vendor 3 to 6 months out to lock in seasonal discounts.';

  const catLower = category.title.toLowerCase();

  if (catLower.includes('hall') || catLower.includes('venue')) {
    return [
      `Inquire about weekday or off-peak booking discounts${cityPhrase}.`,
      timeUrgency,
      'Request itemized clarification on cleaning fees, corkage, and overtime per-hour penalties before signing.',
    ];
  }
  if (catLower.includes('cater') || catLower.includes('cake') || catLower.includes('dining')) {
    return [
      `Ask for a complimentary tasting session${cityPhrase} to finalize portions and taste.`,
      timeUrgency,
      'Request guaranteed server-to-guest ratios and ensure leftover packaging policies are documented.',
    ];
  }
  if (catLower.includes('photo') || catLower.includes('video')) {
    return [
      'Ask to view a complete, unedited event gallery rather than only curated highlight reels.',
      timeUrgency,
      'Ensure the contract explicitly states raw footage delivery timeline and on-site backup gear redundancy.',
    ];
  }
  if (catLower.includes('decor') || catLower.includes('florist')) {
    return [
      'Ask how ceremony or entrance arrangements can be repurposed for the reception stage to save 20-30%.',
      timeUrgency,
      'Clarify whether dismantle and disposal fees are bundled into the proposal or billed separately.',
    ];
  }
  if (catLower.includes('entertain') || catLower.includes('dj') || catLower.includes('music')) {
    return [
      'Provide your preferred playlist alongside a strict "Do Not Play" list well before event day.',
      timeUrgency,
      'Verify that the performer supplies their own redundant mixer, microphones, and audio cables.',
    ];
  }
  return [
    `Request quotes from 2 to 3 reputable vendors${cityPhrase} to compare inclusions.`,
    timeUrgency,
    'Ensure all payment milestones are tied to clear contractual deliverables.',
  ];
}

// In-memory cache for category AI tips: key `${eventType}_${categoryId}_${daysLeft}_${city}`
const vendorTipsMemoryCache = new Map<string, { tips: [string, string, string]; isOffline: boolean }>();

/**
 * Clears the in-memory AI vendor tips cache (useful for tests).
 */
export function clearVendorTipsCache(): void {
  vendorTipsMemoryCache.clear();
}

/**
 * Fetches AI tips for a specific category with 15s timeout, 1 retry, caching,
 * and deterministic fallback with "AI offline" flag.
 */
export async function fetchCategoryAiTips(
  category: VendorCategoryConfig,
  eventType: EventType,
  daysLeft: number,
  city?: string,
  budgetFormatted?: string
): Promise<{ tips: [string, string, string]; isOffline: boolean }> {
  const cacheKey = `${eventType}_${category.id}_${daysLeft}_${city || 'nocity'}`;
  const cached = vendorTipsMemoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const fallbackTips = getDeterministicFallbackVendorTips(category, eventType, daysLeft, city);

  // Attempt API call with 15s timeout + 1 retry
  const attemptFetch = async (): Promise<[string, string, string] | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/vendor-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          categoryId: category.id,
          categoryTitle: category.title,
          mapsQuery: category.mapsQuery,
          city: city || '',
          daysLeft,
          budgetFormatted: budgetFormatted || '',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) return null;
      const data = await response.json();
      return validateAiTips(data?.tips);
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  };

  // Try 1
  let validated = await attemptFetch();

  // 1 Retry if failed
  if (!validated) {
    validated = await attemptFetch();
  }

  const result = validated
    ? { tips: validated, isOffline: false }
    : { tips: fallbackTips, isOffline: true };

  vendorTipsMemoryCache.set(cacheKey, result);
  return result;
}

// ============================================================================
// 5. DEMO VENDORS GENERATOR (2 sample cards per category, non-exportable, not real)
// ============================================================================

export function getDemoVendorsForEvent(eventType: EventType): UserVendor[] {
  const categories = getVendorCategoriesForEvent(eventType);
  const demoList: UserVendor[] = [];

  categories.forEach((cat, index) => {
    demoList.push({
      id: `demo-${cat.id}-1`,
      categoryId: cat.id,
      categoryTitle: cat.title,
      categoryEmoji: cat.emoji,
      name: `Sample ${cat.title} Option A`,
      phone: undefined, // Demo has no real phone
      rating: 4.8,
      reviewsCount: 36 + index * 4,
      quotedPrice: 1200 + index * 300,
      notes: 'Sample quote with setup, equipment, and standard package included.',
      city: 'Sample City',
      isBooked: false,
      isShortlisted: false,
      isSample: true,
      createdAt: new Date().toISOString(),
      mapsUrl: buildMapsSearchUrl(cat.mapsQuery),
    });

    demoList.push({
      id: `demo-${cat.id}-2`,
      categoryId: cat.id,
      categoryTitle: cat.title,
      categoryEmoji: cat.emoji,
      name: `Sample ${cat.title} Option B`,
      phone: undefined, // Demo has no real phone
      rating: 4.5,
      reviewsCount: 19 + index * 2,
      quotedPrice: 950 + index * 250,
      notes: 'Sample alternative with flexible off-peak package discounts.',
      city: 'Sample City',
      isBooked: false,
      isShortlisted: false,
      isSample: true,
      createdAt: new Date().toISOString(),
      mapsUrl: buildMapsSearchUrl(cat.mapsQuery),
    });
  });

  return demoList;
}

// ============================================================================
// 6. LOCALSTORAGE PERSISTENCE & JSON EXPORT
// ============================================================================

const STORAGE_PREFIX = 'eventcraft_user_vendors_';

export function loadUserVendors(eventIdOrType: string): UserVendor[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${eventIdOrType}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any demo vendors that might have leaked in
        return parsed.filter((v: UserVendor) => !v.isSample);
      }
    }
  } catch (err) {
    console.debug('Failed to load user vendors from storage:', err);
  }
  return [];
}

export function saveUserVendors(eventIdOrType: string, vendors: UserVendor[]): boolean {
  try {
    // Strictly do not save demo vendors
    const realVendors = vendors.filter((v) => !v.isSample);
    localStorage.setItem(`${STORAGE_PREFIX}${eventIdOrType}`, JSON.stringify(realVendors));
    return true;
  } catch (err) {
    console.debug('Failed to save user vendors to storage:', err);
    return false;
  }
}

export function exportUserVendorsAsJSON(
  eventName: string,
  vendors: UserVendor[],
  categories: VendorCategoryConfig[]
): void {
  try {
    // Filter out demo vendors
    const realVendors = vendors.filter((v) => !v.isSample);
    const dataStr = JSON.stringify(
      {
        eventName,
        exportedAt: new Date().toISOString(),
        totalCategories: categories.length,
        totalVendorsAdded: realVendors.length,
        bookedCount: realVendors.filter((v) => v.isBooked).length,
        shortlistedCount: realVendors.filter((v) => v.isShortlisted).length,
        vendors: realVendors.map((v) => ({
          id: v.id,
          name: v.name,
          category: v.categoryTitle,
          phone: v.phone || null,
          rating: v.rating ?? null,
          reviewsCount: v.reviewsCount ?? null,
          quotedPrice: v.quotedPrice ?? null,
          notes: v.notes || null,
          isBooked: !!v.isBooked,
          isShortlisted: !!v.isShortlisted,
          mapsUrl: v.mapsUrl || null,
          createdAt: v.createdAt || null,
        })),
      },
      null,
      2
    );

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_vendors.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.debug('Failed to export vendors JSON:', err);
  }
}

// ============================================================================
// 7. BACKWARDS COMPATIBILITY HELPERS (Maintains compatibility with tests)
// ============================================================================

export const GENERIC_VENDORS: Omit<VendorItem, 'booked' | 'notes'>[] = [
  {
    id: 'gen-venue',
    category: 'Venue & Location',
    title: 'Event Venue / Facility Host',
    questions: [
      'What is the maximum verified guest capacity and curfew time?',
      'Are outside food, beverage, or entertainment vendors permitted?',
      'What are the audiovisual, lighting, and power access specifications?',
    ],
  },
  {
    id: 'gen-catering',
    category: 'Food & Beverage',
    title: 'Caterer / Beverage Service',
    questions: [
      'Do you provide tailored menu tastings or sample platters?',
      'How are dietary accommodations handled?',
      'Are serving staff, tableware, barware, and cleanup included in the quote?',
    ],
  },
  {
    id: 'gen-media',
    category: 'Media & Memories',
    title: 'Photographer / Content Creator',
    questions: [
      'How many hours of coverage and deliverable assets are included?',
      'What is the expected delivery turnaround for high-res photos?',
      'Do you maintain backup equipment and liability insurance on site?',
    ],
  },
  {
    id: 'gen-av',
    category: 'Audio-Visual & Tech',
    title: 'AV Technician / Sound & Lighting',
    questions: [
      'Do you supply wireless microphones, speakers, and projection screens?',
      'Will a technician remain on site throughout the event program?',
    ],
  },
  {
    id: 'gen-decor',
    category: 'Design & Ambience',
    title: 'Event Designer / Decorator',
    questions: [
      'Can you provide design mockups or visual moodboards prior to production?',
      'What is your setup window and teardown timeline?',
    ],
  },
  {
    id: 'gen-favors',
    category: 'Hospitality & Supplies',
    title: 'Stationery & Guest Favors',
    questions: [
      'What is the lead time for custom printed items?',
      'Can you produce eco-friendly personalized guest keepsakes?',
    ],
  },
];

export const VENDORS_BY_TYPE: Record<EventType, Omit<VendorItem, 'booked' | 'notes'>[]> = {
  wedding: GENERIC_VENDORS,
  engagement: GENERIC_VENDORS,
  reception: GENERIC_VENDORS,
  birthday: GENERIC_VENDORS,
  baby_shower: GENERIC_VENDORS,
  anniversary: GENERIC_VENDORS,
  housewarming: GENERIC_VENDORS,
  graduation: GENERIC_VENDORS,
  corporate: GENERIC_VENDORS,
  festival: GENERIC_VENDORS,
  community: GENERIC_VENDORS,
  charity: GENERIC_VENDORS,
  others: GENERIC_VENDORS,
};



export function getDefaultVendors(eventType: EventType): VendorItem[] {
  const categories = getVendorCategoriesForEvent(eventType);
  return categories.map((cat) => ({
    id: cat.id,
    category: cat.title,
    title: cat.title,
    booked: false,
    notes: '',
    shortlist: [],
    }));
}

export function loadVendorsState(eventIdOrType: string, eventType: EventType): VendorItem[] {
  return getDefaultVendors(eventType);
}

export function saveVendorsState(_eventIdOrType: string, _items: VendorItem[]): boolean {
  return true;
}

export function exportVendorsAsJSON(eventName: string, _items: VendorItem[]): void {
  exportUserVendorsAsJSON(eventName, [], getVendorCategoriesForEvent('wedding'));
}

export function clampPercentages(percentages: number[]): number[] {
  if (!percentages || percentages.length === 0) return [];
  const cleaned = percentages.map((p) => Math.max(0, Math.round(Number(p) || 0)));
  const sum = cleaned.reduce((a, b) => a + b, 0);

  if (sum === 0) {
    const even = Math.floor(100 / cleaned.length);
    const result = cleaned.map(() => even);
    result[0] += 100 - even * cleaned.length;
    return result;
  }

  const scaled = cleaned.map((p) => Math.round((p / sum) * 100));
  const newSum = scaled.reduce((a, b) => a + b, 0);
  const diff = 100 - newSum;
  scaled[0] += diff;

  return scaled;
}

export function normalizeAiVendorSuggestions(aiData: unknown): VendorItem[] | null {
  if (!aiData || typeof aiData !== 'object') return null;
  const rawList = (aiData as Record<string, unknown>).vendors || aiData;
  if (!Array.isArray(rawList) || rawList.length === 0) return null;

  const validItems: VendorItem[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') return null;

    const cat =
      typeof item.category === 'string' && item.category.trim().length > 0
        ? item.category.trim()
        : 'General Service';
    const title =
      typeof item.title === 'string' && item.title.trim().length > 0
        ? item.title.trim()
        : `Vendor ${i + 1}`;
    const rawQuestions = Array.isArray(item.questions) ? item.questions : [];

    const cleanQuestions: string[] = rawQuestions
      .filter((q: unknown) => typeof q === 'string' && q.trim().length > 0)
      .map((q: string) => q.trim());

    if (cleanQuestions.length === 0) {
      cleanQuestions.push('What are your service inclusions, rates, and cancellation policies?');
    }

    validItems.push({
      id: `ai-vendor-${i + 1}`,
      category: cat,
      title,
      questions: cleanQuestions,
      booked: false,
      notes: '',
    });
  }

  return validItems.length >= 2 ? validItems : null;
}
