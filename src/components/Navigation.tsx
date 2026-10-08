'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/database';
import { 
  Receipt, 
  BarChart3, 
  Users, 
  Plus, 
  MapPin, 
  Wifi, 
  Lock,
  UserCheck,
  Building2,
  Shield,
  HelpCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard,
  MessageSquare
} from 'lucide-react';

interface NavigationProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  isConnected: boolean;
  onOpenNewVoucher: () => void;
  onOpenGpsModal: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Navigation({
  currentRole,
  onRoleChange,
  isConnected,
  onOpenNewVoucher,
  onOpenGpsModal,
  activeTab = 'vouchers',
  onTabChange
}: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'vouchers',
      name: 'Daybook & Bills',
      subtitle: 'Invoices, Quotations & Receipts',
      icon: Receipt,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'reports',
      name: 'Business Reports',
      subtitle: 'Profit & Loss, Pending Collections',
      icon: BarChart3,
      roles: ['admin', 'manager', 'checker']
    },
    {
      id: 'users',
      name: 'Staff & Roles',
      subtitle: 'Team Access & Permissions',
      href: '/dashboard/users',
      icon: Users,
      roles: ['admin'],
      badge: 'Admin'
    }
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (>= 768px) ================= */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-slate-100 border-r border-slate-800/80 flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto shadow-2xl">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  Livekeeping <span className="text-blue-400 font-bold text-[11px] px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800">PRO</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Smart Business ERP & GST</div>
              </div>
            </div>

            {/* Active Company Card */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-white text-[12px] truncate">Livekeeping Global Trading</div>
                  <div className="text-[10px] text-slate-400 font-mono">GSTIN: 24AAACL9999P1Z2</div>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" title="Tally Sync & Cloud Online"></span>
            </div>
          </div>

          {/* User Role Simulation / Indicator Card */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="text-[11px] font-semibold text-slate-300">
                  {isConnected ? 'Real-Time Sync Active' : 'Offline Mode (Local Cache)'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                currentRole === 'admin' 
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-700' 
                  : currentRole === 'checker' 
                  ? 'bg-blue-900/60 text-blue-200 border border-blue-700'
                  : currentRole === 'manager'
                  ? 'bg-amber-900/60 text-amber-200 border border-amber-700'
                  : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
              }`}>
                {currentRole}
              </span>
            </div>

            {onRoleChange && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5 text-blue-400" /> Switch Role Preview:</span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  {(['maker', 'checker', 'manager', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => onRoleChange(r)}
                      className={`py-1 rounded-lg text-[10px] font-bold capitalize transition btn-tactile ${
                        currentRole === r
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="px-4 mb-3">
            <button
              onClick={onOpenNewVoucher}
              className="w-full min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition btn-tactile"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Invoice / Bill</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Main Modules</div>
            {navItems.map((item) => {
              const isAllowed = item.roles.includes(currentRole);
              const isActive = item.href ? pathname === item.href : activeTab === item.id;
              const Icon = item.icon;

              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={isAllowed ? item.href : '#'}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      !isAllowed
                        ? 'opacity-40 cursor-not-allowed text-slate-500'
                        : isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                    onClick={(e) => {
                      if (!isAllowed) {
                        e.preventDefault();
                        alert('Only Admin users have access to Staff Management.');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <div>
                        <div>{item.name}</div>
                        <div className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{item.subtitle}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isAllowed && onTabChange && item.id) {
                      onTabChange(item.id);
                    } else if (!isAllowed) {
                      alert(`Your role (${currentRole}) does not have permission to view ${item.name}.`);
                    }
                  }}
                  disabled={!isAllowed}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                    !isAllowed
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <div>{item.name}</div>
                      <div className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{item.subtitle}</div>
                    </div>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Live Systems Status */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Tally Prime Bridge
              </span>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">Port 9000</span>
            </div>
            <div className="flex items-center justify-between font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400"></span> Government IRP
              </span>
              <span className="text-[10px] text-blue-400 font-bold">1-Click IRN</span>
            </div>
          </div>

          <button
            onClick={onOpenGpsModal}
            className="w-full min-h-[40px] py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition border border-slate-700 btn-tactile"
          >
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            <span>Field Staff Check-in</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE HEADER (Top Navigation < 768px) ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-1">
              Livekeeping <span className="text-blue-400 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800">PRO</span>
            </div>
            <div className="text-[10px] text-slate-400">Livekeeping Enterprises</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenNewVoucher}
            className="h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-blue-600/30 btn-tactile"
          >
            <Plus className="h-4 w-4" />
            <span>Bill</span>
          </button>

          <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400 ring-2 ring-emerald-500/30 animate-pulse' : 'bg-amber-400'}`}></span>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM TAB BAR (< 768px) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 flex items-center justify-around safe-area-pb shadow-2xl">
        <button
          onClick={() => onTabChange && onTabChange('vouchers')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] transition btn-tactile ${
            activeTab === 'vouchers' && !pathname.includes('/users')
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Receipt className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Daybook</span>
        </button>

        <button
          onClick={() => onTabChange && onTabChange('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] transition btn-tactile ${
            activeTab === 'reports' && !pathname.includes('/users')
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <BarChart3 className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Reports</span>
        </button>

        <button
          onClick={onOpenGpsModal}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] text-slate-400 hover:text-indigo-400 transition btn-tactile"
        >
          <MapPin className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">GPS Check</span>
        </button>

        <Link
          href="/dashboard/users"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] transition btn-tactile ${
            pathname.includes('/users')
              ? 'text-purple-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Users className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Staff</span>
        </Link>
      </nav>
    </>
  );
}
