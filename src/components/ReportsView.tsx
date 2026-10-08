'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Phone, 
  MessageCircle, 
  ChevronDown, 
  ChevronRight, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReportsView() {
  const [activeReportTab, setActiveReportTab] = useState<'aging' | 'pnl' | 'stock'>('aging');
  const [remindedParty, setRemindedParty] = useState<string | null>(null);

  // Sample Receivables Aging Data
  const receivables = [
    {
      partyName: 'Apex Retail Enterprises',
      gstin: '27AABCU9603R1ZM',
      phone: '+919825012345',
      totalDue: 42480.00,
      overdueBucket: '61–90 Days',
      daysOverdue: 68,
      status: 'critical'
    },
    {
      partyName: 'Bharat Precision Gears Ltd',
      gstin: '24AAACB9876Q1ZV',
      phone: '+919879054321',
      totalDue: 68900.00,
      overdueBucket: '31–60 Days',
      daysOverdue: 42,
      status: 'warning'
    },
    {
      partyName: 'Acme Industrial Solutions',
      gstin: '24AAACA12341ZV',
      phone: '+919824098765',
      totalDue: 26550.00,
      overdueBucket: '0–30 Days',
      daysOverdue: 14,
      status: 'normal'
    },
    {
      partyName: 'Delta Electronics Components',
      gstin: '29AABBD3344K1ZS',
      phone: '+919909011223',
      totalDue: 85200.00,
      overdueBucket: '90+ Days',
      daysOverdue: 104,
      status: 'critical'
    }
  ];

  // Stock Summary Data
  const inventoryItems = [
    {
      itemName: 'Industrial Sensor Probe X1',
      sku: 'SEN-X1-9031',
      hsn: '90318000',
      availableQty: 142,
      minThreshold: 30,
      godown: 'Ahmedabad Main Central Godown',
      closingValue: 639000.00,
      status: 'in_stock'
    },
    {
      itemName: 'Smart Terminal Controller',
      sku: 'TRM-ST-8471',
      hsn: '84713010',
      availableQty: 8,
      minThreshold: 15,
      godown: 'Vatva Warehouse Bay 3',
      closingValue: 144000.00,
      status: 'low_stock'
    },
    {
      itemName: 'Relay Interface Module 24V',
      sku: 'REL-MOD-8536',
      hsn: '85364100',
      availableQty: 320,
      minThreshold: 50,
      godown: 'Ahmedabad Main Central Godown',
      closingValue: 288000.00,
      status: 'in_stock'
    }
  ];

  const handleSendReminder = (partyName: string, phone: string, amount: number) => {
    setRemindedParty(partyName);
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Dear ${partyName}, This is a gentle payment reminder from Livekeeping Open for outstanding balance of ₹${amount.toLocaleString('en-IN')}. Please verify.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 }
    });

    setTimeout(() => setRemindedParty(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 max-w-md overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('aging')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[40px] ${
            activeReportTab === 'aging'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Receivables Aging
        </button>
        <button
          onClick={() => setActiveReportTab('pnl')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[40px] ${
            activeReportTab === 'pnl'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Profit & Loss
        </button>
        <button
          onClick={() => setActiveReportTab('stock')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[40px] ${
            activeReportTab === 'stock'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Inventory Stock
        </button>
      </div>

      {/* ================= 1. RECEIVABLES & AGING REPORT ================= */}
      {activeReportTab === 'aging' && (
        <div className="space-y-5">
          {/* Top Level Summary Cards (Swipeable on Mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-x-auto pb-1">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 min-w-[140px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">0–30 Days (Current)</div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1">₹26,550</div>
              <div className="text-[10px] text-slate-500 mt-0.5">1 Party Pending</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 min-w-[140px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">31–60 Days</div>
              <div className="text-lg sm:text-xl font-extrabold text-blue-400 mt-1">₹68,900</div>
              <div className="text-[10px] text-slate-500 mt-0.5">1 Party Approaching</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 min-w-[140px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase">61–90 Days</div>
              <div className="text-lg sm:text-xl font-extrabold text-amber-400 mt-1">₹42,480</div>
              <div className="text-[10px] text-amber-500/80 mt-0.5">Follow-up Due</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 min-w-[140px]">
              <div className="text-[10px] font-bold text-rose-400 uppercase">90+ Days Overdue</div>
              <div className="text-lg sm:text-xl font-extrabold text-rose-400 mt-1">₹85,200</div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">High Priority</div>
            </div>
          </div>

          {/* Party Overdue Priority List */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Party-wise Outstanding Ledger</h3>
                <p className="text-xs text-slate-400">1-Tap WhatsApp Payment Reminders and Call Shortcuts</p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {receivables.map((r, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{r.partyName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : r.status === 'warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {r.overdueBucket}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      GSTIN: {r.gstin} • {r.daysOverdue} Days Past Invoice
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-extrabold text-white">₹{r.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-slate-400">Outstanding Balance</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${r.phone}`}
                        className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center border border-slate-700 transition"
                        title="Call Party"
                      >
                        <Phone className="h-4 w-4" />
                      </a>

                      <button
                        onClick={() => handleSendReminder(r.partyName, r.phone, r.totalDue)}
                        className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">WhatsApp Reminder</span>
                        <span className="sm:hidden">Remind</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. PROFIT & LOSS STATEMENT ================= */}
      {activeReportTab === 'pnl' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" /> Income & Expense Statement (P&L)
            </h3>
            <p className="text-xs text-slate-400">Financial Year 2026–27 • Tally Verified General Ledger</p>
          </div>

          {/* Desktop Split / Mobile Collapsible Accordion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue / Income Side */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Direct Income & Sales
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2 text-xs">
                <details className="group" open>
                  <summary className="flex items-center justify-between font-bold text-white cursor-pointer select-none py-1">
                    <span>Sales Accounts</span>
                    <span className="text-emerald-400">₹8,42,000.00</span>
                  </summary>
                  <div className="pl-4 pt-2 space-y-1.5 text-slate-400 border-l border-slate-800 ml-2 mt-1">
                    <div className="flex justify-between"><span>Domestic B2B Sales (GST 18%)</span><span>₹7,20,000.00</span></div>
                    <div className="flex justify-between"><span>Inter-State Supply (IGST)</span><span>₹1,22,000.00</span></div>
                  </div>
                </details>

                <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                  <span>Gross Operating Income</span>
                  <span className="text-emerald-400">₹8,42,000.00</span>
                </div>
              </div>
            </div>

            {/* Expense / Cost Side */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" /> Cost of Sales & Operations
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2 text-xs">
                <details className="group" open>
                  <summary className="flex items-center justify-between font-bold text-white cursor-pointer select-none py-1">
                    <span>Direct Expenses</span>
                    <span className="text-rose-400">₹4,12,000.00</span>
                  </summary>
                  <div className="pl-4 pt-2 space-y-1.5 text-slate-400 border-l border-slate-800 ml-2 mt-1">
                    <div className="flex justify-between"><span>Component Raw Purchases</span><span>₹3,40,000.00</span></div>
                    <div className="flex justify-between"><span>Freight & Transport Inward</span><span>₹72,000.00</span></div>
                  </div>
                </details>

                <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Direct Costs</span>
                  <span className="text-rose-400">₹4,12,000.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Profit Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-950 border border-emerald-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase">Net Operating Profit</div>
              <div className="text-xs text-slate-300">Gross Margin: 51.06%</div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-300">
              ₹4,30,000.00
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. INVENTORY & STOCK SUMMARY ================= */}
      {activeReportTab === 'stock' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" /> Real-time Warehouse Inventory
              </h3>
              <p className="text-xs text-slate-400">Multi-Godown Stock Levels & Reorder Thresholds</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {inventoryItems.map((item, idx) => (
              <details key={idx} className="group py-3.5 cursor-pointer">
                <summary className="flex items-center justify-between list-none">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${
                      item.status === 'low_stock' ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{item.itemName}</div>
                      <div className="text-xs text-slate-400 font-mono">SKU: {item.sku} • HSN: {item.hsn}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-white">{item.availableQty} Units</div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.status === 'low_stock'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {item.status === 'low_stock' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                {/* Expanded Godown Breakdown */}
                <div className="mt-3 pl-11 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Primary Location:</span><span className="font-semibold text-white">{item.godown}</span></div>
                  <div className="flex justify-between"><span>Minimum Reorder Level:</span><span className="font-mono text-amber-400">{item.minThreshold} Units</span></div>
                  <div className="flex justify-between"><span>Total Valuation:</span><span className="font-mono font-bold text-emerald-400">₹{item.closingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
