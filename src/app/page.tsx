'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Voucher, UserRole, PaymentStatus } from '@/types/database';
import sampleData from '@/data/sample_invoices.json';
import confetti from 'canvas-confetti';
import { 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus, 
  MapPin, 
  Sparkles, 
  QrCode, 
  RefreshCw,
  Building2,
  Receipt,
  UserCheck,
  TrendingUp,
  Zap
} from 'lucide-react';

export default function Dashboard() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('checker');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');

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
      irn_number: inv.compliance.irn,
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
    // Local optimistic update
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

    // Try Supabase update if database active
    try {
      await supabase.from('vouchers').update({ status: newStatus }).eq('id', id);
    } catch (e) {
      console.log('Operating in local state mode:', e);
    }
  };

  // Generate IRN / E-Invoice Simulation
  const handleGenerateIrn = (id: string) => {
    const mockIrn = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const mockEway = '24' + Math.floor(1000000000 + Math.random() * 9000000000);

    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, irn_number: mockIrn, eway_bill_no: mockEway, updated_at: new Date().toISOString() }
          : v
      )
    );

    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 }
    });
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

    try {
      await supabase.from('vouchers').insert([
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
    } catch (err) {
      console.log('Saved to local session:', err);
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
          setGpsStatus(`GPS capture simulated: Lat 23.0225, Lng 72.5714 (Gujarat Hub)`);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Livekeeping Open
              </h1>
              <p className="text-xs text-slate-400">Cross-Device Realtime B2B GST & Tally Workspace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Realtime Status Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-xs">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-medium">
                {isConnected ? 'Realtime Sync Active' : 'Offline / Local Sync'}
              </span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 px-2 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Role:
              </span>
              {(['maker', 'checker', 'admin'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2.5 py-1 rounded-md transition-all capitalize font-medium ${
                    activeRole === role ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsGpsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/60 text-xs font-medium transition"
            >
              <MapPin className="h-3.5 w-3.5" /> Sales GPS
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
            >
              <Plus className="h-4 w-4" /> New Sales Bill
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Approved Revenue</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">GST Compliant B2B Invoices</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Checker Review</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-xs text-slate-400 mt-1">Maker-Checker authorization flow</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Approved Vouchers</span>
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{approvedCount}</div>
            <div className="text-xs text-blue-400 mt-1">Ready for Tally XML Sync</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Role Access</span>
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-400 capitalize">{activeRole} Mode</div>
            <div className="text-xs text-slate-400 mt-1">
              {activeRole === 'maker' ? 'Can draft sales bills' : 'Can approve & generate IRN'}
            </div>
          </div>
        </div>

        {/* Invoice Table Section */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" /> B2B GST Sales Vouchers & Quotations
              </h2>
              <p className="text-xs text-slate-400">Live synchronized with Supabase WebSocket engine</p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" /> Live updating across mobile & desktop
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Voucher No</th>
                  <th className="py-4 px-6">Party Details</th>
                  <th className="py-4 px-6">Grand Total</th>
                  <th className="py-4 px-6">GST Tax</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Compliance (IRN)</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-4 px-6 font-mono font-medium text-blue-400">
                      {voucher.voucher_number}
                      <span className="block text-[10px] text-slate-500 uppercase">{voucher.voucher_type.replace('_', ' ')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{voucher.party_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{voucher.party_gstin || 'No GSTIN'}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      ₹{voucher.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      ₹{voucher.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          voucher.status === 'approved'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : voucher.status === 'rejected'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {voucher.status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {voucher.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                        {voucher.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                        {voucher.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {voucher.irn_number ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-mono text-[10px] border border-emerald-700/50 truncate max-w-[120px]">
                            {voucher.irn_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Verified</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateIrn(voucher.id)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Generate IRN
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedVoucher(voucher)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                        >
                          View
                        </button>

                        {(activeRole === 'checker' || activeRole === 'admin') && voucher.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(voucher.id, 'approved')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-900/50 hover:bg-emerald-800/60 rounded-lg border border-emerald-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(voucher.id, 'rejected')}
                              className="px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-900/50 hover:bg-rose-800/60 rounded-lg border border-rose-700 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-400" /> {selectedVoucher.voucher_number}
                </h3>
                <p className="text-xs text-slate-400">Standardized B2B GST Tax Invoice</p>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Billed To</div>
                <div className="font-bold text-white">{selectedVoucher.party_name}</div>
                <div className="text-xs text-slate-400 font-mono">{selectedVoucher.party_gstin}</div>
                <div className="text-xs text-slate-400 mt-1">{selectedVoucher.billing_address}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold">Compliance Details</div>
                <div className="text-xs text-slate-300 mt-1">
                  Place of Supply: <span className="font-semibold text-white">{selectedVoucher.place_of_supply || '24-Gujarat'}</span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  E-Way Bill: <span className="font-mono text-emerald-400">{selectedVoucher.eway_bill_no || 'N/A'}</span>
                </div>
              </div>
            </div>

            {selectedVoucher.items && selectedVoucher.items.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">HSN</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Rate</th>
                      <th className="p-3 text-right">Tax (18%)</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedVoucher.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-white">{item.item_name}</td>
                        <td className="p-3 font-mono text-slate-400">{item.hsn_code}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                        <td className="p-3 text-right">₹{(item.cgst_amount + item.sgst_amount + item.igst_amount).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-white">₹{item.total_item_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sales Bill Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-400" /> Create New Sales Voucher
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Party Name</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Reliance Logistics Ltd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Party GSTIN</label>
                <input
                  type="text"
                  value={partyGstin}
                  onChange={(e) => setPartyGstin(e.target.value)}
                  placeholder="24AAACA12341ZV"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Subtotal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-600/30"
                >
                  Create & Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Modal */}
      {isGpsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-400" /> GPS Field Force Log
              </h3>
              <button onClick={() => setIsGpsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">Record sales team visit coordinates directly to Supabase.</p>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
              {gpsStatus || 'Click below to capture real-time GPS coordinates.'}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCaptureGps}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
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
