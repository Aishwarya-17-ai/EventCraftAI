/**
 * EventCraft AI - Header Navigation Component
 * Modern light-only dashboard header:
 * - Logo left (clean sparkle mark in rounded blue square + wordmark, AI in --primary, no grey box)
 * - Compact currency dropdown (visually hidden screen-reader label)
 * - Edit details, New event, Print, Sign out
 * - Styled buttons, evenly spaced, wrapping to a second row on mobile
 */

import React from 'react';
import {
  Sparkles,
  Printer,
  LogOut,
  Edit3,
  PlusCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CurrencyCode } from '../lib/types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  user: User | null;
  onLogout: () => void;
  currentPage?: 'login' | 'plan' | 'results';
  onNavigateToPlan?: () => void;
  onPlanNewEvent?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenCollab?: () => void;
  collaboratorCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onCurrencyChange,
  user,
  onLogout,
  currentPage = 'plan',
  onNavigateToPlan,
  onPlanNewEvent,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="app-header w-full flex items-center justify-between flex-wrap gap-3 py-2.5 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40" role="banner">
      {/* Left: Brand Logo + Wordmark on one line, no grey box */}
      <div className="brand-container flex items-center">
        <button
          type="button"
          onClick={onNavigateToPlan}
          className="flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer text-left focus:outline-none"
          aria-label="EventCraft AI Home"
        >
          <div className="brand-logo" aria-hidden="true">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="brand-title flex items-center font-extrabold text-lg sm:text-xl text-[var(--text)]">
            <span>EventCraft</span>
            <span className="brand-title-ai text-[var(--primary)] ml-1">AI</span>
          </div>
        </button>
      </div>

      {/* Right: Actions, evenly spaced in styled buttons, wrapping to second row on mobile */}
      <nav className="header-actions flex items-center flex-wrap gap-2" aria-label="Navigation and Settings">
        {/* Navigation buttons when on results dashboard */}
        {currentPage === 'results' && (
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToPlan && (
              <button
                type="button"
                onClick={onNavigateToPlan}
                className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
                style={{ height: '38px', minHeight: '38px' }}
                title="Edit event details"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="hidden sm:inline">Edit details</span>
              </button>
            )}
            {onPlanNewEvent && (
              <button
                type="button"
                onClick={onPlanNewEvent}
                className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-lg"
                style={{ height: '38px', minHeight: '38px' }}
                title="Plan a new event"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="hidden sm:inline">New event</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="icon-button btn-secondary rounded-lg flex items-center justify-center cursor-pointer"
              aria-label="Print event plan"
              title="Print event plan"
              style={{ height: '38px', minHeight: '38px', width: '38px', minWidth: '38px', padding: 0 }}
            >
              <Printer className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>
        )}

        {/* Compact Currency Dropdown with Visually Hidden Screen-Reader Label */}
        <div className="relative inline-flex items-center">
          <label htmlFor="currency-select" className="sr-only">
            Select Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="form-select text-xs font-semibold py-1 px-2.5 rounded-lg border cursor-pointer"
            style={{
              height: '38px',
              minHeight: '38px',
              width: 'auto',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
            }}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onLogout}
          className="icon-button btn-secondary rounded-lg flex items-center justify-center cursor-pointer"
          aria-label="Sign out"
          title={user ? `Signed in as ${user.email || 'User'}. Click to sign out.` : 'Sign out'}
          style={{ height: '38px', minHeight: '38px', width: '38px', minWidth: '38px', padding: 0 }}
        >
          <LogOut className="w-4 h-4 text-[var(--danger)]" />
        </button>
      </nav>
    </header>
  );
};
