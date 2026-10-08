'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Voucher, UserRole, PaymentStatus } from '@/types/database';
import sampleData from '@/data/sample_invoices.json';
import confetti from 'canvas-confetti';
import { queueOfflineVoucher } from '@/lib/services/offlineSync';

// Modular Responsive Components
import Navigation from '@/components/Navigation';
import VoucherList from '@/components/VoucherList';
import VoucherDrawer from '@/components/VoucherDrawer';
import ReportsView from '@/components/ReportsView';

import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  MapPin, 
  RefreshCw, 
  Zap,
  Sparkles,
  Receipt,
  Building2,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('checker');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('vouchers');
  
  // Selected voucher for bottom sheet / slide-over preview
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
          console.log('Realtime payload received:', payload);
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

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 md:pb-0">
      {/* Dual Navigation (Desktop Sidebar & Mobile App / Tab Bar) */}
      <Navigation
        currentRole={activeRole}
        onRoleChange={setActiveRole}
        isConnected={isConnected}
        onOpenNewVoucher={() => setIsNewModalOpen(true)}
        onOpenGpsModal={() => setIsGpsModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Responsive Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl luxe-card bg-gradient-to-br from-white to-blue-50/50">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Approved Sales</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 font-mono">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> B2B GST Tax Invoices
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl luxe-card bg-gradient-to-br from-white to-amber-50/50">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Pending Review</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-amber-600 font-mono">{pendingCount}</div>
            <div className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Maker-Checker Audit
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl luxe-card bg-gradient-to-br from-white to-blue-50/50">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Approved Bills</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 font-mono">{approvedCount}</div>
            <div className="text-[11px] text-blue-700 mt-1 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Ready for Tally Sync
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl luxe-card bg-gradient-to-br from-white to-purple-50/50">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">NIC Compliance</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-purple-700">1-Click IRN</div>
            <div className="text-[11px] text-purple-800 mt-1 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> AES-256-ECB Gateway
            </div>
          </div>
        </div>

        {/* View Switcher: Daybook vs Reports */}
        {activeTab === 'vouchers' ? (
          <VoucherList
            vouchers={vouchers}
            activeRole={activeRole}
            onSelectVoucher={(v) => setSelectedVoucher(v)}
            onUpdateStatus={handleUpdateStatus}
            onGenerateIrn={handleGenerateIrn}
            generatingIrnId={generatingIrnId}
          />
        ) : (
          <ReportsView />
        )}
      </main>

      {/* Bottom Sheet on Mobile / Slide-Over on Desktop */}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" /> Create New Sales Invoice
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 text-base">✕</button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Party / Customer Name</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Reliance Logistics Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Party GSTIN (15 Digits)</label>
                <input
                  type="text"
                  value={partyGstin}
                  onChange={(e) => setPartyGstin(e.target.value)}
                  placeholder="24AAACA12341ZV"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtotal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Automatic 18% GST (CGST 9% + SGST 9%) will be calculated.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl btn-tactile"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition btn-tactile"
                >
                  Save & Queue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Sales Field Log Modal */}
      {isGpsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600" /> GPS Field Staff Check-in
              </h3>
              <button onClick={() => setIsGpsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 text-base">✕</button>
            </div>

            <p className="text-xs text-slate-600">Record sales representative visit coordinates directly to Supabase cloud logs.</p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-indigo-900">
              {gpsStatus || 'Click below to capture your real-time GPS coordinates.'}
            </div>

            <div className="pt-2">
              <button
                onClick={handleCaptureGps}
                className="w-full min-h-[48px] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 btn-tactile"
              >
                <MapPin className="h-4 w-4" /> Capture Geolocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
