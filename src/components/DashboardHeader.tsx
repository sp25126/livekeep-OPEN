'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

export type DatePreset = 'this_month' | 'this_quarter' | 'current_fy' | 'previous_fy' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
  preset: DatePreset;
}

export interface CompanyInfo {
  id: string;
  name: string;
  gstin: string;
  lastSyncedAt: string; // ISO string
  syncStatus: 'synced' | 'stale' | 'syncing';
  daysSinceLastSync: number;
}

interface DashboardHeaderProps {
  currentCompany?: CompanyInfo;
  companies?: CompanyInfo[];
  onCompanyChange?: (company: CompanyInfo) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
}

const DEFAULT_COMPANIES: CompanyInfo[] = [
  {
    id: 'org-101',
    name: 'LiveTech Pvt Ltd',
    gstin: '24AAACL9999P1Z2',
    lastSyncedAt: '2026-03-12T10:00:00.000Z',
    syncStatus: 'stale',
    daysSinceLastSync: 28
  },
  {
    id: 'org-102',
    name: 'Apex Industries LLP',
    gstin: '27AABCA5555M1Z1',
    lastSyncedAt: '2026-04-09T08:00:00.000Z',
    syncStatus: 'synced',
    daysSinceLastSync: 0
  },
  {
    id: 'org-103',
    name: 'Shree Balaji Traders',
    gstin: '07AAACA1234F1ZX',
    lastSyncedAt: '2026-04-04T12:00:00.000Z',
    syncStatus: 'stale',
    daysSinceLastSync: 5
  }
];

export default function DashboardHeader({
  currentCompany = DEFAULT_COMPANIES[0],
  companies = DEFAULT_COMPANIES,
  onCompanyChange,
  dateRange,
  onDateRangeChange,
  onTriggerSync,
  isSyncing = false
}: DashboardHeaderProps) {
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedFYYear, setSelectedFYYear] = useState(2025); // FY 2024-25 = ends 2025

  // Financial Year Helpers
  const shiftFinancialYear = (delta: number) => {
    const newEndYear = selectedFYYear + delta;
    setSelectedFYYear(newEndYear);
    const startYear = newEndYear - 1;
    const startYearStr = String(startYear).slice(-2);
    const endYearStr = String(newEndYear).slice(-2);

    onDateRangeChange({
      startDate: `${startYear}-04-01`,
      endDate: `${newEndYear}-03-31`,
      label: `01 Apr ${startYearStr} – 31 Mar ${endYearStr}`,
      preset: delta === 0 ? 'current_fy' : 'custom'
    });
  };

  const applyPreset = (preset: DatePreset) => {
    const today = new Date();
    const currYear = today.getFullYear();
    const currMonth = today.getMonth(); // 0-indexed

    if (preset === 'current_fy') {
      // Indian FY starts April 1
      const fyStartYear = currMonth >= 3 ? currYear : currYear - 1;
      const fyEndYear = fyStartYear + 1;
      setSelectedFYYear(fyEndYear);
      onDateRangeChange({
        startDate: `${fyStartYear}-04-01`,
        endDate: `${fyEndYear}-03-31`,
        label: `01 Apr ${String(fyStartYear).slice(-2)} – 31 Mar ${String(fyEndYear).slice(-2)}`,
        preset: 'current_fy'
      });
    } else if (preset === 'previous_fy') {
      const fyStartYear = (currMonth >= 3 ? currYear : currYear - 1) - 1;
      const fyEndYear = fyStartYear + 1;
      setSelectedFYYear(fyEndYear);
      onDateRangeChange({
        startDate: `${fyStartYear}-04-01`,
        endDate: `${fyEndYear}-03-31`,
        label: `01 Apr ${String(fyStartYear).slice(-2)} – 31 Mar ${String(fyEndYear).slice(-2)}`,
        preset: 'previous_fy'
      });
    } else if (preset === 'this_month') {
      const monthStart = new Date(currYear, currMonth, 1);
      const monthEnd = new Date(currYear, currMonth + 1, 0);
      const startStr = monthStart.toISOString().split('T')[0];
      const endStr = monthEnd.toISOString().split('T')[0];
      onDateRangeChange({
        startDate: startStr,
        endDate: endStr,
        label: `This Month (${monthStart.toLocaleString('default', { month: 'short' })} ${currYear})`,
        preset: 'this_month'
      });
    } else if (preset === 'this_quarter') {
      const quarterIndex = Math.floor(currMonth / 3);
      const qStart = new Date(currYear, quarterIndex * 3, 1);
      const qEnd = new Date(currYear, quarterIndex * 3 + 3, 0);
      onDateRangeChange({
        startDate: qStart.toISOString().split('T')[0],
        endDate: qEnd.toISOString().split('T')[0],
        label: `Q${quarterIndex + 1} (${qStart.toLocaleString('default', { month: 'short' })} – ${qEnd.toLocaleString('default', { month: 'short' })})`,
        preset: 'this_quarter'
      });
    }
    setIsDatePickerOpen(false);
  };

  const formatRelativeSync = (days: number) => {
    if (days === 0) return 'Synced just now';
    if (days === 1) return 'Synced yesterday';
    return `Synced ${days} days ago`;
  };

  return (
    <div className="space-y-3 select-none">
      {/* 1. TOP BAR: Company Switcher & Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fafaf8] border border-[#e5e3dc] rounded-[24px] p-3 shadow-sm">
        
        {/* Company Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            className="flex items-center space-x-2.5 px-3 py-2 rounded-2xl bg-white border border-[#e5e3dc] hover:border-[#f5ba41] transition shadow-xs text-left group"
          >
            <div className="h-8 w-8 rounded-xl bg-[#232528] text-[#f5ba41] flex items-center justify-center font-black text-xs shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 font-bold text-xs sm:text-sm text-[#232528] group-hover:text-black">
                <span className="truncate max-w-[160px] sm:max-w-[200px]">{currentCompany.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#88898b] group-hover:text-[#232528]" />
              </div>
              <div className="text-[10px] text-[#88898b] flex items-center gap-1 font-medium">
                <span>{currentCompany.gstin}</span>
                <span>•</span>
                <span className={currentCompany.daysSinceLastSync > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                  {formatRelativeSync(currentCompany.daysSinceLastSync)}
                </span>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isCompanyDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-[#e5e3dc] rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#88898b] uppercase tracking-wider">
                Select Tally Company
              </div>
              {companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    if (onCompanyChange) onCompanyChange(comp);
                    setIsCompanyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                    comp.id === currentCompany.id
                      ? 'bg-[#fafaf8] border border-[#f5ba41] font-bold text-[#232528]'
                      : 'hover:bg-[#f6f5f0] text-[#555]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[#232528]">{comp.name}</div>
                    <div className="text-[10px] text-[#88898b] font-mono">{comp.gstin}</div>
                  </div>
                  {comp.id === currentCompany.id && (
                    <Check className="h-4 w-4 text-[#f5ba41]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Financial Date Range Selector (< 01 Apr 24 – 31 Mar 25 >) */}
        <div className="flex items-center space-x-1.5 bg-white border border-[#e5e3dc] rounded-2xl p-1 shadow-xs">
          <button
            onClick={() => shiftFinancialYear(-1)}
            className="h-8 w-8 rounded-xl hover:bg-[#f6f5f0] text-[#555] hover:text-[#232528] flex items-center justify-center transition"
            title="Previous Financial Year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="px-3 py-1.5 text-xs font-bold text-[#232528] hover:bg-[#f6f5f0] rounded-xl flex items-center space-x-2 transition"
          >
            <Calendar className="h-3.5 w-3.5 text-[#f5ba41]" />
            <span className="font-mono">{dateRange.label}</span>
            <ChevronDown className="h-3 w-3 text-[#88898b]" />
          </button>

          <button
            onClick={() => shiftFinancialYear(1)}
            className="h-8 w-8 rounded-xl hover:bg-[#f6f5f0] text-[#555] hover:text-[#232528] flex items-center justify-center transition"
            title="Next Financial Year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date Range Modal / Popover */}
      {isDatePickerOpen && (
        <div className="p-4 bg-white border border-[#e5e3dc] rounded-2xl shadow-lg space-y-3 animate-in fade-in-50">
          <div className="text-xs font-bold text-[#232528] flex items-center justify-between">
            <span>Choose Financial Period</span>
            <button onClick={() => setIsDatePickerOpen(false)} className="text-[#88898b] hover:text-black">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => applyPreset('current_fy')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                dateRange.preset === 'current_fy'
                  ? 'bg-[#232528] text-[#f5ba41] border-[#232528]'
                  : 'bg-[#fafaf8] border-[#e5e3dc] text-[#555] hover:bg-white'
              }`}
            >
              Current FY (2024-25)
            </button>
            <button
              onClick={() => applyPreset('previous_fy')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                dateRange.preset === 'previous_fy'
                  ? 'bg-[#232528] text-[#f5ba41] border-[#232528]'
                  : 'bg-[#fafaf8] border-[#e5e3dc] text-[#555] hover:bg-white'
              }`}
            >
              Previous FY (2023-24)
            </button>
            <button
              onClick={() => applyPreset('this_quarter')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                dateRange.preset === 'this_quarter'
                  ? 'bg-[#232528] text-[#f5ba41] border-[#232528]'
                  : 'bg-[#fafaf8] border-[#e5e3dc] text-[#555] hover:bg-white'
              }`}
            >
              This Quarter
            </button>
            <button
              onClick={() => applyPreset('this_month')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                dateRange.preset === 'this_month'
                  ? 'bg-[#232528] text-[#f5ba41] border-[#232528]'
                  : 'bg-[#fafaf8] border-[#e5e3dc] text-[#555] hover:bg-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      )}

      {/* 2. SYNC HEALTH WARNING BANNER (Not Synced since X days | Sync Now (!)) */}
      {currentCompany.daysSinceLastSync > 0 && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-2.5 shadow-xs animate-in fade-in-50 duration-200">
          <div className="flex items-center space-x-2.5 text-xs font-semibold">
            <div className="h-6 w-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 font-black">
              !
            </div>
            <div>
              <span>Not Synced since <strong className="font-black text-rose-900">{currentCompany.daysSinceLastSync} days</strong></span>
              <span className="hidden sm:inline text-rose-600 text-[11px] ml-2">— Financial tiles may not reflect recent Tally Prime entries.</span>
            </div>
          </div>

          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now (!)'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
