/**
 * EventCraft AI - Client-Side AI Proxy Module
 * Routes all Gemini AI requests to the server endpoints (/api/ideas, /api/chat, /api/vendor-suggestions).
 * Features client sliding-window rate limiting, in-memory caching,
 * and deterministic offline fallbacks adapted to daysLeft and plan styles.
 */

import { ChatMessage, EventFormData, PersonalizedIdeas, VendorItem } from './types';
import { getDefaultVendors, normalizeAiVendorSuggestions } from './vendors';

// Rate Limiter Config
const MAX_CALLS_PER_MINUTE = 10;
const WINDOW_MS = 60 * 1000;
let callTimestamps: number[] = [];

// In-Memory Cache for /ideas
const ideasCache = new Map<string, PersonalizedIdeas>();

/**
 * Resets the rate limiter (primarily for unit tests).
 */
export function resetRateLimiter(): void {
  callTimestamps = [];
}

/**
 * Clears the in-memory ideas cache (primarily for unit tests).
 */
export function clearIdeasCache(): void {
  ideasCache.clear();
}

/**
 * Checks if a call is allowed under the sliding-window rate limit.
 */
export function checkRateLimit(): { allowed: boolean; message?: string } {
  const now = Date.now();
  callTimestamps = callTimestamps.filter((ts) => now - ts < WINDOW_MS);

  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) {
    return {
      allowed: false,
      message: 'Rate limit reached: Maximum 10 AI requests per minute. Please wait a moment before trying again.',
    };
  }

  callTimestamps.push(now);
  return { allowed: true };
}

/**
 * Generates a normalized cache key from event inputs including daysLeft and planStyle.
 */
export function generateInputHash(data: EventFormData): string {
  const normalized = [
    data.eventType,
    (data.customEventType || '').trim().toLowerCase(),
    (data.name || '').trim().toLowerCase(),
    data.date,
    data.guestCount,
    data.totalBudget,
    data.currency,
    (data.city || '').trim().toLowerCase(),
    (data.theme || '').trim().toLowerCase(),
    (data.notes || '').trim().toLowerCase(),
    data.daysLeft ?? '',
    data.planStyle ?? '',
  ].join('::');

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `ideas_${Math.abs(hash)}`;
}

/**
 * Validates that the response conforms to PersonalizedIdeas.
 */
export function validateIdeasResponse(data: unknown): data is Omit<PersonalizedIdeas, 'isMock'> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.themes) || d.themes.length === 0) return false;
  for (const t of d.themes) {
    if (!t || typeof t.title !== 'string' || typeof t.description !== 'string') return false;
  }

  if (!Array.isArray(d.decor) || d.decor.length === 0) return false;
  for (const dec of d.decor) {
    if (!dec || typeof dec.item !== 'string' || typeof dec.tip !== 'string') return false;
  }

  if (!Array.isArray(d.menu) || d.menu.length === 0) return false;
  for (const m of d.menu) {
    if (!m || typeof m.course !== 'string' || typeof m.dish !== 'string') return false;
  }

  if (!Array.isArray(d.activities) || d.activities.length === 0) return false;
  for (const act of d.activities) {
    if (!act || typeof act.title !== 'string' || typeof act.description !== 'string') return false;
  }

  if (!Array.isArray(d.moneySavingTips) || d.moneySavingTips.length !== 3) return false;
  for (const tip of d.moneySavingTips) {
    if (typeof tip !== 'string' || tip.trim().length === 0) return false;
  }

  return true;
}

/**
 * Deterministic fallback ideas generator for offline situations or failures.
 * Adapts tone and recommendations to the event category and days left.
 */
export function getDeterministicFallbackIdeas(data: EventFormData): PersonalizedIdeas {
  const themeLabel = data.theme ? `"${data.theme}"` : 'Celebration Elegance';
  const cityLabel = data.city || 'your area';
  const eventLabel =
    data.eventType === 'others' && data.customEventType
      ? data.customEventType
      : data.eventType;
  const isShortTime = typeof data.daysLeft === 'number' && data.daysLeft <= 14;

  const quickNoticePrefix = isShortTime ? 'Fast-turnaround: ' : '';

  if (['wedding', 'engagement', 'reception', 'anniversary'].includes(data.eventType)) {
    return {
      isMock: true,
      themes: [
        {
          title: `Ethereal ${themeLabel} Romance`,
          description: `Soft pastel blooms, warm candlelight, fairy light canopies, and acoustic instrumental music curated for ${cityLabel}.${isShortTime ? ' Uses turnkey floral styling and off-the-shelf lighting.' : ''}`,
        },
        {
          title: 'Modern Minimalist Elegance',
          description: 'Architectural floral arrangements, crisp neutral linens, monochrome typography signage, and sleek brass ambient accents.',
        },
        {
          title: 'Botanical Garden Celebration',
          description: 'Abundant lush greenery, organic wooden tables, hanging terrariums, and botanical signature mocktails/cocktails.',
        },
      ],
      decor: [
        { item: 'Statement Welcome Sign', tip: `${quickNoticePrefix}Pair clear acrylic or wood easel sign with seasonal greenery and floor candle lanterns.` },
        { item: 'Overhead Fairy Canopy', tip: 'Warm-white micro LED string lights suspended above dining tables create an intimate romantic glow.' },
        { item: 'Custom Table Escort Cards', tip: 'Personalized calligraphy wax-sealed cards that double as memorable guest keepsakes.' },
        { item: 'Ceremony Floral Arch', tip: `${quickNoticePrefix}Design a crescent or circular arch with locally sourced seasonal blooms and olive branches.` },
      ],
      menu: [
        { course: 'Hors d’Oeuvres', dish: 'Mini Brie Crostini & Artisanal Bruschetta', note: 'Served butler-style during the cocktail hour.' },
        { course: 'Main Entrée', dish: 'Herb-Crusted Filet or Pan-Seared Sea Bass', note: 'Served alongside garlic potato puree and roasted seasonal vegetables.' },
        { course: 'Dessert Station', dish: 'Tiered Berry Chiffon Cake & Petit Fours', note: 'Paired with an artisanal espresso and herbal tea bar.' },
      ],
      activities: [
        { title: 'Interactive Audio Guestbook', description: 'Vintage rotary telephone where guests record heartfelt voice messages.' },
        { title: 'Golden Hour Sunset Photo Shoot', description: 'Schedule 15 uninterrupted minutes during magic hour for unforgettable portraits.' },
        { title: 'Sparkler / Ribbon Send-Off', description: 'Distribute safe handheld sparklers or satin ribbons for an unforgettable grand exit.' },
      ],
      moneySavingTips: [
        'Repurpose ceremony flowers: move bridesmaid bouquets and altar arrangements to the bridal table and dessert display.',
        'Choose seasonal, locally grown blooms instead of imported exotics to slash floral quotes by 30-40%.',
        'Offer a signature his/hers cocktail and curated wines rather than an expensive open top-shelf liquor bar.',
      ],
    };
  }

  if (['birthday', 'baby_shower', 'housewarming', 'graduation'].includes(data.eventType)) {
    return {
      isMock: true,
      themes: [
        {
          title: `Vibrant ${themeLabel} Festive Mixer`,
          description: `Bold color accents, custom festive backdrop, immersive photo props, and upbeat music in ${cityLabel}.${isShortTime ? ' Turnkey party kit for rapid same-week setup.' : ''}`,
        },
        {
          title: 'Retro Nostalgia & Lounge',
          description: 'Vintage accents, throwback soundtrack, relaxed lounge seating, and nostalgic comfort snack bar.',
        },
        {
          title: 'Starlit Evening Garden Gathering',
          description: 'Dim moody lighting, cozy seating pods, artisanal finger food boards, and an acoustic playlist.',
        },
      ],
      decor: [
        { item: 'Organic Balloon Arch', tip: `${quickNoticePrefix}Blend matte, chrome, and pastel balloons in organic cascading clusters for photos.` },
        { item: 'Custom Neon / Marquee Sign', tip: 'A reusable LED neon piece that anchors the main dessert table and party backdrop.' },
        { item: 'Themed Photo Corner', tip: 'Instant polaroid camera station with metallic markers and a guestbook memory album.' },
        { item: 'Festive Centerpieces', tip: 'Low-profile succulent bowls or mini disco ball clusters that keep conversation lively.' },
      ],
      menu: [
        { course: 'Starters', dish: 'Sliders, Loaded Crispy Bites & Charcuterie Skewers', note: 'Easy to eat while socializing.' },
        { course: 'Live Station', dish: 'Custom Gourmet Food Station / Buffet', note: 'Cooked fresh on demand with versatile dietary toppings.' },
        { course: 'Celebration Centerpiece', dish: 'Custom Themed Celebration Cake & Sweets', note: 'The grand finale for candles and celebration toasts.' },
      ],
      activities: [
        { title: 'Instant Film Photo Guestbook', description: 'Guests snap candid polaroids, glue them into a memory book, and leave messages.' },
        { title: 'Celebrity Trivia or Milestone Games', description: 'A lighthearted 10-question trivia game about the guest of honor with fun prizes.' },
        { title: 'Playlist DJ Takeover Hour', description: 'Let close friends queue up their favorite upbeat celebration anthems.' },
      ],
      moneySavingTips: [
        'Build your own balloon garland using DIY kits rather than paying high vendor delivery & teardown fees.',
        'Opt for a dessert table with cupcakes, brownies, and a smaller cutting cake to save 50% compared to a giant fondant cake.',
        'Host during non-peak hours (e.g. 2 PM to 5 PM) to serve lighter finger foods and appetizers instead of a full dinner.',
      ],
    };
  }

  // Corporate, Festival, Community, Charity, Others
  return {
    isMock: true,
    themes: [
      {
        title: `Dynamic ${themeLabel} for ${eventLabel}`,
        description: `Professional, engaging gathering in ${cityLabel} highlighting community impact, keynote moments, and welcoming hospitality.${isShortTime ? ' Focuses on turnkey equipment rentals and digital collateral.' : ''}`,
      },
      {
        title: 'Modern Sustainable Showcase',
        description: 'Zero-waste initiatives, local artisan partnerships, eco-friendly materials, and farm-to-table food vendor showcases.',
      },
      {
        title: 'Cultural Heritage & Community Gala',
        description: 'Live cultural performances, interactive showcase zones, and storytelling corners for attendees.',
      },
    ],
    decor: [
      { item: 'All-Weather Directional Signage', tip: `${quickNoticePrefix}Sturdy weather-resistant A-frames and color-coded zone flags for easy wayfinding.` },
      { item: 'Community / Brand Wall', tip: 'Collaborative chalkboard or banner canvas where attendees leave messages and photos.' },
      { item: 'Festive Bunting & Canopies', tip: 'Clean fabric pennants and shaded gazebos for attendee comfort.' },
      { item: 'Warm Pathway Illumination', tip: 'Solar or LED ground lanterns along walking paths for smooth evening transitions.' },
    ],
    menu: [
      { course: 'Street Fare / Buffet', dish: 'Curated Food Stations & Grazing Tables', note: 'Varied cuisines catering to vegetarian, halal, vegan, and gluten-free diets.' },
      { course: 'Hydration Station', dish: 'Free Infused Water & Artisan Lemonade Bar', note: 'Promotes hydration and reduces single-use plastic waste.' },
      { course: 'Sweet Treats', dish: 'Local Bakery Pretzels, Churros & Mini Pastries', note: 'Grab-and-go treats perfect for mingling between sessions.' },
    ],
    activities: [
      { title: 'Featured Showcase & Presentation Hour', description: 'Staggered 20-minute presentations or performances highlighting key achievements.' },
      { title: 'Interactive Collaborative Mural', description: 'Large canvas partitioned by numbers where attendees paint or sign together.' },
      { title: 'Engaging Discovery Scavenger Hunt', description: 'Hands-on discovery stations, digital quiz, and commemorative event prizes.' },
    ],
    moneySavingTips: [
      'Partner with local businesses for in-kind sponsorships (e.g. printing signage or supplying bottled water in exchange for logo placement).',
      'Enlist civic or student volunteers for setup and teardown to save substantially on commercial labor costs.',
      'Borrow staging, sound gear, and tables from local community centers, schools, or civic organizations.',
    ],
  };
}

/**
 * Returns deterministic chat replies for offline situations.
 */
export function getDeterministicPlannerChatReply(
  userQuery: string,
  eventContext: EventFormData
): string {
  const queryLower = (userQuery || '').toLowerCase();
  const eventName = eventContext?.name || 'your event';
  const guests = eventContext?.guestCount || 100;
  const budget = eventContext?.totalBudget || 50000;
  const currency = eventContext?.currency || 'USD';
  const days = typeof eventContext?.daysLeft === 'number' ? `${eventContext.daysLeft} days` : 'your timeline';
  const style = eventContext?.planStyle || 'Adaptive plan';

  if (queryLower.includes('budget') || queryLower.includes('cost') || queryLower.includes('save') || queryLower.includes('money')) {
    return `For ${eventName} with a budget of ${currency} ${budget.toLocaleString()} and ${guests} guests, catering and venue will be your largest investments. To stay comfortably within budget: 1) Allocate your 8% contingency buffer strictly for unexpected surges; 2) Inquire if your caterer allows BYO alcohol or a corkage flat rate; 3) Prioritize statement focal pieces for decor rather than spreading small items across every surface.`;
  }

  if (queryLower.includes('timeline') || queryLower.includes('when') || queryLower.includes('schedule') || queryLower.includes('day')) {
    return `With ${days} remaining (${style}) for ${eventName} on ${eventContext?.date || 'your date'}, focus strictly on your critical-path milestones first: secure the venue and primary catering. Use our "At risk" flags on the timeline tab to see express alternatives if vendors require longer lead times than your countdown allows!`;
  }

  if (queryLower.includes('food') || queryLower.includes('cater') || queryLower.includes('menu') || queryLower.includes('drink')) {
    return `For ${guests} attendees, a curated buffet or family-style service keeps food warm and accessible while cutting staffing costs by 20% compared to formal multi-course plated dining. Don't forget to include vegetarian, vegan, and allergy-friendly stations clearly labeled for guest peace of mind!`;
  }

  if (queryLower.includes('vendor') || queryLower.includes('photographer') || queryLower.includes('music') || queryLower.includes('dj')) {
    return `When interviewing vendors for ${eventName}, always ask: 1) Have they worked at your chosen venue in ${eventContext?.city || 'your area'} before? 2) What is their backup plan if primary equipment fails or a lead falls ill? 3) Do they provide their own insurance and dedicated power supplies? Check our Vendors tab for more tailored interview questions!`;
  }

  return `As your EventCraft assistant planning "${eventName}" (${eventContext?.eventType || 'event'} with ${days} left in ${eventContext?.city || 'your city'}): I recommend prioritizing critical contracts (venue and food) before personalizing decor. Feel free to ask about budget reallocation, vendor negotiation tips, or day-of run-down ideas!`;
}

/**
 * Generates personalized event ideas via server endpoint (/api/ideas),
 * with in-memory caching, client-side rate limiting, and robust mock fallbacks.
 */
export async function generateEventIdeas(
  eventData: EventFormData,
  abortSignal?: AbortSignal
): Promise<PersonalizedIdeas> {
  const cacheKey = generateInputHash(eventData);
  if (ideasCache.has(cacheKey)) {
    return ideasCache.get(cacheKey)!;
  }

  const rateLimitStatus = checkRateLimit();
  if (!rateLimitStatus.allowed) {
    console.debug('Rate limit reached; using fallback suggestions.');
    const mock = getDeterministicFallbackIdeas(eventData);
    ideasCache.set(cacheKey, mock);
    return mock;
  }

  try {
    const response = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventData }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (validateIdeasResponse(data)) {
      const result: PersonalizedIdeas = {
        ...data,
        isMock: !!(data as Record<string, unknown>).isMock,
      };
      ideasCache.set(cacheKey, result);
      return result;
    } else {
      const fallback = getDeterministicFallbackIdeas(eventData);
      ideasCache.set(cacheKey, fallback);
      return fallback;
    }
  } catch (err) {
    console.debug('Server /api/ideas request error; serving fallback:', err);
    const fallback = getDeterministicFallbackIdeas(eventData);
    ideasCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Asks the server for AI vendor suggestions for custom "others" events.
 * Safely validates and normalizes output, falling back to the generic vendor list if offline or malformed.
 */
export async function fetchCustomVendorSuggestions(
  customDescription: string,
  eventData: EventFormData,
  abortSignal?: AbortSignal
): Promise<VendorItem[]> {
  const fallback = getDefaultVendors('others');
  if (!customDescription || customDescription.trim().length === 0) {
    return fallback;
  }

  try {
    const response = await fetch('/api/vendor-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customDescription, eventData }),
      signal: abortSignal,
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const normalized = normalizeAiVendorSuggestions(data);
    return normalized && normalized.length > 0 ? normalized : fallback;
  } catch (err) {
    console.debug('Error fetching custom vendor suggestions; using fallback:', err);
    return fallback;
  }
}

/**
 * Sends a chat message to the server chat endpoint (/api/chat),
 * maintaining a sliding context window and fallback behavior.
 */
export async function sendPlannerChat(
  messages: ChatMessage[],
  eventContext: EventFormData,
  abortSignal?: AbortSignal
): Promise<string> {
  const rateLimitStatus = checkRateLimit();
  if (!rateLimitStatus.allowed) {
    return 'I am currently processing requests too quickly. Please wait a moment before sending another message.';
  }

  const lastUserMessage = messages[messages.length - 1]?.content || '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, eventContext }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data?.reply || getDeterministicPlannerChatReply(lastUserMessage, eventContext);
  } catch (err) {
    console.debug('Server /api/chat error; serving fallback reply:', err);
    return getDeterministicPlannerChatReply(lastUserMessage, eventContext);
  }
}
