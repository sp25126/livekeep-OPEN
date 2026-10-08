'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/database';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Settings, 
  ShieldAlert, 
  Server, 
  Building2, 
  FileCheck,
  MapPin,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export default function Sidebar({ currentRole, onRoleChange }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Executive Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      name: 'Voucher Approvals',
      href: '/',
      icon: Receipt,
      roles: ['admin', 'manager', 'checker', 'maker']
    },
    {
      name: 'User Access Control',
      href: '/dashboard/users',
      icon: Users,
      roles: ['admin'], // Admin Exclusive
      badge: 'Admin'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-base text-white">Livekeeping Open</div>
            <div className="text-[11px] text-slate-400 font-mono">ERP & GST PWA</div>
          </div>
        </div>

        {/* Current Active Role Badge */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Session</span>
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
          <div className="text-xs text-slate-300 font-medium truncate">
            {currentRole === 'admin' && 'Full Root Administration'}
            {currentRole === 'checker' && 'Audit & Approval Privilege'}
            {currentRole === 'maker' && 'Sales Billing & Entry'}
            {currentRole === 'manager' && 'Operations & Reports'}
          </div>

          {onRoleChange && (
            <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-slate-800/80">
              {(['admin', 'checker', 'maker'] as UserRole[]).map((r) => (
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
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Menu
          </div>
          {navigation.map((item) => {
            const hasAccess = item.roles.includes(currentRole);
            const isActive = pathname === item.href;

            if (!hasAccess) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 cursor-not-allowed opacity-60 text-xs"
                  title="Admin authorization required"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  <Lock className="h-3 w-3 text-slate-600" />
                </div>
              );
            }

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
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Tally Bridge</span>
          <span className="text-emerald-400 font-mono">:9000 Active</span>
        </div>
        <div className="flex items-center justify-between">
          <span>NIC Gateway</span>
          <span className="text-blue-400 font-mono">INV-01 Live</span>
        </div>
      </div>
    </aside>
  );
}
