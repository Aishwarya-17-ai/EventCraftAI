/**
 * EventCraft AI - Smart Event Intake Component
 * "Describe your event" card with voice recognition (English & Tamil),
 * character counter, instant extraction preview, and human review before application.
 * Fully WCAG 2.1 AA compliant with polite live announcements and keyboard accessibility.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, AlertCircle, CheckCircle2, ArrowRight, Edit2, Loader2 } from 'lucide-react';
import { CurrencyCode, EventFormData } from '../lib/types';
import { formatCurrency } from '../lib/formatters';
import {
  extractEventFromText,
  IntakeNeedInput,
  IntakeResult,
} from '../lib/intake';
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  SpeechRecognitionController,
} from '../lib/speech';

export interface SmartIntakeProps {
  selectedCurrency: CurrencyCode;
  onApplyIntake: (values: Partial<EventFormData>, needsInput: IntakeNeedInput[]) => void;
}

const MAX_CHARACTERS = 500;

/**
 * Deterministically formats an ISO date string (YYYY-MM-DD) into 'Sat, 7 Nov 2026'.
 */
function formatDateDisplay(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const SmartIntake: React.FC<SmartIntakeProps> = ({
  selectedCurrency,
  onApplyIntake,
}) => {
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Check speech recognition support on mount
  useEffect(() => {
    setIsSpeechSupported(isSpeechRecognitionSupported());
    return () => {
      // Cleanup on unmount
      recognitionRef.current?.abort();
    };
  }, []);

  const handleToggleVoice = () => {
    setVoiceError(null);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setLiveAnnouncement('Voice input stopped.');
      return;
    }

    setLiveAnnouncement('Listening... Speak now.');
    setIsListening(true);

    const controller = startSpeechRecognition({
      language,
      onTranscript: (transcript: string) => {
        setInputText(transcript.slice(0, MAX_CHARACTERS));
      },
      onError: (errMessage: string) => {
        setVoiceError(errMessage);
        setIsListening(false);
        setLiveAnnouncement(errMessage);
      },
      onEnd: () => {
        setIsListening(false);
        setLiveAnnouncement('Voice input finished.');
      },
    });

    recognitionRef.current = controller;
  };

  const handleFillForm = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const trimmed = inputText.trim();
    if (!trimmed) {
      setVoiceError('Please type or say a description of your event.');
      return;
    }

    setIsLoading(true);
    setVoiceError(null);
    setIntakeResult(null);
    setLiveAnnouncement('Analyzing your event description with AI...');

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayISO = `${y}-${m}-${d}`;

    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });

    try {
      const result = await extractEventFromText(
        trimmed,
        language,
        todayISO,
        weekday,
        selectedCurrency
      );

      setIntakeResult(result);

      if (result.isOffline || !result.success) {
        setLiveAnnouncement('AI is offline - please fill the form manually.');
      } else {
        const extractedCount = Object.keys(result.values).length;
        setLiveAnnouncement(
          `Extracted ${extractedCount} fields. Review what was understood before applying.`
        );
      }
    } catch {
      setIntakeResult({
        success: false,
        values: {},
        needsInput: [],
        errorMessage: 'AI is offline - please fill the form manually',
        isOffline: true,
      });
      setLiveAnnouncement('AI is offline - please fill the form manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!intakeResult || !intakeResult.success) return;

    onApplyIntake(intakeResult.values, intakeResult.needsInput);

    const missingCount = intakeResult.needsInput.length;
    setLiveAnnouncement(
      `Form filled. ${missingCount} field${missingCount === 1 ? '' : 's'} need your input.`
    );

    // Close preview panel
    setIntakeResult(null);
  };

  const handleEditSentence = () => {
    setIntakeResult(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const values = intakeResult?.values || {};
  const hasExtractedValues = Object.keys(values).length > 0;

  return (
    <div
      className="card"
      style={{
        marginBottom: '20px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '16px',
        borderRadius: 'var(--radius-card)',
      }}
      aria-labelledby="smart-intake-title"
    >
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {liveAnnouncement}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
            }}
            aria-hidden="true"
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <h3
            id="smart-intake-title"
            style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}
          >
            Describe your event
          </h3>
        </div>

        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label htmlFor="intake-language-select" style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
            Language:
          </label>
          <select
            id="intake-language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en-IN' | 'ta-IN')}
            disabled={isListening || isLoading}
            style={{
              padding: '4px 8px',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              minHeight: '36px',
            }}
            aria-label="Spoken and written language"
          >
            <option value="en-IN">English (India)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
          </select>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '10px' }}>
        Say or type it in one sentence, in English or Tamil.
      </p>

      {/* Input Area */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <label htmlFor="smart-intake-text" className="sr-only">
          Describe your event in one sentence
        </label>
        <textarea
          id="smart-intake-text"
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARACTERS))}
          placeholder={
            language === 'ta-IN'
              ? 'உதாரணம்: அடுத்த சனிக்கிழமை சென்னையில் 50 பேருக்கு பிறந்தநாள் விழா, 50000 ரூபாய் பட்ஜெட்'
              : 'e.g. Birthday party for 40 guests next Saturday, 50000 rupees, in Chennai'
          }
          maxLength={MAX_CHARACTERS}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: '#FAFCFF',
            fontSize: '0.9375rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
          disabled={isLoading}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: '0.75rem',
            color: inputText.length >= MAX_CHARACTERS ? 'var(--danger)' : 'var(--muted)',
            marginTop: '2px',
          }}
          aria-live="polite"
        >
          {inputText.length}/{MAX_CHARACTERS}
        </div>
      </div>

      {/* Voice unsupported or friendly errors */}
      {!isSpeechSupported && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '8px' }}>
          Voice input is not supported in this browser; type instead.
        </p>
      )}

      {voiceError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            marginBottom: '10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isSpeechSupported && (
          <button
            type="button"
            className={isListening ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={handleToggleVoice}
            disabled={isLoading}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              minHeight: '40px',
            }}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Voice input</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleFillForm}
          disabled={isLoading || !inputText.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 18px',
            minHeight: '40px',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Fill the form</span>
            </>
          )}
        </button>
      </div>

      {/* Offline Alert Box - only for NO_API_KEY */}
      {intakeResult && intakeResult.isOffline && (
        <div
          role="alert"
          style={{
            marginTop: '14px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            border: '1px solid #FDE68A',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>AI is offline - please fill the form manually</span>
        </div>
      )}

      {/* Specific Friendly Error Message Box for other errors */}
      {intakeResult && !intakeResult.success && !intakeResult.isOffline && intakeResult.errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: '14px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{intakeResult.errorMessage}</span>
        </div>
      )}

      {/* Review Panel: "Here is what I understood" */}
      {intakeResult && intakeResult.success && (
        <div
          style={{
            marginTop: '16px',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border)',
          }}
          aria-labelledby="intake-review-title"
        >
          <h4
            id="intake-review-title"
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--navy)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
            <span>Here is what I understood</span>
          </h4>

          {/* Extracted Fields Table */}
          {hasExtractedValues ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              {values.eventType && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Event Category</span>
                  <span style={reviewValueStyle}>
                    {values.eventType.replace('_', ' ')}
                  </span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {values.customEventType && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Custom Event</span>
                  <span style={reviewValueStyle}>{values.customEventType}</span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {values.name && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Event Name</span>
                  <span style={reviewValueStyle}>{values.name}</span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {values.date && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Event Date</span>
                  <span style={reviewValueStyle}>
                    {formatDateDisplay(values.date)}
                  </span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {typeof values.guestCount === 'number' && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Guest Count</span>
                  <span style={reviewValueStyle}>
                    {values.guestCount.toLocaleString()} attendees
                  </span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {typeof values.totalBudget === 'number' && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Total Budget</span>
                  <span style={reviewValueStyle}>
                    {formatCurrency(values.totalBudget, selectedCurrency)}
                  </span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {values.city && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Destination City</span>
                  <span style={reviewValueStyle}>{values.city}</span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {values.theme && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Preferences / Theme</span>
                  <span style={reviewValueStyle}>{values.theme}</span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}

              {values.notes && (
                <div style={reviewRowStyle}>
                  <span style={reviewLabelStyle}>Dietary Notes</span>
                  <span style={reviewValueStyle}>{values.notes}</span>
                  <span className="chip" style={aiChipStyle}>AI-filled</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '10px' }}>
              No complete fields could be recognized from your sentence.
            </p>
          )}

          {/* Needs Your Input List */}
          {intakeResult.needsInput.length > 0 && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
              }}
            >
              <h5
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#92400E',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Needs your input</span>
              </h5>
              <ul
                style={{
                  listStyleType: 'disc',
                  paddingLeft: '18px',
                  fontSize: '0.8125rem',
                  color: '#78350F',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {intakeResult.needsInput.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.field}:</strong> {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Human Review Decision Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                minHeight: '40px',
              }}
            >
              <span>Apply to form</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleEditSentence}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '40px',
              }}
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit sentence</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const reviewRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '6px 10px',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  border: '1px solid var(--border)',
  fontSize: '0.85rem',
};

const reviewLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--muted)',
  minWidth: '110px',
};

const reviewValueStyle: React.CSSProperties = {
  flex: 1,
  color: 'var(--text)',
  fontWeight: 500,
  wordBreak: 'break-word',
};

const aiChipStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary-soft)',
  color: 'var(--primary)',
  border: '1px solid rgba(29, 78, 216, 0.2)',
  fontSize: '0.75rem',
  padding: '2px 8px',
};
