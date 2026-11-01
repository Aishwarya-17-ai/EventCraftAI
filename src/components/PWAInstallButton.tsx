/**
 * EventCraft AI - In-App PWA Install Button
 */

import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="btn-secondary"
        aria-label="Install EventCraft AI app to your device"
        title="Install EventCraft AI"
      >
        <Download className="w-4 h-4 text-accent" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="btn-secondary"
          aria-label="How to install on iOS"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-modal-title"
          >
            <div className="card" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="icon-button"
                style={{ position: 'absolute', top: '14px', right: '14px' }}
                aria-label="Close installation guide"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 id="ios-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>
                Install EventCraft on iOS
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Install EventCraft AI on your home screen for instant offline access:
              </p>
              <ol style={{ paddingLeft: '20px', lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--text)' }}>
                <li>Tap the <strong>Share</strong> button in the Safari toolbar (square with arrow).</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
