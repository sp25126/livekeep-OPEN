'use client';

import React, { useState } from 'react';
import { Receipt, CreditCard, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { Voucher } from '@/types/database';

interface CashFlowFormProps {
  voucherType: 'receipt' | 'payment';
  onSubmit: (voucherData: Partial<Voucher>) => void;
  onCancel: () => void;
}

const SAMPLE_PENDING_INVOICES = [
  { no: 'INV/2026-27/001', party: 'Reliance Logistics Ltd', due: 28500 },
  { no: 'INV/2026-27/002', party: 'Tata Motors Commercial Ltd', due: 142000 },
  { no: 'INV/2026-27/003', party: 'Apex Industries LLP', due: 54000 },
  { no: 'INV/2026-27/004', party: 'Adani Ports & SEZ', due: 96000 }
];

export default function CashFlowForm({ voucherType, onSubmit, onCancel }: CashFlowFormProps) {
  const isReceipt = voucherType === 'receipt';
  const [partyName, setPartyName] = useState(SAMPLE_PENDING_INVOICES[0].party);
  const [amount, setAmount] = useState(String(SAMPLE_PENDING_INVOICES[0].due));
  const [againstInvoiceRef, setAgainstInvoiceRef] = useState(SAMPLE_PENDING_INVOICES[0].no);
  const [paymentMode, setPaymentMode] = useState<'bank' | 'cash' | 'cheque' | 'upi'>('bank');
  const [instrumentNo, setInstrumentNo] = useState('UTR-99882201');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankLedger, setBankLedger] = useState('HDFC Bank Account - 9912');
  const [narration, setNarration] = useState(
    isReceipt
      ? 'Payment received towards full settlement of Tax Invoice'
      : 'Vendor payout released via RTGS / NEFT'
  );

  const handleInvoiceSelect = (invNo: string) => {
    setAgainstInvoiceRef(invNo);
    const selected = SAMPLE_PENDING_INVOICES.find(i => i.no === invNo);
    if (selected) {
      setPartyName(selected.party);
      setAmount(String(selected.due));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (!partyName || numAmount <= 0) return;

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
      against_invoice_ref: againstInvoiceRef,
      voucher_date: voucherDate,
      from_account: isReceipt ? partyName : bankLedger,
      to_account: isReceipt ? bankLedger : partyName,
      narration
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 text-xs font-bold text-[#88898b] uppercase pb-1 border-b border-[#e5e3dc]">
        {isReceipt ? <Receipt className="h-4 w-4 text-[#f5ba41]" /> : <CreditCard className="h-4 w-4 text-[#f5ba41]" />}
        <span>{isReceipt ? 'Receipt Voucher (Customer Collection)' : 'Payment Voucher (Vendor / Expense Payout)'}</span>
      </div>

      {/* Invoice Settlement Selector */}
      <div>
        <label className="block text-xs font-bold text-[#232528] mb-1">
          Settlement Against Invoice (Optional / 1-Click Match)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-[#f6f5f0] rounded-2xl">
          {SAMPLE_PENDING_INVOICES.map((inv) => (
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
          ))}
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
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Bank / Cash Account</label>
          <select
            value={bankLedger}
            onChange={(e) => setBankLedger(e.target.value)}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          >
            <option value="HDFC Bank Account - 9912">🏦 HDFC Bank Account - 9912</option>
            <option value="SBI Current Account - 4401">🏦 SBI Current Account - 4401</option>
            <option value="ICICI Bank Account - 0021">🏦 ICICI Bank Account - 0021</option>
            <option value="Cash in Hand">💵 Cash in Hand</option>
          </select>
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
            placeholder="25000"
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
          <label className="block text-xs font-bold text-[#232528] mb-1">Cheque / UTR Ref No</label>
          <input
            type="text"
            value={instrumentNo}
            onChange={(e) => setInstrumentNo(e.target.value)}
            placeholder="UTR-991823"
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#232528] mb-1">Narration</label>
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
  );
}
