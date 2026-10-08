'use client';

import React from 'react';
import { Voucher, UserRole, PaymentStatus } from '@/types/database';
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  Printer, 
  RefreshCw, 
  Share2, 
  MapPin, 
  X,
  FileCheck,
  Building2,
  Download
} from 'lucide-react';

interface VoucherDrawerProps {
  voucher: Voucher | null;
  onClose: () => void;
  activeRole: UserRole;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onGenerateIrn: (id: string) => void;
  generatingIrnId: string | null;
}

export default function VoucherDrawer({
  voucher,
  onClose,
  activeRole,
  onUpdateStatus,
  onGenerateIrn,
  generatingIrnId
}: VoucherDrawerProps) {
  if (!voucher) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end md:items-stretch items-end transition-opacity">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container (Mobile: Bottom Sheet | Desktop: Right-side Slide-Over) */}
      <div className="relative z-10 w-full md:max-w-xl bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-3xl md:rounded-none p-5 sm:p-6 space-y-5 max-h-[90vh] md:max-h-screen overflow-y-auto shadow-2xl flex flex-col justify-between">
        <div className="space-y-5">
          {/* Mobile Drag Indicator Handle */}
          <div className="block md:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono">{voucher.voucher_number}</h3>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">{voucher.voucher_type.replace('_', ' ')}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Party & Supply Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Billed To (Customer)</div>
              <div className="font-bold text-sm text-white mt-1">{voucher.party_name}</div>
              <div className="font-mono text-slate-400 text-[11px] mt-0.5">{voucher.party_gstin || 'Unregistered'}</div>
              <div className="text-slate-400 text-[11px] mt-1 line-clamp-2">{voucher.billing_address || 'Gujarat Industrial Estate, Vatva'}</div>
            </div>

            <div className="pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-3 space-y-1.5">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Compliance Status</div>
              <div className="text-slate-300">
                Place of Supply: <span className="font-semibold text-white">{voucher.place_of_supply || '24-Gujarat'}</span>
              </div>
              <div className="text-slate-300">
                Authorization: <span className="font-bold uppercase text-emerald-400">{voucher.status}</span>
              </div>
              <div className="text-slate-300">
                E-Way Bill: <span className="font-mono text-emerald-400 font-bold">{voucher.eway_bill_no || 'Not Required (<50k)'}</span>
              </div>
            </div>
          </div>

          {/* IRN Status / Generator Banner */}
          {voucher.irn_number ? (
            <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Verified NIC Government IRN
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded font-bold">
                  INV-01
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-200 break-all select-all pt-1 leading-tight">
                {voucher.irn_number}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-950/50 border border-blue-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-blue-300">Government IRN Pending</div>
                <div className="text-[11px] text-slate-400">Generate 64-char hash via NIC IRP Gateway</div>
              </div>
              <button
                onClick={() => onGenerateIrn(voucher.id)}
                disabled={generatingIrnId === voucher.id}
                className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {generatingIrnId === voucher.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" /> 1-Click IRN
                  </>
                )}
              </button>
            </div>
          )}

          {/* Line Items Table */}
          {voucher.items && voucher.items.length > 0 && (
            <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3">HSN</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {voucher.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{item.item_name}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">{item.hsn_code}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-white">₹{item.total_item_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Totals Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Taxable Value (Subtotal):</span>
              <span>₹{(voucher.total_amount - voucher.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST Tax (18%):</span>
              <span>₹{voucher.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="text-base text-blue-400">₹{voucher.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <a
            href={`/api/invoices/${voucher.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-h-[48px] py-2.5 px-4 text-xs font-semibold text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Printer className="h-4 w-4 text-indigo-400" /> Print Tax Invoice (PDF)
          </a>

          {(activeRole === 'checker' || activeRole === 'admin') && voucher.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(voucher.id, 'approved')}
                className="flex-1 min-h-[48px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve Voucher
              </button>

              <button
                onClick={() => onUpdateStatus(voucher.id, 'rejected')}
                className="min-h-[48px] px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-xl transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
