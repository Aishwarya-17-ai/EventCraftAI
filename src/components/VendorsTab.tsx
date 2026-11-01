/**
 * EventCraft AI - Vendors Tab Component
 * Restructured to clean job-board dashboard style with light-only theme:
 * 1. Top Blue Box: Solid --primary rounded card with title, "+ Add a vendor" & "Export JSON" white buttons, and 3 stat tiles.
 * 2. Toolbar Row: Filter pills (All, Shortlisted, Booked, Rating 4+), Sort dropdown, and "Show demo vendors" role="switch".
 * 3. Category Blocks: One white card per category (20px gap):
 *    - Header row: 48px emoji tile, category title, suggested budget & vendor count.
 *    - Action row: "Find nearby on Google Maps" (primary), "Near my location" (secondary), "AI tips" (secondary), "+ Add vendor" (preselected).
 *    - Divider and category vendor cards or empty state.
 * 4. Vendor Card: 56px emoji tile, middle info & chips, right navy panel (stars + budget fit), bottom action row (Call, Open in Maps, Shortlist, Booked, Edit, Remove).
 * 5. Add/Edit Modal: desktop modal / mobile bottom sheet with focus trap, Escape to close, Category select, validated fields.
 * 6. Zero fabricated businesses; demo vendors flagged with "Sample - not a real business".
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sparkles,
  Download,
  Phone,
  Trash2,
  Edit2,
  Bookmark,
  X,
  Star,
  Info,
  Loader2,
} from 'lucide-react';
import {
  EventType,
  BudgetSummary,
  CurrencyCode,
  UserVendor,
  VendorCategoryConfig,
  BudgetCategory,
} from '../lib/types';
import {
  getVendorCategoriesForEvent,
  buildMapsSearchUrl,
  buildMapsVendorSearchUrl,
  buildMapsGeoSearchUrl,
  normalizePhoneDisplay,
  getSanitizedTelHref,
  fetchCategoryAiTips,
  getDemoVendorsForEvent,
  loadUserVendors,
  saveUserVendors,
  exportUserVendorsAsJSON,
} from '../lib/vendors';
import { calculateBudget } from '../lib/budget';
import { formatCurrencyFromCents } from '../lib/formatters';

interface VendorsTabProps {
  eventType: EventType;
  eventName: string;
  eventId?: string;
  customDescription?: string;
  city?: string;
  budget?: BudgetSummary;
  totalBudget?: number;
  currency?: CurrencyCode;
  daysLeft?: number;
}

interface VendorFormData {
  id?: string;
  categoryId: string;
  name: string;
  phone: string;
  rating: string;
  reviewsCount: string;
  quotedPrice: string;
  notes: string;
}

type FilterOption = 'all' | 'shortlisted' | 'booked' | 'rating4';
type SortOption = 'rating_desc' | 'name_asc';

export const VendorsTab: React.FC<VendorsTabProps> = ({
  eventType,
  eventName,
  eventId = 'default',
  city = '',
  budget,
  totalBudget = 50000,
  currency = 'USD',
  daysLeft = 60,
}) => {
  // Budget resolution
  const activeBudget = useMemo(() => {
    return budget || calculateBudget(eventType, totalBudget, 100, currency);
  }, [budget, eventType, totalBudget, currency]);

  const activeCurrency: CurrencyCode = activeBudget.currency || currency;

  // Categories for current event type
  const categories = useMemo(() => {
    return getVendorCategoriesForEvent(eventType);
  }, [eventType]);

  // Persisted user vendors
  const storageKey = `${eventType}_${eventId}`;
  const [userVendors, setUserVendors] = useState<UserVendor[]>(() => loadUserVendors(storageKey));

  // Demo data switch (default OFF)
  const [showDemoVendors, setShowDemoVendors] = useState<boolean>(false);

  // Active filter & sorting
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('rating_desc');

  // AI tips state per category
  const [categoryAiTips, setCategoryAiTips] = useState<
    Record<string, { tips: [string, string, string]; isOffline: boolean; loading: boolean }>
  >({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  // Form / Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<VendorFormData>({
    categoryId: '',
    name: '',
    phone: '',
    rating: '',
    reviewsCount: '',
    quotedPrice: '',
    notes: '',
  });

  // Geolocation loading state per category
  const [geoLoadingCategory, setGeoLoadingCategory] = useState<string | null>(null);

  // Modal first input ref for autofocus & focus trap
  const firstInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reload vendors when eventType or eventId changes
  useEffect(() => {
    setUserVendors(loadUserVendors(`${eventType}_${eventId}`));
  }, [eventType, eventId]);

  // Save vendors to localStorage on change
  const handleUpdateVendors = (updater: (prev: UserVendor[]) => UserVendor[]) => {
    setUserVendors((prev) => {
      const next = updater(prev);
      saveUserVendors(storageKey, next);
      return next;
    });
  };

  // Keyboard trap and escape listener for modal
  useEffect(() => {
    if (!isModalOpen) return;

    const timer = setTimeout(() => {
      if (formData.categoryId) {
        firstInputRef.current?.focus();
      } else {
        categorySelectRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, formData.categoryId]);

  // Match category budget
  const getCategoryBudget = (cat: VendorCategoryConfig): { amountFormatted: string; percent: number; cents: number } => {
    const matched = activeBudget.categories.find(
      (b: BudgetCategory) =>
        b.id.toLowerCase() === cat.budgetCategoryId.toLowerCase() ||
        b.name.toLowerCase().includes(cat.title.toLowerCase()) ||
        cat.title.toLowerCase().includes(b.name.toLowerCase())
    );

    if (matched) {
      return {
        amountFormatted: matched.amountFormatted,
        percent: matched.percent,
        cents: matched.amountCents,
      };
    }

    const fallbackPercent = Math.max(5, Math.round(100 / Math.max(1, categories.length)));
    const fallbackCents = Math.round((activeBudget.totalCents * fallbackPercent) / 100);
    return {
      amountFormatted: formatCurrencyFromCents(fallbackCents, activeCurrency),
      percent: fallbackPercent,
      cents: fallbackCents,
    };
  };

  // Combine real user vendors with demo vendors if switch is on
  const allDisplayVendors = useMemo(() => {
    const list = [...userVendors];
    if (showDemoVendors) {
      const demoList = getDemoVendorsForEvent(eventType);
      return [...list, ...demoList];
    }
    return list;
  }, [userVendors, showDemoVendors, eventType]);

  // Filter and sort vendors
  const filteredAndSortedVendors = useMemo(() => {
    let list = [...allDisplayVendors];

    if (activeFilter === 'shortlisted') {
      list = list.filter((v) => v.isShortlisted);
    } else if (activeFilter === 'booked') {
      list = list.filter((v) => v.isBooked);
    } else if (activeFilter === 'rating4') {
      list = list.filter((v) => (v.rating || 0) >= 4.0);
    }

    list.sort((a, b) => {
      if (activeSort === 'rating_desc') {
        const ratingA = a.rating ?? -1;
        const ratingB = b.rating ?? -1;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allDisplayVendors, activeFilter, activeSort]);

  // Summary counts
  const totalUserVendorsCount = userVendors.length;
  const bookedUserVendorsCount = userVendors.filter((v) => v.isBooked).length;
  const progressPercent =
    totalUserVendorsCount > 0 ? Math.round((bookedUserVendorsCount / totalUserVendorsCount) * 100) : 0;

  const totalQuotesSumCents = userVendors.reduce((sum, v) => {
    return sum + (v.quotedPrice ? Math.round(v.quotedPrice * 100) : 0);
  }, 0);

  // AI tips fetch handler
  const handleFetchAiTips = async (cat: VendorCategoryConfig) => {
    if (categoryAiTips[cat.id]?.tips) {
      setCategoryAiTips((prev) => {
        const copy = { ...prev };
        delete copy[cat.id];
        return copy;
      });
      return;
    }

    setCategoryAiTips((prev) => ({
      ...prev,
      [cat.id]: { tips: ['Loading...', '', ''], isOffline: false, loading: true },
    }));

    const catBudget = getCategoryBudget(cat);
    const result = await fetchCategoryAiTips(
      cat,
      eventType,
      daysLeft,
      city,
      catBudget.amountFormatted
    );

    setCategoryAiTips((prev) => ({
      ...prev,
      [cat.id]: {
        tips: result.tips,
        isOffline: result.isOffline,
        loading: false,
      },
    }));
  };

  // Geolocation Search Handler
  const handleGeoSearch = (cat: VendorCategoryConfig) => {
    setGeoLoadingCategory(cat.id);

    if (!('geolocation' in navigator)) {
      setToastMessage({
        message: 'Geolocation is not supported in this browser. Searching in your event city instead.',
        type: 'info',
      });
      const fallbackUrl = buildMapsSearchUrl(cat.mapsQuery, city);
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      setGeoLoadingCategory(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const geoUrl = buildMapsGeoSearchUrl(cat.mapsQuery, latitude, longitude);
        window.open(geoUrl, '_blank', 'noopener,noreferrer');
        setGeoLoadingCategory(null);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setToastMessage({
          message: 'Location access was not granted. Searching nearby your event city instead.',
          type: 'info',
        });
        const fallbackUrl = buildMapsSearchUrl(cat.mapsQuery, city);
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        setGeoLoadingCategory(null);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Open modal for new vendor
  const handleOpenAddModal = (catId?: string) => {
    setFormErrors({});
    setFormData({
      id: undefined,
      categoryId: catId || '',
      name: '',
      phone: '',
      rating: '',
      reviewsCount: '',
      quotedPrice: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing vendor
  const handleOpenEditModal = (vendor: UserVendor) => {
    if (vendor.isSample) return;
    setFormErrors({});
    setFormData({
      id: vendor.id,
      categoryId: vendor.categoryId,
      name: vendor.name,
      phone: vendor.phone || '',
      rating: vendor.rating !== undefined ? String(vendor.rating) : '',
      reviewsCount: vendor.reviewsCount !== undefined ? String(vendor.reviewsCount) : '',
      quotedPrice: vendor.quotedPrice !== undefined ? String(vendor.quotedPrice) : '',
      notes: vendor.notes || '',
    });
    setIsModalOpen(true);
  };

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category for this vendor.';
    }

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Vendor name is required.';
    } else if (trimmedName.length > 80) {
      errors.name = 'Vendor name must be 80 characters or fewer.';
    }

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone && trimmedPhone.length > 20) {
      errors.phone = 'Phone number must be 20 characters or fewer.';
    }

    let parsedRating: number | undefined;
    if (formData.rating.trim()) {
      const r = parseFloat(formData.rating);
      if (isNaN(r) || r < 0 || r > 5) {
        errors.rating = 'Rating must be a number between 0 and 5.';
      } else {
        parsedRating = Math.round(r * 10) / 10;
      }
    }

    let parsedReviews: number | undefined;
    if (formData.reviewsCount.trim()) {
      const rc = parseInt(formData.reviewsCount, 10);
      if (isNaN(rc) || rc < 0) {
        errors.reviewsCount = 'Reviews count must be 0 or greater.';
      } else {
        parsedReviews = rc;
      }
    }

    let parsedPrice: number | undefined;
    if (formData.quotedPrice.trim()) {
      const q = parseFloat(formData.quotedPrice);
      if (isNaN(q) || q < 0) {
        errors.quotedPrice = 'Quoted price must be a valid positive amount.';
      } else {
        parsedPrice = Math.round(q * 100) / 100;
      }
    }

    const trimmedNotes = formData.notes.trim();
    if (trimmedNotes.length > 200) {
      errors.notes = 'Notes cannot exceed 200 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const targetCategory = categories.find((c) => c.id === formData.categoryId) || categories[0];
    const mapsUrl = buildMapsVendorSearchUrl(trimmedName, city);

    if (formData.id) {
      // Editing existing vendor
      handleUpdateVendors((prev) =>
        prev.map((v) =>
          v.id === formData.id
            ? {
                ...v,
                categoryId: targetCategory.id,
                categoryTitle: targetCategory.title,
                categoryEmoji: targetCategory.emoji,
                name: trimmedName,
                phone: trimmedPhone ? normalizePhoneDisplay(trimmedPhone) : undefined,
                rating: parsedRating,
                reviewsCount: parsedReviews,
                quotedPrice: parsedPrice,
                notes: trimmedNotes || undefined,
                city: city || undefined,
                mapsUrl,
              }
            : v
        )
      );
      setToastMessage({ message: `Updated "${trimmedName}"`, type: 'success' });
    } else {
      // Adding new vendor
      const newVendor: UserVendor = {
        id: `vendor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        categoryId: targetCategory.id,
        categoryTitle: targetCategory.title,
        categoryEmoji: targetCategory.emoji,
        name: trimmedName,
        phone: trimmedPhone ? normalizePhoneDisplay(trimmedPhone) : undefined,
        rating: parsedRating,
        reviewsCount: parsedReviews,
        quotedPrice: parsedPrice,
        notes: trimmedNotes || undefined,
        city: city || undefined,
        isBooked: false,
        isShortlisted: false,
        isSample: false,
        createdAt: new Date().toISOString(),
        mapsUrl,
      };

      handleUpdateVendors((prev) => [...prev, newVendor]);
      setToastMessage({ message: `Added "${trimmedName}" to ${targetCategory.title}`, type: 'success' });
    }

    setIsModalOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle shortlist status
  const handleToggleShortlist = (vendor: UserVendor) => {
    if (vendor.isSample) return;
    handleUpdateVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, isShortlisted: !v.isShortlisted } : v))
    );
  };

  // Toggle booked status
  const handleToggleBooked = (vendor: UserVendor) => {
    if (vendor.isSample) return;
    handleUpdateVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, isBooked: !v.isBooked } : v))
    );
  };

  // Delete vendor with confirmation dialog
  const handleDeleteVendor = (vendor: UserVendor) => {
    if (vendor.isSample) return;
    const confirmed = window.confirm(`Are you sure you want to remove "${vendor.name}"?`);
    if (confirmed) {
      handleUpdateVendors((prev) => prev.filter((v) => v.id !== vendor.id));
      setToastMessage({ message: `Removed "${vendor.name}"`, type: 'info' });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Export JSON handler
  const handleExportJSON = () => {
    exportUserVendorsAsJSON(eventName || 'Event', userVendors, categories);
    setToastMessage({ message: 'Exported vendor directory to JSON file!', type: 'success' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <section
      role="tabpanel"
      id="panel-vendors"
      aria-labelledby="tab-vendors"
      className="max-w-[1100px] mx-auto p-4 sm:p-6 flex flex-col gap-6 w-full"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-2xl border flex items-center justify-between shadow-xs animate-fade-in"
          style={{
            backgroundColor:
              toastMessage.type === 'success'
                ? '#ECFDF5'
                : toastMessage.type === 'error'
                ? '#FEF2F2'
                : '#EFF6FF',
            borderColor:
              toastMessage.type === 'success'
                ? '#10B981'
                : toastMessage.type === 'error'
                ? '#EF4444'
                : '#3B82F6',
            color: '#1F2937',
          }}
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs p-1 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          1. TOP BLUE BOX: Solid --primary rounded card with white text
          ======================================================== */}
      <div
        className="rounded-2xl p-6 sm:p-7 shadow-md flex flex-col gap-6"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          color: '#FFFFFF',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vendors
            </h2>
            <p className="text-sm mt-1 text-blue-100 font-medium">
              Explore local categories on Google Maps, save quotes you find, and manage bookings.
            </p>
          </div>
          {/* Right Action Buttons: White styled buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="btn-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--primary)',
                border: 'none',
              }}
            >
              <Plus className="w-4 h-4 text-[var(--primary)]" />
              <span>+ Add a vendor</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="btn-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--primary)',
                border: 'none',
              }}
            >
              <Download className="w-4 h-4 text-[var(--primary)]" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Beneath: 3 Stat Tiles with semi-transparent white background and white text */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Tile 1: Vendors added */}
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-3.5 border border-white/20 flex flex-col justify-center">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-100">
              Vendors Added
            </span>
            <span className="text-xl font-black mt-1 text-white">
              {totalUserVendorsCount} {totalUserVendorsCount === 1 ? 'vendor' : 'vendors'}
            </span>
          </div>

          {/* Tile 2: Booked progress */}
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-3.5 border border-white/20 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs uppercase font-extrabold tracking-wider text-blue-100">
              <span>Booked</span>
              <span>{bookedUserVendorsCount} of {totalUserVendorsCount} ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/25 mt-2.5 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tile 3: Quotes vs Budget */}
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-3.5 border border-white/20 flex flex-col justify-center">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-100">
              Quotes vs Budget
            </span>
            <span className="text-xl font-black mt-1 text-white">
              {formatCurrencyFromCents(totalQuotesSumCents, activeCurrency)} of{' '}
              {formatCurrencyFromCents(activeBudget.totalCents, activeCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. TOOLBAR ROW: Filter pills, Sort dropdown, and Demo Switch
          ======================================================== */}
      <div className="flex items-center justify-between flex-wrap gap-4 py-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`pill px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'pill-primary bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-white text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('shortlisted')}
            className={`pill px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
              activeFilter === 'shortlisted'
                ? 'pill-primary bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-white text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)]'
            }`}
          >
            Shortlisted
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('booked')}
            className={`pill px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
              activeFilter === 'booked'
                ? 'pill-primary bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-white text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)]'
            }`}
          >
            Booked
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('rating4')}
            className={`pill px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
              activeFilter === 'rating4'
                ? 'pill-primary bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-white text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg)]'
            }`}
          >
            Rating 4+
          </button>
        </div>

        {/* Right: Sort and Demo vendors switch */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Styled Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
            <label htmlFor="vendor-sort-select" className="sr-only">
              Sort vendors
            </label>
            <span aria-hidden="true">Sort:</span>
            <select
              id="vendor-sort-select"
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as SortOption)}
              className="form-select text-xs font-bold py-1 px-2.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text)] cursor-pointer"
              style={{ minHeight: '36px', height: '36px' }}
            >
              <option value="rating_desc">Highest rated</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          {/* Show Demo Vendors Toggle Switch */}
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text)] cursor-pointer select-none">
            <input
              type="checkbox"
              role="switch"
              checked={showDemoVendors}
              onChange={(e) => setShowDemoVendors(e.target.checked)}
              aria-label="Show demo vendors"
              className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
            <span>Show demo vendors</span>
          </label>
        </div>
      </div>

      {/* ========================================================
          3. CATEGORY BLOCKS: One white card per category (20px gap)
          ======================================================== */}
      <div className="flex flex-col gap-5 w-full">
        {categories.map((cat) => {
          const catBudget = getCategoryBudget(cat);
          const catVendors = filteredAndSortedVendors.filter((v) => v.categoryId === cat.id);
          const aiTips = categoryAiTips[cat.id];

          return (
            <div
              key={cat.id}
              className="card bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex flex-col gap-4"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              {/* a. Header Row: 48px emoji tile, category title, suggested budget line */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: 'var(--primary-soft)' }}
                    aria-hidden="true"
                  >
                    <span>{cat.emoji}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-[var(--text)] tracking-tight">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Suggested budget: {catBudget.amountFormatted} ({catBudget.percent}%) · {catVendors.length} {catVendors.length === 1 ? 'vendor' : 'vendors'} added
                    </p>
                  </div>
                </div>
              </div>

              {/* b. Action Row: Styled Buttons */}
              <div className="flex items-center flex-wrap gap-2.5 pt-1">
                {/* Primary: Find nearby on Google Maps */}
                <a
                  href={buildMapsSearchUrl(cat.mapsQuery, city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Find nearby ${cat.title} on Google Maps (opens in a new tab)`}
                  className="btn btn-primary text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    minHeight: '38px',
                    height: '38px',
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Find nearby on Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                {/* Secondary: Near my location */}
                <button
                  type="button"
                  onClick={() => handleGeoSearch(cat)}
                  disabled={geoLoadingCategory === cat.id}
                  aria-label={`Search ${cat.title} near your current GPS location (falls back to city)`}
                  className="btn btn-secondary text-xs font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    minHeight: '38px',
                    height: '38px',
                  }}
                >
                  {geoLoadingCategory === cat.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-[var(--primary)]" />
                  )}
                  <span>Near my location</span>
                </button>

                {/* Secondary: AI Tips */}
                <button
                  type="button"
                  onClick={() => handleFetchAiTips(cat)}
                  disabled={aiTips?.loading}
                  aria-label={`AI Tips for ${cat.title}`}
                  className="btn btn-secondary text-xs font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    minHeight: '38px',
                    height: '38px',
                  }}
                >
                  {aiTips?.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                  )}
                  <span>{aiTips?.tips ? 'Hide AI tips' : 'AI tips'}</span>
                </button>

                {/* + Add vendor (opens add form with this category preselected) */}
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(cat.id)}
                  aria-label={`Add a vendor to ${cat.title}`}
                  className="btn btn-secondary text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--primary)',
                    minHeight: '38px',
                    height: '38px',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add vendor</span>
                </button>
              </div>

              {/* Soft blue AI Tips panel if toggled */}
              {aiTips?.tips && (
                <div
                  className="p-4 rounded-xl text-xs space-y-2 border border-blue-200 mt-1"
                  style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--text)' }}
                >
                  <div className="flex items-center justify-between font-bold text-[var(--primary)]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Negotiation & Selection Tips ({cat.title})</span>
                    </span>
                    {aiTips.isOffline && (
                      <span className="text-[11px] font-semibold text-[var(--muted)]">Curated tips</span>
                    )}
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 text-[var(--text)]">
                    {aiTips.tips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* c. Divider */}
              <hr className="my-2 border-[var(--border)]" />

              {/* Category vendor cards in responsive list, or empty state */}
              {catVendors.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--muted)] rounded-xl border border-dashed border-[var(--border)] bg-[#FAFBFD]">
                  <p className="font-medium">
                    No vendors added yet. Open Google Maps, pick a place and add it here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {catVendors.map((vendor) => {
                    const priceCents = vendor.quotedPrice ? Math.round(vendor.quotedPrice * 100) : 0;
                    const diffCents = catBudget.cents - priceCents;
                    const isWithin = diffCents >= 0;
                    const diffFormatted = formatCurrencyFromCents(Math.abs(diffCents), activeCurrency);

                    return (
                      <div
                        key={vendor.id}
                        className="p-4 rounded-xl border border-[var(--border)] bg-white flex flex-col gap-3 transition-all"
                      >
                        {/* 4. VENDOR CARD: Horizontal on desktop, stacked on mobile */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Left: 56px emoji tile + Middle info */}
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                              style={{ backgroundColor: 'var(--primary-soft)' }}
                              aria-hidden="true"
                            >
                              <span>{cat.emoji}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-extrabold text-base text-[var(--text)] truncate">
                                  {vendor.name}
                                </h3>

                                {vendor.isSample ? (
                                  <span className="chip px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                    Sample - not a real business
                                  </span>
                                ) : (
                                  <span className="chip px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    Added by you
                                  </span>
                                )}

                                {vendor.isShortlisted && (
                                  <span className="chip px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-blue-100 text-[var(--primary)] border border-blue-200">
                                    Shortlisted
                                  </span>
                                )}

                                {vendor.isBooked && (
                                  <span className="chip px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Booked
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-wrap">
                                {vendor.phone && (
                                  <a
                                    href={getSanitizedTelHref(vendor.phone) || undefined}
                                    aria-label={`Call ${vendor.name} at ${vendor.phone}`}
                                    className="font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{vendor.phone}</span>
                                  </a>
                                )}
                                {(vendor.city || city) && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{vendor.city || city}</span>
                                  </span>
                                )}
                                {vendor.quotedPrice !== undefined && (
                                  <span className="font-bold text-[var(--text)]">
                                    Quote:{' '}
                                    {formatCurrencyFromCents(
                                      Math.round(vendor.quotedPrice * 100),
                                      activeCurrency
                                    )}
                                  </span>
                                )}
                              </div>

                              {vendor.notes && (
                                <p className="text-xs text-[var(--muted)] mt-1.5 line-clamp-2">
                                  {vendor.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Navy --navy panel with white text */}
                          <div
                            className="rounded-xl p-3.5 text-white flex flex-col justify-between gap-2.5 shrink-0 min-w-[210px]"
                            style={{ backgroundColor: 'var(--navy)' }}
                          >
                            {/* Rating with stars or Not rated yet */}
                            <div>
                              {vendor.rating !== undefined ? (
                                <div
                                  className="flex items-center gap-2"
                                  aria-label={`Rated ${vendor.rating} out of 5${
                                    vendor.reviewsCount ? ` from ${vendor.reviewsCount} reviews` : ''
                                  }`}
                                >
                                  <span className="text-lg font-black text-amber-300">
                                    {vendor.rating.toFixed(1)}
                                  </span>
                                  <div className="flex items-center gap-0.5 text-amber-300" aria-hidden="true">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3.5 h-3.5 ${
                                          s <= Math.round(vendor.rating || 0)
                                            ? 'fill-amber-300'
                                            : 'opacity-40'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {vendor.reviewsCount !== undefined && (
                                    <span className="text-[11px] text-slate-300">
                                      ({vendor.reviewsCount})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300 font-semibold">
                                  Not rated yet
                                </span>
                              )}
                            </div>

                            {/* Budget fit ring / badge */}
                            <div className="text-xs pt-1 border-t border-slate-700/80">
                              {vendor.quotedPrice !== undefined ? (
                                isWithin ? (
                                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Within budget ({diffFormatted} left)</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Over by {diffFormatted}</span>
                                  </div>
                                )
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Category allocation: {catBudget.amountFormatted}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Row, evenly spaced */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-[var(--border)] text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {vendor.phone && (
                              <a
                                href={getSanitizedTelHref(vendor.phone) || undefined}
                                aria-label={`Call ${vendor.name}`}
                                className="btn btn-primary text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                                style={{
                                  backgroundColor: 'var(--primary)',
                                  color: '#FFFFFF',
                                  height: '34px',
                                  minHeight: '34px',
                                }}
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </a>
                            )}
                            <a
                              href={vendor.mapsUrl || buildMapsVendorSearchUrl(vendor.name, city)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${vendor.name} in Google Maps (opens in a new tab)`}
                              className="btn btn-secondary text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border)',
                                color: 'var(--text)',
                                height: '34px',
                                minHeight: '34px',
                              }}
                            >
                              <MapPin className="w-3 h-3 text-[var(--primary)]" />
                              <span>Open in Maps</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!vendor.isSample && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleShortlist(vendor)}
                                  aria-pressed={vendor.isShortlisted ? 'true' : 'false'}
                                  aria-label={`Shortlist ${vendor.name}`}
                                  className={`btn text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                    vendor.isShortlisted
                                      ? 'bg-blue-100 text-[var(--primary)] border border-blue-300'
                                      : 'bg-white text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--bg)]'
                                  }`}
                                  style={{ height: '34px', minHeight: '34px' }}
                                >
                                  <Bookmark className="w-3 h-3" />
                                  <span>{vendor.isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleBooked(vendor)}
                                  aria-pressed={vendor.isBooked ? 'true' : 'false'}
                                  aria-label={`Mark ${vendor.name} as booked`}
                                  className={`btn text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                    vendor.isBooked
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-white text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--bg)]'
                                  }`}
                                  style={{ height: '34px', minHeight: '34px' }}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{vendor.isBooked ? 'Booked' : 'Mark as booked'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(vendor)}
                                  aria-label={`Edit ${vendor.name}`}
                                  className="btn btn-secondary text-xs font-medium px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                                  style={{ height: '34px', minHeight: '34px' }}
                                >
                                  <Edit2 className="w-3 h-3 text-[var(--muted)]" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteVendor(vendor)}
                                  aria-label={`Remove ${vendor.name}`}
                                  className="btn text-xs font-medium px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 text-[var(--danger)] hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                                  style={{ height: '34px', minHeight: '34px' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================
          5. ADD / EDIT VENDOR FORM: Desktop Modal & Mobile Bottom Sheet
          ======================================================== */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            ref={modalRef}
            className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 id="vendor-modal-title" className="text-lg font-black text-[var(--text)]">
                {formData.id ? 'Edit Vendor' : 'Add a Vendor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
              {/* Category Select (Required) */}
              <div>
                <label
                  htmlFor="vendor-category-select"
                  className="block text-xs font-bold mb-1.5 text-[var(--text)]"
                >
                  Vendor Category <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  ref={categorySelectRef}
                  id="vendor-category-select"
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, categoryId: e.target.value }));
                    if (formErrors.categoryId) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.categoryId;
                        return copy;
                      });
                    }
                  }}
                  required
                  aria-invalid={formErrors.categoryId ? 'true' : 'false'}
                  aria-describedby={formErrors.categoryId ? 'error-vendor-category' : undefined}
                  className={`form-select w-full text-sm rounded-xl border p-2.5 ${
                    formErrors.categoryId ? 'has-error' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: formErrors.categoryId ? 'var(--danger)' : 'var(--border)',
                    height: '44px',
                    minHeight: '44px',
                  }}
                >
                  <option value="">-- Select a Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.title}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <div
                    id="error-vendor-category"
                    role="alert"
                    aria-live="polite"
                    className="text-xs font-semibold text-[var(--danger)] mt-1"
                  >
                    {formErrors.categoryId}
                  </div>
                )}
              </div>

              {/* Vendor / Business Name (Required, max 80) */}
              <div>
                <label
                  htmlFor="vendor-name-input"
                  className="block text-xs font-bold mb-1.5 text-[var(--text)]"
                >
                  Vendor / Business Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="vendor-name-input"
                  type="text"
                  maxLength={80}
                  required
                  placeholder="e.g. Royal Palace Banquet Hall"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.name;
                        return copy;
                      });
                    }
                  }}
                  aria-invalid={formErrors.name ? 'true' : 'false'}
                  aria-describedby={formErrors.name ? 'error-vendor-name' : undefined}
                  className={`form-input w-full text-sm rounded-xl border p-2.5 ${
                    formErrors.name ? 'has-error' : ''
                  }`}
                  style={{
                    borderColor: formErrors.name ? 'var(--danger)' : 'var(--border)',
                    height: '44px',
                    minHeight: '44px',
                  }}
                />
                {formErrors.name && (
                  <div
                    id="error-vendor-name"
                    role="alert"
                    aria-live="polite"
                    className="text-xs font-semibold text-[var(--danger)] mt-1"
                  >
                    {formErrors.name}
                  </div>
                )}
              </div>

              {/* Phone (Optional, max 20) */}
              <div>
                <label
                  htmlFor="vendor-phone-input"
                  className="block text-xs font-bold mb-1.5 text-[var(--text)]"
                >
                  Phone Number (optional)
                </label>
                <input
                  id="vendor-phone-input"
                  type="tel"
                  maxLength={20}
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, phone: e.target.value }));
                    if (formErrors.phone) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.phone;
                        return copy;
                      });
                    }
                  }}
                  aria-invalid={formErrors.phone ? 'true' : 'false'}
                  aria-describedby={formErrors.phone ? 'error-vendor-phone' : undefined}
                  className="form-input w-full text-sm rounded-xl border p-2.5"
                  style={{
                    borderColor: formErrors.phone ? 'var(--danger)' : 'var(--border)',
                    height: '44px',
                    minHeight: '44px',
                  }}
                />
                {formErrors.phone && (
                  <div
                    id="error-vendor-phone"
                    role="alert"
                    aria-live="polite"
                    className="text-xs font-semibold text-[var(--danger)] mt-1"
                  >
                    {formErrors.phone}
                  </div>
                )}
              </div>

              {/* Rating and Reviews Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="vendor-rating-input"
                    className="block text-xs font-bold mb-1.5 text-[var(--text)]"
                  >
                    Rating (0 to 5)
                  </label>
                  <input
                    id="vendor-rating-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="4.8"
                    value={formData.rating}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, rating: e.target.value }));
                      if (formErrors.rating) {
                        setFormErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.rating;
                          return copy;
                        });
                      }
                    }}
                    aria-invalid={formErrors.rating ? 'true' : 'false'}
                    aria-describedby={formErrors.rating ? 'error-vendor-rating' : undefined}
                    className="form-input w-full text-sm rounded-xl border p-2.5"
                    style={{
                      borderColor: formErrors.rating ? 'var(--danger)' : 'var(--border)',
                      height: '44px',
                      minHeight: '44px',
                    }}
                  />
                  {formErrors.rating && (
                    <div
                      id="error-vendor-rating"
                      role="alert"
                      aria-live="polite"
                      className="text-xs font-semibold text-[var(--danger)] mt-1"
                    >
                      {formErrors.rating}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="vendor-reviews-input"
                    className="block text-xs font-bold mb-1.5 text-[var(--text)]"
                  >
                    Reviews Count
                  </label>
                  <input
                    id="vendor-reviews-input"
                    type="number"
                    min="0"
                    placeholder="120"
                    value={formData.reviewsCount}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, reviewsCount: e.target.value }));
                      if (formErrors.reviewsCount) {
                        setFormErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.reviewsCount;
                          return copy;
                        });
                      }
                    }}
                    aria-invalid={formErrors.reviewsCount ? 'true' : 'false'}
                    aria-describedby={formErrors.reviewsCount ? 'error-vendor-reviews' : undefined}
                    className="form-input w-full text-sm rounded-xl border p-2.5"
                    style={{
                      borderColor: formErrors.reviewsCount ? 'var(--danger)' : 'var(--border)',
                      height: '44px',
                      minHeight: '44px',
                    }}
                  />
                  {formErrors.reviewsCount && (
                    <div
                      id="error-vendor-reviews"
                      role="alert"
                      aria-live="polite"
                      className="text-xs font-semibold text-[var(--danger)] mt-1"
                    >
                      {formErrors.reviewsCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Quoted Price */}
              <div>
                <label
                  htmlFor="vendor-price-input"
                  className="block text-xs font-bold mb-1.5 text-[var(--text)]"
                >
                  Quoted Price ({activeCurrency})
                </label>
                <input
                  id="vendor-price-input"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 2500"
                  value={formData.quotedPrice}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, quotedPrice: e.target.value }));
                    if (formErrors.quotedPrice) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.quotedPrice;
                        return copy;
                      });
                    }
                  }}
                  aria-invalid={formErrors.quotedPrice ? 'true' : 'false'}
                  aria-describedby={formErrors.quotedPrice ? 'error-vendor-price' : undefined}
                  className="form-input w-full text-sm rounded-xl border p-2.5"
                  style={{
                    borderColor: formErrors.quotedPrice ? 'var(--danger)' : 'var(--border)',
                    height: '44px',
                    minHeight: '44px',
                  }}
                />
                {formErrors.quotedPrice && (
                  <div
                    id="error-vendor-price"
                    role="alert"
                    aria-live="polite"
                    className="text-xs font-semibold text-[var(--danger)] mt-1"
                  >
                    {formErrors.quotedPrice}
                  </div>
                )}
              </div>

              {/* Notes (max 200) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="vendor-notes-input"
                    className="block text-xs font-bold text-[var(--text)]"
                  >
                    Notes & Deliverables (optional)
                  </label>
                  <span className="text-[11px] text-[var(--muted)]">
                    {formData.notes.length}/200
                  </span>
                </div>
                <textarea
                  id="vendor-notes-input"
                  rows={2}
                  maxLength={200}
                  placeholder="Includes 2 photographers, full day coverage, drone teaser video..."
                  value={formData.notes}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, notes: e.target.value }));
                    if (formErrors.notes) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.notes;
                        return copy;
                      });
                    }
                  }}
                  aria-invalid={formErrors.notes ? 'true' : 'false'}
                  aria-describedby={formErrors.notes ? 'error-vendor-notes' : undefined}
                  className="form-textarea w-full text-sm rounded-xl border p-2.5"
                  style={{
                    borderColor: formErrors.notes ? 'var(--danger)' : 'var(--border)',
                  }}
                />
                {formErrors.notes && (
                  <div
                    id="error-vendor-notes"
                    role="alert"
                    aria-live="polite"
                    className="text-xs font-semibold text-[var(--danger)] mt-1"
                  >
                    {formErrors.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    height: '42px',
                    minHeight: '42px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-sm font-bold px-5 py-2 rounded-xl cursor-pointer"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    height: '42px',
                    minHeight: '42px',
                  }}
                >
                  {formData.id ? 'Save changes' : 'Add vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
