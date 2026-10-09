'use client';

import React, { useState, useEffect } from 'react';
import { useSecurity } from '@/context/SecurityContext';
import { Lock, ShieldCheck, Delete, ArrowRight, AlertTriangle, Fingerprint } from 'lucide-react';

export default function SecurityPinModal() {
  const { isLocked, unlockApp, remainingAttempts, isLockedOut } = useSecurity();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Reset PIN when lock screen is activated
  useEffect(() => {
    if (isLocked) {
      setPin('');
      setErrorMsg('');
    }
  }, [isLocked]);

  if (!isLocked) return null;

  // Auto-submit on typing 6th digit
  const handleDigitPress = (digit: string) => {
    if (isLoading || isLockedOut) return;
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');

      if (newPin.length === 6) {
        triggerSubmit(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading || isLockedOut) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    if (isLoading || isLockedOut) return;
    setPin('');
    setErrorMsg('');
  };

  const triggerSubmit = async (pinToSubmit: string) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await unlockApp(pinToSubmit);
      if (!result.success) {
        setErrorMsg(result.error || 'Incorrect PIN');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPin('');
      }
    } catch {
      setErrorMsg('Authentication error. Try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick keyboard numeric input listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocked) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pin, isLoading, isLockedOut]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#121316]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none touch-none animate-in fade-in duration-300"
      style={{ isolation: 'isolate' }}
    >
      <div
        className={`w-full max-w-sm flex flex-col items-center text-center space-y-6 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Brand Shield & Title */}
        <div className="flex flex-col items-center space-y-2">
          <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#f5ba41] shadow-2xl relative">
            <Lock className="h-8 w-8 text-[#f5ba41]" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            Master Security PIN
          </h2>
          <p className="text-xs text-[#9a9ba0] max-w-xs font-medium">
            Enter your 6-digit enterprise security PIN to unlock financial ledgers & Tally records.
          </p>
        </div>

        {/* 6-Circle PIN Indicator */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`h-4 w-4 rounded-full transition-all duration-200 border ${
                  isFilled
                    ? 'bg-[#f5ba41] border-[#f5ba41] scale-110 shadow-lg shadow-[#f5ba41]/40 ring-4 ring-[#f5ba41]/20'
                    : 'bg-white/5 border-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* Error or Warning Message */}
        {errorMsg && (
          <div className="px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLockedOut && (
          <div className="text-xs text-amber-400 font-bold">
            Security Lockout Active. Please wait before retrying.
          </div>
        )}

        {/* Touch / Click Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isLoading || isLockedOut}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-[#f5ba41]/20 active:scale-95 border border-white/5 text-xl font-bold text-white transition flex flex-col items-center justify-center disabled:opacity-40"
            >
              <span>{digit}</span>
            </button>
          ))}

          {/* Clear Key */}
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || isLockedOut || pin.length === 0}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-xs font-bold text-[#8c8d8f] hover:text-white transition flex items-center justify-center disabled:opacity-40"
          >
            Clear
          </button>

          {/* '0' Key */}
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isLoading || isLockedOut}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-[#f5ba41]/20 active:scale-95 border border-white/5 text-xl font-bold text-white transition flex flex-col items-center justify-center disabled:opacity-40"
          >
            <span>0</span>
          </button>

          {/* Backspace Key */}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isLoading || isLockedOut || pin.length === 0}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-sm font-bold text-white transition flex items-center justify-center disabled:opacity-40"
            aria-label="Delete"
          >
            <Delete className="h-5 w-5 text-[#8c8d8f] hover:text-white" />
          </button>
        </div>

        {/* Loading Spinner or Helper Note */}
        <div className="text-[11px] text-[#6c6d70] pt-1 flex items-center gap-1.5">
          {isLoading ? (
            <span className="text-[#f5ba41] animate-pulse font-bold flex items-center gap-1">
              Verifying master key hash...
            </span>
          ) : (
            <span>Default Master PIN: <code className="text-white font-mono">123456</code></span>
          )}
        </div>
      </div>
    </div>
  );
}
