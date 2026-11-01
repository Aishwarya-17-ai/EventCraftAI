/**
 * EventCraft AI - Event Input Form Component
 * Accessible, responsive form featuring an interactive card grid for 13 event types,
 * conditional custom event input for 'others', debounced validation,
 * inline aria-describedby errors, and mobile collapsible card behavior.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Sparkles, Check, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { CurrencyCode, EVENT_TYPES, EventFormData, EventType, ValidationErrors } from '../lib/types';
import { validateEventForm, MAX_LENGTHS, LIMITS } from '../lib/validation';
import { getCurrencySymbol } from '../lib/formatters';
import { SmartIntake } from './SmartIntake';
import { IntakeNeedInput } from '../lib/intake';

interface EventFormProps {
  initialData: EventFormData;
  onSubmit: (data: EventFormData) => void;
  isLoading: boolean;
  currency: CurrencyCode;
  isMobile?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  currency,
  isMobile = false,
}) => {
  const [formData, setFormData] = useState<EventFormData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [inlineMissingErrors, setInlineMissingErrors] = useState<Record<string, string>>({});
  const [isCooldown, setIsCooldown] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(true);
  const debounceTimerRef = useRef<number | null>(null);

  // Sync external changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Debounced validation helper
  const runValidation = useCallback((data: EventFormData) => {
    const res = validateEventForm(data);
    setErrors(res.errors);
  }, []);

  const handleChange = (
    field: keyof EventFormData,
    value: string | number
  ) => {
    const updated: EventFormData = {
      ...formData,
      [field]: value,
    };
    setFormData(updated);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setInlineMissingErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      runValidation(updated);
    }, 250);
  };

  const handleBlur = (field: keyof EventFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runValidation(formData);
  };

  const handleApplyIntake = (
    values: Partial<EventFormData>,
    _needsInput: IntakeNeedInput[]
  ) => {
    const updated: EventFormData = {
      ...formData,
      ...values,
    };

    setFormData(updated);
    runValidation(updated);

    // Compute missing required fields to display inline "Please fill this in"
    const missing: Record<string, string> = {};
    const emptyKeys: string[] = [];

    if (!updated.eventType) {
      missing.eventType = 'Please fill this in';
      emptyKeys.push('eventType');
    }
    if (updated.eventType === 'others' && !updated.customEventType?.trim()) {
      missing.customEventType = 'Please fill this in';
      emptyKeys.push('customEventType');
    }
    if (!updated.name?.trim()) {
      missing.name = 'Please fill this in';
      emptyKeys.push('name');
    }
    if (!updated.date?.trim()) {
      missing.date = 'Please fill this in';
      emptyKeys.push('date');
    }
    if (!updated.guestCount || updated.guestCount <= 0) {
      missing.guestCount = 'Please fill this in';
      emptyKeys.push('guestCount');
    }
    if (!updated.totalBudget || updated.totalBudget <= 0) {
      missing.totalBudget = 'Please fill this in';
      emptyKeys.push('totalBudget');
    }
    if (!updated.city?.trim()) {
      missing.city = 'Please fill this in';
      emptyKeys.push('city');
    }

    setInlineMissingErrors(missing);

    // Shift focus to the first empty required field or to "Generate plan"
    setTimeout(() => {
      if (emptyKeys.length > 0) {
        const firstKey = emptyKeys[0];
        const elementId =
          firstKey === 'eventType'
            ? 'radio-wedding'
            : firstKey === 'customEventType'
            ? 'input-customEventType'
            : firstKey === 'guestCount'
            ? 'input-guests'
            : firstKey === 'totalBudget'
            ? 'input-budget'
            : `input-${firstKey}`;
        const el = document.getElementById(elementId);
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const submitBtn = document.getElementById('btn-generate-plan');
        submitBtn?.focus();
        submitBtn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isCooldown) return;

    // Mark all as touched
    const allTouched: Record<string, boolean> = {
      eventType: true,
      customEventType: true,
      name: true,
      date: true,
      guestCount: true,
      totalBudget: true,
      city: true,
      theme: true,
      notes: true,
    };
    setTouched(allTouched);

    const validation = validateEventForm(formData);
    setErrors(validation.errors);

    if (validation.isValid) {
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 2000);

      // On mobile, automatically collapse after plan is generated
      if (isMobile) {
        setIsMobileOpen(false);
      }

      onSubmit(formData);
    } else {
      // Auto-focus and scroll to the first invalid field
      const firstErrorKey = Object.keys(validation.errors)[0];
      if (firstErrorKey) {
        const inputId =
          firstErrorKey === 'eventType'
            ? 'radio-wedding'
            : firstErrorKey === 'customEventType'
            ? 'input-customEventType'
            : `input-${firstErrorKey}`;
        const el = document.getElementById(inputId);
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <section className="form-sidebar" aria-labelledby="form-heading">
      {/* Mobile Collapsible Header Toggle */}
      {isMobile && (
        <button
          type="button"
          className="mobile-collapse-trigger"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-expanded={isMobileOpen}
          aria-controls="event-form-content"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 className="w-4 h-4" />
            <span>{isMobileOpen ? 'Hide Event Details' : 'Edit Event Details'}</span>
          </span>
          {isMobileOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      )}

      {/* Form Content Card */}
      {(!isMobile || isMobileOpen) && (
        <div id="event-form-content" className="card">
          <h2 id="form-heading" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px', color: 'var(--primary)' }}>
            Plan Your Event
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Configure details to generate your adaptive timeline, exact budget, vendor checklist, and ideas.
          </p>

          {/* Smart Intake Card */}
          <SmartIntake
            selectedCurrency={currency}
            onApplyIntake={handleApplyIntake}
          />

          <form onSubmit={handleSubmit} noValidate>
            {/* Event Category: Responsive Grid of Selectable Cards */}
            <fieldset className="form-group" style={{ border: 'none', padding: 0 }}>
              <legend className="form-label" style={{ marginBottom: '8px' }}>
                <span>Event Category</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose one</span>
              </legend>

              <div
                className="event-type-grid"
                role="radiogroup"
                aria-label="Event Category"
                aria-describedby={
                  errors.eventType && touched.eventType
                    ? 'error-eventType'
                    : inlineMissingErrors.eventType
                    ? 'error-eventType'
                    : undefined
                }
              >
                {EVENT_TYPES.map((item) => {
                  const isChecked = formData.eventType === item.type;
                  return (
                    <label
                      key={item.type}
                      className={`event-type-card ${isChecked ? 'active' : ''}`}
                      htmlFor={`radio-${item.type}`}
                      style={{
                        borderColor: isChecked ? item.accent : undefined,
                        boxShadow: isChecked ? `0 0 0 2px ${item.accent}` : undefined,
                      }}
                    >
                      <input
                        type="radio"
                        id={`radio-${item.type}`}
                        name="eventType"
                        value={item.type}
                        checked={isChecked}
                        onChange={() => handleChange('eventType', item.type)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                      <span className="event-type-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="event-type-label">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              {((errors.eventType && touched.eventType) || inlineMissingErrors.eventType) && (
                <p id="error-eventType" className="form-error" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{(errors.eventType && touched.eventType) ? errors.eventType : inlineMissingErrors.eventType}</span>
                </p>
              )}
            </fieldset>

            {/* Conditional "Others" Description Field */}
            {formData.eventType === 'others' && (
              <div className="form-group">
                <label htmlFor="input-customEventType" className="form-label">
                  <span>Describe your event</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(formData.customEventType || '').length}/{MAX_LENGTHS.customEventType}
                  </span>
                </label>
                <input
                  id="input-customEventType"
                  type="text"
                  className={`form-input ${(errors.customEventType && touched.customEventType) || inlineMissingErrors.customEventType ? 'has-error' : ''}`}
                  placeholder="e.g. Science Fair, Pet Adoption Gala, Book Launch"
                  value={formData.customEventType || ''}
                  maxLength={MAX_LENGTHS.customEventType}
                  required
                  autoComplete="off"
                  onChange={(e) => handleChange('customEventType', e.target.value)}
                  onBlur={() => handleBlur('customEventType')}
                  aria-invalid={(errors.customEventType && touched.customEventType) || inlineMissingErrors.customEventType ? 'true' : 'false'}
                  aria-describedby={
                    errors.customEventType && touched.customEventType
                      ? 'error-customEventType'
                      : inlineMissingErrors.customEventType
                      ? 'error-customEventType'
                      : undefined
                  }
                />
                {((errors.customEventType && touched.customEventType) || inlineMissingErrors.customEventType) && (
                  <p id="error-customEventType" className="form-error" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{(errors.customEventType && touched.customEventType) ? errors.customEventType : inlineMissingErrors.customEventType}</span>
                  </p>
                )}
              </div>
            )}

            {/* Event Name */}
            <div className="form-group">
              <label htmlFor="input-name" className="form-label">
                <span>Event Name</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.name.length}/{MAX_LENGTHS.name}
                </span>
              </label>
              <input
                id="input-name"
                type="text"
                className={`form-input ${(errors.name && touched.name) || inlineMissingErrors.name ? 'has-error' : ''}`}
                placeholder="e.g. Maya & Arjun's Summer Wedding"
                value={formData.name}
                maxLength={MAX_LENGTHS.name}
                required
                autoComplete="off"
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                aria-invalid={(errors.name && touched.name) || inlineMissingErrors.name ? 'true' : 'false'}
                aria-describedby={
                  errors.name && touched.name
                    ? 'error-name'
                    : inlineMissingErrors.name
                    ? 'error-name'
                    : undefined
                }
              />
              {((errors.name && touched.name) || inlineMissingErrors.name) && (
                <p id="error-name" className="form-error" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{(errors.name && touched.name) ? errors.name : inlineMissingErrors.name}</span>
                </p>
              )}
            </div>

            {/* Event Date */}
            <div className="form-group">
              <label htmlFor="input-date" className="form-label">
                <span>Event Date</span>
              </label>
              <input
                id="input-date"
                type="date"
                min={todayStr}
                className={`form-input ${(errors.date && touched.date) || inlineMissingErrors.date ? 'has-error' : ''}`}
                value={formData.date}
                required
                onChange={(e) => handleChange('date', e.target.value)}
                onBlur={() => handleBlur('date')}
                aria-invalid={(errors.date && touched.date) || inlineMissingErrors.date ? 'true' : 'false'}
                aria-describedby={
                  errors.date && touched.date
                    ? 'error-date'
                    : inlineMissingErrors.date
                    ? 'error-date'
                    : undefined
                }
              />
              {((errors.date && touched.date) || inlineMissingErrors.date) && (
                <p id="error-date" className="form-error" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{(errors.date && touched.date) ? errors.date : inlineMissingErrors.date}</span>
                </p>
              )}
            </div>

            {/* Row: Guest Count & Total Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Guest Count */}
              <div className="form-group">
                <label htmlFor="input-guests" className="form-label">
                  <span>Guest Count</span>
                </label>
                <input
                  id="input-guests"
                  type="number"
                  inputMode="numeric"
                  min={LIMITS.minGuests}
                  max={LIMITS.maxGuests}
                  className={`form-input ${(errors.guestCount && touched.guestCount) || inlineMissingErrors.guestCount ? 'has-error' : ''}`}
                  placeholder="e.g. 150"
                  value={formData.guestCount || ''}
                  required
                  onChange={(e) => handleChange('guestCount', parseInt(e.target.value, 10) || 0)}
                  onBlur={() => handleBlur('guestCount')}
                  aria-invalid={(errors.guestCount && touched.guestCount) || inlineMissingErrors.guestCount ? 'true' : 'false'}
                  aria-describedby={
                    errors.guestCount && touched.guestCount
                      ? 'error-guestCount'
                      : inlineMissingErrors.guestCount
                      ? 'error-guestCount'
                      : undefined
                  }
                />
                {((errors.guestCount && touched.guestCount) || inlineMissingErrors.guestCount) && (
                  <p id="error-guestCount" className="form-error" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{(errors.guestCount && touched.guestCount) ? errors.guestCount : inlineMissingErrors.guestCount}</span>
                  </p>
                )}
              </div>

              {/* Total Budget */}
              <div className="form-group">
                <label htmlFor="input-budget" className="form-label">
                  <span>Budget ({currencySymbol})</span>
                </label>
                <input
                  id="input-budget"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="999999999"
                  step="any"
                  className={`form-input ${(errors.totalBudget && touched.totalBudget) || inlineMissingErrors.totalBudget ? 'has-error' : ''}`}
                  placeholder="e.g. 25000"
                  value={formData.totalBudget || ''}
                  required
                  onChange={(e) => handleChange('totalBudget', parseFloat(e.target.value) || 0)}
                  onBlur={() => handleBlur('totalBudget')}
                  aria-invalid={(errors.totalBudget && touched.totalBudget) || inlineMissingErrors.totalBudget ? 'true' : 'false'}
                  aria-describedby={
                    errors.totalBudget && touched.totalBudget
                      ? 'error-totalBudget'
                      : inlineMissingErrors.totalBudget
                      ? 'error-totalBudget'
                      : undefined
                  }
                />
                {((errors.totalBudget && touched.totalBudget) || inlineMissingErrors.totalBudget) && (
                  <p id="error-totalBudget" className="form-error" role="alert" aria-live="polite">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{(errors.totalBudget && touched.totalBudget) ? errors.totalBudget : inlineMissingErrors.totalBudget}</span>
                  </p>
                )}
              </div>
            </div>

            {/* City / Location */}
            <div className="form-group">
              <label htmlFor="input-city" className="form-label">
                <span>City / Destination</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.city.length}/{MAX_LENGTHS.city}
                </span>
              </label>
              <input
                id="input-city"
                type="text"
                className={`form-input ${(errors.city && touched.city) || inlineMissingErrors.city ? 'has-error' : ''}`}
                placeholder="e.g. Bengaluru, India or Austin, TX"
                value={formData.city}
                maxLength={MAX_LENGTHS.city}
                required
                autoComplete="address-level2"
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                aria-invalid={(errors.city && touched.city) || inlineMissingErrors.city ? 'true' : 'false'}
                aria-describedby={
                  errors.city && touched.city
                    ? 'error-city'
                    : inlineMissingErrors.city
                    ? 'error-city'
                    : undefined
                }
              />
              {((errors.city && touched.city) || inlineMissingErrors.city) && (
                <p id="error-city" className="form-error" role="alert" aria-live="polite">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{(errors.city && touched.city) ? errors.city : inlineMissingErrors.city}</span>
                </p>
              )}
            </div>

            {/* Theme & Aesthetic Preferences */}
            <div className="form-group">
              <label htmlFor="input-theme" className="form-label">
                <span>Theme / Aesthetic Preferences</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.theme.length}/{MAX_LENGTHS.theme}
                </span>
              </label>
              <textarea
                id="input-theme"
                className={`form-textarea ${errors.theme && touched.theme ? 'has-error' : ''}`}
                placeholder="e.g. Botanical romance with pastel florals, fairy lights, and live acoustic music"
                rows={2}
                value={formData.theme}
                maxLength={MAX_LENGTHS.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                onBlur={() => handleBlur('theme')}
                aria-invalid={errors.theme && touched.theme ? 'true' : 'false'}
                aria-describedby={errors.theme && touched.theme ? 'error-theme' : undefined}
              />
              {errors.theme && touched.theme && (
                <p id="error-theme" className="form-error" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.theme}</span>
                </p>
              )}
            </div>

            {/* Dietary / Cultural Notes */}
            <div className="form-group">
              <label htmlFor="input-notes" className="form-label">
                <span>Dietary & Cultural Notes (Optional)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.notes.length}/{MAX_LENGTHS.notes}
                </span>
              </label>
              <textarea
                id="input-notes"
                className={`form-textarea ${errors.notes && touched.notes ? 'has-error' : ''}`}
                placeholder="e.g. Traditional ceremony rituals, Halal & Jain options required, wheelchair accessibility"
                rows={2}
                value={formData.notes}
                maxLength={MAX_LENGTHS.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                onBlur={() => handleBlur('notes')}
                aria-invalid={errors.notes && touched.notes ? 'true' : 'false'}
                aria-describedby={errors.notes && touched.notes ? 'error-notes' : undefined}
              />
              {errors.notes && touched.notes && (
                <p id="error-notes" className="form-error" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.notes}</span>
                </p>
              )}
            </div>

            {/* Summary Validation Error Box */}
            {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
              <div
                role="alert"
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Please resolve the following issues:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                  {Object.entries(errors).map(([key, msg]) => (
                    <li key={key} style={{ marginTop: '2px' }}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-generate-plan"
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '6px', fontSize: '1rem', padding: '14px' }}
              disabled={isLoading || isCooldown}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-2" aria-hidden="true">⚙️</span>
                  <span>Generating Adaptive Plan...</span>
                </>
              ) : isCooldown ? (
                <>
                  <Check className="w-5 h-5 mr-1" />
                  <span>Plan Generated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-1" />
                  <span>Generate Event Plan</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
