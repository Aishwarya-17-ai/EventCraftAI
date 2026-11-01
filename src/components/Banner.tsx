/**
 * EventCraft AI - System Notification Banner
 */

import React from 'react';
import { WifiOff, Sparkles } from 'lucide-react';

interface BannerProps {
  isMockMode?: boolean;
  isOffline?: boolean;
}

export const Banner: React.FC<BannerProps> = ({ isMockMode, isOffline }) => {
  if (isOffline) {
    return (
      <aside className="banner banner-danger" role="status" aria-live="polite">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>Offline Mode:</strong> You are currently offline. EventCraft AI is operating from cached local data and deterministic offline logic.
          </span>
        </div>
      </aside>
    );
  }

  if (isMockMode) {
    return (
      <aside className="banner banner-warning" role="status" aria-live="polite">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>AI offline - showing sample suggestions:</strong> Operating in deterministic mock mode. All budget, timeline, and vendor features remain fully functional.
          </span>
        </div>
      </aside>
    );
  }

  return null;
};
