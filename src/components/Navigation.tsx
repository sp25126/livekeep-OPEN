'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/database';
import { 
  Box, 
  LayoutDashboard, 
  BarChart2, 
  CreditCard, 
  ArrowLeftRight, 
  ShoppingBag, 
  Users2, 
  MessageSquare, 
  Settings, 
  LogOut,
  Sparkles,
  MapPin,
  Plus,
  Building2,
  Receipt
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
  activeTab = 'dashboard',
  onTabChange
}: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'statistics',
      name: 'Statistics',
      icon: BarChart2,
      roles: ['admin', 'manager', 'checker']
    },
    {
      id: 'vouchers',
      name: 'Daybook & Invoices',
      icon: Receipt,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'transactions',
      name: 'Transactions',
      icon: ArrowLeftRight,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'products',
      name: 'GST Stock',
      icon: ShoppingBag,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'customer',
      name: 'Customers',
      icon: Users2,
      roles: ['admin', 'manager', 'checker']
    },
    {
      id: 'messages',
      name: 'WhatsApp Reminders',
      icon: MessageSquare,
      roles: ['admin', 'manager', 'checker', 'maker'],
      badge: '5'
    },
    {
      id: 'settings',
      name: 'Staff & Roles',
      href: '/dashboard/users',
      icon: Settings,
      roles: ['admin']
    }
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (Matte Charcoal) ================= */}
      <aside className="hidden lg:flex w-64 bg-[#232528] text-[#c9c8c5] flex-col justify-between shrink-0 rounded-l-[36px] p-6 select-none">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-inner">
              <Box className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">Livekeep</span>
          </div>

          {/* User Profile Card */}
          <div className="flex flex-col items-center text-center pt-2 pb-2">
            <div className="relative mb-3">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-slate-700 to-slate-500 ring-4 ring-white/10 p-0.5 overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="User Profile"
                  className="h-full w-full object-cover rounded-full grayscale contrast-125"
                />
              </div>
              <span className={`absolute bottom-0 right-1 h-3.5 w-3.5 rounded-full ring-2 ring-[#232528] ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>
            <div className="text-[11px] text-[#8c8d8f] font-medium">Welcome Back,</div>
            <div className="text-base font-bold text-white tracking-tight mt-0.5">Saumya Patel</div>
            
            {/* Quick Role Simulation Badge */}
            {onRoleChange && (
              <div className="mt-2.5 flex items-center gap-1 bg-[#1a1c1e] p-1 rounded-xl border border-white/5">
                {(['maker', 'checker', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-lg transition ${
                      currentRole === r
                        ? 'bg-[#f5ba41] text-[#232528] shadow-sm'
                        : 'text-[#88898b] hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.href ? pathname === item.href : activeTab === item.id;
              const isAllowed = item.roles.includes(currentRole);
              const Icon = item.icon;

              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={isAllowed ? item.href : '#'}
                    onClick={(e) => {
                      if (!isAllowed) {
                        e.preventDefault();
                        alert('Admin authorization required.');
                      }
                    }}
                    className={`relative flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-[#88898b] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#f5ba41] rounded-r-full" />
                    )}
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#f5ba41]' : 'text-[#88898b]'}`} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange && onTabChange(item.id)}
                  className={`w-full relative flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition text-left ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[#88898b] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#f5ba41] rounded-r-full" />
                  )}
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#f5ba41]' : 'text-[#88898b]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#5b5fd8] text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions: Log Out / Quick Bill */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={onOpenNewVoucher}
            className="w-full py-2.5 px-4 bg-[#f5ba41] hover:bg-[#e6ab33] text-[#232528] font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 transition btn-pill shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create Invoice</span>
          </button>

          <button
            onClick={() => onRoleChange && onRoleChange(currentRole === 'admin' ? 'maker' : 'admin')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-xs font-semibold text-[#88898b] hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out / Switch</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE TOP HEADER (< 1024px) ================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#232528] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Box className="h-4 w-4 text-[#f5ba41]" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">Livekeep</div>
            <div className="text-[10px] text-[#88898b]">Enterprise ERP</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenNewVoucher}
            className="h-8 px-3 bg-[#f5ba41] text-[#232528] font-extrabold rounded-xl text-xs flex items-center space-x-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Bill</span>
          </button>
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>
      </header>

      {/* ================= MOBILE BOTTOM TAB BAR (< 1024px) ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#232528]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around safe-area-pb">
        <button
          onClick={() => onTabChange && onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[56px] min-h-[44px] ${
            activeTab === 'dashboard' ? 'text-[#f5ba41] font-bold' : 'text-[#88898b]'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => onTabChange && onTabChange('vouchers')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[56px] min-h-[44px] ${
            activeTab === 'vouchers' ? 'text-[#f5ba41] font-bold' : 'text-[#88898b]'
          }`}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Daybook</span>
        </button>

        <button
          onClick={() => onTabChange && onTabChange('statistics')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[56px] min-h-[44px] ${
            activeTab === 'statistics' ? 'text-[#f5ba41] font-bold' : 'text-[#88898b]'
          }`}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Reports</span>
        </button>

        <Link
          href="/dashboard/users"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[56px] min-h-[44px] text-[#88898b]"
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Staff</span>
        </Link>
      </nav>
    </>
  );
}
