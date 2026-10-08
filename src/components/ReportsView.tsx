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

  const agingBuckets = [
    { range: '0–30 Days', amount: 245000, count: 8, bg: 'bg-[#D2DEC9] text-[#2b3e24]' },
    { range: '31–60 Days', amount: 182000, count: 5, bg: 'bg-[#FBE29D] text-[#4d3809]' },
    { range: '61–90 Days', amount: 95000, count: 3, bg: 'bg-[#8F94FB]/20 text-[#2c307a]' },
    { range: '90+ Days (Overdue)', amount: 48500, count: 2, bg: 'bg-[#F8D7DA] text-[#721C24]' }
  ];

  const overdueCustomers = [
    { name: 'Apex Logistics & Infra Ltd', amount: 48500, days: 94, phone: '+919876543210', invoice: 'INV/2026/089', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { name: 'Shree Balaji Traders', amount: 52000, days: 68, phone: '+919812345678', invoice: 'INV/2026/102', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    { name: 'Mehta Chemical Works', amount: 43000, days: 62, phone: '+919723456789', invoice: 'INV/2026/108', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
  ];

  const handleSendReminder = (customer: typeof overdueCustomers[0]) => {
    const text = `Dear ${customer.name},\n\nThis is a gentle payment reminder from Livekeeping Enterprises regarding overdue invoice *${customer.invoice}* for the amount of *₹${customer.amount.toLocaleString('en-IN')}* (overdue by ${customer.days} days).\n\nKindly arrange payment via NEFT/UPI or reply if already cleared.\n\nThank you for your prompt cooperation!`;
    window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#e5e3dc] pb-3">
        <button
          onClick={() => setActiveSubTab('aging')}
          className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition btn-pill ${
            activeSubTab === 'aging'
              ? 'bg-[#232528] text-white shadow-sm'
              : 'text-[#88898b] hover:text-[#232528] hover:bg-[#f6f5f0]'
          }`}
        >
          Money to Collect (Aging)
        </button>
        <button
          onClick={() => setActiveSubTab('pnl')}
          className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition btn-pill ${
            activeSubTab === 'pnl'
              ? 'bg-[#232528] text-white shadow-sm'
              : 'text-[#88898b] hover:text-[#232528] hover:bg-[#f6f5f0]'
          }`}
        >
          Profit & Loss Summary
        </button>
        <button
          onClick={() => setActiveSubTab('balance')}
          className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition btn-pill ${
            activeSubTab === 'balance'
              ? 'bg-[#232528] text-white shadow-sm'
              : 'text-[#88898b] hover:text-[#232528] hover:bg-[#f6f5f0]'
          }`}
        >
          Balance Sheet
        </button>
      </div>

      {/* ================= TAB 1: RECEIVABLES & AGING ================= */}
      {activeSubTab === 'aging' && (
        <div className="space-y-6">
          {/* Aging Summary Pastel Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {agingBuckets.map((bucket) => (
              <div key={bucket.range} className={`p-5 rounded-[24px] ${bucket.bg} shadow-sm space-y-1`}>
                <div className="text-[11px] font-black uppercase tracking-wider">{bucket.range}</div>
                <div className="text-xl sm:text-2xl font-black">₹{bucket.amount.toLocaleString('en-IN')}</div>
                <div className="text-[11px] font-medium opacity-80">{bucket.count} Invoices Pending</div>
              </div>
            ))}
          </div>

          {/* Overdue Action Cards */}
          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#232528] flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#8F94FB]" /> Critical Overdue Receivables (&gt;60 Days)
              </h3>
              <p className="text-xs text-[#88898b] mt-0.5">Send instant WhatsApp payment reminder messages with 1-tap</p>
            </div>

            <div className="space-y-3">
              {overdueCustomers.map((c) => (
                <div key={c.name} className="p-4 rounded-2xl bg-[#f6f5f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="h-10 w-10 rounded-full object-cover grayscale contrast-125 ring-2 ring-white"
                    />
                    <div>
                      <div className="font-extrabold text-sm text-[#232528]">{c.name}</div>
                      <div className="text-xs text-[#88898b] mt-0.5 flex items-center gap-2">
                        <span className="font-mono">{c.invoice}</span>
                        <span>•</span>
                        <span className="text-rose-700 font-bold">{c.days} days overdue</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-[#232528] font-mono">₹{c.amount.toLocaleString('en-IN')}</div>
                    </div>

                    <button
                      onClick={() => handleSendReminder(c)}
                      className="min-h-[40px] px-5 py-2 bg-[#D2DEC9] hover:bg-[#c2d2b7] text-[#2b3e24] font-black rounded-full text-xs flex items-center gap-1.5 btn-pill"
                    >
                      <Share2 className="h-4 w-4" /> Remind WhatsApp
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
          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
            <div className="flex items-center justify-between border-b border-[#efeee9] pb-3">
              <h4 className="font-extrabold text-sm text-[#232528] flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-[#2b3e24]" /> Revenue & Sales Income
              </h4>
              <span className="text-xs font-black text-[#2b3e24] font-mono">₹28,45,000</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Domestic GST B2B Sales</span>
                <span className="font-bold text-[#232528] font-mono">₹24,50,000</span>
              </div>
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Interstate IGST Supplies</span>
                <span className="font-bold text-[#232528] font-mono">₹3,95,000</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
            <div className="flex items-center justify-between border-b border-[#efeee9] pb-3">
              <h4 className="font-extrabold text-sm text-[#232528] flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-rose-700" /> Operating Expenses & COGS
              </h4>
              <span className="text-xs font-black text-rose-700 font-mono">₹19,10,000</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Direct Raw Material Purchases</span>
                <span className="font-bold text-[#232528] font-mono">₹16,40,000</span>
              </div>
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Freight & Warehouse Logistics</span>
                <span className="font-bold text-[#232528] font-mono">₹2,70,000</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 p-6 rounded-[28px] bg-[#232528] text-white flex items-center justify-between shadow-xl">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#c9c8c5]">Estimated Net Operating Profit</div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-[#f5ba41]">₹9,35,000</div>
              <div className="text-xs text-[#c9c8c5] mt-0.5 font-medium">+32.8% Margin (FY 2026-27)</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/10">
              <TrendingUp className="h-8 w-8 text-[#f5ba41]" />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BALANCE SHEET ================= */}
      {activeSubTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-3">
            <div className="font-extrabold text-sm text-[#232528] border-b border-[#efeee9] pb-2">Liabilities & Equity</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Capital & Reserves</span>
                <span className="font-bold text-[#232528] font-mono">₹45,00,000</span>
              </div>
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Sundry Creditors</span>
                <span className="font-bold text-[#232528] font-mono">₹12,40,000</span>
              </div>
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>GST Tax Payable</span>
                <span className="font-bold text-[#232528] font-mono">₹2,80,000</span>
              </div>
              <div className="border-t border-[#efeee9] pt-2 flex justify-between font-extrabold text-[#232528]">
                <span>Total Liabilities</span>
                <span className="font-mono">₹60,20,000</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-3">
            <div className="font-extrabold text-sm text-[#232528] border-b border-[#efeee9] pb-2">Assets & Receivables</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Fixed Assets & Machinery</span>
                <span className="font-bold text-[#232528] font-mono">₹32,00,000</span>
              </div>
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Sundry Debtors (Receivables)</span>
                <span className="font-bold text-[#232528] font-mono">₹18,50,000</span>
              </div>
              <div className="flex justify-between py-1 text-[#88898b]">
                <span>Bank & Cash Balances</span>
                <span className="font-bold text-[#232528] font-mono">₹9,70,000</span>
              </div>
              <div className="border-t border-[#efeee9] pt-2 flex justify-between font-extrabold text-[#232528]">
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
