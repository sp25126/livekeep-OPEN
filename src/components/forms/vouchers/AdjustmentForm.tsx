'use client';

import React, { useState } from 'react';
import { FileEdit, AlertCircle, Plus, Trash2, Scale } from 'lucide-react';
import { Voucher, VoucherType, LedgerEntry } from '@/types/database';

interface AdjustmentFormProps {
  voucherType: 'journal' | 'credit_note' | 'debit_note';
  onSubmit: (voucherData: Partial<Voucher>) => void;
  onCancel: () => void;
}

export const REASON_CODES = [
  { code: '01', label: '01 - Sales Return / Goods Rejected' },
  { code: '02', label: '02 - Post-Sale Price Discount / Rebate' },
  { code: '03', label: '03 - Deficiency in Services Rendered' },
  { code: '04', label: '04 - Correction in Invoice Value / Tax' },
  { code: '05', label: '05 - Change in Place of Supply (POS)' }
];

export default function AdjustmentForm({ voucherType, onSubmit, onCancel }: AdjustmentFormProps) {
  const isJournal = voucherType === 'journal';
  const isCreditNote = voucherType === 'credit_note';
  const isDebitNote = voucherType === 'debit_note';

  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState('');
  const [originalInvoiceDate, setOriginalInvoiceDate] = useState('');
  const [reasonCode, setReasonCode] = useState('01');
  const [taxableAmount, setTaxableAmount] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [narration, setNarration] = useState('');

  // For Multi-row Journal entries
  const [debitLedgers, setDebitLedgers] = useState<LedgerEntry[]>([
    { ledger_name: '', amount: 0, type: 'dr' }
  ]);
  const [creditLedgers, setCreditLedgers] = useState<LedgerEntry[]>([
    { ledger_name: '', amount: 0, type: 'cr' }
  ]);

  const numTaxable = parseFloat(taxableAmount) || 0;
  const reversedGst = (numTaxable * gstRate) / 100;
  const totalAdjustment = numTaxable + reversedGst;

  const totalJournalDebit = debitLedgers.reduce((acc, l) => acc + (l.amount || 0), 0);
  const totalJournalCredit = creditLedgers.reduce((acc, l) => acc + (l.amount || 0), 0);
  const isJournalBalanced = Math.abs(totalJournalDebit - totalJournalCredit) < 0.01;

  const handleAddJournalRow = (type: 'dr' | 'cr') => {
    if (type === 'dr') {
      setDebitLedgers([...debitLedgers, { ledger_name: '', amount: 0, type: 'dr' }]);
    } else {
      setCreditLedgers([...creditLedgers, { ledger_name: '', amount: 0, type: 'cr' }]);
    }
  };

  const handleUpdateJournalRow = (type: 'dr' | 'cr', idx: number, field: keyof LedgerEntry, val: any) => {
    if (type === 'dr') {
      const updated = [...debitLedgers];
      updated[idx] = { ...updated[idx], [field]: val };
      setDebitLedgers(updated);
    } else {
      const updated = [...creditLedgers];
      updated[idx] = { ...updated[idx], [field]: val };
      setCreditLedgers(updated);
    }
  };

  const handleRemoveJournalRow = (type: 'dr' | 'cr', idx: number) => {
    if (type === 'dr' && debitLedgers.length > 1) {
      setDebitLedgers(debitLedgers.filter((_, i) => i !== idx));
    } else if (type === 'cr' && creditLedgers.length > 1) {
      setCreditLedgers(creditLedgers.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isJournal) {
      if (!isJournalBalanced) {
        alert('Total Debits must exactly match Total Credits in a Journal Entry.');
        return;
      }
      onSubmit({
        voucher_type: 'journal',
        voucher_number: `JRN/2026-27/${Math.floor(100 + Math.random() * 900)}`,
        party_name: debitLedgers[0]?.ledger_name || 'Journal Adjustment',
        total_amount: totalJournalDebit,
        tax_amount: 0,
        status: 'pending',
        debit_ledgers: debitLedgers,
        credit_ledgers: creditLedgers,
        narration
      });
      return;
    }

    if (!partyName) return;

    onSubmit({
      voucher_type: voucherType,
      voucher_number: `${isCreditNote ? 'CN' : 'DN'}/2026-27/${Math.floor(100 + Math.random() * 900)}`,
      party_name: partyName,
      party_gstin: partyGstin,
      original_invoice_no: originalInvoiceNo,
      original_invoice_date: originalInvoiceDate,
      reason_code: reasonCode,
      total_amount: totalAdjustment,
      tax_amount: reversedGst,
      reversed_gst: reversedGst,
      status: 'pending',
      narration
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 text-xs font-bold text-[#88898b] uppercase pb-1 border-b border-[#e5e3dc]">
        <Scale className="h-4 w-4 text-[#f5ba41]" />
        <span>
          {isCreditNote
            ? 'Credit Note (GST-01 Adjustment / Sales Return)'
            : isDebitNote
            ? 'Debit Note (Vendor Rate Variance / Purchase Return)'
            : 'Journal Voucher (Double Entry Adjustment)'}
        </span>
      </div>

      {isJournal ? (
        /* Journal Multi-ledger Rows */
        <div className="space-y-4">
          {/* Debit Ledgers */}
          <div className="space-y-2 bg-[#f6f5f0] p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800">Debit (Dr) Ledgers</label>
              <button
                type="button"
                onClick={() => handleAddJournalRow('dr')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Dr Row
              </button>
            </div>
            {debitLedgers.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={row.ledger_name}
                    onChange={(e) => handleUpdateJournalRow('dr', idx, 'ledger_name', e.target.value)}
                    placeholder="e.g. Depreciation A/c or Bad Debts"
                    className="w-full bg-white rounded-xl px-3 py-1.5 text-xs text-[#232528] border-none"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    required
                    value={row.amount || ''}
                    onChange={(e) => handleUpdateJournalRow('dr', idx, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="Amount (₹)"
                    className="w-full bg-white rounded-xl px-3 py-1.5 text-xs font-mono text-[#232528] border-none"
                  />
                </div>
                <div className="col-span-1 text-center">
                  {debitLedgers.length > 1 && (
                    <button type="button" onClick={() => handleRemoveJournalRow('dr', idx)} className="text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Credit Ledgers */}
          <div className="space-y-2 bg-[#f6f5f0] p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-800">Credit (Cr) Ledgers</label>
              <button
                type="button"
                onClick={() => handleAddJournalRow('cr')}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Cr Row
              </button>
            </div>
            {creditLedgers.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    value={row.ledger_name}
                    onChange={(e) => handleUpdateJournalRow('cr', idx, 'ledger_name', e.target.value)}
                    placeholder="e.g. Machinery A/c or Party Name"
                    className="w-full bg-white rounded-xl px-3 py-1.5 text-xs text-[#232528] border-none"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    required
                    value={row.amount || ''}
                    onChange={(e) => handleUpdateJournalRow('cr', idx, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="Amount (₹)"
                    className="w-full bg-white rounded-xl px-3 py-1.5 text-xs font-mono text-[#232528] border-none"
                  />
                </div>
                <div className="col-span-1 text-center">
                  {creditLedgers.length > 1 && (
                    <button type="button" onClick={() => handleRemoveJournalRow('cr', idx)} className="text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            isJournalBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span>Total Dr: ₹{totalJournalDebit.toLocaleString('en-IN')} | Total Cr: ₹{totalJournalCredit.toLocaleString('en-IN')}</span>
            <span>{isJournalBalanced ? '✓ Balanced' : '⚠ Difference: ₹' + Math.abs(totalJournalDebit - totalJournalCredit).toLocaleString('en-IN')}</span>
          </div>
        </div>
      ) : (
        /* Credit / Debit Note Adjustment Form */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">
                {isCreditNote ? 'Customer / Buyer Name' : 'Supplier / Vendor Name'}
              </label>
              <input
                type="text"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="e.g. Reliance Logistics Ltd"
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">Party GSTIN</label>
              <input
                type="text"
                value={partyGstin}
                onChange={(e) => setPartyGstin(e.target.value)}
                placeholder="24AAACA12341ZV"
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>
          </div>

          {/* Original Invoice Reference & Reason Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">Original Invoice No</label>
              <input
                type="text"
                required
                value={originalInvoiceNo}
                onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                placeholder="INV/2026-27/042"
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">Original Invoice Date</label>
              <input
                type="date"
                required
                value={originalInvoiceDate}
                onChange={(e) => setOriginalInvoiceDate(e.target.value)}
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">GST Reason Code</label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              >
                {REASON_CODES.map(r => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">Taxable Adjustment Amount (₹)</label>
              <input
                type="number"
                required
                value={taxableAmount}
                onChange={(e) => setTaxableAmount(e.target.value)}
                placeholder="10000"
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">GST Rate</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseInt(e.target.value))}
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              >
                <option value="0">0% (Nil / Exempted)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#fafaf8] border border-[#e5e3dc] rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[#88898b]">Reversed GST (CGST+SGST): </span>
              <span className="font-bold text-[#232528] font-mono">₹{reversedGst.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[#88898b]">Total Note Value: </span>
              <span className="font-black text-sm text-[#232528] font-mono">₹{totalAdjustment.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#232528] mb-1">Narration / Remark</label>
        <input
          type="text"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="Accounting narration for Tally daybook"
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
          Post Adjustment
        </button>
      </div>
    </form>
  );
}
