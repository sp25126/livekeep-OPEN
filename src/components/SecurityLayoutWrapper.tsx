'use client';

import React from 'react';
import { SecurityProvider, useSecurity } from '@/context/SecurityContext';
import SecurityPinModal from '@/components/SecurityPinModal';

function SecurityEnforcer({ children }: { children: React.ReactNode }) {
  const { isLocked } = useSecurity();

  return (
    <>
      {/* 6-Digit Master Security PIN Lock Screen Overlay */}
      <SecurityPinModal />

      {/* Main App Content: Completely hidden, blurred, and un-interactive when locked */}
      <div
        className={`w-full min-h-screen transition-all duration-300 ${
          isLocked
            ? 'filter blur-3xl opacity-0 pointer-events-none select-none invisible overflow-hidden max-h-0'
            : 'filter-none opacity-100'
        }`}
        aria-hidden={isLocked}
      >
        {children}
      </div>
    </>
  );
}

export default function SecurityLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SecurityProvider>
      <SecurityEnforcer>{children}</SecurityEnforcer>
    </SecurityProvider>
  );
}
