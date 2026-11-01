/**
 * Vitest & React Testing Library Setup
 * Mocks localStorage, matchMedia, and server fetch endpoints.
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock fetch for server API endpoints
const originalFetch = globalThis.fetch;
globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, options?: RequestInit) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const bodyStr = typeof options?.body === 'string' ? options.body : '';

  if (urlStr.includes('/api/ideas')) {
    if (bodyStr.includes('Simulated Thrown Exception')) {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Simulated API Exception' }),
      } as Response;
    }

    if (bodyStr.includes('Simulated Malformed')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ broken: 'incomplete data' }),
      } as Response;
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        isMock: false,
        themes: [
          { title: 'Server Themed Elegance', description: 'Refined celebration concept' },
          { title: 'Modern Minimalist', description: 'Clean lines and ambient lighting' },
          { title: 'Festive Garden', description: 'Lush greenery and fairy lights' },
        ],
        decor: [
          { item: 'Welcome Easel', tip: 'Pair with localized seasonal florals' },
          { item: 'Overhead Canopies', tip: 'Warm-white micro LED string lights' },
          { item: 'Calligraphy Cards', tip: 'Handwritten place cards' },
          { item: 'Ceremony Backdrop', tip: 'Crescent arch with greenery' },
        ],
        menu: [
          { course: 'Appetizers', dish: 'Mini Artisanal Bruschetta', note: 'Butler style' },
          { course: 'Main Entrée', dish: 'Pan-Seared Herb Protein', note: 'Seasonal puree' },
          { course: 'Dessert', dish: 'Tiered Celebration Cake', note: 'Coffee station' },
        ],
        activities: [
          { title: 'Memory Guestbook', description: 'Vintage audio or polaroid station' },
          { title: 'Golden Hour Photos', description: 'Dedicated portrait window' },
          { title: 'Celebration Toast', description: 'Champagne or sparkling cider' },
        ],
        moneySavingTips: [
          'Repurpose ceremony flowers for dining reception',
          'Opt for seasonal local blooms over imported flowers',
          'Curate two signature cocktails rather than full open bar',
        ],
      }),
    } as Response;
  }

  if (urlStr.includes('/api/chat')) {
    if (bodyStr.toLowerCase().includes('catering') || bodyStr.toLowerCase().includes('save budget')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          reply: 'For catering and total budget, a family-style buffet will save 20% while keeping food warm and accessible.',
        }),
      } as Response;
    }

    if (bodyStr.toLowerCase().includes('photographer') || bodyStr.toLowerCase().includes('vendor')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          reply: 'When vetting each vendor, review their equipment backups, arrival schedule, and portfolio from past events.',
        }),
      } as Response;
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        reply: 'As your EventCraft assistant, I recommend focusing on guest comfort and clear day-of timeline flow.',
      }),
    } as Response;
  }

  return originalFetch ? originalFetch(url, options) : ({
    ok: true,
    status: 200,
    json: async () => ({}),
  } as Response);
});
