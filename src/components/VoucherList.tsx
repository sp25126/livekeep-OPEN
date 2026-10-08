'use client';

import React, { useState } from 'react';
import { Voucher, UserRole, PaymentStatus } from '@/types/database';
import { 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  Printer, 
  Share2, 
  Search, 
  Filter, 
  ChevronRight,
  RefreshCw,
  Eye
} from 'lucide-react';

interface VoucherListProps {
  vouchers: Voucher[];
  activeRole: UserRole;
  onSelectVoucher: (voucher: Voucher) => void;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onGenerateIrn: (id: string) => void;
  generatingIrnId: string | null;
}

export default function VoucherList({
  vouchers,
  activeRole,
  onSelectVoucher,
  onUpdateStatus,
  onGenerateIrn,
  generatingIrnId
}: VoucherListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = 
      v.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.party_gstin && v.party_gstin.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesType = typeFilter === 'all' || v.voucher_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" /> B2B Daybook & Sales Transactions
            </h2>
            <p className="text-xs text-slate-400">Live multi-device transactions and maker-checker audit ledger</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {filteredVouchers.length} Record{filteredVouchers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Search & Filter Inputs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search voucher #, party name, or GSTIN..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition min-h-[36px] ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= DESKTOP TABLE VIEW (>= 768px) ================= */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-6">Voucher No</th>
              <th className="py-3.5 px-6">Party Details</th>
              <th className="py-3.5 px-6">Grand Total</th>
              <th className="py-3.5 px-6">GST Tax</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">NIC IRN / Compliance</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredVouchers.map((voucher) => (
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
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-700/60 truncate max-w-[130px]" title={voucher.irn_number}>
                        {voucher.irn_number}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Verified
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onGenerateIrn(voucher.id)}
                      disabled={generatingIrnId === voucher.id}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded bg-blue-950/60 border border-blue-800/60 transition disabled:opacity-50"
                    >
                      {generatingIrnId === voucher.id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 text-blue-400 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> 1-Click IRN
                        </>
                      )}
                    </button>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectVoucher(voucher)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    >
                      View
                    </button>

                    <a
                      href={`/api/invoices/${voucher.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 rounded-lg border border-indigo-700/60 transition flex items-center gap-1"
                    >
                      PDF
                    </a>

                    {(activeRole === 'checker' || activeRole === 'admin') && voucher.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(voucher.id, 'approved')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-900/50 hover:bg-emerald-800/60 rounded-lg border border-emerald-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onUpdateStatus(voucher.id, 'rejected')}
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

      {/* ================= MOBILE CARD-STACK VIEW (< 768px) ================= */}
      <div className="block md:hidden divide-y divide-slate-800/80">
        {filteredVouchers.map((voucher) => (
          <div
            key={voucher.id}
            onClick={() => onSelectVoucher(voucher)}
            className="p-4 hover:bg-slate-800/40 active:bg-slate-800/70 transition space-y-3 cursor-pointer"
          >
            {/* Top Row: Party Name + Grand Total */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-sm text-white leading-tight">{voucher.party_name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {voucher.party_gstin || 'Unregistered'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-white">
                  ₹{voucher.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400">
                  Tax: ₹{voucher.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Middle Row: Voucher #, Type Badge, Status */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
              <div className="flex items-center space-x-2 font-mono text-[11px] text-blue-400">
                <span>{voucher.voucher_number}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-400 uppercase">{voucher.voucher_type.replace('_', ' ')}</span>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  voucher.status === 'approved'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : voucher.status === 'rejected'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {voucher.status}
              </span>
            </div>

            {/* Bottom Row: 48px Minimum Touch Target Action Buttons */}
            <div
              className="flex items-center justify-between gap-2 pt-2"
              onClick={(e) => e.stopPropagation()} // prevent card tap
            >
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={() => onSelectVoucher(voucher)}
                  className="flex-1 min-h-[44px] py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Eye className="h-4 w-4 text-blue-400" /> Details
                </button>

                <a
                  href={`/api/invoices/${voucher.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] px-3.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Printer className="h-4 w-4" /> PDF
                </a>
              </div>

              {/* Conditional Approval or IRN Action */}
              {(activeRole === 'checker' || activeRole === 'admin') && voucher.status === 'pending' ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateStatus(voucher.id, 'approved')}
                    className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => onUpdateStatus(voucher.id, 'rejected')}
                    className="min-h-[44px] px-2.5 bg-rose-950/60 border border-rose-800/60 text-rose-400 rounded-xl text-xs font-semibold transition"
                  >
                    ✕
                  </button>
                </div>
              ) : !voucher.irn_number && voucher.status === 'approved' ? (
                <button
                  onClick={() => onGenerateIrn(voucher.id)}
                  disabled={generatingIrnId === voucher.id}
                  className="min-h-[44px] px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {generatingIrnId === voucher.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  )}
                  IRN
                </button>
              ) : voucher.irn_number ? (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> IRN Active
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
