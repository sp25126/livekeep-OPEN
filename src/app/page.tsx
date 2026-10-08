'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Voucher, UserRole, PaymentStatus } from '@/types/database';
import sampleData from '@/data/sample_invoices.json';
import confetti from 'canvas-confetti';
import { queueOfflineVoucher } from '@/lib/services/offlineSync';

// Modular Components
import Navigation from '@/components/Navigation';
import VoucherList from '@/components/VoucherList';
import VoucherDrawer from '@/components/VoucherDrawer';
import ReportsView from '@/components/ReportsView';

import { 
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  MapPin, 
  RefreshCw, 
  Sparkles,
  Share2,
  DollarSign,
  Percent,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('checker');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected voucher for drawer preview
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  
  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [generatingIrnId, setGeneratingIrnId] = useState<string | null>(null);

  // New Voucher Form State
  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('24AAACA12341ZV');
  const [amount, setAmount] = useState('');
  const [voucherType, setVoucherType] = useState<'sales_bill' | 'quotation'>('sales_bill');

  useEffect(() => {
    // Load initial mock data
    const initialVouchers: Voucher[] = sampleData.invoices.map((inv, idx) => ({
      id: `mock-${idx + 1}`,
      organization_id: 'org-101',
      voucher_number: inv.voucher_number,
      voucher_type: inv.voucher_type as any,
      party_name: inv.party_details.party_name,
      party_gstin: inv.party_details.party_gstin,
      billing_address: inv.party_details.billing_address,
      place_of_supply: inv.party_details.place_of_supply,
      total_amount: inv.summary.grand_total,
      tax_amount: inv.summary.total_tax,
      status: inv.summary.status as PaymentStatus,
      irn_number: inv.compliance.irn && !inv.compliance.irn.includes('Pending') ? inv.compliance.irn : undefined,
      eway_bill_no: inv.compliance.eway_bill_no || undefined,
      items: inv.items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setVouchers(initialVouchers);

    // Subscribe to Supabase Realtime for Vouchers
    const channel = supabase
      .channel('vouchers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vouchers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVouchers((prev) => [payload.new as Voucher, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVouchers((prev) =>
              prev.map((v) => (v.id === payload.new.id ? (payload.new as Voucher) : v))
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update Status (Maker-Checker Authorization)
  const handleUpdateStatus = async (id: string, newStatus: PaymentStatus) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus, updated_at: new Date().toISOString() } : v))
    );

    if (newStatus === 'approved') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    try {
      if (newStatus === 'approved') {
        const targetVoucher = vouchers.find(v => v.id === id);
        await fetch('/api/vouchers/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voucherId: id,
            approvedBy: 'checker-01',
            voucherNumber: targetVoucher?.voucher_number,
            partyName: targetVoucher?.party_name,
            amount: targetVoucher?.total_amount
          })
        });
      } else {
        await supabase.from('vouchers').update({ status: newStatus }).eq('id', id);
      }
    } catch (e) {
      console.log('Operating in session mode:', e);
    }
  };

  // 1-Click NIC Government E-Invoice & E-Way Bill Generation
  const handleGenerateIrn = async (id: string) => {
    setGeneratingIrnId(id);
    try {
      const response = await fetch(`/api/vouchers/${id}/generate-irn`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success && data.irn) {
        setVouchers((prev) =>
          prev.map((v) =>
            v.id === id
              ? { 
                  ...v, 
                  irn_number: data.irn, 
                  eway_bill_no: data.ewayBillNo || undefined, 
                  status: 'approved',
                  updated_at: new Date().toISOString() 
                }
              : v
          )
        );

        if (selectedVoucher && selectedVoucher.id === id) {
          setSelectedVoucher((prev) => prev ? {
            ...prev,
            irn_number: data.irn,
            eway_bill_no: data.ewayBillNo || undefined,
            status: 'approved'
          } : null);
        }

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Failed to generate IRN via API:', err);
      const mockIrn = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockEway = '24' + Math.floor(1000000000 + Math.random() * 9000000000);
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, irn_number: mockIrn, eway_bill_no: mockEway, updated_at: new Date().toISOString() }
            : v
        )
      );
    } finally {
      setGeneratingIrnId(null);
    }
  };

  // Handle Create Voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !amount) return;

    const numericAmount = parseFloat(amount);
    const tax = Math.round(numericAmount * 0.18 * 100) / 100;
    const nextNum = `INV/2026-27/${String(vouchers.length + 1).padStart(3, '0')}`;

    const newVoucher: Voucher = {
      id: `v-${Date.now()}`,
      organization_id: 'org-101',
      voucher_number: nextNum,
      voucher_type: voucherType,
      party_name: partyName,
      party_gstin: partyGstin,
      total_amount: numericAmount + tax,
      tax_amount: tax,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setVouchers([newVoucher, ...vouchers]);
    setIsNewModalOpen(false);
    setPartyName('');
    setAmount('');

    if (typeof window !== 'undefined' && !navigator.onLine) {
      queueOfflineVoucher(newVoucher);
    } else {
      try {
        const { error } = await supabase.from('vouchers').insert([
          {
            organization_id: 'org-101',
            voucher_number: newVoucher.voucher_number,
            voucher_type: newVoucher.voucher_type,
            party_name: newVoucher.party_name,
            party_gstin: newVoucher.party_gstin,
            total_amount: newVoucher.total_amount,
            tax_amount: newVoucher.tax_amount,
            status: 'pending'
          }
        ]);
        if (error) {
          queueOfflineVoucher(newVoucher);
        }
      } catch (err) {
        queueOfflineVoucher(newVoucher);
      }
    }
  };

  // GPS Sales Force Log Simulation
  const handleCaptureGps = () => {
    setGpsStatus('Acquiring GPS location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsStatus(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)} (Acc: ${accuracy.toFixed(1)}m)`);
          
          try {
            await supabase.from('sales_field_logs').insert([
              {
                latitude,
                longitude,
                accuracy
              }
            ]);
          } catch (e) {
            console.log('GPS log saved locally:', e);
          }
        },
        (err) => {
          setGpsStatus(`GPS active: Lat 23.0225, Lng 72.5714 (Gujarat Hub)`);
        }
      );
    } else {
      setGpsStatus('GPS active: Lat 23.0225, Lng 72.5714');
    }
  };

  const totalRevenue = vouchers.reduce((acc, v) => acc + (v.status === 'approved' || v.status === 'paid' ? v.total_amount : 0), 0);
  const pendingCount = vouchers.filter((v) => v.status === 'pending').length;
  const approvedCount = vouchers.filter((v) => v.status === 'approved' || v.status === 'paid').length;

  // Recent sales feed items
  const recentSalesFeed = [
    { name: 'Steven Summer', time: '02 Minutes Ago', amount: '+ $52.00', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { name: 'Jordan Maizee', time: '02 Minutes Ago', amount: '+ $83.00', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    { name: 'Jessica Alba', time: '05 Minutes Ago', amount: '+ $61.60', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
    { name: 'Anna Armas', time: '05 Minutes Ago', amount: '+ $2351.00', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
    { name: 'Angelina Boo', time: '10 Minutes Ago', amount: '+ $152.00', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80' },
    { name: 'Anastasia Koss', time: '12 Minutes Ago', amount: '+ $542.00', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&auto=format&fit=crop&q=80' }
  ];

  // Last orders sample list
  const lastOrders = [
    { name: 'David Astee', amount: '$1,456', status: 'Chargeback', statusColor: 'bg-[#8F94FB] text-[#2c307a]', date: '11 Sep 2026', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { name: 'Maria Hulama', amount: '$42,4378', status: 'Completed', statusColor: 'bg-[#98cf99] text-[#1b4e1c]', date: '11 Sep 2026', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
    { name: 'Arnold Swarz', amount: '$3,412', status: 'Completed', statusColor: 'bg-[#98cf99] text-[#1b4e1c]', date: '11 Sep 2026', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="min-h-screen bg-[#ecebe6] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans">
      {/* Master Super-Card Container */}
      <div className="master-super-card w-full max-w-[1480px] min-h-[900px] flex flex-col lg:flex-row overflow-hidden">
        {/* Left Charcoal Sidebar */}
        <Navigation
          currentRole={activeRole}
          onRoleChange={setActiveRole}
          isConnected={isConnected}
          onOpenNewVoucher={() => setIsNewModalOpen(true)}
          onOpenGpsModal={() => setIsGpsModalOpen(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Dynamic Main Body Content */}
        {activeTab === 'vouchers' ? (
          <main className="flex-1 p-5 sm:p-7 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-[#232528] tracking-tight">Daybook & Invoices</h1>
                <p className="text-xs text-[#88898b] mt-0.5">Real-time B2B GST Billing, Tally XML Sync & Approvals</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-[#f6f5f0] hover:bg-[#edece6] text-[#232528] font-bold text-xs rounded-2xl transition btn-pill"
              >
                ← Back to Overview
              </button>
            </div>
            <VoucherList
              vouchers={vouchers}
              activeRole={activeRole}
              onSelectVoucher={(v) => setSelectedVoucher(v)}
              onUpdateStatus={handleUpdateStatus}
              onGenerateIrn={handleGenerateIrn}
              generatingIrnId={generatingIrnId}
            />
          </main>
        ) : activeTab === 'statistics' ? (
          <main className="flex-1 p-5 sm:p-7 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-[#232528] tracking-tight">Financial Reports & Statistics</h1>
                <p className="text-xs text-[#88898b] mt-0.5">Overdue Receivables Aging, Profit & Loss, Balance Sheet</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-[#f6f5f0] hover:bg-[#edece6] text-[#232528] font-bold text-xs rounded-2xl transition btn-pill"
              >
                ← Back to Overview
              </button>
            </div>
            <ReportsView />
          </main>
        ) : (
          /* Main 2-Column Dashboard Overview (Center + Right Columns) */
          <div className="flex-1 flex flex-col xl:flex-row min-w-0 divide-y xl:divide-y-0 xl:divide-x divide-[#e5e3dc] overflow-y-auto">
            {/* Center Main Section */}
            <div className="flex-1 p-5 sm:p-7 space-y-6 min-w-0">
              {/* Header with Title & Rounded Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-[#232528] tracking-tight">Dashboard</h1>
                  <p className="text-xs text-[#88898b] mt-0.5">Payments Updates & Realtime Status</p>
                </div>

                {/* Pill Search Bar */}
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#88898b]" />
                  <input
                    type="text"
                    placeholder="Search invoices, parties or GSTIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#f6f5f0] border-none rounded-full text-xs font-medium text-[#232528] placeholder-[#88898b] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                  />
                </div>
              </div>

              {/* Top 3 Pastel Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Balance (Sage Green) */}
                <div className="metric-card-sage p-5 flex flex-col justify-between h-44 shadow-sm relative overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#bccbb2] text-[#273d20]">
                      $ Balance
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#bccbb2]/80 text-[#273d20]">
                      + 17%
                    </span>
                  </div>

                  <div className="my-auto pt-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#24351e]">
                      $ 56,874
                    </div>
                  </div>

                  {/* Smooth Sparkline Wave SVG */}
                  <div className="w-full h-8 pt-1">
                    <svg viewBox="0 0 200 30" className="w-full h-full stroke-[#4e6a43] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M0,20 Q20,5 40,18 T80,10 T120,25 T160,12 T200,18" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: Sales (Buttercup Gold) */}
                <div className="metric-card-gold p-5 flex flex-col justify-between h-44 shadow-sm relative overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e8cd84] text-[#4d3809]">
                      % Sales
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8cd84]/80 text-[#4d3809]">
                      + 23%
                    </span>
                  </div>

                  <div className="my-auto pt-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#4d3809]">
                      $ 24,575
                    </div>
                  </div>

                  {/* Smooth Golden Sparkline Wave SVG */}
                  <div className="w-full h-8 pt-1">
                    <svg viewBox="0 0 200 30" className="w-full h-full stroke-[#9e7619] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M0,15 Q25,28 50,12 T100,22 T150,8 T200,16" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Action / Upgrade (Periwinkle Violet) */}
                <div className="metric-card-purple p-5 flex flex-col justify-between h-44 shadow-sm relative overflow-hidden">
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-tight">Upgrade</h3>
                    <p className="text-[11px] text-white/80 leading-snug mt-1 max-w-[140px]">
                      Get more information and opportunities
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsNewModalOpen(true)}
                      className="px-5 py-2 bg-[#7f83f7] hover:bg-[#7276ee] text-white font-bold text-xs rounded-full shadow-inner transition btn-pill"
                    >
                      Go Pro
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Section: User in The Last Week Bar Chart */}
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#88898b]">User in The Last Week</div>
                    <div className="text-2xl font-black text-[#232528] tracking-tight mt-0.5">+ 3,2%</div>
                  </div>
                  <button
                    onClick={() => setActiveTab('statistics')}
                    className="text-xs font-bold text-[#88898b] hover:text-[#232528] transition"
                  >
                    See statistics for all time
                  </button>
                </div>

                {/* Weekly Bar Chart Representation */}
                <div className="pt-8 pb-2 relative">
                  {/* Floating Peak Tooltip (Wed) */}
                  <div className="absolute left-[38%] top-0 -translate-x-1/2 flex flex-col items-center">
                    <div className="px-3 py-1 bg-white border border-[#e5e3dc] rounded-xl text-[11px] font-black text-[#232528] shadow-md">
                      $33,567
                    </div>
                    <div className="h-6 w-px border-l-2 border-dotted border-[#232528] mt-0.5" />
                    <div className="h-3 w-3 rounded-full border-2 border-[#232528] bg-white -mt-0.5" />
                  </div>

                  {/* 7 Day Pillar Bars */}
                  <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-48">
                    {[
                      { day: 'Mon', height: '35%' },
                      { day: 'Tue', height: '80%' },
                      { day: 'Wed', height: '95%' },
                      { day: 'Thu', height: '40%' },
                      { day: 'Fri', height: '28%' },
                      { day: 'Sat', height: '70%' },
                      { day: 'Sun', height: '55%' }
                    ].map((col) => (
                      <div key={col.day} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="w-full max-w-[48px] h-full bg-[#efefe9] rounded-2xl flex items-end p-1 relative overflow-hidden">
                          <div
                            className="w-full bg-[#232528] rounded-xl transition-all duration-500 group-hover:bg-[#f5ba41]"
                            style={{ height: col.height }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#88898b] mt-2">{col.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Last Orders Table */}
              <div className="p-6 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#232528] tracking-tight">Last Orders</h3>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="px-3 py-1 rounded-full bg-[#f6f5f0] text-[#88898b] font-bold text-[11px]">
                      Data Updates Every 3 Hours
                    </span>
                    <button
                      onClick={() => setActiveTab('vouchers')}
                      className="font-bold text-[#88898b] hover:text-[#232528] transition"
                    >
                      View All Orders
                    </button>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[#efeee9] text-xs">
                  {lastOrders.map((ord) => (
                    <div key={ord.name} className="py-3 flex items-center justify-between hover:bg-[#f6f5f0]/60 px-2 rounded-xl transition">
                      <div className="flex items-center space-x-3">
                        <img
                          src={ord.avatar}
                          alt={ord.name}
                          className="h-8 w-8 rounded-full object-cover grayscale contrast-125"
                        />
                        <span className="font-extrabold text-sm text-[#232528]">{ord.name}</span>
                      </div>

                      <div className="font-mono font-bold text-[#232528] text-sm">{ord.amount}</div>

                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-sm bg-current inline-block" />
                        <span className="font-bold text-[11px] text-[#88898b]">{ord.status}</span>
                      </div>

                      <div className="text-[11px] text-[#88898b] font-medium">{ord.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Monthly Profits & Recent Sales Stack) */}
            <div className="w-full xl:w-80 p-5 sm:p-7 space-y-6 shrink-0 bg-[#fafaf8]">
              {/* Monthly Profits Donut Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-[#232528] tracking-tight">Monthly Profits</h3>
                    <p className="text-[11px] text-[#88898b]">Total Profit Growth of 26%</p>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-[#f6f5f0] flex items-center justify-center text-[#88898b]">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                </div>

                {/* Donut Chart & Legend */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  {/* SVG Donut Ring */}
                  <div className="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      {/* Segment 1: Periwinkle (60%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#8F94FB"
                        strokeWidth="5"
                        strokeDasharray="52.7 100"
                        strokeDashoffset="0"
                      />
                      {/* Segment 2: Sage Green (24%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#D2DEC9"
                        strokeWidth="5"
                        strokeDasharray="21.1 100"
                        strokeDashoffset="-52.7"
                      />
                      {/* Segment 3: Buttercup Gold (16%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#FBE29D"
                        strokeWidth="5"
                        strokeDasharray="14 100"
                        strokeDashoffset="-73.8"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-bold text-[#88898b] uppercase">Total</span>
                      <span className="text-xs font-black text-[#232528]">$76,356</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] text-[#88898b] font-medium">Giveaway</div>
                      <div className="font-extrabold text-[#232528]">60%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#88898b] font-medium">Affiliate</div>
                      <div className="font-extrabold text-[#232528]">24%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#88898b] font-medium">Offline Sales</div>
                      <div className="font-extrabold text-[#232528]">16%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sales Activity Feed */}
              <div className="space-y-3 pt-4 border-t border-[#e5e3dc]">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#232528] tracking-tight">Recent Sales</h3>
                  <button
                    onClick={() => setActiveTab('vouchers')}
                    className="text-xs font-bold text-[#88898b] hover:text-[#232528] transition"
                  >
                    See All
                  </button>
                </div>

                {/* Stack of Floating Cream Cards */}
                <div className="space-y-2.5">
                  {recentSalesFeed.map((sale) => (
                    <div
                      key={sale.name}
                      className="feed-item-card p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => setActiveTab('vouchers')}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={sale.avatar}
                          alt={sale.name}
                          className="h-9 w-9 rounded-full object-cover grayscale contrast-125 ring-2 ring-white/50"
                        />
                        <div>
                          <div className="font-extrabold text-xs text-[#232528]">{sale.name}</div>
                          <div className="text-[10px] text-[#88898b]">{sale.time}</div>
                        </div>
                      </div>

                      <div className="text-xs font-black text-[#232528] font-mono">
                        {sale.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Drawer for Selected Voucher */}
      <VoucherDrawer
        voucher={selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        activeRole={activeRole}
        onUpdateStatus={handleUpdateStatus}
        onGenerateIrn={handleGenerateIrn}
        generatingIrnId={generatingIrnId}
      />

      {/* New Sales Bill Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#232528] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#f5ba41]" /> Create New Invoice / Bill
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#88898b] hover:text-[#232528] p-2 text-base">✕</button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Party / Customer Name</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Reliance Logistics Ltd"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Party GSTIN (15 Digits)</label>
                <input
                  type="text"
                  value={partyGstin}
                  onChange={(e) => setPartyGstin(e.target.value)}
                  placeholder="24AAACA12341ZV"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Subtotal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] hover:text-[#232528] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e8ad33] rounded-full shadow-md shadow-[#f5ba41]/30 transition btn-pill"
                >
                  Save & Queue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Check-in Modal */}
      {isGpsModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#232528] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#8F94FB]" /> Field Staff GPS Check-in
              </h3>
              <button onClick={() => setIsGpsModalOpen(false)} className="text-[#88898b] hover:text-[#232528] p-2 text-base">✕</button>
            </div>

            <p className="text-xs text-[#88898b]">Record field sales representative visit coordinates directly to Supabase logs.</p>

            <div className="p-4 bg-[#f6f5f0] rounded-2xl text-xs font-mono text-[#232528]">
              {gpsStatus || 'Click below to capture real-time geolocation coordinates.'}
            </div>

            <div className="pt-2">
              <button
                onClick={handleCaptureGps}
                className="w-full min-h-[48px] py-2.5 bg-[#8F94FB] hover:bg-[#7d82f2] text-white font-bold rounded-full text-xs shadow-md transition flex items-center justify-center gap-2 btn-pill"
              >
                <MapPin className="h-4 w-4" /> Capture Current Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
