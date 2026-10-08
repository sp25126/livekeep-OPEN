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
  UserCheck, 
  Building2, 
  ChevronRight,
  Box,
  Layers,
  Sparkles
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
      name: 'Daybook & Invoices',
      subtitle: 'Sales Bills, WhatsApp & Approvals',
      icon: Receipt,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'reports',
      name: 'Business Reports',
      subtitle: 'Receivables Aging, P&L & Balance',
      icon: BarChart3,
      roles: ['admin', 'manager', 'checker']
    },
    {
      id: 'users',
      name: 'Staff & Security',
      subtitle: 'Team Access & Permissions',
      href: '/dashboard/users',
      icon: Users,
      roles: ['admin'],
      badge: 'Admin'
    }
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (Matte Charcoal & Warm Sand Accent) ================= */}
      <aside className="hidden md:flex w-72 bg-[#232528] text-[#c9c8c5] flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto p-5 select-none border-r border-[#1a1c1e]">
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 pb-2">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-[#f5ba41] shadow-inner">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Livekeep <span className="text-[#f5ba41] font-black text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-[#f5ba41]/30">ERP</span>
              </div>
              <div className="text-[11px] text-[#8c8d8f]">Smart GST & Tally Bridge</div>
            </div>
          </div>

          {/* Active Company Badge */}
          <div className="p-3 rounded-2xl bg-[#1b1c1e] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="p-1.5 rounded-xl bg-white/5 text-[#c9c8c5]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="truncate">
                <div className="font-bold text-white text-[11px] truncate">Livekeeping Enterprises</div>
                <div className="text-[10px] text-[#8c8d8f] font-mono">24AAACL9999P1Z2</div>
              </div>
            </div>
            <span
              className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/20 animate-pulse' : 'bg-amber-400'}`}
              title={isConnected ? 'Real-Time Sync Active' : 'Offline Mode'}
            />
          </div>

          {/* Role Simulation Switcher Card */}
          <div className="p-3.5 rounded-2xl bg-[#1b1c1e] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-[#8c8d8f] uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-[#f5ba41]" /> Role Preview
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#f5ba41] text-[#232528]">
                {currentRole}
              </span>
            </div>

            {onRoleChange && (
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#232528] rounded-xl border border-white/5">
                {(['maker', 'checker', 'manager', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={`py-1 rounded-lg text-[10px] font-bold capitalize transition ${
                      currentRole === r
                        ? 'bg-[#f5ba41] text-[#232528] shadow-sm font-black'
                        : 'text-[#8c8d8f] hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Create Voucher Button */}
          <div>
            <button
              onClick={onOpenNewVoucher}
              className="w-full min-h-[44px] py-2.5 px-4 bg-[#f5ba41] hover:bg-[#e6ab33] text-[#232528] font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-[#f5ba41]/20 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create New Invoice</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#6e7073]">Modules</div>
            {navItems.map((item) => {
              const isAllowed = item.roles.includes(currentRole);
              const isActive = item.href ? pathname === item.href : activeTab === item.id;
              const Icon = item.icon;

              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={isAllowed ? item.href : '#'}
                    onClick={(e) => {
                      if (!isAllowed) {
                        e.preventDefault();
                        alert('Only Admin users have access to Staff Management.');
                      }
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                      !isAllowed
                        ? 'opacity-30 cursor-not-allowed text-[#6e7073]'
                        : isActive
                        ? 'bg-white/10 text-white shadow-inner'
                        : 'text-[#8c8d8f] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#f5ba41]' : 'text-[#8c8d8f]'}`} />
                      <div>
                        <div>{item.name}</div>
                        <div className="text-[10px] text-[#6e7073] font-normal">{item.subtitle}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#f5ba41]/20 text-[#f5ba41]">
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
                    }
                  }}
                  disabled={!isAllowed}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                    !isAllowed
                      ? 'opacity-30 cursor-not-allowed text-[#6e7073]'
                      : isActive
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-[#8c8d8f] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#f5ba41]' : 'text-[#8c8d8f]'}`} />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-[10px] text-[#6e7073] font-normal">{item.subtitle}</div>
                    </div>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-[#f5ba41]' : 'text-[#6e7073]'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Live Systems Status */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="p-3 rounded-2xl bg-[#1b1c1e] text-[11px] text-[#8c8d8f] space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[#c9c8c5]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Tally Bridge
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">Port 9000</span>
            </div>
            <div className="flex items-center justify-between font-bold text-[#c9c8c5]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f5ba41]" /> Govt. NIC IRP
              </span>
              <span className="text-[10px] text-[#f5ba41] font-bold">1-Click IRN</span>
            </div>
          </div>

          <button
            onClick={onOpenGpsModal}
            className="w-full min-h-[40px] py-2 px-3 bg-white/5 hover:bg-white/10 text-[#c9c8c5] hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition border border-white/5"
          >
            <MapPin className="h-3.5 w-3.5 text-[#f5ba41]" />
            <span>Field Staff Check-in</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE HEADER (< 768px) ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-[#232528] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center text-[#f5ba41]">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <div className="font-black text-sm text-white flex items-center gap-1">
              Livekeep <span className="text-[#f5ba41] text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/5">PRO</span>
            </div>
            <div className="text-[10px] text-[#8c8d8f]">Livekeeping Enterprises</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenNewVoucher}
            className="h-8 px-3 bg-[#f5ba41] text-[#232528] font-black rounded-xl text-xs flex items-center space-x-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Bill</span>
          </button>
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>
      </header>

      {/* ================= MOBILE BOTTOM TAB BAR (< 768px) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#232528]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around safe-area-pb shadow-2xl">
        <button
          onClick={() => onTabChange && onTabChange('vouchers')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] transition ${
            activeTab === 'vouchers' && !pathname.includes('/users')
              ? 'text-[#f5ba41] font-black'
              : 'text-[#8c8d8f]'
          }`}
        >
          <Receipt className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Daybook</span>
        </button>

        <button
          onClick={() => onTabChange && onTabChange('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] transition ${
            activeTab === 'reports' && !pathname.includes('/users')
              ? 'text-[#f5ba41] font-black'
              : 'text-[#8c8d8f]'
          }`}
        >
          <BarChart3 className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Reports</span>
        </button>

        <button
          onClick={onOpenGpsModal}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] text-[#8c8d8f] hover:text-[#f5ba41] transition"
        >
          <MapPin className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">GPS Check</span>
        </button>

        <Link
          href="/dashboard/users"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[64px] min-h-[48px] transition ${
            pathname.includes('/users')
              ? 'text-[#f5ba41] font-black'
              : 'text-[#8c8d8f]'
          }`}
        >
          <Users className="h-5 w-5 mb-0.5" />
          <span className="text-[10px]">Staff</span>
        </Link>
      </nav>
    </>
  );
}
