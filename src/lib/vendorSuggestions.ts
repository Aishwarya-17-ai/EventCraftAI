/**
 * EventCraft AI - Vendor Suggestions Catalog
 * Deprecated: In accordance with anti-fabrication guidelines,
 * all invented businesses, fake ratings, and mock badges have been removed.
 * VendorsTab now uses deterministic category vetting guidelines, Google Maps links,
 * and user-managed shortlists.
 */

import { EventType } from './types';

export interface VendorSuggestion {
  id: string;
  companyName: string;
  category: string;
  workInShort: string;
  priceTier: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  reviewCount: number;
  cityCoverage: string;
  contactEmail: string;
  contactPhone: string;
  badge?: string;
}

export const getVendorSuggestionsForEvent = (
  _eventType: EventType,
  _city?: string
): VendorSuggestion[] => {
  // Empty catalog to ensure no fabricated businesses or fake reviews are ever returned
  return [];
};
