'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Building, Banknote, ShieldAlert, AlertTriangle, Laptop, Plus } from 'lucide-react';
import { Voucher } from '@/types/database';
import { supabase } from '@/lib/supabase';
import TallyConnectModal from '@/components/TallyConnectModal';

interface ContraFormProps {
  onSubmit: (voucherData: Partial<Voucher>) => void;
  onCancel: () => void;
}

export interface CashBankLedger {
  id: string;
  name: string;
  type: 'bank' | 'cash';
}

export default function ContraForm({ onSubmit, onCancel }: ContraFormProps) {
  const [ledgers, setLedgers] = useState<CashBankLedger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [customFromAccount, setCustomFromAccount] = useState('');
  const [customToAccount, setCustomToAccount] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [amount, setAmount] = useState('');
  const [instrumentNo, setInstrumentNo] = useState('');
  const [narration, setNarration] = useState('');
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);

  useEffect(() => {
    async function loadSyncedLedgers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vouchers')
          .select('from_account, to_account')
          .limit(100);

        if (!error && data && data.length > 0) {
          const names = new Set<string>();
          data.forEach((v) => {
            if (v.from_account && v.from_account.trim()) names.add(v.from_account.trim());
            if (v.to_account && v.to_account.trim()) names.add(v.to_account.trim());
          });

          const parsed: CashBankLedger[] = Array.from(names).map((name, idx) => ({
            id: `acc-${idx}`,
            name,
            type: name.toLowerCase().includes('cash') ? 'cash' : 'bank'
          }));

          setLedgers(parsed);
          if (parsed.length >= 2) {
            setFromAccount(parsed[0].name);
            setToAccount(parsed[1].name);
          } else if (parsed.length === 1) {
            setFromAccount(parsed[0].name);
          }
        } else {
          setLedgers([]);
        }
      } catch (err) {
        setLedgers([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadSyncedLedgers();
  }, []);

  const effectiveFrom = isManualEntry ? customFromAccount.trim() : fromAccount;
  const effectiveTo = isManualEntry ? customToAccount.trim() : toAccount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveFrom || !effectiveTo) {
      alert('Please specify both Source and Destination accounts. If Tally is not connected, please connect Tally first.');
      return;
    }

    if (effectiveFrom === effectiveTo) {
      alert('Source and Destination accounts cannot be the same in a Contra transfer.');
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    onSubmit({
      voucher_type: 'contra',
      voucher_number: `CNT/2026-27/${Math.floor(100 + Math.random() * 900)}`,
      party_name: `${effectiveFrom} ➔ ${effectiveTo}`,
      from_account: effectiveFrom,
      to_account: effectiveTo,
      total_amount: numAmount,
      tax_amount: 0,
      status: 'pending',
      instrument_number: instrumentNo || undefined,
      narration: narration || undefined
    });
  };

  const hasLedgers = ledgers.length > 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#88898b] uppercase pb-1 border-b border-[#e5e3dc]">
          <ArrowLeftRight className="h-4 w-4 text-[#f5ba41]" />
          <span>Contra Voucher (Restricted Cash ⇋ Bank Internal Transfer)</span>
        </div>

        {/* Tally Connection Alert if No Ledgers Synced */}
        {!isLoading && !hasLedgers && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black">No Bank or Cash Ledgers Found</strong>
                <span className="text-[11px] text-amber-800">
                  Please connect Tally first to sync your Bank & Cash accounts, or enter them manually.
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
                onClick={() => setIsManualEntry(!isManualEntry)}
                className="px-3 py-1.5 bg-white hover:bg-[#fafaf8] border border-amber-300 text-[#232528] font-bold rounded-xl text-[11px] transition"
              >
                {isManualEntry ? 'Use Synced List' : 'Enter Manually'}
              </button>
            </div>
          </div>
        )}

        {/* Account Selector Row */}
        {!isManualEntry && hasLedgers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">
                Source Account (Transfer Out / Cr)
              </label>
              <select
                required
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              >
                <option value="" disabled>Select Source Account</option>
                {ledgers.map((l) => (
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
                required
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              >
                <option value="" disabled>Select Destination Account</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.type === 'bank' ? '🏦 ' : '💵 '} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">
                Source Account (Transfer Out / Cr)
              </label>
              {hasLedgers && !isManualEntry ? null : (
                <input
                  type="text"
                  required
                  value={customFromAccount}
                  onChange={(e) => setCustomFromAccount(e.target.value)}
                  placeholder="e.g. Bank Account (Connect Tally first to auto-sync)"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#232528] mb-1">
                Destination Account (Transfer In / Dr)
              </label>
              <input
                type="text"
                required
                value={customToAccount}
                onChange={(e) => setCustomToAccount(e.target.value)}
                placeholder="e.g. Cash in Hand (Connect Tally first to auto-sync)"
                className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#232528] mb-1">Transfer Amount (₹)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
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
          <label className="block text-xs font-bold text-[#232528] mb-1">Narration (Optional)</label>
          <input
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="e.g. Internal cash/bank transfer"
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

      <TallyConnectModal
        isOpen={isTallyModalOpen}
        onClose={() => setIsTallyModalOpen(false)}
        isConnected={false}
      />
    </>
  );
}
