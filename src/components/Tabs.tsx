/**
 * EventCraft AI - Navigation Tabs Component
 * WAI-ARIA compliant tabs with role tablist/tab/tabpanel, roving tabindex,
 * and keyboard arrow navigation (Left, Right, Home, End).
 */

import React, { useRef } from 'react';
import {
  Calculator,
  CalendarDays,
  CheckSquare,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';

export type TabId = 'budget' | 'timeline' | 'vendors' | 'ideas' | 'chat';

interface TabDefinition {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDefinition[] = [
  { id: 'budget', label: 'Budget', icon: <Calculator className="w-4 h-4" /> },
  { id: 'timeline', label: 'Timeline', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'vendors', label: 'Vendors', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'ideas', label: 'Ideas', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
  isMobile: boolean;
  accentColor?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange,
  children,
  isMobile,
  accentColor = 'var(--primary)',
}) => {
  const tabRefs = useRef<Map<TabId, HTMLButtonElement | null>>(new Map());

  const handleKeyDown = (e: React.KeyboardEvent, currentId: TabId) => {
    const currentIndex = TABS.findIndex((t) => t.id === currentId);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % TABS.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      e.preventDefault();
    } else if (e.key === 'Home') {
      nextIndex = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      nextIndex = TABS.length - 1;
      e.preventDefault();
    }

    if (nextIndex !== currentIndex) {
      const nextTab = TABS[nextIndex];
      onTabChange(nextTab.id);
      tabRefs.current.get(nextTab.id)?.focus();
    }
  };

  return (
    <div className="tabs-container" style={{ width: '100%' }}>
      {/* Top Tab Bar (Visible on tablets & desktop, or mobile header) */}
      <div
        className="tablist-top"
        role="tablist"
        aria-label="Event Planning Sections"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current.set(tab.id, el);
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className="tab-btn"
              style={
                isSelected
                  ? {
                      color: 'var(--primary)',
                      borderBottom: '2px solid var(--primary)',
                      fontWeight: 700,
                      backgroundColor: 'transparent',
                    }
                  : {
                      color: 'var(--muted)',
                      borderBottom: '2px solid transparent',
                      backgroundColor: 'transparent',
                    }
              }
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div style={{ marginTop: '20px' }}>
        {children}
      </div>

      {/* Fixed Bottom Bar on Mobile screens */}
      {isMobile && (
        <nav
          className="mobile-bottom-tabs"
          role="tablist"
          aria-label="Mobile Navigation Tabs"
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={`mobile-${tab.id}`}
                role="tab"
                id={`mobile-tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                className="mobile-tab-item"
                style={isSelected ? { color: accentColor } : undefined}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
