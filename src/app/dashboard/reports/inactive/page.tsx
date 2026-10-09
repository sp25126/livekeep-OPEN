'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InactiveCustomer } from '@/types/database';
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
  Send
} from 'lucide-react';

const SAMPLE_INACTIVE_CUSTOMERS: InactiveCustomer[] = [
  {
    party_name: 'Adani Logistics & Ports Ltd',
    party_gstin: '24AAACA9988P1Z1',
    phone_number: '919876543210',
    last_sale_date: '2026-04-12T10:00:00Z',
    days_since_last_sale: 180,
    total_sales_value: 1250000,
    lifetime_invoice_count: 8,
    inactivity_tier: '180_plus_days'
  },
  {
    party_name: 'Gujarat Polychem Industries',
    party_gstin: '24AAACG1122K1Z9',
    phone_number: '919876543211',
    last_sale_date: '2026-07-05T14:30:00Z',
    days_since_last_sale: 96,
    total_sales_value: 485000,
    lifetime_invoice_count: 4,
    inactivity_tier: '90_days'
  },
  {
    party_name: 'Surat Diamond Cutting Tools Corp',
    party_gstin: '24AAACD4433L1Z4',
    phone_number: '919876543212',
    last_sale_date: '2026-08-08T09:15:00Z',
    days_since_last_sale: 62,
    total_sales_value: 320000,
    lifetime_invoice_count: 3,
    inactivity_tier: '60_days'
  },
  {
    party_name: 'Ahmedabad Foundry Works LLP',
    party_gstin: '24AAACA5566M1Z2',
    phone_number: '919876543213',
    last_sale_date: '2026-09-07T11:45:00Z',
    days_since_last_sale: 32,
    total_sales_value: 175000,
    lifetime_invoice_count: 2,
    inactivity_tier: '30_days'
  },
  {
    party_name: 'Vadodara Power Transmission Ltd',
    party_gstin: '24AAACV7788N1Z5',
    phone_number: '919876543214',
    last_sale_date: '2026-03-20T16:00:00Z',
    days_since_last_sale: 203,
    total_sales_value: 890000,
    lifetime_invoice_count: 6,
    inactivity_tier: '180_plus_days'
  },
  {
    party_name: 'Rajkot Diesel Engines & Pumps',
    party_gstin: '24AAACR9900O1Z8',
    phone_number: '919876543215',
    last_sale_date: '2026-07-15T12:00:00Z',
    days_since_last_sale: 86,
    total_sales_value: 260000,
    lifetime_invoice_count: 2,
    inactivity_tier: '60_days'
  }
];

export default function InactiveCustomersPage() {
  const [customers, setCustomers] = useState<InactiveCustomer[]>(SAMPLE_INACTIVE_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | '30_days' | '60_days' | '90_days' | '180_plus_days'>('all');

  useEffect(() => {
    async function loadInactiveFromDb() {
      try {
        const { data, error } = await supabase.from('view_inactive_customers').select('*');
        if (!error && data && data.length > 0) {
          setCustomers(data as InactiveCustomer[]);
        }
      } catch (e) {
        console.log('Using sample inactive customer dataset');
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
    const message = `*Exclusive Greeting from Livekeeping Enterprises*\n\nDear *${cust.party_name}*,\n\nWe noticed it has been *${cust.days_since_last_sale} days* since our last transaction. We value our partnership and would love to support your upcoming supply requirements.\n\n*Special Re-Engagement Offer:*\n• Direct priority dispatch on all industrial valves & fittings.\n• Volume discounts for repeat orders.\n• Updated GST billing & same-day E-Way bill generation.\n\nPlease let us know if we can share our updated 2026-27 catalog or assist with any quotation!\n\nBest regards,\n*Livekeeping Enterprises*`;

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

        {/* Inactive Customers Table */}
        <div className="rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] overflow-hidden">
          <div className="overflow-x-auto">
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
        </div>
      </div>
    </div>
  );
}
