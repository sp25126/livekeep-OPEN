'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Voucher } from '@/types/database';
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

interface CustomerReminder {
  name: string;
  amount: number;
  days: number;
  phone: string;
  invoice: string;
  avatar?: string;
}

export default function ReportsView() {
  const [activeSubTab, setActiveSubTab] = useState<'aging' | 'pnl' | 'balance'>('aging');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReminder | null>(null);
  const [scheduleDate, setScheduleDate] = useState('2026-04-12');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadReportsData() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vouchers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setVouchers(data as Voucher[]);
        }
      } catch (err) {
        console.error('Error loading vouchers for reports:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReportsData();
  }, []);

  // Compute Dynamic Aging Buckets & Overdue Customers from Live Supabase Vouchers
  const now = new Date();
  
  // Pending or Sales receivables
  const receivableVouchers = vouchers.filter((v) => 
    v.voucher_type === 'sales_bill' || v.voucher_type === 'sales_order' || v.status === 'pending'
  );

  let bucket0to30 = { amount: 0, count: 0 };
  let bucket31to60 = { amount: 0, count: 0 };
  let bucket61to90 = { amount: 0, count: 0 };
  let bucket90Plus = { amount: 0, count: 0 };
  const calculatedOverdue: CustomerReminder[] = [];

  receivableVouchers.forEach((v) => {
    const voucherDate = new Date(v.voucher_date || v.created_at || now);
    const diffTime = Math.abs(now.getTime() - voucherDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      bucket0to30.amount += v.total_amount;
      bucket0to30.count += 1;
    } else if (diffDays <= 60) {
      bucket31to60.amount += v.total_amount;
      bucket31to60.count += 1;
    } else if (diffDays <= 90) {
      bucket61to90.amount += v.total_amount;
      bucket61to90.count += 1;
    } else {
      bucket90Plus.amount += v.total_amount;
      bucket90Plus.count += 1;
    }

    if (diffDays >= 30) {
      calculatedOverdue.push({
        name: v.party_name,
        amount: v.total_amount,
        days: diffDays,
        phone: '+919876543210',
        invoice: v.voucher_number
      });
    }
  });

  const agingBuckets = [
    { range: '0–30 Days', amount: bucket0to30.amount, count: bucket0to30.count, bg: 'bg-[#D2DEC9] text-[#2b3e24]' },
    { range: '31–60 Days', amount: bucket31to60.amount, count: bucket31to60.count, bg: 'bg-[#FBE29D] text-[#4d3809]' },
    { range: '61–90 Days', amount: bucket61to90.amount, count: bucket61to90.count, bg: 'bg-[#8F94FB]/20 text-[#2c307a]' },
    { range: '90+ Days (Overdue)', amount: bucket90Plus.amount, count: bucket90Plus.count, bg: 'bg-[#F8D7DA] text-[#721C24]' }
  ];

  // Dynamic P&L Calculations
  const totalSalesRevenue = vouchers
    .filter((v) => v.voucher_type === 'sales_bill' || v.voucher_type === 'sales_order')
    .reduce((acc, v) => acc + v.total_amount, 0);

  const totalPurchasesCOGS = vouchers
    .filter((v) => v.voucher_type === 'purchase_order' || v.voucher_type === 'payment')
    .reduce((acc, v) => acc + v.total_amount, 0);

  const netOperatingProfit = totalSalesRevenue - totalPurchasesCOGS;
  const marginPercentage = totalSalesRevenue > 0 
    ? ((netOperatingProfit / totalSalesRevenue) * 100).toFixed(1) 
    : '0.0';

  // Dynamic Balance Sheet Calculations
  const sundryDebtors = receivableVouchers.reduce((acc, v) => acc + v.total_amount, 0);
  const sundryCreditors = vouchers
    .filter((v) => v.voucher_type === 'purchase_order' && v.status === 'pending')
    .reduce((acc, v) => acc + v.total_amount, 0);

  const totalReceipts = vouchers
    .filter((v) => v.voucher_type === 'receipt')
    .reduce((acc, v) => acc + v.total_amount, 0);

  const totalPayments = vouchers
    .filter((v) => v.voucher_type === 'payment')
    .reduce((acc, v) => acc + v.total_amount, 0);

  const bankAndCashBalance = Math.max(0, totalReceipts - totalPayments);
  const totalLiabilities = sundryCreditors + (totalSalesRevenue * 0.18);
  const totalAssets = sundryDebtors + bankAndCashBalance;

  const getWhatsAppReminderUrl = (customer: CustomerReminder) => {
    const text = `Dear ${customer.name},\n\nThis is a gentle payment reminder from Livekeeping Enterprises regarding overdue invoice *${customer.invoice}* for the amount of *₹${customer.amount.toLocaleString('en-IN')}* (overdue by ${customer.days} days).\n\nKindly arrange payment via NEFT/UPI or reply if already cleared.\n\nThank you for your prompt cooperation!`;
    return `https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  const handleSendReminder = (customer: CustomerReminder) => {
    window.open(getWhatsAppReminderUrl(customer), '_blank');
  };

  const handleAddToGoogleCalendar = (customer: CustomerReminder, dateStr: string, timeStr = '10:00') => {
    const title = `💰 Payment Follow-up: ${customer.name} (₹${customer.amount.toLocaleString('en-IN')})`;
    const waUrl = getWhatsAppReminderUrl(customer);
    const details = `Overdue Payment Follow-up Reminder\n\n• Customer: ${customer.name}\n• Invoice: ${customer.invoice}\n• Amount Due: ₹${customer.amount.toLocaleString('en-IN')}\n• Overdue: ${customer.days} Days\n• Phone: ${customer.phone}\n\n👉 1-Tap to Send WhatsApp Reminder:\n${waUrl}\n\n(Scheduled via Livekeeping Open ERP)`;

    const cleanDate = dateStr.replace(/-/g, '');
    const [hours, mins] = timeStr.split(':');
    const startHour = hours || '10';
    const startMin = mins || '00';
    const endHour = String((parseInt(startHour) + 1) % 24).padStart(2, '0');

    const startDateTime = `${cleanDate}T${startHour}${startMin}00`;
    const endDateTime = `${cleanDate}T${endHour}${startMin}00`;

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(details)}&add=${encodeURIComponent(customer.name)}`;
    window.open(gcalUrl, '_blank');
  };

  const handleDownloadIcs = (customer: CustomerReminder, dateStr: string, timeStr = '10:00') => {
    const title = `💰 Payment Follow-up: ${customer.name} (₹${customer.amount.toLocaleString('en-IN')})`;
    const waUrl = getWhatsAppReminderUrl(customer);
    const details = `Overdue Payment Follow-up Reminder\\n\\nCustomer: ${customer.name}\\nInvoice: ${customer.invoice}\\nAmount Due: INR ${customer.amount}\\nDays Overdue: ${customer.days} Days\\n\\n1-Tap WhatsApp Link: ${waUrl}`;

    const cleanDate = dateStr.replace(/-/g, '');
    const [hours, mins] = timeStr.split(':');
    const startHour = hours || '10';
    const startMin = mins || '00';
    const endHour = String((parseInt(startHour) + 1) % 24).padStart(2, '0');

    const startDateTime = `${cleanDate}T${startHour}${startMin}00`;
    const endDateTime = `${cleanDate}T${endHour}${startMin}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Livekeeping Open//Payment Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Follow-up Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `payment-reminder-${customer.invoice.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveScheduledReminder = async (e: React.FormEvent, calendarOption?: 'google' | 'ics') => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setIsScheduling(true);
    try {
      const res = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: selectedCustomer.name,
          phone: selectedCustomer.phone,
          amountDue: selectedCustomer.amount,
          daysOverdue: selectedCustomer.days,
          scheduledFor: scheduleDate,
          voucherNumber: selectedCustomer.invoice
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScheduleFeedback(`Payment reminder scheduled for ${selectedCustomer.name} on ${scheduleDate}!`);
        
        if (calendarOption === 'google') {
          handleAddToGoogleCalendar(selectedCustomer, scheduleDate, scheduleTime);
        } else if (calendarOption === 'ics') {
          handleDownloadIcs(selectedCustomer, scheduleDate, scheduleTime);
        }

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
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-[24px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-2">
                  <div className="h-3 w-20 bg-[#e5e3dc] rounded-full"></div>
                  <div className="h-7 w-28 bg-[#e5e3dc] rounded-md"></div>
                  <div className="h-3 w-24 bg-[#e5e3dc] rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {agingBuckets.map((bucket) => (
                <div key={bucket.range} className={`p-5 rounded-[24px] ${bucket.bg} shadow-sm space-y-1`}>
                  <div className="text-[11px] font-black uppercase tracking-wider">{bucket.range}</div>
                  <div className="text-xl sm:text-2xl font-black">₹{bucket.amount.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] font-medium opacity-80">{bucket.count} Invoices Pending</div>
                </div>
              ))}
            </div>
          )}

          {/* Overdue Action Cards */}
          <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#232528] flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#8F94FB]" /> Critical Overdue Receivables
              </h3>
              <p className="text-xs text-[#88898b] mt-0.5">Send instant WhatsApp payment reminder messages or schedule calendar follow-ups</p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#f6f5f0] animate-pulse flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-[#e5e3dc] rounded"></div>
                      <div className="h-3 w-24 bg-[#e5e3dc] rounded-full"></div>
                    </div>
                    <div className="h-8 w-32 bg-[#e5e3dc] rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : calculatedOverdue.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#f6f5f0] text-[#88898b]">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[#2b3e24]" />
                <p className="text-xs font-bold text-[#232528]">All Customer Accounts Current</p>
                <p className="text-[11px] mt-0.5">No overdue customer invoices pending follow-up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calculatedOverdue.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#f6f5f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-[#232528] text-[#f5ba41] font-black text-sm flex items-center justify-center ring-2 ring-white">
                        {c.name.charAt(0)}
                      </div>
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
            )}
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
          {isLoading ? (
            <>
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-4">
                <div className="h-5 w-48 bg-[#e5e3dc] rounded"></div>
                <div className="h-4 w-full bg-[#e5e3dc] rounded"></div>
              </div>
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-4">
                <div className="h-5 w-48 bg-[#e5e3dc] rounded"></div>
                <div className="h-4 w-full bg-[#e5e3dc] rounded"></div>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
                <div className="flex items-center justify-between border-b border-[#efeee9] pb-3">
                  <h4 className="font-extrabold text-sm text-[#232528] flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-[#2b3e24]" /> Revenue & Sales Income
                  </h4>
                  <span className="text-xs font-black text-[#2b3e24] font-mono">₹{totalSalesRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-[#88898b]">
                    <span>Domestic GST Sales & Invoices</span>
                    <span className="font-bold text-[#232528] font-mono">₹{totalSalesRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
                <div className="flex items-center justify-between border-b border-[#efeee9] pb-3">
                  <h4 className="font-extrabold text-sm text-[#232528] flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-rose-700" /> Operating Purchases & Expenses
                  </h4>
                  <span className="text-xs font-black text-rose-700 font-mono">₹{totalPurchasesCOGS.toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-[#88898b]">
                    <span>Vendor Purchases & Disbursed Payments</span>
                    <span className="font-bold text-[#232528] font-mono">₹{totalPurchasesCOGS.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 p-6 rounded-[28px] bg-[#232528] text-white flex items-center justify-between shadow-xl">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#c9c8c5]">Estimated Net Operating Profit</div>
                  <div className="text-2xl sm:text-3xl font-black mt-1 text-[#f5ba41]">₹{netOperatingProfit.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-[#c9c8c5] mt-0.5 font-medium">{marginPercentage}% Margin on Live Vouchers</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10">
                  <TrendingUp className="h-8 w-8 text-[#f5ba41]" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= TAB 3: BALANCE SHEET ================= */}
      {activeSubTab === 'balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-3">
                <div className="h-5 w-36 bg-[#e5e3dc] rounded"></div>
                <div className="h-4 w-full bg-[#e5e3dc] rounded"></div>
              </div>
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-3">
                <div className="h-5 w-36 bg-[#e5e3dc] rounded"></div>
                <div className="h-4 w-full bg-[#e5e3dc] rounded"></div>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-3">
                <div className="font-extrabold text-sm text-[#232528] border-b border-[#efeee9] pb-2">Liabilities & Creditors</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-[#88898b]">
                    <span>Sundry Creditors (Pending Purchases)</span>
                    <span className="font-bold text-[#232528] font-mono">₹{sundryCreditors.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-[#efeee9] pt-2 flex justify-between font-extrabold text-[#232528]">
                    <span>Total Liabilities</span>
                    <span className="font-mono">₹{totalLiabilities.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-3">
                <div className="font-extrabold text-sm text-[#232528] border-b border-[#efeee9] pb-2">Assets & Receivables</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-[#88898b]">
                    <span>Sundry Debtors (Receivables)</span>
                    <span className="font-bold text-[#232528] font-mono">₹{sundryDebtors.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#88898b]">
                    <span>Bank & Cash Balances</span>
                    <span className="font-bold text-[#232528] font-mono">₹{bankAndCashBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-[#efeee9] pt-2 flex justify-between font-extrabold text-[#232528]">
                    <span>Total Assets</span>
                    <span className="font-mono">₹{totalAssets.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
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

            <form onSubmit={(e) => handleSaveScheduledReminder(e, 'google')} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1">Alert Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f0eee6] rounded-2xl text-[11px] text-[#555] space-y-1">
                <div className="font-bold text-[#232528] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#f5ba41]" /> Direct Calendar Sync
                </div>
                <div>
                  Creates a calendar event with an integrated <strong>1-Tap WhatsApp link</strong> in the notes, alerting your phone/laptop on the scheduled date!
                </div>
              </div>

              {/* Quick 1-Click Calendar Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-[#232528] hover:bg-black text-[#f5ba41] font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
                >
                  <CalendarClock className="h-4 w-4 text-[#f5ba41]" />
                  <span>{isScheduling ? 'Scheduling...' : 'Confirm & Add to Google Calendar'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveScheduledReminder(e as any, 'ics')}
                    disabled={isScheduling}
                    className="min-h-[40px] py-2 px-3 bg-white hover:bg-[#edece6] border border-[#e5e3dc] text-[#232528] font-bold rounded-2xl text-[11px] flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Apple / Outlook (.ics)</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSaveScheduledReminder(e as any)}
                    disabled={isScheduling}
                    className="min-h-[40px] py-2 px-3 bg-[#f6f5f0] hover:bg-[#edece6] text-[#666] font-bold rounded-2xl text-[11px] flex items-center justify-center transition"
                  >
                    <span>System Only</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
