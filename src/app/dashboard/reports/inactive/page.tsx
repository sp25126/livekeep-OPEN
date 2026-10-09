'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InactiveCustomer, Voucher } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { 
  UserX, 
  Search, 
  Filter, 
  ArrowLeft, 
  Share2, 
  Calendar, 
  Clock, 
  IndianRupee, 
  TrendingDown, 
  Building2, 
  Sparkles,
  PhoneCall,
  Send,
  CheckCircle2
} from 'lucide-react';

export default function InactiveCustomersPage() {
  const [customers, setCustomers] = useState<InactiveCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | '30_days' | '60_days' | '90_days' | '180_plus_days'>('all');

  useEffect(() => {
    async function loadInactiveFromDb() {
      setIsLoading(true);
      try {
        // Try querying the SQL view first
        const { data: viewData, error: viewError } = await supabase.from('view_inactive_customers').select('*');
        if (!viewError && viewData && viewData.length > 0) {
          setCustomers(viewData as InactiveCustomer[]);
          return;
        }

        // Fallback: Dynamically aggregate directly from vouchers table
        const { data: vouchersData, error: vouchersError } = await supabase
          .from('vouchers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!vouchersError && vouchersData && vouchersData.length > 0) {
          const now = new Date().getTime();
          const partyMap = new Map<string, {
            party_name: string;
            party_gstin?: string;
            latestDate: number;
            totalSales: number;
            invoiceCount: number;
          }>();

          vouchersData.forEach((v: Voucher) => {
            const vDate = new Date(v.voucher_date || v.created_at).getTime();
            const existing = partyMap.get(v.party_name);
            if (!existing) {
              partyMap.set(v.party_name, {
                party_name: v.party_name,
                party_gstin: v.party_gstin,
                latestDate: vDate,
                totalSales: v.total_amount,
                invoiceCount: 1
              });
            } else {
              existing.totalSales += v.total_amount;
              existing.invoiceCount += 1;
              if (vDate > existing.latestDate) {
                existing.latestDate = vDate;
              }
            }
          });

          const derived: InactiveCustomer[] = [];
          partyMap.forEach((info) => {
            const daysSince = Math.max(1, Math.floor((now - info.latestDate) / (1000 * 60 * 60 * 24)));
            let tier: InactiveCustomer['inactivity_tier'] = '30_days';
            if (daysSince >= 180) tier = '180_plus_days';
            else if (daysSince >= 90) tier = '90_days';
            else if (daysSince >= 60) tier = '60_days';

            derived.push({
              party_name: info.party_name,
              party_gstin: info.party_gstin,
              phone_number: '919876543210',
              last_sale_date: new Date(info.latestDate).toISOString(),
              days_since_last_sale: daysSince,
              total_sales_value: info.totalSales,
              lifetime_invoice_count: info.invoiceCount,
              inactivity_tier: tier
            });
          });

          setCustomers(derived);
        }
      } catch (e) {
        console.error('Failed to load inactive customer data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadInactiveFromDb();
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch = 
      cust.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.party_gstin && cust.party_gstin.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === 'all' || cust.inactivity_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const count180 = customers.filter((c) => c.days_since_last_sale >= 180).length;
  const count90 = customers.filter((c) => c.days_since_last_sale >= 90 && c.days_since_last_sale < 180).length;
  const count60 = customers.filter((c) => c.days_since_last_sale >= 60 && c.days_since_last_sale < 90).length;
  const totalDormantValue = customers.reduce((acc, c) => acc + c.total_sales_value, 0);

  const handleReactivationWhatsApp = (cust: InactiveCustomer) => {
    const message = `*Customer Appreciation & Re-Engagement*\n\nDear *${cust.party_name}*,\n\nWe noticed it has been *${cust.days_since_last_sale} days* since our last transaction. We truly value our partnership and would love to support your upcoming requirements.\n\n*Special Re-Engagement Benefits:*\n• Priority order processing & dedicated dispatch.\n• Volume pricing benefits for repeat orders.\n• Instant GST compliance & same-day billing.\n\nPlease let us know if we can assist with any upcoming requirements or quotations!\n\nBest regards,\n*Sales & Accounts Team*`;

    const cleanPhone = (cust.phone_number || '').replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#ecebe6] text-[#232528] p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e3dc] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2.5 rounded-full bg-[#fafaf8] hover:bg-[#edece6] text-[#232528] transition btn-pill border border-[#e5e3dc]"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#232528] tracking-tight flex items-center gap-2">
                <UserX className="h-6 w-6 text-[#f5ba41]" /> Inactive Customer Analytics
              </h1>
              <p className="text-xs text-[#88898b]">Identify dormant B2B parties and trigger 1-tap WhatsApp re-engagement</p>
            </div>
          </div>
        </header>

        {/* Top Metric Pastel Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 sm:p-5 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-2">
                <div className="h-3 w-20 bg-[#e5e3dc] rounded-full"></div>
                <div className="h-7 w-28 bg-[#e5e3dc] rounded-md"></div>
                <div className="h-3 w-24 bg-[#e5e3dc] rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: 180+ Days Dormant (High Alert) */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#fbeaea] text-[#b91c1c] shadow-sm relative overflow-hidden flex flex-col justify-between border border-rose-200">
              <div>
                <div className="flex items-center justify-between text-[#b91c1c]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">180+ Days Inactive</span>
                  <span className="p-1 rounded-full bg-rose-200 text-[#b91c1c]">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">{count180} Accounts</div>
                <div className="text-[10px] text-[#b91c1c] mt-1 font-bold">Requires Direct Executive Call</div>
              </div>
            </div>

            {/* Card 2: 90-180 Days */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#fbe29d] text-[#4d3809] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#4d3809]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">90–180 Days</span>
                  <span className="p-1 rounded-full bg-[#e8cd84] text-[#4d3809]">
                    <TrendingDown className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">{count90} Accounts</div>
                <div className="text-[10px] text-[#4d3809]/80 mt-1 font-bold">Quarterly Lapse</div>
              </div>
            </div>

            {/* Card 3: 60-90 Days */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#dfe5ec] text-[#1e293b] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#1e293b]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">60–90 Days</span>
                  <span className="p-1 rounded-full bg-[#cbd5e1] text-[#1e293b]">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">{count60} Accounts</div>
                <div className="text-[10px] text-[#1e293b]/80 mt-1 font-bold">Early Warning Bucket</div>
              </div>
            </div>

            {/* Card 4: Total Dormant Sales Value */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#d2dec9] text-[#24351e] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#24351e]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Lifetime Value At Risk</span>
                  <span className="p-1 rounded-full bg-[#bccbb2] text-[#24351e]">
                    <IndianRupee className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">
                  ₹{totalDormantValue.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#24351e]/80 mt-1 font-bold">Historic Revenue Pool</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#88898b]" />
            <input
              type="text"
              placeholder="Search dormant customer or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#f6f5f0] border-none rounded-full text-xs sm:text-sm font-medium text-[#232528] placeholder-[#88898b] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Inactive' },
              { id: '30_days', label: '30+ Days' },
              { id: '60_days', label: '60+ Days' },
              { id: '90_days', label: '90+ Days' },
              { id: '180_plus_days', label: `180+ Days (${count180})`, alert: count180 > 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTierFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap btn-pill ${
                  tierFilter === tab.id
                    ? 'bg-[#232528] text-white shadow-sm'
                    : tab.alert
                    ? 'bg-rose-100 text-rose-700 font-black'
                    : 'bg-[#f6f5f0] text-[#88898b] hover:text-[#232528]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inactive Customers Table and Mobile Cards */}
        <div className="rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e3dc] bg-[#f6f5f0] text-[11px] font-extrabold uppercase tracking-wider text-[#88898b]">
                      <th className="py-4 px-6">Customer / B2B Party</th>
                      <th className="py-4 px-6">GSTIN</th>
                      <th className="py-4 px-6">Inactivity Period</th>
                      <th className="py-4 px-6 text-right">Lifetime Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efeee9]">
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-6 space-y-1"><div className="h-4 w-40 bg-[#e5e3dc] rounded"></div><div className="h-3 w-24 bg-[#e5e3dc] rounded-full"></div></td>
                        <td className="py-4 px-6"><div className="h-4 w-28 bg-[#e5e3dc] rounded"></div></td>
                        <td className="py-4 px-6"><div className="h-5 w-24 bg-[#e5e3dc] rounded-full"></div></td>
                        <td className="py-4 px-6 text-right"><div className="h-5 w-20 bg-[#e5e3dc] rounded ml-auto"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#e5e3dc] animate-pulse space-y-2">
                    <div className="h-4 w-36 bg-[#e5e3dc] rounded"></div>
                    <div className="h-3 w-24 bg-[#e5e3dc] rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#2b3e24] mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-[#232528]">No Dormant Customers</h3>
              <p className="text-xs text-[#88898b] mt-1 max-w-sm mx-auto">
                {searchTerm || tierFilter !== 'all'
                  ? 'No dormant customers match the active search or inactivity filter.'
                  : 'All customers are actively transacting with no prolonged inactivity recorded.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e3dc] bg-[#f6f5f0] text-[11px] font-extrabold uppercase tracking-wider text-[#88898b]">
                      <th className="py-4 px-6">Customer / B2B Party</th>
                      <th className="py-4 px-6">GSTIN</th>
                      <th className="py-4 px-6">Last Purchase Date</th>
                      <th className="py-4 px-6 text-center">Inactivity Period</th>
                      <th className="py-4 px-6 text-right">Lifetime Sales</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efeee9] text-xs">
                    {filteredCustomers.map((cust, idx) => {
                      const isSevere = cust.days_since_last_sale >= 180;
                      const isModerate = cust.days_since_last_sale >= 90;

                      return (
                        <tr key={idx} className="hover:bg-[#f6f5f0]/80 transition">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-sm text-[#232528]">{cust.party_name}</div>
                            <div className="text-[11px] text-[#88898b] font-mono mt-0.5">{cust.phone_number || '+91 98765 43210'}</div>
                          </td>

                          <td className="py-4 px-6 font-mono text-[#88898b]">
                            {cust.party_gstin || 'Unregistered'}
                          </td>

                          <td className="py-4 px-6 font-medium text-[#232528]">
                            {new Date(cust.last_sale_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>

                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-mono font-black text-xs px-3 py-1 rounded-full ${
                              isSevere 
                                ? 'bg-rose-100 text-rose-700 font-extrabold ring-2 ring-rose-200' 
                                : isModerate
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              <Clock className="h-3.5 w-3.5" />
                              {cust.days_since_last_sale} Days Inactive
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-black text-sm text-[#232528]">
                            ₹{cust.total_sales_value.toLocaleString('en-IN')}
                            <div className="text-[10px] text-[#88898b] font-normal">{cust.lifetime_invoice_count} Bills</div>
                          </td>

                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleReactivationWhatsApp(cust)}
                              className="px-4 py-2 bg-[#D2DEC9] hover:bg-[#c2d2b7] text-[#2b3e24] font-black rounded-full text-xs flex items-center gap-1.5 btn-pill transition shadow-sm ml-auto"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Reactivation WhatsApp</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="flex flex-col space-y-4 md:hidden p-4">
                {filteredCustomers.map((cust, idx) => {
                  const isSevere = cust.days_since_last_sale >= 180;
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-[#e5e3dc] space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#232528]">{cust.party_name}</h4>
                          <div className="text-[11px] text-[#88898b] font-mono mt-0.5">GST: {cust.party_gstin || 'Unregistered'}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          isSevere ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {cust.days_since_last_sale}d
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#efeee9] flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-[#88898b] block">Lifetime Value</span>
                          <span className="font-mono font-black text-sm text-[#232528]">₹{cust.total_sales_value.toLocaleString('en-IN')}</span>
                        </div>

                        <button
                          onClick={() => handleReactivationWhatsApp(cust)}
                          className="px-3.5 py-1.5 bg-[#D2DEC9] text-[#2b3e24] font-bold rounded-full text-xs flex items-center gap-1"
                        >
                          <Share2 className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
