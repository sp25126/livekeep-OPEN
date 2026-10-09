'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface SecurityContextType {
  isLocked: boolean;
  autoLockMinutes: number;
  lastActiveTimestamp: number;
  remainingAttempts: number;
  isLockedOut: boolean;
  unlockApp: (pin: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; lockedOut?: boolean }>;
  lockApp: () => void;
  updateSecurityConfig: (currentPin: string, newPin: string, minutes?: number) => Promise<{ success: boolean; error?: string }>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'livekeep_pin_session';
const DEFAULT_AUTO_LOCK_MINUTES = 3;

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  // Always lock initially to enforce Zero-Trust access control
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(DEFAULT_AUTO_LOCK_MINUTES);
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lock the application immediately
  const lockApp = useCallback(() => {
    setIsLocked(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  // Update user activity timestamp
  const recordActivity = useCallback(() => {
    if (!isLocked) {
      setLastActiveTimestamp(Date.now());
    }
  }, [isLocked]);

  // Setup user interaction event listeners
  useEffect(() => {
    if (isLocked) return;

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          recordActivity();
          throttleTimeout = null;
        }, 1000); // Throttle activity updates to once per second
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic inactivity scanner (checks every 5 seconds)
    timerRef.current = setInterval(() => {
      if (lastActiveTimestamp === 0) return;
      const elapsed = Date.now() - lastActiveTimestamp;
      const timeoutThreshold = autoLockMinutes * 60 * 1000;
      if (elapsed > timeoutThreshold) {
        console.warn(`[SecurityContext] Inactivity timeout reached (${autoLockMinutes}m). Locking app.`);
        lockApp();
      }
    }, 5000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (timerRef.current) clearInterval(timerRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isLocked, lastActiveTimestamp, autoLockMinutes, recordActivity, lockApp]);

  // Check existing session on mount
  useEffect(() => {
    setLastActiveTimestamp(Date.now());
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
            setIsLocked(false);
            if (parsed.autoLockMinutes) {
              setAutoLockMinutes(parsed.autoLockMinutes);
            }
          } else {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
            setIsLocked(true);
          }
        } catch {
          setIsLocked(true);
        }
      }
    }
  }, []);

  // Unlock application with 6-digit Master PIN
  const unlockApp = async (pin: string) => {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsLocked(false);
        setIsLockedOut(false);
        setRemainingAttempts(5);
        setLastActiveTimestamp(Date.now());

        if (data.autoLockMinutes) {
          setAutoLockMinutes(data.autoLockMinutes);
        }

        if (typeof window !== 'undefined' && data.token) {
          sessionStorage.setItem(
            SESSION_TOKEN_KEY,
            JSON.stringify({
              token: data.token,
              expiresAt: Date.now() + (data.autoLockMinutes || 3) * 60 * 1000,
              autoLockMinutes: data.autoLockMinutes || 3
            })
          );
        }

        return { success: true };
      } else {
        if (data.lockedOut) {
          setIsLockedOut(true);
        }
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        return {
          success: false,
          error: data.error || 'Invalid Master Security PIN',
          remainingAttempts: data.remainingAttempts,
          lockedOut: data.lockedOut
        };
      }
    } catch (err: any) {
      return { success: false, error: 'Network error verifying security PIN.' };
    }
  };

  // Update Master Security PIN
  const updateSecurityConfig = async (currentPin: string, newPin: string, minutes?: number) => {
    try {
      const res = await fetch('/api/auth/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin, autoLockMinutes: minutes })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (minutes) setAutoLockMinutes(minutes);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update Master PIN.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network exception.' };
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        autoLockMinutes,
        lastActiveTimestamp,
        remainingAttempts,
        isLockedOut,
        unlockApp,
        lockApp,
        updateSecurityConfig
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
