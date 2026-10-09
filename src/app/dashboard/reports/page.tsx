'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Receipt, 
  UserX, 
  PackageX, 
  FileText, 
  TrendingUp, 
  Truck, 
  QrCode, 
  FileCheck2, 
  FileSpreadsheet, 
  ChevronRight, 
  Search,
  Sparkles,
  ArrowLeft,
  Building2,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  accent: string;
}

export default function ReportsHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'accounting' | 'entries'>('all');

  const accountingReports: ReportItem[] = [
    {
      id: 'daybook',
      title: 'Day Book',
      description: 'Daily transaction chronicle & double-entry journal logs',
      href: '/',
      icon: BookOpen,
      badge: 'Live',
      accent: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Indirect operating expenses, rent, utilities & overheads',
      href: '/dashboard/reports/expenses',
      icon: Receipt,
      accent: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'inactive_customers',
      title: 'Inactive Customers',
      description: 'Dormant accounts (30–180+ days) with 1-tap WhatsApp outreach',
      href: '/dashboard/reports/inactive',
      icon: UserX,
      badge: 'Smart Action',
      accent: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'inactive_items',
      title: 'Inactive Items',
      description: 'Slow-moving SKUs & dead inventory holding costs',
      href: '/dashboard/reports/inactive-items',
      icon: PackageX,
      accent: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'ledger_report',
      title: 'Ledger Report',
      description: 'Party statements, opening/closing balances & Dr/Cr summaries',
      href: '/dashboard/reports/ledgers',
      icon: FileText,
      badge: 'Tally Match',
      accent: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'top_reports',
      title: 'Top Reports',
      description: 'Top 10 highest-grossing customers and best-selling stock items',
      href: '/dashboard/reports/top-analytics',
      icon: TrendingUp,
      accent: 'bg-emerald-100 text-emerald-800'
    }
  ];

  const myEntries: ReportItem[] = [
    {
      id: 'eway_bills',
      title: 'My eWay Bills',
      description: 'Government NIC eWay bill dispatches, Part A/B & validity',
      href: '/dashboard/entries/eway-bills',
      icon: Truck,
      badge: 'NIC IRP',
      accent: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'einvoices',
      title: 'My eInvoices',
      description: 'Signed IRN QR codes, GST INV-01 acknowledgements',
      href: '/dashboard/entries/einvoices',
      icon: QrCode,
      badge: 'Govt. Valid',
      accent: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'my_vouchers',
      title: 'My Vouchers',
      description: 'All queued, approved & pending vouchers created by staff',
      href: '/',
      icon: FileCheck2,
      accent: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'my_quotations',
      title: 'My Quotations',
      description: 'Sales proforma estimates, pipeline quotes & conversion rates',
      href: '/dashboard/entries/quotations',
      icon: FileSpreadsheet,
      accent: 'bg-amber-100 text-amber-800'
    }
  ];

  const filterItems = (items: ReportItem[]) => {
    if (!searchQuery) return items;
    return items.filter(
      i =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredAccounting = filterItems(accountingReports);
  const filteredEntries = filterItems(myEntries);

  return (
    <div className="min-h-screen bg-[#ECEBE6] flex flex-col md:flex-row antialiased text-[#232528]">
      {/* Navigation */}
      <Navigation
        currentRole="admin"
        isConnected={true}
        onOpenNewVoucher={() => {}}
        onOpenGpsModal={() => {}}
        activeTab="reports"
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 pb-28 md:pb-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#88898b] mb-1">
              <Link href="/" className="hover:text-[#232528] flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#232528] font-bold">Reports Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#232528] tracking-tight">
              Reports & Registers Hub
            </h1>
            <p className="text-xs text-[#88898b] mt-0.5">
              Comprehensive financial statements, GST registries, and compliance audit logs.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#88898b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or registers..."
              className="w-full bg-[#fafaf8] border border-[#e5e3dc] focus:border-[#f5ba41] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#232528] focus:outline-none transition shadow-xs"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-2 border-b border-[#dedcd4] pb-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeCategory === 'all'
                ? 'bg-[#232528] text-[#f5ba41] shadow-xs'
                : 'bg-[#fafaf8] border border-[#e5e3dc] text-[#555] hover:bg-white'
            }`}
          >
            All Reports ({accountingReports.length + myEntries.length})
          </button>
          <button
            onClick={() => setActiveCategory('accounting')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeCategory === 'accounting'
                ? 'bg-[#232528] text-[#f5ba41] shadow-xs'
                : 'bg-[#fafaf8] border border-[#e5e3dc] text-[#555] hover:bg-white'
            }`}
          >
            Accounting Reports ({accountingReports.length})
          </button>
          <button
            onClick={() => setActiveCategory('entries')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeCategory === 'entries'
                ? 'bg-[#232528] text-[#f5ba41] shadow-xs'
                : 'bg-[#fafaf8] border border-[#e5e3dc] text-[#555] hover:bg-white'
            }`}
          >
            My Entries ({myEntries.length})
          </button>
        </div>

        {/* SECTION 1: Accounting Reports */}
        {(activeCategory === 'all' || activeCategory === 'accounting') && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#6e7073] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#f5ba41]" /> Accounting Reports
              </h2>
              <span className="text-[11px] text-[#88898b] font-medium">
                {filteredAccounting.length} reports available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAccounting.map((report) => {
                const Icon = report.icon;
                return (
                  <Link
                    key={report.id}
                    href={report.href}
                    className="group bg-[#fafaf8] hover:bg-white border border-[#e5e3dc] hover:border-[#f5ba41] rounded-[24px] p-4 transition-all duration-200 shadow-xs hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${report.accent} shadow-inner`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-xs sm:text-sm text-[#232528] group-hover:text-black">
                            {report.title}
                          </h3>
                          {report.badge && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#232528] text-[#f5ba41]">
                              {report.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#88898b] font-medium mt-0.5 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[#88898b] group-hover:text-[#232528] transition group-hover:translate-x-1 shrink-0 ml-2" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: My Entries */}
        {(activeCategory === 'all' || activeCategory === 'entries') && (
          <section className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#6e7073] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#f5ba41]" /> My Entries
              </h2>
              <span className="text-[11px] text-[#88898b] font-medium">
                {filteredEntries.length} categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {filteredEntries.map((entry) => {
                const Icon = entry.icon;
                return (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="group bg-[#fafaf8] hover:bg-white border border-[#e5e3dc] hover:border-[#f5ba41] rounded-[24px] p-4 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${entry.accent} shadow-inner`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {entry.badge && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#f5ba41]/20 text-[#232528] border border-[#f5ba41]/30">
                          {entry.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#232528] group-hover:text-black">
                        {entry.title}
                      </h3>
                      <p className="text-[10px] text-[#88898b] font-medium mt-0.5 line-clamp-2">
                        {entry.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#f0eee6] flex items-center justify-between text-[11px] font-bold text-[#88898b] group-hover:text-[#232528]">
                      <span>Open Register</span>
                      <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
