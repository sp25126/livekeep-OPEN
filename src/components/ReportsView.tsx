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
  ArrowDownRight,
  Calendar,
  CalendarClock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReportsView() {
  const [activeSubTab, setActiveSubTab] = useState<'aging' | 'pnl' | 'balance'>('aging');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; amount: number; days: number; phone: string; invoice: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);

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

  const handleSaveScheduledReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !scheduleDate) return;

    setIsScheduling(true);
    try {
      const res = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: selectedCustomer.name,
          phoneNumber: selectedCustomer.phone,
          amountDue: selectedCustomer.amount,
          scheduledFor: scheduleDate,
          voucherNumber: selectedCustomer.invoice
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScheduleFeedback(`Payment reminder scheduled for ${selectedCustomer.name} on ${scheduleDate}!`);
        setIsScheduleModalOpen(false);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else {
        alert(data.error || 'Failed to schedule reminder');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsScheduling(false);
      setTimeout(() => setScheduleFeedback(null), 5000);
    }
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsScheduleModalOpen(true);
                        }}
                        className="min-h-[40px] px-4 py-2 bg-white hover:bg-[#edece6] text-[#232528] font-bold rounded-full text-xs flex items-center gap-1.5 btn-pill border border-[#e5e3dc]"
                        title="Schedule automated reminder"
                      >
                        <CalendarClock className="h-4 w-4 text-[#88898b]" /> Schedule
                      </button>

                      <button
                        onClick={() => handleSendReminder(c)}
                        className="min-h-[40px] px-5 py-2 bg-[#D2DEC9] hover:bg-[#c2d2b7] text-[#2b3e24] font-black rounded-full text-xs flex items-center gap-1.5 btn-pill shadow-sm"
                      >
                        <Share2 className="h-4 w-4" /> Remind WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {scheduleFeedback && (
            <div className="p-4 rounded-2xl bg-[#D2DEC9] text-[#2b3e24] text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{scheduleFeedback}</span>
            </div>
          )}
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

      {/* SCHEDULE PAYMENT REMINDER MODAL */}
      {isScheduleModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base font-black text-[#232528] flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#f5ba41]" /> Schedule Payment Reminder
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-[#88898b] hover:text-[#232528]">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f6f5f0] space-y-1.5 text-xs">
              <div className="font-extrabold text-sm text-[#232528]">{selectedCustomer.name}</div>
              <div className="flex justify-between text-[#88898b]">
                <span>Invoice: <strong className="font-mono text-[#232528]">{selectedCustomer.invoice}</strong></span>
                <span>Overdue: <strong className="text-rose-700 font-bold">{selectedCustomer.days} Days</strong></span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#232528] pt-1 border-t border-[#e5e3dc]">
                <span>Amount Due</span>
                <span className="font-mono text-[#f5ba41] bg-[#232528] px-2.5 py-0.5 rounded-lg">₹{selectedCustomer.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleSaveScheduledReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Select Execution Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                />
                <span className="text-[11px] text-[#88898b] mt-1 block">
                  The automated cron worker will dispatch a WhatsApp payment reminder on this date.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full btn-pill shadow-md shadow-[#f5ba41]/20 disabled:opacity-50"
                >
                  {isScheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
