'use client';

import React from 'react';
import { Voucher, UserRole, PaymentStatus } from '@/types/database';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  QrCode, 
  Share2, 
  Download, 
  Printer, 
  Building2, 
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  Sparkles
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

  const handleWhatsAppShare = () => {
    const message = `*Tax Invoice: ${voucher.voucher_number}*\n\nDear *${voucher.party_name}*,\nYour invoice for *₹${voucher.total_amount.toLocaleString('en-IN')}* is generated.\n\n*Billing Summary:*\n• Subtotal: ₹${((voucher.total_amount) - (voucher.tax_amount || 0)).toLocaleString('en-IN')}\n• GST (18%): ₹${(voucher.tax_amount || 0).toLocaleString('en-IN')}\n• Total Payable: ₹${voucher.total_amount.toLocaleString('en-IN')}\n\n*Compliance Details:*\n• GSTIN: ${voucher.party_gstin || '24AAACL9999P1Z2'}\n• IRN: ${voucher.irn_number ? `${voucher.irn_number.substring(0, 16)}...` : 'Pending Verification'}\n\nThank you for choosing Livekeeping Enterprises!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${voucher.id}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      {/* Drawer Container */}
      <div 
        className="w-full max-w-xl bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-slate-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
          <div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
              {voucher.voucher_type.replace('_', ' ')}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">{voucher.voucher_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status & Compliance Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approval Status</div>
              <div className="font-extrabold text-sm capitalize text-slate-900 mt-0.5 flex items-center gap-1.5">
                {voucher.status === 'approved' ? (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approved & Synced</>
                ) : (
                  <><Clock className="h-4 w-4 text-amber-600" /> Pending Maker Review</>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tally Prime Status</div>
              <div className="text-xs font-bold text-emerald-600 font-mono">XML Bridge Ready</div>
            </div>
          </div>

          {/* Party and Supply Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Billed To (Customer)</div>
              <div className="font-bold text-slate-900 text-sm mt-1">{voucher.party_name}</div>
              <div className="text-slate-600 font-mono mt-0.5">GSTIN: {voucher.party_gstin || '24AAACA12341ZV'}</div>
              <div className="text-slate-500 mt-1">Place of Supply: Gujarat (24)</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Billed From (Seller)</div>
              <div className="font-bold text-slate-900 text-sm mt-1">Livekeeping Enterprises</div>
              <div className="text-slate-600 font-mono mt-0.5">GSTIN: 24AAACL9999P1Z2</div>
              <div className="text-slate-500 mt-1">Ahmedabad, Gujarat</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600 flex justify-between">
              <span>Item & Description</span>
              <span>Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs p-2">
              <div className="p-2 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Enterprise Industrial Valves (Grade A)</div>
                  <div className="text-[11px] text-slate-500">HSN: 84818030 | Qty: 10 Nos @ ₹{(voucher.total_amount * 0.85 / 10).toLocaleString('en-IN')}</div>
                </div>
                <div className="font-bold text-slate-900 font-mono">
                  ₹{(voucher.total_amount - (voucher.tax_amount || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Grand Totals */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-lg">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Taxable Value (Subtotal)</span>
              <span className="font-mono text-slate-200">₹{(voucher.total_amount - (voucher.tax_amount || 0)).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>GST Breakdown (CGST 9% + SGST 9%)</span>
              <span className="font-mono text-slate-200">₹{(voucher.tax_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-extrabold text-white">
              <span>Grand Total</span>
              <span className="text-emerald-400 font-mono">₹{voucher.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Government NIC E-Invoice & E-Way Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-xs text-indigo-950">Govt. E-Invoice & E-Way Bill</h4>
                  <p className="text-[11px] text-indigo-700">AES-256 Direct NIC Compliance</p>
                </div>
              </div>

              {!voucher.irn_number && (
                <button
                  onClick={() => onGenerateIrn(voucher.id)}
                  disabled={generatingIrnId === voucher.id}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 btn-tactile disabled:opacity-50"
                >
                  {generatingIrnId === voucher.id ? 'Generating IRN...' : 'Generate 1-Click IRN'}
                </button>
              )}
            </div>

            {voucher.irn_number && (
              <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Verified IRN Hash</div>
                  <div className="text-[11px] font-mono font-bold text-indigo-900 break-all">{voucher.irn_number}</div>
                </div>
                {voucher.eway_bill_no && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">E-Way Bill No.</div>
                    <div className="text-xs font-mono font-bold text-emerald-700">{voucher.eway_bill_no}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/90 sticky bottom-0 z-10 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDownloadPdf}
            className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 btn-tactile shadow-sm"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 btn-tactile"
          >
            <Share2 className="h-4 w-4" />
            <span>Send on WhatsApp</span>
          </button>

          {(activeRole === 'checker' || activeRole === 'admin') && voucher.status === 'pending' && (
            <button
              onClick={() => {
                onUpdateStatus(voucher.id, 'approved');
                onClose();
              }}
              className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 btn-tactile"
            >
              Approve Voucher
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
