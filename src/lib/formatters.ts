/**
 * EventCraft AI - Formatting Utilities
 */

import { CurrencyCode } from './types';

const CURRENCY_LOCALES: Record<CurrencyCode, { locale: string; currency: string }> = {
  INR: { locale: 'en-IN', currency: 'INR' },
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
  GBP: { locale: 'en-GB', currency: 'GBP' },
};

/**
 * Formats an amount in integer cents into a localized currency string.
 * Uses Intl.NumberFormat for precision and correct currency symbols.
 */
export function formatCurrencyFromCents(cents: number, currency: CurrencyCode): string {
  const config = CURRENCY_LOCALES[currency] || CURRENCY_LOCALES.INR;
  const amount = cents / 100;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an amount into a localized currency string.
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const config = CURRENCY_LOCALES[currency] || CURRENCY_LOCALES.INR;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Returns currency symbol for display.
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '₹';
  }
}

/**
 * Formats a YYYY-MM-DD date string into a friendly, human-readable date.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}
