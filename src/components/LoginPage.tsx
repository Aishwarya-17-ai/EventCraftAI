/**
 * EventCraft AI - Dedicated Login & Authentication Page
 * Simple, centered mobile-style login screen (no header, no footer).
 * Top of card: Logo mark (sparkle in rounded blue square) + "EventCraft AI" with "AI" in --primary.
 * Form: Email (inside left icon), Password (inside left lock, right eye toggle), Primary 48px button,
 * "or" divider, 48px "Continue with Google", mode toggle link, "Forgot password?" link (signin only).
 * Nothing renders below the card.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react';
import { CurrencyCode } from '../lib/types';

interface LoginPageProps {
  onGoogleLogin: () => void;
  onGuestContinue?: () => void;
  onEmailSignIn?: (email: string) => void;
  currency?: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  authError?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoogleLogin,
  onEmailSignIn,
  authError,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus email input when switching modes
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [mode]);

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setEmailError(null);
    setPasswordError(null);
    setGenericError(null);
    setForgotPasswordNotice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setGenericError(null);
    setForgotPasswordNotice(null);

    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    if (!passwordInput || (mode === 'signup' && passwordInput.length < 8) || (mode === 'signin' && passwordInput.length < 6)) {
      setPasswordError(mode === 'signup' ? 'Password must be at least 8 characters.' : 'Password is required.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      if (onEmailSignIn) {
        onEmailSignIn(trimmedEmail);
      }
    } catch {
      setGenericError('Unable to sign in. Please check your credentials or try again.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    if (!emailInput.trim()) {
      setEmailError('Please enter your email address to receive reset instructions.');
      emailInputRef.current?.focus();
      return;
    }
    setForgotPasswordNotice(`Password reset instructions sent to ${emailInput.trim()}.`);
  };

  const activeError = genericError || authError;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Centered Column (max-width: 420px) */}
      <div className="w-full max-w-[420px] mx-auto">
        {/* Centered White Card */}
        <div
          className="card w-full p-6 sm:p-8 rounded-2xl shadow-lg border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          {/* Top: Logo Mark (Sparkle in rounded blue square) + "EventCraft AI" + Tagline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2.5 mb-2">
              <div className="brand-logo" aria-hidden="true">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1
                aria-label="EventCraft AI"
                className="text-2xl font-black tracking-tight flex items-center"
                style={{ color: 'var(--text)' }}
              >
                <span>EventCraft</span>
                <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>AI</span>
              </h1>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
              Plan unforgettable events, effortlessly.
            </p>
          </div>

          {/* Generic Error Announcement */}
          {activeError && (
            <div
              id="login-error-alert"
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 rounded-xl text-xs font-semibold border"
              style={{
                backgroundColor: 'var(--danger-bg)',
                borderColor: 'var(--danger)',
                color: 'var(--danger)',
              }}
            >
              {activeError}
            </div>
          )}

          {/* Forgot Password Announcement */}
          {forgotPasswordNotice && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 p-3 rounded-xl text-xs font-semibold border"
              style={{
                backgroundColor: 'var(--success-bg)',
                borderColor: 'var(--success)',
                color: 'var(--success)',
              }}
            >
              {forgotPasswordNotice}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 1. Email Field with inside-field left mail icon */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold mb-1.5"
                style={{ color: 'var(--text)' }}
              >
                Email address
              </label>
              <div className="input-wrap relative">
                <Mail
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--muted)' }}
                  aria-hidden="true"
                />
                <input
                  ref={emailInputRef}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (emailError) setEmailError(null);
                    if (genericError) setGenericError(null);
                  }}
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-input-error' : undefined}
                  className={`form-input text-sm pl-11 pr-3 rounded-xl w-full ${emailError ? 'has-error' : ''}`}
                  style={{
                    height: '44px',
                    minHeight: '44px',
                    paddingLeft: '44px',
                    borderColor: emailError ? 'var(--danger)' : 'var(--border)',
                  }}
                />
              </div>
              {emailError && (
                <div
                  id="email-input-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs font-semibold mt-1"
                  style={{ color: 'var(--danger)' }}
                >
                  {emailError}
                </div>
              )}
            </div>

            {/* 2. Password Field with inside-field left lock icon and right eye button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold"
                  style={{ color: 'var(--text)' }}
                >
                  Password
                </label>
              </div>
              <div className="input-wrap relative">
                <Lock
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--muted)' }}
                  aria-hidden="true"
                />
                <input
                  ref={passwordInputRef}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (genericError) setGenericError(null);
                  }}
                  aria-invalid={passwordError ? 'true' : 'false'}
                  aria-describedby={
                    passwordError
                      ? 'password-input-error'
                      : mode === 'signup'
                      ? 'password-hint'
                      : undefined
                  }
                  className={`form-input text-sm pl-11 pr-11 rounded-xl w-full ${passwordError ? 'has-error' : ''}`}
                  style={{
                    height: '44px',
                    minHeight: '44px',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    borderColor: passwordError ? 'var(--danger)' : 'var(--border)',
                  }}
                />
                {/* Show/Hide password toggle button with aria-pressed */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  style={{ color: 'var(--muted)', minHeight: '36px', minWidth: '36px' }}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Only ONE short hint line, shown in signup mode only */}
              {mode === 'signup' && (
                <p
                  id="password-hint"
                  className="text-[11px] mt-1"
                  style={{ color: 'var(--muted)' }}
                >
                  At least 8 characters.
                </p>
              )}

              {passwordError && (
                <div
                  id="password-input-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs font-semibold mt-1"
                  style={{ color: 'var(--danger)' }}
                >
                  {passwordError}
                </div>
              )}
            </div>

            {/* 3. Full-width primary button, 48px tall */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full text-sm font-bold rounded-xl mt-2 cursor-pointer"
              style={{
                height: '48px',
                minHeight: '48px',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
              }}
            >
              <span>
                {isSubmitting
                  ? 'Please wait...'
                  : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
              </span>
            </button>
          </form>

          {/* 4. Divider with the word "or" */}
          <div className="login-divider relative my-5 flex items-center justify-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            <span
              className="absolute px-3 text-xs uppercase font-bold tracking-wider"
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--muted)',
              }}
            >
              or
            </span>
          </div>

          {/* 5. Full-width "Continue with Google" button: 48px, white, bordered, 20px inline SVG Google G */}
          <button
            type="button"
            onClick={onGoogleLogin}
            className="google-btn w-full flex items-center justify-center gap-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            style={{
              height: '48px',
              minHeight: '48px',
              backgroundColor: '#FFFFFF',
              color: 'var(--text)',
              borderColor: 'var(--border)',
            }}
            aria-label="Continue with Google"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="w-5 h-5 flex-shrink-0"
              aria-hidden="true"
              style={{ width: '20px', height: '20px' }}
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 6. Below the buttons, centered text link: mode switch */}
          <div className="w-full text-center mt-5">
            {mode === 'signin' ? (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold hover:underline cursor-pointer transition-colors"
                  style={{
                    color: 'var(--primary)',
                    background: 'transparent',
                    border: 'none',
                    padding: '0 2px',
                  }}
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-bold hover:underline cursor-pointer transition-colors"
                  style={{
                    color: 'var(--primary)',
                    background: 'transparent',
                    border: 'none',
                    padding: '0 2px',
                  }}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

          {/* 7. "Forgot password?" small link, signin mode only */}
          {mode === 'signin' && (
            <div className="w-full text-center mt-3">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium hover:underline cursor-pointer transition-colors"
                style={{
                  color: 'var(--muted)',
                  background: 'transparent',
                  border: 'none',
                }}
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
        {/* REMOVED: Nothing renders below the card */}
      </div>
    </div>
  );
};
