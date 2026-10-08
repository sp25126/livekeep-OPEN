'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Send, 
  PhoneCall, 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  AlertCircle,
  FileSpreadsheet,
  IndianRupee,
  Share2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function ReportsView() {
  const [activeSubTab, setActiveSubTab] = useState<'aging' | 'pnl' | 'balance'>('aging');
  const [expandedSection, setExpandedSection] = useState<string | null>('debtors');

  const agingBuckets = [
    { range: '0–30 Days', amount: 245000, count: 8, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { range: '31–60 Days', amount: 182000, count: 5, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { range: '61–90 Days', amount: 95000, count: 3, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { range: '90+ Days (Overdue)', amount: 48500, count: 2, color: 'text-rose-700 bg-rose-50 border-rose-200' }
  ];

  const overdueCustomers = [
    { name: 'Apex Logistics & Infra Ltd', amount: 48500, days: 94, phone: '+919876543210', invoice: 'INV/2026/089' },
    { name: 'Shree Balaji Traders', amount: 52000, days: 68, phone: '+919812345678', invoice: 'INV/2026/102' },
    { name: 'Mehta Chemical Works', amount: 43000, days: 62, phone: '+919723456789', invoice: 'INV/2026/108' }
  ];

  const handleSendReminder = (customer: typeof overdueCustomers[0]) => {
    const text = `Dear ${customer.name},\n\nThis is a gentle payment reminder from Livekeeping Enterprises regarding overdue invoice *${customer.invoice}* for the amount of *₹${customer.amount.toLocaleString('en-IN')}* (overdue by ${customer.days} days).\n\nKindly arrange payment via NEFT/UPI or reply if already cleared.\n\nThank you for your prompt cooperation!`;
    window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('aging')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition btn-tactile ${
            activeSubTab === 'aging'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Money to Collect (Aging)
        </button>
        <button
          onClick={() => setActiveSubTab('pnl')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition btn-tactile ${
            activeSubTab === 'pnl'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Profit & Loss Summary
        </button>
        <button
          onClick={() => setActiveSubTab('balance')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition btn-tactile ${
            activeSubTab === 'balance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Balance Sheet
        </button>
      </div>

      {/* ================= TAB 1: RECEIVABLES & AGING ================= */}
      {activeSubTab === 'aging' && (
        <div className="space-y-6">
          {/* Aging Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {agingBuckets.map((bucket) => (
              <div key={bucket.range} className={`p-4 rounded-2xl border ${bucket.color} shadow-sm space-y-1`}>
                <div className="text-[11px] font-extrabold uppercase tracking-wider">{bucket.range}</div>
                <div className="text-lg sm:text-2xl font-extrabold">₹{bucket.amount.toLocaleString('en-IN')}</div>
                <div className="text-[11px] font-medium opacity-80">{bucket.count} Invoices Pending</div>
              </div>
            ))}
          </div>

          {/* Overdue Action Cards */}
          <div className="luxe-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-rose-600" /> Critical Overdue Receivables (&gt;60 Days)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Send instant WhatsApp payment reminder messages in 1-tap</p>
              </div>
            </div>

            <div className="space-y-3">
              {overdueCustomers.map((c) => (
                <div key={c.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono">{c.invoice}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">{c.days} days overdue</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900 font-mono">₹{c.amount.toLocaleString('en-IN')}</div>
                    </div>

                    <button
                      onClick={() => handleSendReminder(c)}
                      className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 btn-tactile"
                    >
                      <Share2 className="h-4 w-4" /> Remind on WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PROFIT & LOSS ================= */}
      {activeSubTab === 'pnl' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="luxe-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Revenue & Sales Income
              </h4>
              <span className="text-xs font-bold text-emerald-600 font-mono">₹28,45,000</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Domestic GST B2B Sales</span>
                <span className="font-bold text-slate-900 font-mono">₹24,50,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Interstate IGST Supplies</span>
                <span className="font-bold text-slate-900 font-mono">₹3,95,000</span>
              </div>
            </div>
          </div>

          <div className="luxe-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-rose-600" /> Operating Expenses & COGS
              </h4>
              <span className="text-xs font-bold text-rose-600 font-mono">₹19,10,000</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Direct Raw Material Purchases</span>
                <span className="font-bold text-slate-900 font-mono">₹16,40,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Freight & Warehouse Logistics</span>
                <span className="font-bold text-slate-900 font-mono">₹2,70,000</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-xl">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-200">Estimated Net Operating Profit</div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1">₹9,35,000</div>
              <div className="text-xs text-blue-100 mt-0.5 font-medium">+32.8% Margin (FY 2026-27)</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BALANCE SHEET ================= */}
      {activeSubTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="luxe-card p-5 rounded-2xl space-y-3">
            <div className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">Liabilities & Equity</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Capital & Reserves</span>
                <span className="font-bold text-slate-900 font-mono">₹45,00,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Sundry Creditors</span>
                <span className="font-bold text-slate-900 font-mono">₹12,40,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>GST Tax Payable</span>
                <span className="font-bold text-slate-900 font-mono">₹2,80,000</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-slate-900">
                <span>Total Liabilities</span>
                <span className="font-mono">₹60,20,000</span>
              </div>
            </div>
          </div>

          <div className="luxe-card p-5 rounded-2xl space-y-3">
            <div className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">Assets & Receivables</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Fixed Assets & Machinery</span>
                <span className="font-bold text-slate-900 font-mono">₹32,00,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Sundry Debtors (Receivables)</span>
                <span className="font-bold text-slate-900 font-mono">₹18,50,000</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Bank & Cash Balances</span>
                <span className="font-bold text-slate-900 font-mono">₹9,70,000</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-slate-900">
                <span>Total Assets</span>
                <span className="font-mono">₹60,20,000</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
