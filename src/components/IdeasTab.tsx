/**
 * EventCraft AI - Personalized Ideas Tab
 * Displays themes, decor, menu, activities, and 3 money-saving tips.
 * XSS-safe (text only, no innerHTML), with accessible skeleton loading states.
 */

import React from 'react';
import {
  Palette,
  Sparkles,
  Utensils,
  PartyPopper,
  PiggyBank,
  RefreshCw,
} from 'lucide-react';
import { PersonalizedIdeas } from '../lib/types';

interface IdeasTabProps {
  ideas: PersonalizedIdeas | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

export const IdeasTab: React.FC<IdeasTabProps> = ({
  ideas,
  isLoading,
  onRegenerate,
}) => {
  if (isLoading) {
    return (
      <section
        role="tabpanel"
        id="panel-ideas"
        aria-labelledby="tab-ideas"
        aria-busy="true"
        className="space-y-6"
      >
        <div className="card">
          <div className="skeleton" style={{ height: '24px', width: '200px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }} />
          </div>
        </div>

        <div className="card">
          <div className="skeleton" style={{ height: '20px', width: '180px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton" style={{ height: '60px' }} />
            <div className="skeleton" style={{ height: '60px' }} />
            <div className="skeleton" style={{ height: '60px' }} />
          </div>
        </div>
      </section>
    );
  }

  if (!ideas) {
    return (
      <section
        role="tabpanel"
        id="panel-ideas"
        aria-labelledby="tab-ideas"
        className="card text-center py-12"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          No suggestions generated yet. Click "Generate Event Plan" to receive bespoke ideas.
        </p>
        <button onClick={onRegenerate} className="btn-primary">
          <Sparkles className="w-4 h-4 mr-2" />
          <span>Generate Ideas</span>
        </button>
      </section>
    );
  }

  return (
    <section
      role="tabpanel"
      id="panel-ideas"
      aria-labelledby="tab-ideas"
      className="space-y-6"
    >
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Personalized Creative Ideas</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Curated recommendations tailored specifically to your event vision and budget.
          </p>
        </div>
        <button
          onClick={onRegenerate}
          className="btn-secondary"
          aria-label="Refresh and regenerate event ideas"
        >
          <RefreshCw className="w-4 h-4 text-btn" />
          <span>Refresh Ideas</span>
        </button>
      </div>

      {/* 1. Theme Concepts */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Palette className="w-5 h-5 text-primary" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Curated Theme Concepts</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {ideas.themes.map((theme, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                {theme.title}
              </h5>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {theme.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Decor Ideas */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles className="w-5 h-5 text-accent" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>High-Impact Decor Installations</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {ideas.decor.map((d, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                {d.item}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {d.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Menu Recommendations */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Utensils className="w-5 h-5 text-primary" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recommended Menu & Beverages</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ideas.menu.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--btn)',
                  }}
                >
                  {m.course}
                </span>
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
                  {m.dish}
                </p>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                {m.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Guest Activities */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PartyPopper className="w-5 h-5 text-btn" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Engaging Guest Activities</h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {ideas.activities.map((act, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg)',
              }}
            >
              <h5 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                {act.title}
              </h5>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {act.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Exactly 3 Money Saving Tips */}
      <div
        className="card"
        style={{
          border: '1.5px solid var(--success)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <PiggyBank className="w-5 h-5 text-success" />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            3 Smart Money-Saving Tips
          </h4>
        </div>
        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ideas.moneySavingTips.map((tip, idx) => (
            <li key={idx} style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>
              {tip}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
