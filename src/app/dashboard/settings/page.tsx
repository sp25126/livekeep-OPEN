'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Building, 
  User, 
  Sparkles,
  RefreshCw,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'security' | 'profile'>('security');
  
  // Current Auth User State
  const [userEmail, setUserEmail] = useState<string>('admin@livekeeping.com');
  const [userId, setUserId] = useState<string>('');
  const [lastSignIn, setLastSignIn] = useState<string>('');

  // Password Reset Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showReLoginPrompt, setShowReLoginPrompt] = useState(false);
  const [reLoginCountdown, setReLoginCountdown] = useState(5);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || 'admin@livekeeping.com');
          setUserId(user.id);
          if (user.last_sign_in_at) {
            setLastSignIn(new Date(user.last_sign_in_at).toLocaleString('en-IN'));
          }
        }
      } catch (err) {
        console.log('Local session active');
      }
    }
    loadCurrentUser();
  }, []);

  // Re-login Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showReLoginPrompt && reLoginCountdown > 0) {
      timer = setTimeout(() => {
        setReLoginCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showReLoginPrompt && reLoginCountdown === 0) {
      handleImmediateReLogin();
    }
    return () => clearTimeout(timer);
  }, [showReLoginPrompt, reLoginCountdown]);

  const handleImmediateReLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('Logged out');
    }
    window.location.href = '/login';
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(null);

    if (newPassword.length < 8) {
      setToastMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMessage({
        type: 'error',
        text: 'New password and confirmation password do not match.'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setToastMessage({
          type: 'error',
          text: error.message || 'Failed to update password. Please verify current session.'
        });
      } else {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setToastMessage({
          type: 'success',
          text: 'Admin password updated successfully! Session credentials have been refreshed.'
        });
        setNewPassword('');
        setConfirmPassword('');
        setShowReLoginPrompt(true);
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred while communicating with Supabase Auth.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecebe6] text-[#232528] p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e3dc] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2.5 rounded-full bg-[#fafaf8] hover:bg-[#edece6] text-[#232528] transition btn-pill border border-[#e5e3dc]"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#232528] tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#f5ba41]" /> Admin Settings
              </h1>
              <p className="text-xs text-[#88898b]">Manage system credentials, authentication, and security preferences</p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-[#e5e3dc] pb-3">
          <button
            onClick={() => setActiveTab('security')}
            className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition btn-pill flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-[#232528] text-white shadow-sm'
                : 'text-[#88898b] hover:text-[#232528] hover:bg-[#f6f5f0]'
            }`}
          >
            <KeyRound className="h-4 w-4 text-[#f5ba41]" /> Security & Password
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition btn-pill flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#232528] text-white shadow-sm'
                : 'text-[#88898b] hover:text-[#232528] hover:bg-[#f6f5f0]'
            }`}
          >
            <Building className="h-4 w-4" /> Company & Organization
          </button>
        </div>

        {/* ================= TAB 1: SECURITY SETTINGS ================= */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Toast Notification Banner */}
            {toastMessage && (
              <div className={`p-4 rounded-[24px] text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
                toastMessage.type === 'success' 
                  ? 'bg-[#D2DEC9] text-[#2b3e24] border border-[#bccbb2]' 
                  : 'bg-[#F8D7DA] text-[#721C24] border border-rose-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {toastMessage.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-[#2b3e24] shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[#721C24] shrink-0" />
                  )}
                  <span>{toastMessage.text}</span>
                </div>
                <button 
                  onClick={() => setToastMessage(null)} 
                  className="text-xs opacity-60 hover:opacity-100 font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Re-login Modal Dialog */}
            {showReLoginPrompt && (
              <div className="p-6 rounded-[28px] bg-[#232528] text-white shadow-2xl border-2 border-[#f5ba41]/50 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#f5ba41] text-[#232528] rounded-2xl">
                    <LogOut className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Re-Authentication Required</h3>
                    <p className="text-xs text-[#c9c8c5] mt-0.5">
                      Your password has changed. For security, please sign in with your new credentials.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
                  <span className="text-[#c9c8c5]">
                    Redirecting to login in <strong className="text-[#f5ba41] font-mono text-sm">{reLoginCountdown}s</strong>...
                  </span>
                  <button
                    onClick={handleImmediateReLogin}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#f5ba41] hover:bg-[#e6ab33] text-[#232528] font-black rounded-full transition shadow-lg btn-pill flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Re-Login Now
                  </button>
                </div>
              </div>
            )}

            {/* Admin Profile & Session Overview */}
            <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
              <div className="flex items-center justify-between border-b border-[#efeee9] pb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-[#232528] text-[#f5ba41] font-black text-sm flex items-center justify-center ring-2 ring-white">
                    AD
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#232528]">Administrator Profile</h3>
                    <p className="text-xs text-[#88898b] font-mono flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-[#88898b]" /> {userEmail}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#D2DEC9] text-[#2b3e24]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2b3e24]" /> Master Admin Access
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#f6f5f0] rounded-2xl space-y-1">
                  <span className="text-[#88898b] block text-[10px] uppercase font-bold tracking-wider">Account Authority</span>
                  <span className="font-bold text-[#232528]">Role: Admin (Full Tally & Supabase RLS Access)</span>
                </div>
                <div className="p-3 bg-[#f6f5f0] rounded-2xl space-y-1">
                  <span className="text-[#88898b] block text-[10px] uppercase font-bold tracking-wider">Last Sign-in</span>
                  <span className="font-bold text-[#232528] font-mono">{lastSignIn || 'Active Local Session'}</span>
                </div>
              </div>
            </div>

            {/* Update Password Form Card */}
            <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-5">
              <div>
                <h3 className="font-extrabold text-base text-[#232528] flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#f5ba41]" /> Update Admin Password
                </h3>
                <p className="text-xs text-[#88898b] mt-0.5">
                  Update your master Supabase authentication password. Minimum 8 characters.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter minimum 8 character password..."
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-[#232528] placeholder-[#88898b] focus:outline-none focus:ring-2 focus:ring-[#f5ba41] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#88898b] hover:text-[#232528]"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password..."
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-[#232528] placeholder-[#88898b] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                  />
                </div>

                {newPassword && (
                  <div className="p-3 bg-[#f6f5f0] rounded-2xl text-[11px] space-y-1 text-[#666]">
                    <div className="font-bold text-[#232528]">Security Check:</div>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                        {newPassword.length >= 8 ? '✓' : '•'} At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                        {newPassword && confirmPassword && newPassword === confirmPassword ? '✓ Passwords match' : '• Passwords match'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="min-h-[46px] px-6 py-2.5 bg-[#232528] hover:bg-black text-[#f5ba41] font-black rounded-full text-xs sm:text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 btn-pill"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-[#f5ba41]" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-[#f5ba41]" />
                        <span>Save & Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 2: COMPANY OVERVIEW ================= */}
        {activeTab === 'profile' && (
          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
            <h3 className="font-extrabold text-base text-[#232528] flex items-center gap-2">
              <Building className="h-5 w-5 text-[#f5ba41]" /> Livekeeping Organization Details
            </h3>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <strong className="font-black text-amber-950 block">No Tally Company Linked</strong>
                <span className="text-[11px] text-amber-800">
                  Connect Tally Prime (port 9000) using the sync connector to import your active company legal entity, GSTIN, and branch details.
                </span>
              </div>
              <a
                href="/"
                className="px-4 py-2 bg-[#232528] hover:bg-black text-[#f5ba41] rounded-xl font-bold text-xs shrink-0 text-center transition"
              >
                Connect Tally on Home
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#f6f5f0] rounded-2xl space-y-1">
                <span className="text-[#88898b] font-bold block text-[10px] uppercase">Legal Entity Name</span>
                <span className="font-bold text-sm text-[#88898b] italic">Not Synced (Connect Tally First)</span>
              </div>
              <div className="p-4 bg-[#f6f5f0] rounded-2xl space-y-1">
                <span className="text-[#88898b] font-bold block text-[10px] uppercase">Goods & Services Tax (GSTIN)</span>
                <span className="font-bold text-sm font-mono text-[#88898b] italic">Not Synced</span>
              </div>
              <div className="p-4 bg-[#f6f5f0] rounded-2xl space-y-1">
                <span className="text-[#88898b] font-bold block text-[10px] uppercase">Primary State & Jurisdiction</span>
                <span className="font-bold text-[#88898b] italic">Pending Tally Master Sync</span>
              </div>
              <div className="p-4 bg-[#f6f5f0] rounded-2xl space-y-1">
                <span className="text-[#88898b] font-bold block text-[10px] uppercase">ERP Integration Backend</span>
                <span className="font-bold text-[#232528]">Tally Prime XML Server (Port 9000) &bull; Supabase Postgres</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
