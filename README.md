# EventCraft AI

> **GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![PWA: Installable](https://img.shields.io/badge/PWA-Ready-success.svg)](https://web.dev/progressive-web-apps/)
[![Tests: 79 Passing](https://img.shields.io/badge/Tests-79%20Passing-brightgreen.svg)](https://vitest.dev/)

---

## Architecture & Multi-Page User Journey

EventCraft AI is architected into 3 dedicated, focused screens:

1. **Page 1: Login Page**
   - Simple, centered mobile-style screen (no header, no footer) on `--bg` (`#F4F7FC`) background, centered card (`max-width: 420px`).
   - Centered EventCraft AI logo mark (inline SVG sparkle in rounded blue square) and "EventCraft AI" with "AI" in `--primary`.
   - Single clean form with `signin` default or `signup` mode:
     - Email field with inside-field left mail icon (absolute positioning, 44px left padding) and visible label.
     - Password field with inside-field left lock icon, right show/hide eye toggle with `aria-pressed`, and short hint in signup mode ("At least 8 characters.").
     - Full-width primary button (48px tall): "Sign in" in signin mode, "Create account" in signup mode.
     - Visual divider with the word **"or"**.
     - Full-width **"Continue with Google"** button (white, bordered, 48px tall, 20x20 inline SVG Google G logo).
     - Centered mode switch text link ("Don't have an account? Sign up" / "Already have an account? Sign in").
     - Accessible "Forgot password?" link (signin mode only).
     - Nothing renders below the card.

2. **Page 2: "Plan Your Event" Page**
   - Dedicated configuration screen featuring the interactive 13-event-category grid (Wedding, Birthday, Corporate, Community, etc.).
   - Conditional custom event input for "Others" with 60-character validation.
   - Core details: Event Name, Date (min today), Guests, Budget with currency selector, Destination City, Theme & Notes.
   - Single clear primary action: **✨ Generate Event Plan**.

### Smart intake
The "Describe your event" intake allows users to speak or type an event summary in English (`en-IN`) or Tamil (`ta-IN`). Gemini extracts structured fields into typed JSON, deterministic client code validates every field against form bounds, and the user conducts a human review with an "AI-filled" preview and "Needs your input" checklist before anything is applied. Voice browser support: Chrome/Edge/Android Chrome yes, Safari partial, Firefox no.

3. **Page 3: Generated Plan Dashboard**
   - Comprehensive multi-tab planner:
     - **Budget**: 100% exact allocations, catering guest-scaling, visual donut chart & accessible table.
     - **Timeline**: Deterministic adaptive scheduling from Today to Event Day with sprint/rush modes, at-risk flags, and quick alternatives.
     - **Vendors**: Modern job-board vendor directory with zero fabricated company names or fake ratings:
       - **Top Blue Box**: Solid `--primary` rounded card with white text, title "Vendors", white styled buttons `+ Add a vendor` and `Export JSON`, and 3 semi-transparent stat tiles ("Vendors added", "Booked: X of N" with progress bar, "Quotes vs budget").
       - **Toolbar Row**: Filter pills (All, Shortlisted, Booked, Rating 4+), styled Sort dropdown ("Highest rated", "Name A-Z"), and accessible "Show demo vendors" toggle switch (`role="switch"`).
       - **Category Blocks**: One white card per category (20px gap) containing 48px emoji tile, category title, suggested budget line, action buttons ("Find nearby on Google Maps" opening in new tab, GPS "Near my location", "AI tips" panel, and `+ Add vendor`), divider, and vendor cards or empty state.
       - **Vendor Cards**: Horizontal desktop / stacked mobile card with 56px emoji tile, middle info & status chips ("Added by you" / "Shortlisted" / "Booked"), sanitized `tel:` link, right navy panel (`--navy`) with star ratings and "Budget fit" ring (text + icon), and bottom action row (Call, Open in Maps, Shortlist toggle, Booked toggle, Edit, Remove).
       - **Add / Edit Modal**: Desktop modal and mobile bottom sheet with focus trap, Escape to close, required Category select, and validated fields.
     - **Ideas**: AI-tailored themes, decor, menus, activities, and 3 money-saving tips.
     - **Chat**: Interactive AI event assistant with full context of event date, budget, and plan style.
   - Top Header with clean logo mark and wordmark on one line, styled action buttons (Edit details, New event, Print, Sign out), and currency selector.

---

## Problem Statement Alignment

| Requirement | Implementation & Feature Mapping |
| :--- | :--- |
| **1. Dedicated Pages Flow** | Structured into 3 sequential pages: Page 1 (Centered mobile-style Login with 48px Google Sign-In, accessible inside-icon inputs, mode toggle, and no bottom clutter), Page 2 ("Plan Your Event" form & options), and Page 3 (Generated Plan Dashboard). |
| **2. Event Form & 13 Types** | Responsive grid of 13 selectable cards (real `<input type="radio">` with icon + label, keyboard accessible, >=44px touch targets). "Others" reveals a required "Describe your event" input (max 60 chars, trimmed, validated, rendered strictly as text). |
| **3. Budget Planner** | Pure function `calculateBudget` with dedicated percentage tables for all 13 event types summing to exactly 100%. Shifts up to 5 points toward catering as guests grow from 50 to 200. Maintains 5–10% contingency buffer. Integer-cents allocation ensures exact mathematical sum to the total budget with zero penny rounding discrepancies. |
| **4. Adaptive Timeline Engine** | Pure function `generateAdaptiveTimeline` computing `daysLeft` from today to event date (never scheduling before today). Selects from 6 dynamic plan styles: Full plan (180+ days), Compressed plan (60–179 days), Rush plan (15–59 days), Sprint plan (4–14 days), Day-by-day emergency plan (1–3 days), and Event-day checklist (0 days). Critical tasks scheduled first. Shows "At risk" badge and `quickAlternative` when `minLeadDays > daysLeft`. |
| **5. Authentic Vendor Directory & Job-Listing Layout** | Completely replaced vendor architecture: ZERO paid Google Places API calls, keys, or CSP entries. Top blue box with 3 stat tiles and white buttons (+ Add a vendor, Export JSON), filter pills and sort, category cards without deprecated lists, real Google Maps search (`?api=1&query=...`), GPS "Near my location" search with graceful denial fallback, AI tips with regex guardrails (rejecting 7+ digits and URLs), Add/Edit vendor modal with Category select and sanitized `tel:` links, horizontal cards with 56px emoji tiles and Navy ratings/budget-fit panels, and demo data switch ("Sample - not a real business"). |
| **6. Personalized Ideas & Chat** | Structured JSON call to Gemini returning themes, decor, menus, activities, and money-saving tips, tailored with `daysLeft` and `planStyle`. Chat assistant panel with sliding 6-message window, contextual event awareness, and accessible live regions. |
| **7. Multi-User Collaboration** | Cloud Firestore live synchronization (`onSnapshot`) with role-based access control (Owner, Editor, Viewer), shareable links, and real-time activity notes. |
| **8. Theme & Accessibility** | Modern light-only dashboard theme with tokens: `--bg: #F4F7FC;`, `--surface: #FFFFFF;`, `--border: #E3E8F2;`, `--text: #0F172A;`, `--muted: #475569;`, `--primary: #1D4ED8;`, `--navy: #0B1B4D;`. Fully WCAG 2.1 AA compliant contrast. |

---

## Setup in 3 Commands

```bash
# 1. Clone repository and navigate into project directory
git clone https://github.com/example/eventcraft-ai.git && cd eventcraft-ai

# 2. Install dependencies
npm install

# 3. Start local development server on port 3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | Gemini API key injected by AI Studio or server environment. If omitted, the app runs in **MOCK MODE** with realistic deterministic suggestions. |
| `VITE_GEMINI_API_KEY` | Optional | Client-side fallback variable for Gemini API key during local development. |
| `APP_URL` | Optional | Hosting URL for self-referential links, PWA start URLs, and OAuth redirects. |

---

## Running the Test Suite

EventCraft AI ships with **79 automated tests** covering pure functions, security injection defenses, rate limiting, and WCAG accessibility:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Test coverage encompasses:
- **Adaptive Timeline**: Deterministic scheduling for `daysLeft` 0, 1, 3, 7, 20, 60, and 200 days; guarantees zero past dates; prioritizes critical vendors first; triggers "At risk" badge and quick alternatives when `minLeadDays > daysLeft`; accurately handles leap-year dates (e.g. Feb 29, 2028).
- **Budget**: Exact 100% percentage sums across all 13 event types, integer-cents conservation with zero penny rounding discrepancies, 5–10% contingency limits, tiny budget handling, huge budget handling, guest catering shift.
- **Validation**: Enforces `customEventType` presence for "Others", rejects empty/whitespace and >60 characters, accepts <=60 characters, validates all 13 event types, rejects negative/zero budget, exceeding 1,000,000,000, guests `< 1` or `> 10,000`, and past dates.
- **AI & Vendors**: AI vendor normalization, percentage clamping and scaling to 100%, fallback to generic vendor checklists on malformed response, prompt-injection defense, in-memory caching, sliding-window rate limit blocking the 11th call.
- **UI Components & XSS**: Form accessibility with `aria-describedby`, keyboard arrow navigation on tabs, table `caption` and `th scope`, 13 event radio cards with >=44px touch targets, LoginPage presentation (centered 420px card, 48px Google button with 20x20 inline SVG, visible labelled inputs, show/hide password toggle exposing `aria-pressed`, exactly one guest button, no duplicate guest buttons), Vendor category cards rendering across all 13 event types (including Others), zero invented company names or ratings, Google Maps link URL encoding, shortlist add/remove with within-budget/over-budget text labels and icons, and strict XSS defense (verifying `<script>` in user quotes and chat renders strictly as safe text).

---

## Adaptive Timeline Engine

The Adaptive Timeline is a deterministic, pure-function scheduling engine (`generateAdaptiveTimeline`) that builds a realistic forward plan starting from **TODAY** and ending on the **EVENT DATE**. It never schedules any milestone or task in the past.

### Dynamic Plan Styles (Based on `daysLeft`)

| `daysLeft` Range | Plan Style Name | Scheduling Cadence & Milestones |
| :--- | :--- | :--- |
| **180+ days** | **Full plan** | Traditional long-horizon schedule: 6 Months, 3 Months, 1 Month, 1 Week, 1 Day, Event Day. |
| **60–179 days** | **Compressed plan** | Structured forward milestones with weekly checkpoints and vendor locks. |
| **15–59 days** | **Rush plan** | Accelerated 4-stage milestones with weekly task bursts. |
| **4–14 days** | **Sprint plan** | Rapid execution with checkpoints every 2 days focusing on essentials. |
| **1–3 days** | **Day-by-day emergency plan** | Immediate daily checklist for last-minute preparations. |
| **0 days** | **Event-day checklist only** | Single execution milestone dedicated to day-of coordination, setup, and wrap-up. |

### Task Attributes & At-Risk Fallbacks

Every task in the catalog defines:
- `title`: Actionable milestone objective.
- `priority`: `'critical'` (venues, caterers, core licenses), `'high'` (media, entertainment, decor), or `'normal'`.
- `minLeadDays`: Minimum lead time required under normal vendor market conditions.
- `quickAlternative`: Practical accelerated fallback if booked on short notice.

**At-Risk Detection Rule**: If `minLeadDays > daysLeft`, the task is marked `isAtRisk: true`. The UI renders an **"At risk"** badge (with warning icon + readable text, adhering to WCAG 2.1 AA non-color-alone rule) and prominently presents the `quickAlternative` guidance. Critical tasks are always scheduled first.

---

## 13 Event Types & "Others" Workflow

EventCraft AI supports 13 dedicated event types arranged in a responsive grid of selectable cards with real radio inputs and `>=44px` touch targets:

1. **Wedding**: Grand romance, ceremony, reception, floral arches, multi-tier confections.
2. **Engagement**: Cocktail lounges, portrait photography, intimate champagne toasts.
3. **Reception**: Evening banquet halls, high-energy DJs, lighting design, live stations.
4. **Birthday**: Balloon stylists, themed custom cakes, kids or adult party entertainment.
5. **Baby Shower**: Afternoon tea, pastel florals, baby marquee letters, parlor games.
6. **Anniversary**: Private dining rooms, multi-generational portraits, commemorative albums.
7. **Housewarming**: Gourmet drop-off catering, glassware rentals, post-event deep cleaning.
8. **Graduation / Farewell**: Smokehouse buffets, digital photobooths, celebratory DJ sets.
9. **Corporate / Conference**: Keynote auditoriums, dual-switch AV streaming, executive lunches, QR badges.
10. **Festival / Cultural**: Municipal street permits, outdoor stages, paramedic fleets, sanitation.
11. **Community**: Public parks, sound coverage, concessions, insurance and city permits.
12. **Charity Fundraiser**: Gala ballrooms, benefit auctioneers, spotlight AV, live donation thermometers.
13. **Others**: User-defined custom events.

### "Others" Custom Event Workflow
- Selecting "Others" reveals a required input: **"Describe your event"** (max 60 characters, trimmed, validated).
- Generates generic budget tables and generic vendor checklists by default.
- When AI is available, calls Gemini via server proxy with a structured JSON schema (`/api/vendor-suggestions`) to produce custom vendor categories and questions tailored to the description.
- Returns percentages normalized and clamped via `clampPercentages` to sum to exactly 100%.
- Falls back gracefully to generic vendor lists if offline or if the response is malformed.
- Untrusted custom event text is escaped and delimited within `<user_event_data>` blocks in all Gemini prompts.

---

## Rose & Sage Design System & WCAG 2.1 AA Contrast Ratios

The app is styled with the **"Rose & Sage"** color system, engineered for high aesthetic warmth and strict WCAG 2.1 AA compliance:

### Contrast Ratio Verification (Light Mode)

| Token / Element | Foreground Hex | Background Hex | Contrast Ratio | WCAG 2.1 AA Status (>=4.5:1) |
| :--- | :--- | :--- | :--- | :--- |
| **Body Text on Surface** | `#3B1F2B` (Deep Plum) | `#FFFFFF` (White) | **13.9:1** | **PASS** (Exceeds 4.5:1) |
| **Primary Button / Link** | `#FFFFFF` (White) | `#9D174D` (Rose Primary) | **7.4:1** | **PASS** (Exceeds 4.5:1) |
| **Sage Accent Text** | `#3F6B5A` (Forest Sage) | `#FFFFFF` (White) | **5.5:1** | **PASS** (Exceeds 4.5:1) |
| **Success Badge Text** | `#166534` (Deep Green) | `#DCFCE7` (Light Green) | **6.8:1** | **PASS** (Exceeds 4.5:1) |
| **Danger / At-Risk Text** | `#B91C1C` (Deep Red) | `#FEE2E2` (Light Red) | **6.1:1** | **PASS** (Exceeds 4.5:1) |
| **Surface on Background** | `#FFFFFF` | `#FDF6F4` (Alabaster Rose) | **1.1:1** | *Structural surface card* |

### Contrast Ratio Verification (Dark Mode)

| Token / Element | Foreground Hex | Background Hex | Contrast Ratio | WCAG 2.1 AA Status (>=4.5:1) |
| :--- | :--- | :--- | :--- | :--- |
| **Body Text on Surface** | `#FBEFF2` (Pale Rose) | `#26191F` (Dark Plum) | **14.1:1** | **PASS** (Exceeds 4.5:1) |
| **Primary Button** | `#1B1216` (Deep Black) | `#F9A8D4` (Light Pink) | **11.5:1** | **PASS** (Exceeds 4.5:1) |
| **Sage Accent Text** | `#86C5A9` (Mint Sage) | `#26191F` (Dark Plum) | **8.2:1** | **PASS** (Exceeds 4.5:1) |
| **Danger / At-Risk Text** | `#F87171` (Light Red) | `#7F1D1D` (Dark Red) | **4.9:1** | **PASS** (Exceeds 4.5:1) |
| **Border Tone** | `#4A3039` | `#26191F` | Non-text UI border | **PASS** |

### Per-Event Accent Colors
- **Wedding**: `#9D174D` (Rose)
- **Engagement & Anniversary**: `#86198F` (Plum Fuchsia)
- **Birthday**: `#6D28D9` (Violet)
- **Corporate**: `#1D4ED8` (Royal Blue)
- **Community & Festival**: `#0F766E` (Deep Teal)
- **Others / Generic**: `#334155` (Slate Navy)

### Mobile & Responsive Layout Enhancements
- **Natural Page Scroll**: Eliminated inner fixed-height sidebar scrolling (`max-height: calc(100vh - 180px); overflow-y: auto`) in favor of seamless whole-page native scrolling.
- **Collapsible Mobile Form**: On mobile viewports, the event form automatically collapses into a compact card upon plan generation, with an accessible **"Edit details"** toggle button.
- **Hero Summary Card**: Renders at the top of the plan with the event name, date, interactive **"days left"** chip, guest count, city, and **"plan style"** badge.

---

## Accessibility Measures (WCAG 2.1 AA)

- **Semantic HTML**: Built using `<header>`, `<main>`, `<nav>`, `<section>`, `<form>`, `<fieldset>`, `<legend>`, `<caption>`, and `<table scope="...">`.
- **Skip Link**: Top-level `<a href="#main-content" className="skip-link">` allows screen-reader and keyboard users to bypass navigation immediately.
- **Tabs Accessibility**: Tabs implement `role="tablist"`, `role="tab"`, and `role="tabpanel"` with roving `tabIndex` (`0` for selected, `-1` for others) and arrow key support (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
- **Form Error Association**: Every input has a visible label and links to inline errors via `aria-describedby`, announcing dynamic error updates via `role="alert"` and `aria-live`.
- **Focus Management**: Focus automatically shifts to the main results heading after generating an event plan (`resultsHeadingRef.current?.focus()`).
- **Touch Target & Font Minimums**: All interactive buttons, inputs, and tabs have minimum hit areas of `44x44px`, and inputs maintain a minimum `16px` font size to prevent mobile browser auto-zoom.
- **Motion Reduction**: Respects `@media (prefers-reduced-motion: reduce)` by disabling transition durations for users with vestibular sensitivities.

---

## Efficiency & Performance

- **Pure Computation**: Budget breakdowns, timeline scheduling, and vendor checklists run synchronously in pure TypeScript functions with zero AI delay.
- **Memoization**: Heavy computations are wrapped in React `useMemo` hooks.
- **In-Memory Caching**: Identical ideas requests are hashed and retrieved instantly from memory cache.
- **Lazy Loading**: `IdeasTab` and `ChatTab` are lazy-loaded via `React.lazy` and `Suspense`.
- **Request Abort**: In-flight requests are automatically aborted on component unmount or re-submission using `AbortController`.
- **No Heavy Libraries**: Uses plain CSS with CSS custom properties without third-party CSS component bloat.

---

## Assumptions

1. **Currency Exchange**: Budget distributions operate in whole currency percentages; users can toggle between INR, USD, EUR, and GBP with localized formatting via `Intl.NumberFormat`.
2. **Catering Shift**: Guest counts between 50 and 200 represent the scaling window where per-person catering consumption requires reallocating up to 5 points from flexible decorative budgets.
3. **Offline Strategy**: Service worker caches core HTML, CSS, JavaScript, and app icons. Firebase and Gemini calls gracefully fall back to local offline state.

---

## Use on Mobile

EventCraft AI is optimized for mobile touchscreens:
1. Open the application URL on your mobile device (Safari on iOS, Chrome on Android).
2. **On Android / Chrome**: Tap the **"Install App"** button in the header, or choose **"Add to Home Screen"** from the browser menu.
3. **On iPhone / iPad (Safari)**: Tap the **Share** button (box with upward arrow), scroll down, and tap **"Add to Home Screen"**.
4. The app installs with standalone display mode, safe-area inset padding, and offline capabilities.

---

## How AI Studio / Vibe Coding Was Used

- **System Prompts & Rapid Prototyping**: Iterated on domain-specific event planning rules, percentage matrices, and backward scheduling logic in Google AI Studio.
- **Structured Output Schemas**: Configured Gemini JSON Schema (`responseSchema`) with `Type.OBJECT` and `Type.ARRAY` definitions to eliminate hallucinated JSON formatting.
- **Zero-Dep Plain CSS Constitution**: Enforced strict CSS custom property tokens and anti-AI slop design standards with high color contrast and responsive layout breakpoints.

---

## Limitations & Future Work

- **Calendar Sync**: Future versions could add direct `.ics` export or Google Calendar API sync for timeline milestones.
- **Receipt Scanning**: Multi-modal photo upload to parse vendor invoices into the budget checklist using Gemini Flash vision.
- **Dynamic Currency Rates**: Integration of live forex exchange rates when hosting destination events across multiple countries.

## 🔗 Live Demo / Prototype

Explore the EventCraft AI prototype here:https://eventcraftai-89df.onrender.com/

## License

This project is licensed under the [MIT License](LICENSE).
