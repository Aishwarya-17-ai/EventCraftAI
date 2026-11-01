/**
 * EventCraft AI - Budget Planner Tab
 * Part 1: Redesigned modern light-only job-board dashboard style
 * - 3 summary cards: Total Budget, Allocated, Remaining
 * - Responsive donut chart (pure CSS conic-gradient) with text legend
 * - Accessible table of categories with percentage, amount, and count of vendors added
 * - Accessible caption and th scope attributes
 */

import React, { useMemo } from 'react';
import { DollarSign, PieChart, Wallet } from 'lucide-react';
import { BudgetSummary } from '../lib/types';
import { formatCurrencyFromCents } from '../lib/formatters';

interface BudgetTabProps {
  budget: BudgetSummary;
  accentColor?: string;
  vendorCountsByCategory?: Record<string, number>;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  budget,
  vendorCountsByCategory = {},
}) => {
  // Compute allocated vs remaining
  const totalAllocatedCents = useMemo(() => {
    return budget.categories.reduce((acc, cat) => acc + cat.amountCents, 0);
  }, [budget.categories]);

  const remainingCents = useMemo(() => {
    return Math.max(0, budget.totalCents - totalAllocatedCents);
  }, [budget.totalCents, totalAllocatedCents]);

  // Build conic-gradient for the pure CSS Donut Chart
  let cumulativePercent = 0;
  const gradientStops = budget.categories.map((cat) => {
    const start = cumulativePercent;
    cumulativePercent += cat.percent;
    return `${cat.color} ${start}% ${cumulativePercent}%`;
  });
  const conicStyle = {
    background: `conic-gradient(${gradientStops.join(', ')})`,
  };

  return (
    <section
      role="tabpanel"
      id="panel-budget"
      aria-labelledby="tab-budget"
      className="space-y-6"
    >
      {/* 1. Three Summary Cards: Total Budget, Allocated, Remaining */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Total Budget */}
        <div className="card card-hoverable flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
            }}
          >
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Total Budget
            </p>
            <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--text)' }}>
              {formatCurrencyFromCents(budget.totalCents, budget.currency)}
            </p>
          </div>
        </div>

        {/* Card 2: Allocated */}
        <div className="card card-hoverable flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
            }}
          >
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Allocated
            </p>
            <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--text)' }}>
              {formatCurrencyFromCents(totalAllocatedCents, budget.currency)}
            </p>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className="card card-hoverable flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
            }}
          >
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Remaining Buffer
            </p>
            <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--success)' }}>
              {remainingCents > 0
                ? formatCurrencyFromCents(remainingCents, budget.currency)
                : budget.contingencyFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Responsive Donut Chart with Text Legend */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Budget Allocation Breakdown
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Proportional distribution by event category
            </p>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
            }}
          >
            {budget.categories.length} Categories
          </span>
        </div>

        <div className="donut-chart-container">
          {/* Pure CSS Donut */}
          <div
            className="css-donut"
            style={conicStyle}
            role="img"
            aria-label={`Donut chart showing allocation of ${formatCurrencyFromCents(
              budget.totalCents,
              budget.currency
            )} across ${budget.categories.length} categories`}
          >
            <div className="donut-hole">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                TOTAL
              </span>
              <span className="text-base font-extrabold" style={{ color: 'var(--text)' }}>
                {formatCurrencyFromCents(budget.totalCents, budget.currency)}
              </span>
            </div>
          </div>

          {/* Text Legend */}
          <div className="legend-grid" aria-label="Budget chart legend">
            {budget.categories.map((cat) => (
              <div key={cat.id} className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                  {cat.percent}%
                </span>
                <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Accessible Table of Categories */}
      <div className="card">
        <div
          className="table-scroll-container"
          tabIndex={0}
          role="region"
          aria-label="Scrollable budget allocations table"
        >
          <table className="accessible-table">
            <caption>Category Allocations and Per-Guest Breakdown</caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Share</th>
                <th scope="col">Allocated Amount</th>
                <th scope="col">Vendors Added</th>
                <th scope="col">Scope & Notes</th>
              </tr>
            </thead>
            <tbody>
              {budget.categories.map((cat) => {
                const vendorCount = vendorCountsByCategory[cat.id] || 0;
                return (
                  <tr key={cat.id}>
                    <th scope="row">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-sm">{cat.name}</span>
                      </div>
                    </th>
                    <td className="text-sm font-semibold">{cat.percent}%</td>
                    <td className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {cat.amountFormatted}
                    </td>
                    <td className="text-sm">
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-md"
                        style={{
                          backgroundColor: vendorCount > 0 ? 'var(--primary-soft)' : '#F1F5F9',
                          color: vendorCount > 0 ? 'var(--primary)' : 'var(--muted)',
                        }}
                      >
                        {vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--muted)' }}>
                      {cat.description || `${cat.costPerGuestFormatted} / guest`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 800, backgroundColor: 'var(--bg)' }}>
                <th scope="row">TOTAL</th>
                <td>100%</td>
                <td>{formatCurrencyFromCents(budget.totalCents, budget.currency)}</td>
                <td>
                  {Object.values(vendorCountsByCategory).reduce((a, b) => a + b, 0)} total
                </td>
                <td className="text-xs">
                  Exact integer allocation ({budget.costPerGuestFormatted} / guest)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};
