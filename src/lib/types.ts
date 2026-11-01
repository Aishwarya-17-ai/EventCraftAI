/**
 * EventCraft AI - Core Domain Types
 */

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'reception'
  | 'birthday'
  | 'baby_shower'
  | 'anniversary'
  | 'housewarming'
  | 'graduation'
  | 'corporate'
  | 'festival'
  | 'community'
  | 'charity'
  | 'others';

export type PlanStyle =
  | 'Full plan'
  | 'Compressed plan'
  | 'Rush plan'
  | 'Sprint plan'
  | 'Day-by-day emergency plan'
  | 'Event-day checklist';

export type TaskPriority = 'critical' | 'high' | 'normal';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface EventFormData {
  eventType: EventType;
  customEventType?: string; // required when eventType === 'others' (max 60 chars)
  name: string;
  date: string; // YYYY-MM-DD
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  city: string;
  theme: string;
  notes: string;
  daysLeft?: number;
  planStyle?: PlanStyle;
}

export interface ValidationErrors {
  eventType?: string;
  customEventType?: string;
  name?: string;
  date?: string;
  guestCount?: string;
  totalBudget?: string;
  city?: string;
  theme?: string;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  percent: number;
  amountCents: number;
  amountFormatted: string;
  costPerGuestCents: number;
  costPerGuestFormatted: string;
  description: string;
  color: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalCents: number;
  currency: CurrencyCode;
  guestCount: number;
  costPerGuestCents: number;
  costPerGuestFormatted: string;
  contingencyPercent: number;
  contingencyCents: number;
  contingencyFormatted: string;
  categories: BudgetCategory[];
}

export interface TimelineTask {
  id: string;
  title: string;
  priority: TaskPriority;
  minLeadDays: number;
  quickAlternative?: string;
  dueDate: string; // YYYY-MM-DD
  daysRemaining: number;
  isAtRisk: boolean;
  completed: boolean;
  category?: string;
}

export interface TimelineMilestone {
  id: string;
  title: string;
  timeframe: string;
  targetDate: string; // YYYY-MM-DD
  daysRemaining: number;
  isOverdue?: boolean;
  isToday?: boolean;
  isEventDay?: boolean;
  tasks: TimelineTask[];
}

export interface AdaptiveTimeline {
  daysLeft: number;
  planStyle: PlanStyle;
  eventDate: string;
  referenceDate: string;
  milestones: TimelineMilestone[];
  atRiskCount: number;
  totalTasks: number;
}

export interface UserVendor {
  id: string;
  categoryId: string;
  categoryTitle: string;
  categoryEmoji?: string;
  name: string; // max 80 chars
  phone?: string; // max 20 chars
  rating?: number; // 0 to 5, step 0.1
  reviewsCount?: number;
  quotedPrice?: number;
  notes?: string; // max 200 chars
  city?: string;
  isBooked?: boolean;
  isShortlisted?: boolean;
  isSample?: boolean; // true for demo vendors
  createdAt?: string;
  mapsUrl?: string;
}

export interface VendorCategoryConfig {
  id: string;
  title: string;
  emoji: string;
  mapsQuery: string;
  budgetCategoryId: string;
}

export interface ShortlistedVendor {
  id: string;
  name: string; // max 80 chars
  phone?: string; // optional
  quotedPrice: number; // positive number
  notes?: string; // max 200 chars
  booked?: boolean;
  createdAt?: string;
}

export interface VendorItem {
  id: string;
  category: string;
  title: string;
  booked: boolean;
  notes: string;
  questions?: string[];
  shortlist?: ShortlistedVendor[];
  suggestedBudget?: number;
  suggestedPercent?: number;
}

export interface PersonalizedIdeas {
  themes: { title: string; description: string }[];
  decor: { item: string; tip: string }[];
  menu: { course: string; dish: string; note: string }[];
  activities: { title: string; description: string }[];
  moneySavingTips: [string, string, string]; // exactly 3
  isMock: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface Collaborator {
  email: string;
  role: 'editor' | 'viewer';
  addedAt: string;
}

export interface EventDocument extends EventFormData {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  editors: string[]; // UIDs or emails
  viewers: string[]; // UIDs or emails
  vendorsState?: string; // serialized JSON
  ideasState?: string; // serialized JSON
  createdAt?: string;
  updatedAt?: string;
}

export interface EventActivity {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: string;
}

export interface EventTypeDefinition {
  type: EventType;
  label: string;
  icon: string;
  description: string;
  accent: string;
}

export const EVENT_TYPES: EventTypeDefinition[] = [
  { type: 'wedding', label: 'Wedding', icon: '💍', description: 'Ceremony, banquet & celebration', accent: '#9D174D' },
  { type: 'engagement', label: 'Engagement', icon: '💎', description: 'Ring exchange & celebration', accent: '#86198F' },
  { type: 'reception', label: 'Reception', icon: '🥂', description: 'Evening post-wedding party', accent: '#9D174D' },
  { type: 'birthday', label: 'Birthday', icon: '🎂', description: 'Milestone or festive party', accent: '#6D28D9' },
  { type: 'baby_shower', label: 'Baby Shower', icon: '🍼', description: 'Welcoming celebration & games', accent: '#BE185D' },
  { type: 'anniversary', label: 'Anniversary', icon: '💖', description: 'Marriage & milestone jubilee', accent: '#86198F' },
  { type: 'housewarming', label: 'Housewarming', icon: '🏡', description: 'New home blessing & mixer', accent: '#B45309' },
  { type: 'graduation', label: 'Graduation / Farewell', icon: '🎓', description: 'Academic honors & toast', accent: '#4338CA' },
  { type: 'corporate', label: 'Corporate / Conference', icon: '💼', description: 'Summit, meeting or gala', accent: '#1D4ED8' },
  { type: 'festival', label: 'Festival / Cultural', icon: '🪔', description: 'Cultural fair & festivities', accent: '#0F766E' },
  { type: 'community', label: 'Community', icon: '🎪', description: 'Neighborhood gathering', accent: '#0F766E' },
  { type: 'charity', label: 'Charity Fundraiser', icon: '🎗️', description: 'Donor gala & benefit auction', accent: '#047857' },
  { type: 'others', label: 'Others', icon: '✨', description: 'Custom tailored event', accent: '#334155' },
];

export function getEventAccent(eventType: EventType): string {
  const match = EVENT_TYPES.find((e) => e.type === eventType);
  return match ? match.accent : '#334155';
}

export function getEventLabel(eventType: EventType, customText?: string): string {
  if (eventType === 'others') {
    return (customText || '').trim() || 'Custom Event';
  }
  const match = EVENT_TYPES.find((e) => e.type === eventType);
  return match ? match.label : eventType;
}
