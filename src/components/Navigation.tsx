'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/database';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Users, 
  Plus, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Lock,
  UserCheck,
  Building2,
  FileSpreadsheet
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
      name: 'Daybook',
      icon: Receipt,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      id: 'reports',
      name: 'P&L & Aging',
      icon: BarChart3,
      roles: ['admin', 'manager', 'checker']
    },
    {
      id: 'users',
      name: 'Team Access',
      href: '/dashboard/users',
      icon: Users,
      roles: ['admin'],
      badge: 'Admin'
    }
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (>= 768px) ================= */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-base text-white">Livekeeping Open</div>
              <div className="text-[10px] text-slate-400 font-mono">ERP & GST PWA</div>
            </div>
          </div>

          {/* Active Role & Realtime Indicator */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs">
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="text-[11px] font-medium text-slate-300">
                  {isConnected ? 'Realtime Sync' : 'Local Queue'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentRole === 'admin' 
                  ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                  : currentRole === 'checker' 
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {currentRole}
              </span>
            </div>

            {onRoleChange && (
              <div>
                <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> Switch Role Simulation:
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['maker', 'checker', 'manager', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => onRoleChange(r)}
                      className={`py-1 rounded text-[10px] font-semibold capitalize transition ${
                        currentRole === r
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
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
          <div className="px-3 pb-2 space-y-2">
            <button
              onClick={onOpenNewVoucher}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create Sales Bill
            </button>

            <button
              onClick={onOpenGpsModal}
              className="w-full py-2 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <MapPin className="h-3.5 w-3.5" /> Sales Force GPS
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </div>
            {navItems.map((item) => {
              const hasAccess = item.roles.includes(currentRole);
              const isActive = item.href ? pathname === item.href : activeTab === item.id;

              if (!hasAccess) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 cursor-not-allowed opacity-50 text-xs"
                    title="Admin privilege required"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    <Lock className="h-3 w-3 text-slate-600" />
                  </div>
                );
              }

              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <button
                  key={item.name}
                  onClick={() => onTabChange && onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Tally Bridge</span>
            <span className="text-emerald-400 font-mono">:9000 Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>NIC E-Invoice</span>
            <span className="text-blue-400 font-mono">INV-01 Ready</span>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE TOP APP BAR (< 768px) ================= */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Receipt className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Livekeeping Open</div>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{isConnected ? 'Sync Active' : 'Offline Mode'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Role Switcher Pill */}
          {onRoleChange && (
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-slate-950 border border-slate-800 text-blue-400 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="maker">Maker</option>
              <option value="checker">Checker</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <button
            onClick={onOpenGpsModal}
            className="p-1.5 bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 rounded-lg text-xs"
            title="GPS Field Log"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ================= MOBILE FIXED BOTTOM TAB BAR (< 768px) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => onTabChange && onTabChange('vouchers')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition ${
            activeTab === 'vouchers' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Daybook</span>
        </button>

        <button
          onClick={onOpenNewVoucher}
          className="flex flex-col items-center justify-center min-h-[48px] -mt-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full h-12 w-12 shadow-lg shadow-blue-600/40"
          title="Create Voucher"
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          onClick={() => onTabChange && onTabChange('reports')}
          className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition ${
            activeTab === 'reports' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Reports</span>
        </button>

        {currentRole === 'admin' ? (
          <Link
            href="/dashboard/users"
            className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl transition ${
              pathname === '/dashboard/users' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Team</span>
          </Link>
        ) : (
          <button
            onClick={() => onOpenGpsModal()}
            className="flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-xl text-slate-400 hover:text-slate-200 transition"
          >
            <MapPin className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">GPS</span>
          </button>
        )}
      </nav>
    </>
  );
}
