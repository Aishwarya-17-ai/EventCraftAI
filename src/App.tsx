/**
 * EventCraft AI - Main Application Component
 * Multi-page architecture:
 * Page 1: Dedicated Login / Welcome page with centered Google Sign-In & guest preview
 * Page 2: "Plan Your Event" page with 13 event types and detail inputs
 * Page 3: Generated Plan Dashboard (Budget, Adaptive Timeline, Vendors with job-listing layout, Ideas, Chat)
 *
 * Light-Only Job-Board Dashboard Theme:
 * - Clean blue-grey background, white rounded cards, visible focus rings, WCAG 2.1 AA compliant.
 * - Under-header banner with event name, "N days left" chip, and plan style chip.
 * - Desktop underlined tabs and mobile bottom tab bar.
 */

import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  CheckCircle2,
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import {
  CurrencyCode,
  EventDocument,
  EventFormData,
  PersonalizedIdeas,
  getEventAccent,
  getEventLabel,
} from './lib/types';
import { calculateBudget } from './lib/budget';
import { generateAdaptiveTimeline } from './lib/timeline';
import { generateEventIdeas } from './lib/ai';
import { formatDate } from './lib/formatters';
import { loadUserVendors } from './lib/vendors';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  saveEventToFirestore,
  subscribeToEvent,
  testConnection,
} from './lib/firebase';
import { useOnlineStatus } from './hooks/usePWAInstall';

// Components
import { Header } from './components/Header';
import { Banner } from './components/Banner';
import { LoginPage } from './components/LoginPage';
import { EventForm } from './components/EventForm';
import { Tabs, TabId } from './components/Tabs';
import { BudgetTab } from './components/BudgetTab';
import { TimelineTab } from './components/TimelineTab';
import { VendorsTab } from './components/VendorsTab';

// Lazy-loaded tabs for performance
const IdeasTab = lazy(() =>
  import('./components/IdeasTab').then((m) => ({ default: m.IdeasTab }))
);
const ChatTab = lazy(() =>
  import('./components/ChatTab').then((m) => ({ default: m.ChatTab }))
);

export type AppPage = 'login' | 'plan' | 'results';

const DEFAULT_EVENT: EventFormData = {
  eventType: 'wedding',
  name: 'Maya & Arjun’s Garden Wedding',
  date: '2027-05-18',
  guestCount: 150,
  totalBudget: 1500000,
  currency: 'INR',
  city: 'Bengaluru, India',
  theme: 'Eco-chic botanical celebration with pastel florals, fairy lights, and live acoustic music',
  notes: 'Provide traditional South Indian vegetarian breakfast, multi-cuisine dinner buffet, wheelchair accessible entrance',
};

export default function App() {
  const [formData, setFormData] = useState<EventFormData>(DEFAULT_EVENT);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [activeTab, setActiveTab] = useState<TabId>('budget');
  const [ideas, setIdeas] = useState<PersonalizedIdeas | null>(null);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planSuccessToast, setPlanSuccessToast] = useState<string | null>(null);

  // Multi-page navigation state: 'login' | 'plan' | 'results'
  const [currentPage, setCurrentPage] = useState<AppPage>('login');
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth & Storage state
  const [user, setUser] = useState<User | null>(null);
  const [eventId, setEventId] = useState<string>('local-demo');
  const [editors, setEditors] = useState<string[]>([]);
  const [viewers, setViewers] = useState<string[]>([]);

  // Responsive state (< 640px)
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const isOnline = useOnlineStatus();
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Enforce Light-Only Theme (Part 1 Requirement: remove dark mode completely)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    localStorage.removeItem('eventcraft_theme');
  }, []);

  // Window resize handler for mobile tabs breakpoint (< 640px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize service worker with immediate update check
  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.debug('ServiceWorker registration note:', err);
        });
    }
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentPage === 'login') {
        setCurrentPage('plan');
      }
    });
    return () => unsubscribe();
  }, [currentPage]);

  // Check URL params for shared event
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('event');
    if (sharedId) {
      setEventId(sharedId);
      const unsubEvent = subscribeToEvent(
        sharedId,
        (docData) => {
          if (docData) {
            setFormData({
              eventType: docData.eventType,
              name: docData.name,
              date: docData.date,
              guestCount: docData.guestCount,
              totalBudget: docData.totalBudget,
              currency: docData.currency,
              city: docData.city,
              theme: docData.theme || '',
              notes: docData.notes || '',
              customEventType: docData.customEventType,
            });
            setCurrency(docData.currency);
            setEditors(docData.editors || []);
            setViewers(docData.viewers || []);
            if (docData.ideasState) {
              try {
                setIdeas(JSON.parse(docData.ideasState));
              } catch {
                // Ignore parse errors
              }
            }
            setCurrentPage('results');
          }
        },
        (err) => console.debug('Shared event listener notice:', err)
      );

      return () => {
        unsubEvent();
      };
    }
  }, []);

  // Memoized pure budget calculations
  const budgetSummary = useMemo(() => {
    return calculateBudget(
      formData.eventType,
      formData.totalBudget,
      formData.guestCount,
      currency
    );
  }, [formData.eventType, formData.totalBudget, formData.guestCount, currency]);

  // Memoized adaptive timeline spanning from Today to Event Day
  const adaptiveTimeline = useMemo(() => {
    return generateAdaptiveTimeline(
      formData.eventType,
      formData.date,
      undefined,
      formData.customEventType
    );
  }, [formData.eventType, formData.date, formData.customEventType]);

  const accentColor = getEventAccent(formData.eventType);
  const eventLabel = getEventLabel(formData.eventType, formData.customEventType);

  // Vendor counts by category for the budget table
  const vendorCountsByCategory = useMemo(() => {
    const storageKey = `${formData.eventType}_${eventId}`;
    const vendors = loadUserVendors(storageKey);
    const counts: Record<string, number> = {};
    vendors.forEach((v) => {
      counts[v.categoryId] = (counts[v.categoryId] || 0) + 1;
    });
    return counts;
  }, [formData.eventType, eventId]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
      setCurrentPage('plan');
    } catch (err: unknown) {
      console.debug('Login note:', err);
      setAuthError('Unable to sign in. Please check your credentials or try again.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore
    }
    setUser(null);
    setCurrentPage('login');
  };

  // Handle Form Submit from Page 2 ("Plan Your Event") -> transitions to Page 3 ("Results")
  const handleFormSubmit = async (newFormData: EventFormData) => {
    const freshTimeline = generateAdaptiveTimeline(
      newFormData.eventType,
      newFormData.date,
      undefined,
      newFormData.customEventType
    );

    const fullFormData: EventFormData = {
      ...newFormData,
      daysLeft: freshTimeline.daysLeft,
      planStyle: freshTimeline.planStyle,
    };

    setFormData(fullFormData);
    setIsGeneratingPlan(true);
    setIsLoadingIdeas(true);
    setPlanSuccessToast(null);

    // Cancel any previous in-flight ideas request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Transition to Page 3 (Results)
    setCurrentPage('results');

    try {
      const generatedIdeas = await generateEventIdeas(
        fullFormData,
        abortControllerRef.current.signal
      );
      setIdeas(generatedIdeas);

      // If user is authenticated, sync event to Firestore safely
      if (user) {
        try {
          const eventDoc: EventDocument = {
            ...fullFormData,
            id: eventId === 'local-demo' ? `evt_${Date.now()}` : eventId,
            ownerId: user.uid,
            ownerEmail: user.email || user.displayName || 'Creator',
            editors,
            viewers,
            ideasState: JSON.stringify(generatedIdeas),
          };
          await saveEventToFirestore(eventDoc);
          if (eventId === 'local-demo') {
            setEventId(eventDoc.id);
          }
        } catch (syncErr) {
          console.debug('Firestore sync note:', syncErr);
        }
      }

      setPlanSuccessToast(
        `Event plan generated for ${newFormData.name}! Budget, adaptive timeline (${freshTimeline.planStyle}), vendor suggestions, and recommendations are ready.`
      );
    } catch (err) {
      console.debug('Error generating event plan:', err);
      setPlanSuccessToast('Event plan generated! Sample recommendations loaded.');
    } finally {
      setIsGeneratingPlan(false);
      setIsLoadingIdeas(false);

      setTimeout(() => {
        resultsHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        resultsHeadingRef.current?.focus();
      }, 100);
    }
  };

  const handleRegenerateIdeas = async () => {
    setIsLoadingIdeas(true);
    try {
      const res = await generateEventIdeas(formData);
      setIdeas(res);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const handlePlanNewEvent = () => {
    setFormData({
      eventType: 'wedding',
      name: '',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      guestCount: 100,
      totalBudget: 500000,
      currency,
      city: '',
      theme: '',
      notes: '',
    });
    setCurrentPage('plan');
  };

  // ==========================================
  // PAGE 1: DEDICATED LOGIN / WELCOME PAGE (No header, centered 420px)
  // ==========================================
  if (currentPage === 'login') {
    return (
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onGuestContinue={() => setCurrentPage('plan')}
        onEmailSignIn={(email) => {
          console.debug('Email signed in as:', email);
          setCurrentPage('plan');
        }}
        currency={currency}
        onCurrencyChange={(newCurr) => {
          setCurrency(newCurr);
          setFormData((prev) => ({ ...prev, currency: newCurr }));
        }}
        authError={authError}
      />
    );
  }

  // ==========================================
  // PAGES 2 & 3: APP SHELL (Header + Subheader + Content)
  // ==========================================
  return (
    <div className="app-container min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Skip to Content for WCAG 2.1 AA keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Header: Logo, sr-only Currency Dropdown, Edit, New event, Print, Sign out */}
      <Header
        currency={currency}
        onCurrencyChange={(newCurr) => {
          setCurrency(newCurr);
          setFormData((prev) => ({ ...prev, currency: newCurr }));
        }}
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigateToPlan={() => setCurrentPage('plan')}
        onPlanNewEvent={handlePlanNewEvent}
      />

      {/* Under-Header Bar: Event Name, Days Left Chip, Plan Style Chip */}
      {currentPage === 'results' && (
        <div className="plan-sub-header">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1
                id="results-main-heading"
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="text-xl sm:text-2xl font-black tracking-tight"
                style={{ color: 'var(--text)', outline: 'none' }}
              >
                {formData.name || 'Your Event Plan'}
              </h1>
              <span
                className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                {eventLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="days-left-chip"
                aria-label={`${adaptiveTimeline.daysLeft} days remaining`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{adaptiveTimeline.daysLeft} days left</span>
              </span>
              <span
                className="plan-style-chip"
                aria-label={`Planning strategy: ${adaptiveTimeline.planStyle}`}
              >
                <span>{adaptiveTimeline.planStyle}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Offline Status Banner */}
      <div className="w-full px-4 pt-3 max-w-7xl mx-auto">
        <Banner
          isOffline={!isOnline}
          isMockMode={!isLoadingIdeas && ideas?.isMock}
        />
      </div>

      {/* ==========================================
          PAGE 2: "PLAN YOUR EVENT" PAGE
         ========================================== */}
      {currentPage === 'plan' && (
        <main id="main-content" className="page-plan-wrapper flex-1" tabIndex={-1}>
          {/* Page Heading & Guidance */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
              style={{
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1: Event Configuration</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black tracking-tight mb-2"
              style={{ color: 'var(--text)' }}
            >
              Plan Your Event
            </h1>
            <p
            className="text-sm sm:text-base max-w-xl mx-auto"
            style={{
              color: 'var(--muted)',
              textAlign: 'center',
              width: '100%',
            }}
>
              Choose from 13 event categories or describe your custom concept. Specify your budget and date to generate an adaptive timeline, zero-leak budget, and vendor recommendations.
            </p>
          </div>

          {/* Centered Interactive Form */}
          <div className="w-full">
            <EventForm
              initialData={formData}
              onSubmit={handleFormSubmit}
              isLoading={isGeneratingPlan}
              currency={currency}
              isMobile={isMobile}
            />
          </div>
        </main>
      )}

      {/* ==========================================
          PAGE 3: GENERATED PLAN DASHBOARD PAGE
         ========================================== */}
      {currentPage === 'results' && (
        <main id="main-content" className="page-results-wrapper flex-1" tabIndex={-1}>
          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <button
              type="button"
              onClick={() => setCurrentPage('plan')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
              aria-label="Back to Plan Your Event page to edit details"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={handlePlanNewEvent}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
              title="Start a fresh plan"
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              <span>Plan Another Event</span>
            </button>
          </div>

          {/* Success Toast */}
          {planSuccessToast && (
            <div
              role="status"
              aria-live="polite"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginBottom: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid var(--success)',
                color: 'var(--text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{planSuccessToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setPlanSuccessToast(null)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Event Meta Bar */}
          <div className="card mb-6 py-4 px-5">
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span style={{ color: 'var(--text)' }}>{formatDate(formData.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span style={{ color: 'var(--text)' }}>{formData.guestCount} Guests</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span style={{ color: 'var(--text)' }}>{formData.city || 'Local Destination'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">Budget:</span>
                <span className="font-extrabold text-primary" style={{ color: 'var(--primary)' }}>
                  {budgetSummary.costPerGuestFormatted} / guest
                </span>
              </div>
            </div>
          </div>

          {/* Accessible Tabs and Panels (Budget, Timeline, Vendors, Ideas, Chat) */}
          <Tabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={isMobile}
            accentColor={accentColor}
          >
            {activeTab === 'budget' && (
              <BudgetTab
                budget={budgetSummary}
                accentColor={accentColor}
                vendorCountsByCategory={vendorCountsByCategory}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab
                timeline={adaptiveTimeline}
                eventDate={formData.date}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorsTab
                eventType={formData.eventType}
                eventName={formData.name}
                eventId={eventId}
                customDescription={formData.customEventType}
                city={formData.city}
                budget={budgetSummary}
                currency={currency}
              />
            )}

            {activeTab === 'ideas' && (
              <Suspense
                fallback={
                  <div className="card text-center py-12">
                    <p style={{ color: 'var(--muted)' }}>Loading AI Ideas Panel...</p>
                  </div>
                }
              >
                <IdeasTab
                  ideas={ideas}
                  isLoading={isLoadingIdeas}
                  onRegenerate={handleRegenerateIdeas}
                />
              </Suspense>
            )}

            {activeTab === 'chat' && (
              <Suspense
                fallback={
                  <div className="card text-center py-12">
                    <p style={{ color: 'var(--muted)' }}>Loading Planner Chat Assistant...</p>
                  </div>
                }
              >
                <ChatTab eventContext={formData} />
              </Suspense>
            )}
          </Tabs>
        </main>
      )}
    </div>
  );
}
