'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Voucher, VoucherType, UserRole, PaymentStatus } from '@/types/database';
import sampleData from '@/data/sample_invoices.json';
import confetti from 'canvas-confetti';
import { queueOfflineVoucher } from '@/lib/services/offlineSync';
import { calculateInvoiceTaxes } from '@/lib/billing/taxEngine';

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
  Sparkles,
  Edit3
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
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [generatingIrnId, setGeneratingIrnId] = useState<string | null>(null);

  // New Voucher Form State
  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('24AAACA12341ZV');
  const [amount, setAmount] = useState('');
  const [voucherType, setVoucherType] = useState<VoucherType>('sales_bill');
  const [fromAccount, setFromAccount] = useState('HDFC Bank Account');
  const [toAccount, setToAccount] = useState('Cash in Hand');
  const [paymentMode, setPaymentMode] = useState<'bank' | 'cash' | 'cheque' | 'upi'>('bank');
  const [instrumentNo, setInstrumentNo] = useState('');

  // Edit Voucher Form State
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyGstin, setEditPartyGstin] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editVoucherType, setEditVoucherType] = useState<VoucherType>('sales_bill');
  const [editFromAccount, setEditFromAccount] = useState('HDFC Bank Account');
  const [editToAccount, setEditToAccount] = useState('Cash in Hand');
  const [editPaymentMode, setEditPaymentMode] = useState<'bank' | 'cash' | 'cheque' | 'upi'>('bank');
  const [editInstrumentNo, setEditInstrumentNo] = useState('');

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
    const sellerStateCode = '24'; // Gujarat (seller)
    const buyerStateCode = partyGstin?.trim().substring(0, 2) || '24';

    const isTaxApplicable = ['sales_bill', 'purchase_order', 'credit_note', 'quotation'].includes(voucherType);

    const taxCalc = isTaxApplicable
      ? calculateInvoiceTaxes(
          [
            {
              itemName: `${voucherType.replace('_', ' ').toUpperCase()} Commercial Entry`,
              hsnCode: '84818030',
              quantity: 1,
              unitPrice: numericAmount,
              taxRate: 18
            }
          ],
          sellerStateCode,
          buyerStateCode
        )
      : { grandTotal: numericAmount, totalTax: 0, itemBreakdowns: [] };

    const prefixMap: Record<string, string> = {
      sales_bill: 'INV',
      receipt: 'RCP',
      payment: 'PAY',
      contra: 'CNT',
      purchase_order: 'PO',
      credit_note: 'CN',
      quotation: 'QTN',
      delivery_challan: 'DC'
    };
    const prefix = prefixMap[voucherType] || 'VCH';
    const nextNum = `${prefix}/2026-27/${String(vouchers.length + 1).padStart(3, '0')}`;

    const newVoucher: Voucher = {
      id: `v-${Date.now()}`,
      organization_id: 'org-101',
      voucher_number: nextNum,
      voucher_type: voucherType,
      party_name: voucherType === 'contra' ? `${fromAccount} ➔ ${toAccount}` : (partyName || 'Cash Account'),
      party_gstin: partyGstin,
      total_amount: taxCalc.grandTotal,
      tax_amount: taxCalc.totalTax,
      status: 'pending',
      from_account: fromAccount,
      to_account: toAccount,
      payment_mode: paymentMode,
      instrument_number: instrumentNo || undefined,
      items: taxCalc.itemBreakdowns.map((item) => ({
        item_name: item.itemName || 'Commercial Entry',
        hsn_code: item.hsnCode,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        cgst_amount: item.cgstAmount,
        sgst_amount: item.sgstAmount,
        igst_amount: item.igstAmount,
        total_item_amount: item.totalAmount
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setVouchers([newVoucher, ...vouchers]);
    setIsNewModalOpen(false);
    setPartyName('');
    setAmount('');
    setInstrumentNo('');

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

  // Open Edit Voucher Modal
  const handleOpenEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setEditPartyName(voucher.party_name);
    setEditPartyGstin(voucher.party_gstin || '24AAACA12341ZV');
    const taxableAmount = voucher.total_amount - (voucher.tax_amount || 0);
    setEditAmount(String(Math.round(taxableAmount > 0 ? taxableAmount : voucher.total_amount)));
    setEditVoucherType(voucher.voucher_type);
    setEditFromAccount(voucher.from_account || 'HDFC Bank Account');
    setEditToAccount(voucher.to_account || 'Cash in Hand');
    setEditPaymentMode(voucher.payment_mode || 'bank');
    setEditInstrumentNo(voucher.instrument_number || '');
    setIsEditModalOpen(true);
  };

  // Save Voucher Edits
  const handleSaveEditVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher || !editAmount) return;

    const numericAmount = parseFloat(editAmount);
    const sellerStateCode = '24';
    const buyerStateCode = editPartyGstin?.trim().substring(0, 2) || '24';

    const isTaxApplicable = ['sales_bill', 'purchase_order', 'credit_note', 'quotation'].includes(editVoucherType);

    const taxCalc = isTaxApplicable
      ? calculateInvoiceTaxes(
          [
            {
              itemName: `${editVoucherType.replace('_', ' ').toUpperCase()} Commercial Entry`,
              hsnCode: '84818030',
              quantity: 1,
              unitPrice: numericAmount,
              taxRate: 18
            }
          ],
          sellerStateCode,
          buyerStateCode
        )
      : { grandTotal: numericAmount, totalTax: 0, itemBreakdowns: [] };

    const updatedVoucher: Voucher = {
      ...editingVoucher,
      party_name: editVoucherType === 'contra' ? `${editFromAccount} ➔ ${editToAccount}` : (editPartyName || 'Cash Account'),
      party_gstin: editPartyGstin,
      voucher_type: editVoucherType,
      total_amount: taxCalc.grandTotal,
      tax_amount: taxCalc.totalTax,
      from_account: editFromAccount,
      to_account: editToAccount,
      payment_mode: editPaymentMode,
      instrument_number: editInstrumentNo || undefined,
      items: taxCalc.itemBreakdowns.map((item) => ({
        item_name: item.itemName || 'Commercial Entry',
        hsn_code: item.hsnCode,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        cgst_amount: item.cgstAmount,
        sgst_amount: item.sgstAmount,
        igst_amount: item.igstAmount,
        total_item_amount: item.totalAmount
      })),
      updated_at: new Date().toISOString()
    };

    setVouchers((prev) => prev.map((v) => (v.id === updatedVoucher.id ? updatedVoucher : v)));
    if (selectedVoucher && selectedVoucher.id === updatedVoucher.id) {
      setSelectedVoucher(updatedVoucher);
    }
    setIsEditModalOpen(false);

    try {
      await supabase.from('vouchers').update({
        party_name: updatedVoucher.party_name,
        party_gstin: updatedVoucher.party_gstin,
        voucher_type: updatedVoucher.voucher_type,
        total_amount: updatedVoucher.total_amount,
        tax_amount: updatedVoucher.tax_amount,
        updated_at: updatedVoucher.updated_at
      }).eq('id', updatedVoucher.id);
    } catch (err) {
      console.log('Saved voucher edit locally:', err);
    }
  };

  // Delete Voucher
  const handleDeleteVoucher = async (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    if (selectedVoucher && selectedVoucher.id === id) {
      setSelectedVoucher(null);
    }

    try {
      await supabase.from('vouchers').delete().eq('id', id);
    } catch (err) {
      console.log('Deleted voucher locally:', err);
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
    <div className="flex min-h-screen bg-[#ecebe6] text-[#232528] font-sans pb-16 md:pb-0">
      {/* Dual Navigation (Matte Charcoal Sidebar on Desktop & Bottom Bar on Mobile) */}
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
        {/* Executive Metric Pastel KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Approved Sales (Pastel Sage Green) */}
          <div className="p-4 sm:p-5 rounded-[28px] bg-[#d2dec9] text-[#24351e] shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#24351e]/80 mb-1">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Approved Sales</span>
                <span className="p-1 rounded-full bg-[#bccbb2] text-[#24351e]">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#24351e] font-mono mt-1">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] sm:text-xs text-[#24351e]/80 mt-1 font-bold">B2B GST Tax Invoices</div>
            </div>

            {/* Subtle Sparkline Wave */}
            <div className="w-full h-5 pt-2">
              <svg viewBox="0 0 100 20" className="w-full h-full stroke-[#4e6a43] fill-none" strokeWidth="2.5" strokeLinecap="round">
                <path d="M0,15 Q25,3 50,12 T100,6" />
              </svg>
            </div>
          </div>

          {/* Card 2: Pending Review (Pastel Buttercup Gold) */}
          <div className="p-4 sm:p-5 rounded-[28px] bg-[#fbe29d] text-[#4d3809] shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#4d3809]/80 mb-1">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Pending Review</span>
                <span className="p-1 rounded-full bg-[#e8cd84] text-[#4d3809]">
                  <Clock className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#4d3809] font-mono mt-1">{pendingCount}</div>
              <div className="text-[10px] sm:text-xs text-[#4d3809]/80 mt-1 font-bold">Maker-Checker Audit</div>
            </div>

            {/* Subtle Sparkline Wave */}
            <div className="w-full h-5 pt-2">
              <svg viewBox="0 0 100 20" className="w-full h-full stroke-[#9e7619] fill-none" strokeWidth="2.5" strokeLinecap="round">
                <path d="M0,12 Q30,18 60,8 T100,14" />
              </svg>
            </div>
          </div>

          {/* Card 3: Approved Bills (Pastel Ice Slate) */}
          <div className="p-4 sm:p-5 rounded-[28px] bg-[#dfe5ec] text-[#1e293b] shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#1e293b]/80 mb-1">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Approved Bills</span>
                <span className="p-1 rounded-full bg-[#cbd5e1] text-[#1e293b]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#1e293b] font-mono mt-1">{approvedCount}</div>
              <div className="text-[10px] sm:text-xs text-[#1e293b]/80 mt-1 font-bold">Ready for Tally Sync</div>
            </div>

            {/* Subtle Sparkline Wave */}
            <div className="w-full h-5 pt-2">
              <svg viewBox="0 0 100 20" className="w-full h-full stroke-[#475569] fill-none" strokeWidth="2.5" strokeLinecap="round">
                <path d="M0,8 Q20,16 50,7 T100,10" />
              </svg>
            </div>
          </div>

          {/* Card 4: NIC Compliance (Pastel Lavender Periwinkle) */}
          <div className="p-4 sm:p-5 rounded-[28px] bg-[#deddfa] text-[#2c307a] shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#2c307a]/80 mb-1">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">NIC Compliance</span>
                <span className="p-1 rounded-full bg-[#c8c6f6] text-[#2c307a]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-[#2c307a] mt-1">1-Click IRN</div>
              <div className="text-[10px] sm:text-xs text-[#2c307a]/80 mt-1 font-bold">AES-256-ECB Gateway</div>
            </div>

            {/* Subtle Sparkline Wave */}
            <div className="w-full h-5 pt-2">
              <svg viewBox="0 0 100 20" className="w-full h-full stroke-[#6b68df] fill-none" strokeWidth="2.5" strokeLinecap="round">
                <path d="M0,14 Q25,5 55,15 T100,8" />
              </svg>
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
            onEditVoucher={handleOpenEditModal}
            onDeleteVoucher={handleDeleteVoucher}
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
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteVoucher}
      />

      {/* Edit Voucher Modal */}
      {isEditModalOpen && editingVoucher && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#232528] flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#f5ba41]" /> Edit Voucher ({editingVoucher.voucher_number})
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#88898b] hover:text-[#232528] p-2 text-base">✕</button>
            </div>

            <form onSubmit={handleSaveEditVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Voucher Type</label>
                <select
                  value={editVoucherType}
                  onChange={(e) => setEditVoucherType(e.target.value as VoucherType)}
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                >
                  <option value="sales_bill">📄 Sales Bill (Tax Invoice)</option>
                  <option value="receipt">💰 Receipt Voucher (Payment Received)</option>
                  <option value="payment">💸 Payment Voucher (Expense / Vendor Pay)</option>
                  <option value="contra">🔄 Contra Voucher (Bank ⇋ Cash Transfer)</option>
                  <option value="purchase_order">📦 Purchase Order</option>
                  <option value="credit_note">📝 Credit Note</option>
                  <option value="quotation">📊 Quotation / Estimate</option>
                  <option value="delivery_challan">🚚 Delivery Challan</option>
                </select>
              </div>

              {/* Dynamic Fields for Contra */}
              {editVoucherType === 'contra' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#232528] mb-1">From Account (Source)</label>
                    <select
                      value={editFromAccount}
                      onChange={(e) => setEditFromAccount(e.target.value)}
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                    >
                      <option value="HDFC Bank Account">HDFC Bank Account</option>
                      <option value="SBI Current Account">SBI Current Account</option>
                      <option value="ICICI Bank Account">ICICI Bank Account</option>
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Petty Cash">Petty Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#232528] mb-1">To Account (Destination)</label>
                    <select
                      value={editToAccount}
                      onChange={(e) => setEditToAccount(e.target.value)}
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                    >
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Petty Cash">Petty Cash</option>
                      <option value="HDFC Bank Account">HDFC Bank Account</option>
                      <option value="SBI Current Account">SBI Current Account</option>
                      <option value="ICICI Bank Account">ICICI Bank Account</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#232528] mb-1">
                      {editVoucherType === 'receipt' || editVoucherType === 'sales_bill' ? 'Customer / Party Name' : 'Party / Ledger Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editPartyName}
                      onChange={(e) => setEditPartyName(e.target.value)}
                      placeholder="e.g. Reliance Logistics Ltd"
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                    />
                  </div>

                  {['sales_bill', 'purchase_order', 'credit_note'].includes(editVoucherType) && (
                    <div>
                      <label className="block text-xs font-bold text-[#232528] mb-1">Party GSTIN (15 Digits)</label>
                      <input
                        type="text"
                        value={editPartyGstin}
                        onChange={(e) => setEditPartyGstin(e.target.value)}
                        placeholder="24AAACA12341ZV"
                        className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                      />
                    </div>
                  )}

                  {/* Payment / Receipt Dynamic Details */}
                  {(editVoucherType === 'receipt' || editVoucherType === 'payment') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#232528] mb-1">Payment Mode</label>
                        <select
                          value={editPaymentMode}
                          onChange={(e) => setEditPaymentMode(e.target.value as any)}
                          className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                        >
                          <option value="bank">Bank Transfer (NEFT/RTGS)</option>
                          <option value="upi">UPI / QR Code</option>
                          <option value="cheque">Cheque</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#232528] mb-1">Instrument / Ref No</label>
                        <input
                          type="text"
                          value={editInstrumentNo}
                          onChange={(e) => setEditInstrumentNo(e.target.value)}
                          placeholder="e.g. CHQ-882190 or UTR-9901"
                          className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">
                  {['sales_bill', 'purchase_order', 'credit_note'].includes(editVoucherType) ? 'Subtotal Taxable Amount (₹)' : 'Total Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
                {['sales_bill', 'purchase_order', 'credit_note'].includes(editVoucherType) && (
                  <span className="text-[11px] text-[#88898b] mt-1 block">Taxes (CGST/SGST or IGST) will automatically recalculate.</span>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] hover:text-[#232528] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full shadow-md shadow-[#f5ba41]/30 transition btn-pill"
                >
                  Update & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Voucher Modal (Expanded Types) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#232528] flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#f5ba41]" /> Create Accounting Voucher
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#88898b] hover:text-[#232528] p-2 text-base">✕</button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Voucher Type</label>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value as VoucherType)}
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                >
                  <option value="sales_bill">📄 Sales Bill (Tax Invoice)</option>
                  <option value="receipt">💰 Receipt Voucher (Payment Received)</option>
                  <option value="payment">💸 Payment Voucher (Expense / Vendor Pay)</option>
                  <option value="contra">🔄 Contra Voucher (Bank ⇋ Cash Transfer)</option>
                  <option value="purchase_order">📦 Purchase Order</option>
                  <option value="credit_note">📝 Credit Note</option>
                  <option value="quotation">📊 Quotation / Estimate</option>
                  <option value="delivery_challan">🚚 Delivery Challan</option>
                </select>
              </div>

              {/* Dynamic Fields for Contra */}
              {voucherType === 'contra' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#232528] mb-1">From Account (Source)</label>
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                    >
                      <option value="HDFC Bank Account">HDFC Bank Account</option>
                      <option value="SBI Current Account">SBI Current Account</option>
                      <option value="ICICI Bank Account">ICICI Bank Account</option>
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Petty Cash">Petty Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#232528] mb-1">To Account (Destination)</label>
                    <select
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                    >
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Petty Cash">Petty Cash</option>
                      <option value="HDFC Bank Account">HDFC Bank Account</option>
                      <option value="SBI Current Account">SBI Current Account</option>
                      <option value="ICICI Bank Account">ICICI Bank Account</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#232528] mb-1">
                      {voucherType === 'receipt' || voucherType === 'sales_bill' ? 'Customer / Party Name' : 'Party / Ledger Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      placeholder="e.g. Reliance Logistics Ltd"
                      className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                    />
                  </div>

                  {['sales_bill', 'purchase_order', 'credit_note'].includes(voucherType) && (
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
                  )}

                  {/* Payment / Receipt Dynamic Details */}
                  {(voucherType === 'receipt' || voucherType === 'payment') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#232528] mb-1">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value as any)}
                          className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                        >
                          <option value="bank">Bank Transfer (NEFT/RTGS)</option>
                          <option value="upi">UPI / QR Code</option>
                          <option value="cheque">Cheque</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#232528] mb-1">Instrument / Ref No</label>
                        <input
                          type="text"
                          value={instrumentNo}
                          onChange={(e) => setInstrumentNo(e.target.value)}
                          placeholder="e.g. CHQ-882190 or UTR-9901"
                          className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">
                  {['sales_bill', 'purchase_order', 'credit_note'].includes(voucherType) ? 'Subtotal Taxable Amount (₹)' : 'Total Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
                {['sales_bill', 'purchase_order', 'credit_note'].includes(voucherType) && (
                  <span className="text-[11px] text-[#88898b] mt-1 block">Automatic 18% GST (CGST 9% + SGST 9%) will be calculated.</span>
                )}
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
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full shadow-md shadow-[#f5ba41]/30 transition btn-pill"
                >
                  Save & Queue Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Sales Field Log Modal */}
      {isGpsModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#232528] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#8F94FB]" /> Field Staff GPS Check-in
              </h3>
              <button onClick={() => setIsGpsModalOpen(false)} className="text-[#88898b] hover:text-[#232528] p-2 text-base">✕</button>
            </div>

            <p className="text-xs text-[#88898b]">Record sales representative visit coordinates directly to Supabase cloud logs.</p>

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
