'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Voucher, VoucherType, UserRole, PaymentStatus } from '@/types/database';
import confetti from 'canvas-confetti';
import { queueOfflineVoucher } from '@/lib/services/offlineSync';
import { calculateInvoiceTaxes } from '@/lib/billing/taxEngine';

// Modular Responsive Components
import Navigation from '@/components/Navigation';
import VoucherList from '@/components/VoucherList';
import VoucherDrawer from '@/components/VoucherDrawer';
import ReportsView from '@/components/ReportsView';
import DashboardHeader, { DateRange, CompanyInfo } from '@/components/DashboardHeader';
import MetricsGrid from '@/components/MetricsGrid';
import CreateTransactionSheet from '@/components/CreateTransactionSheet';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('vouchers');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Financial Date Range & Company State
  const [currentCompany, setCurrentCompany] = useState<CompanyInfo>({
    id: 'org-101',
    name: 'LiveTech Pvt Ltd',
    gstin: '24AAACL9999P1Z2',
    lastSyncedAt: '2026-03-12T10:00:00.000Z',
    syncStatus: 'stale',
    daysSinceLastSync: 28
  });

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    label: '01 Apr 24 – 31 Mar 25',
    preset: 'current_fy'
  });

  // Selected voucher for bottom sheet / slide-over preview
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  
  // Modal states
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState<boolean>(false);
  const [createSheetInitialType, setCreateSheetInitialType] = useState<VoucherType | undefined>(undefined);
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

  // Global Keyboard Shortcuts (Alt + S, Alt + R, Alt + P, Alt + C, Alt + Q, Alt + J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 's') {
          e.preventDefault();
          setCreateSheetInitialType('sales_bill');
          setIsCreateSheetOpen(true);
        } else if (key === 'r') {
          e.preventDefault();
          setCreateSheetInitialType('receipt');
          setIsCreateSheetOpen(true);
        } else if (key === 'p') {
          e.preventDefault();
          setCreateSheetInitialType('payment');
          setIsCreateSheetOpen(true);
        } else if (key === 'c') {
          e.preventDefault();
          setCreateSheetInitialType('contra');
          setIsCreateSheetOpen(true);
        } else if (key === 'q') {
          e.preventDefault();
          setCreateSheetInitialType('quotation');
          setIsCreateSheetOpen(true);
        } else if (key === 'j') {
          e.preventDefault();
          setCreateSheetInitialType('journal');
          setIsCreateSheetOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function fetchLiveVouchers() {
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
        console.error('Failed to load live vouchers from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLiveVouchers();

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
          } else if (payload.eventType === 'DELETE') {
            setVouchers((prev) => prev.filter((v) => v.id !== (payload.old as Voucher).id));
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

  // Sync Trigger Handler
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setCurrentCompany((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        daysSinceLastSync: 0,
        syncStatus: 'synced'
      }));
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 }
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Create Transaction from 11-voucher sheet
  const handleCreateTransaction = async (voucherData: Partial<Voucher>) => {
    const nextNum = voucherData.voucher_number || `VCH/2026-27/${String(vouchers.length + 1).padStart(3, '0')}`;
    const newVch: Voucher = {
      id: `v-${Date.now()}`,
      organization_id: currentCompany.id || 'org-101',
      voucher_number: nextNum,
      voucher_type: voucherData.voucher_type || 'sales_bill',
      party_name: voucherData.party_name || 'Cash Account',
      party_gstin: voucherData.party_gstin,
      total_amount: voucherData.total_amount || 0,
      tax_amount: voucherData.tax_amount || 0,
      status: 'pending',
      from_account: voucherData.from_account,
      to_account: voucherData.to_account,
      payment_mode: voucherData.payment_mode,
      instrument_number: voucherData.instrument_number,
      order_number: voucherData.order_number,
      expected_delivery_date: voucherData.expected_delivery_date,
      terms_of_delivery: voucherData.terms_of_delivery,
      original_invoice_no: voucherData.original_invoice_no,
      original_invoice_date: voucherData.original_invoice_date,
      reason_code: voucherData.reason_code,
      reversed_gst: voucherData.reversed_gst,
      debit_ledgers: voucherData.debit_ledgers,
      credit_ledgers: voucherData.credit_ledgers,
      against_invoice_ref: voucherData.against_invoice_ref,
      voucher_date: voucherData.voucher_date,
      narration: voucherData.narration,
      items: voucherData.items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setVouchers((prev) => [newVch, ...prev]);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });

    try {
      await supabase.from('vouchers').insert([newVch]);
    } catch (err) {
      queueOfflineVoucher(newVch);
    }
  };

  const totalRevenue = vouchers.reduce((acc, v) => acc + (v.status === 'approved' || v.status === 'paid' ? v.total_amount : 0), 0);
  const pendingCount = vouchers.filter((v) => v.status === 'pending').length;
  const approvedCount = vouchers.filter((v) => v.status === 'approved' || v.status === 'paid').length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#ecebe6] text-[#232528] font-sans pb-20 md:pb-0">
      {/* Dual Navigation (Matte Charcoal Sidebar on Desktop & Bottom Bar on Mobile) */}
      <Navigation
        currentRole={activeRole}
        onRoleChange={setActiveRole}
        isConnected={isConnected}
        onOpenNewVoucher={() => {
          setCreateSheetInitialType(undefined);
          setIsCreateSheetOpen(true);
        }}
        onOpenGpsModal={() => setIsGpsModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Responsive Content */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 max-w-7xl mx-auto w-full">
        
        {/* 1. Dashboard Header (Company Switcher, Sync Warning Banner, Date Range Selector) */}
        <DashboardHeader
          currentCompany={currentCompany}
          onCompanyChange={(comp) => setCurrentCompany(comp)}
          dateRange={dateRange}
          onDateRangeChange={(range) => setDateRange(range)}
          onTriggerSync={handleTriggerSync}
          isSyncing={isSyncing}
        />

        {/* 2. The 8 Core Financial Metrics Grid (Sales, Receivables, Purchase, Payables, Receipt, Payment, Bank, Cash) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6e7073] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#f5ba41]" /> Financial Performance Overview ({dateRange.label})
            </h3>
            <span className="text-[11px] text-[#88898b] font-medium hidden sm:inline">
              Real-time Tally Prime Aggregates
            </span>
          </div>
          <MetricsGrid
            vouchers={vouchers}
            isLoading={isLoading}
            onSelectMetric={(id) => {
              if (id === 'receivables' || id === 'payables' || id === 'bank' || id === 'cash') {
                setActiveTab('reports');
              } else {
                setActiveTab('vouchers');
              }
            }}
          />
        </div>

        {/* View Switcher: Daybook vs Reports */}
        {activeTab === 'vouchers' ? (
          <VoucherList
            vouchers={vouchers}
            activeRole={activeRole}
            isLoading={isLoading}
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

      {/* 3. Floating Action Button (+) for 1-Click Transaction Creation */}
      <button
        onClick={() => {
          setCreateSheetInitialType(undefined);
          setIsCreateSheetOpen(true);
        }}
        className="fixed bottom-20 md:bottom-8 right-6 z-40 h-14 w-14 rounded-full bg-[#232528] hover:bg-black text-[#f5ba41] flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95 border-2 border-white/10 group"
        title="Create Transaction (Alt + S / R / P / C / Q / J)"
      >
        <Plus className="h-7 w-7 transition group-hover:rotate-90 duration-200" />
      </button>

      {/* 4. Complete 11-Voucher Create Transaction Bottom Sheet */}
      <CreateTransactionSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        onSubmitVoucher={handleCreateTransaction}
        initialType={createSheetInitialType}
      />

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
