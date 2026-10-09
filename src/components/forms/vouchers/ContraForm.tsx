'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, Building, Banknote, ShieldAlert } from 'lucide-react';
import { Voucher } from '@/types/database';

interface ContraFormProps {
  onSubmit: (voucherData: Partial<Voucher>) => void;
  onCancel: () => void;
}

const CASH_BANK_LEDGERS = [
  { id: 'hdfc', name: 'HDFC Bank Account - 9912', type: 'bank' },
  { id: 'sbi', name: 'SBI Current Account - 4401', type: 'bank' },
  { id: 'icici', name: 'ICICI Bank Account - 0021', type: 'bank' },
  { id: 'cash', name: 'Cash in Hand', type: 'cash' },
  { id: 'petty', name: 'Petty Cash Desk', type: 'cash' }
];

export default function ContraForm({ onSubmit, onCancel }: ContraFormProps) {
  const [fromAccount, setFromAccount] = useState(CASH_BANK_LEDGERS[0].name);
  const [toAccount, setToAccount] = useState(CASH_BANK_LEDGERS[3].name);
  const [amount, setAmount] = useState('50000');
  const [instrumentNo, setInstrumentNo] = useState('');
  const [narration, setNarration] = useState('Cash withdrawal from HDFC Bank for office operations');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      alert('Source and Destination accounts cannot be the same in a Contra transfer.');
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    onSubmit({
      voucher_type: 'contra',
      voucher_number: `CNT/2026-27/${Math.floor(100 + Math.random() * 900)}`,
      party_name: `${fromAccount} ➔ ${toAccount}`,
      from_account: fromAccount,
      to_account: toAccount,
      total_amount: numAmount,
      tax_amount: 0,
      status: 'pending',
      instrument_number: instrumentNo || undefined,
      narration
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 text-xs font-bold text-[#88898b] uppercase pb-1 border-b border-[#e5e3dc]">
        <ArrowLeftRight className="h-4 w-4 text-[#f5ba41]" />
        <span>Contra Voucher (Restricted Cash ⇋ Bank Internal Transfer)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">
            Source Account (Transfer Out / Cr)
          </label>
          <select
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          >
            {CASH_BANK_LEDGERS.map((l) => (
              <option key={l.id} value={l.name}>
                {l.type === 'bank' ? '🏦 ' : '💵 '} {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">
            Destination Account (Transfer In / Dr)
          </label>
          <select
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          >
            {CASH_BANK_LEDGERS.map((l) => (
              <option key={l.id} value={l.name}>
                {l.type === 'bank' ? '🏦 ' : '💵 '} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Transfer Amount (₹)</label>
          <input
            type="number"
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="50000"
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Cheque / UTR Ref No (Optional)</label>
          <input
            type="text"
            value={instrumentNo}
            onChange={(e) => setInstrumentNo(e.target.value)}
            placeholder="e.g. CHQ-991823 or Self Withdrawal"
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
          placeholder="e.g. Cash withdrawn for administrative expenses"
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
          Post Contra Transfer
        </button>
      </div>
    </form>
  );
}
