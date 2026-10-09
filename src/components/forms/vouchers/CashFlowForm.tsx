'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, CreditCard, CheckCircle2, Calendar, FileText, AlertTriangle, Laptop } from 'lucide-react';
import { Voucher } from '@/types/database';
import { supabase } from '@/lib/supabase';
import TallyConnectModal from '@/components/TallyConnectModal';

interface CashFlowFormProps {
  voucherType: 'receipt' | 'payment';
  onSubmit: (voucherData: Partial<Voucher>) => void;
  onCancel: () => void;
}

export interface CashBankOption {
  id: string;
  name: string;
  type: 'bank' | 'cash';
}

export default function CashFlowForm({ voucherType, onSubmit, onCancel }: CashFlowFormProps) {
  const isReceipt = voucherType === 'receipt';
  const [pendingInvoices, setPendingInvoices] = useState<Array<{ no: string; party: string; due: number }>>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [syncedAccounts, setSyncedAccounts] = useState<CashBankOption[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [againstInvoiceRef, setAgainstInvoiceRef] = useState('');
  const [paymentMode, setPaymentMode] = useState<'bank' | 'cash' | 'cheque' | 'upi'>('bank');
  const [instrumentNo, setInstrumentNo] = useState('');
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bankLedger, setBankLedger] = useState('');
  const [customBankLedger, setCustomBankLedger] = useState('');
  const [isManualAccount, setIsManualAccount] = useState(false);
  const [narration, setNarration] = useState('');
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPendingInvoicesAndAccounts() {
      setIsLoadingInvoices(true);
      setIsLoadingAccounts(true);
      try {
        const { data: vchData, error: vchErr } = await supabase
          .from('vouchers')
          .select('voucher_number, party_name, total_amount, from_account, to_account')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!vchErr && vchData && vchData.length > 0) {
          const mapped = vchData.map((v) => ({
            no: v.voucher_number,
            party: v.party_name,
            due: v.total_amount
          }));
          setPendingInvoices(mapped);

          // Extract accounts
          const accountNames = new Set<string>();
          vchData.forEach((v) => {
            if (v.from_account && v.from_account.trim()) accountNames.add(v.from_account.trim());
            if (v.to_account && v.to_account.trim()) accountNames.add(v.to_account.trim());
          });

          const parsedAccounts: CashBankOption[] = Array.from(accountNames).map((name, idx) => ({
            id: `acc-${idx}`,
            name,
            type: name.toLowerCase().includes('cash') ? 'cash' : 'bank'
          }));

          setSyncedAccounts(parsedAccounts);
          if (parsedAccounts.length > 0) {
            setBankLedger(parsedAccounts[0].name);
          }
        } else {
          setPendingInvoices([]);
          setSyncedAccounts([]);
        }
      } catch (err) {
        console.error('Failed to query data:', err);
      } finally {
        setIsLoadingInvoices(false);
        setIsLoadingAccounts(false);
      }
    }
    fetchPendingInvoicesAndAccounts();
  }, []);

  const handleInvoiceSelect = (invNo: string) => {
    if (againstInvoiceRef === invNo) {
      setAgainstInvoiceRef('');
    } else {
      setAgainstInvoiceRef(invNo);
      const selected = pendingInvoices.find((i) => i.no === invNo);
      if (selected) {
        setPartyName(selected.party);
        setAmount(String(selected.due));
      }
    }
  };

  const effectiveAccount = isManualAccount ? customBankLedger.trim() : bankLedger;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (!partyName || numAmount <= 0) {
      alert('Please enter party name and a valid amount.');
      return;
    }

    if (!effectiveAccount) {
      alert('Please specify the Bank or Cash account. If Tally is not connected, please connect Tally first.');
      return;
    }

    const prefix = isReceipt ? 'RCP' : 'PAY';
    onSubmit({
      voucher_type: voucherType,
      voucher_number: `${prefix}/2026-27/${Math.floor(100 + Math.random() * 900)}`,
      party_name: partyName,
      total_amount: numAmount,
      tax_amount: 0,
      status: 'pending',
      payment_mode: paymentMode,
      instrument_number: paymentMode !== 'cash' ? instrumentNo : undefined,
      against_invoice_ref: againstInvoiceRef || undefined,
      voucher_date: voucherDate,
      from_account: isReceipt ? partyName : effectiveAccount,
      to_account: isReceipt ? effectiveAccount : partyName,
      narration: narration || undefined
    });
  };

  const hasAccounts = syncedAccounts.length > 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#88898b] uppercase pb-1 border-b border-[#e5e3dc]">
          {isReceipt ? <Receipt className="h-4 w-4 text-[#f5ba41]" /> : <CreditCard className="h-4 w-4 text-[#f5ba41]" />}
          <span>{isReceipt ? 'Receipt Voucher (Customer Collection)' : 'Payment Voucher (Vendor / Expense Payout)'}</span>
        </div>

        {/* Tally Connection Alert if No Accounts */}
        {!isLoadingAccounts && !hasAccounts && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black">No Bank or Cash Accounts Found</strong>
                <span className="text-[11px] text-amber-800">
                  Please connect Tally first to sync bank & cash accounts, or type the ledger name manually.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTallyModalOpen(true)}
                className="px-3 py-1.5 bg-[#232528] hover:bg-black text-[#f5ba41] font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition"
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>Connect Tally First</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManualAccount(!isManualAccount)}
                className="px-3 py-1.5 bg-white hover:bg-[#fafaf8] border border-amber-300 text-[#232528] font-bold rounded-xl text-[11px] transition"
              >
                {isManualAccount ? 'Use Synced List' : 'Enter Manually'}
              </button>
            </div>
          </div>
        )}

        {/* Invoice Settlement Selector */}
        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">
            Settlement Against Invoice (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-[#f6f5f0] rounded-2xl">
            {isLoadingInvoices ? (
              [1, 2].map((i) => (
                <div key={i} className="p-2.5 rounded-xl bg-white border border-[#e5e3dc] animate-pulse space-y-1.5">
                  <div className="h-3 w-28 bg-[#e5e3dc] rounded"></div>
                  <div className="h-2.5 w-16 bg-[#e5e3dc] rounded"></div>
                </div>
              ))
            ) : pendingInvoices.length === 0 ? (
              <div className="col-span-full py-2 text-center text-[11px] text-[#88898b]">
                No pending invoices synced. Enter party details manually below.
              </div>
            ) : (
              pendingInvoices.map((inv) => (
                <button
                  type="button"
                  key={inv.no}
                  onClick={() => handleInvoiceSelect(inv.no)}
                  className={`p-2 rounded-xl text-left text-xs transition border flex items-center justify-between ${
                    againstInvoiceRef === inv.no
                      ? 'bg-[#232528] text-white border-[#232528]'
                      : 'bg-white border-[#e5e3dc] text-[#555] hover:border-[#f5ba41]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[11px] truncate max-w-[140px]">{inv.party}</div>
                    <div className="text-[10px] opacity-75 font-mono">{inv.no}</div>
                  </div>
                  <span className="font-bold text-[11px] font-mono">₹{inv.due.toLocaleString('en-IN')}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#232528] mb-1">
              {isReceipt ? 'Received From (Customer / Party)' : 'Paid To (Vendor / Expense Ledger)'}
            </label>
            <input
              type="text"
              required
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. Acme Enterprises Ltd"
              className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#232528] mb-1">Bank / Cash Account</label>
            {!isManualAccount && hasAccounts ? (
              <select
                required
                value={bankLedger}
                onChange={(e) => setBankLedger(e.target.value)}
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              >
                <option value="" disabled>Select Account</option>
                {syncedAccounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.type === 'bank' ? '🏦 ' : '💵 '} {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={customBankLedger}
                onChange={(e) => setCustomBankLedger(e.target.value)}
                placeholder="e.g. Bank Account (Connect Tally first to auto-sync)"
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#232528] mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#232528] mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
            >
              <option value="bank">Bank Transfer (NEFT/RTGS)</option>
              <option value="upi">UPI / QR Code</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#232528] mb-1">Cheque / UTR Ref No (Optional)</label>
            <input
              type="text"
              value={instrumentNo}
              onChange={(e) => setInstrumentNo(e.target.value)}
              placeholder="e.g. UTR-991823"
              className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Narration (Optional)</label>
          <input
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="e.g. Cleared via online IMPS transfer"
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e3dc]">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-xs font-bold text-[#88898b] hover:text-[#232528] bg-[#f6f5f0] rounded-full"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full shadow-md shadow-[#f5ba41]/30 transition"
          >
            {isReceipt ? 'Record Receipt' : 'Record Payment'}
          </button>
        </div>
      </form>

      <TallyConnectModal
        isOpen={isTallyModalOpen}
        onClose={() => setIsTallyModalOpen(false)}
        isConnected={false}
      />
    </>
  );
}
