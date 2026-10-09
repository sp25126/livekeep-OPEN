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
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';

interface VoucherDrawerProps {
  voucher: Voucher | null;
  onClose: () => void;
  activeRole: UserRole;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onGenerateIrn: (id: string) => void;
  generatingIrnId: string | null;
  onEdit?: (voucher: Voucher) => void;
  onDelete?: (id: string) => void;
  companyName?: string;
  companyGstin?: string;
}

export default function VoucherDrawer({
  voucher,
  onClose,
  activeRole,
  onUpdateStatus,
  onGenerateIrn,
  generatingIrnId,
  onEdit,
  onDelete,
  companyName,
  companyGstin
}: VoucherDrawerProps) {
  if (!voucher) return null;

  const handleWhatsAppShare = () => {
    const businessName = companyName || 'our business';
    const message = `*Tax Invoice: ${voucher.voucher_number}*\n\nDear *${voucher.party_name}*,\nYour invoice for *₹${voucher.total_amount.toLocaleString('en-IN')}* is generated.\n\n*Billing Summary:*\n• Subtotal: ₹${((voucher.total_amount) - (voucher.tax_amount || 0)).toLocaleString('en-IN')}\n• GST: ₹${(voucher.tax_amount || 0).toLocaleString('en-IN')}\n• Total Payable: ₹${voucher.total_amount.toLocaleString('en-IN')}\n\n*Compliance Details:*\n• GSTIN: ${voucher.party_gstin || 'Unregistered'}\n• IRN: ${voucher.irn_number ? `${voucher.irn_number.substring(0, 16)}...` : 'Pending Verification'}\n\nThank you for choosing ${businessName}!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${voucher.id}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#232528]/60 backdrop-blur-sm flex justify-end">
      {/* Drawer Container */}
      <div 
        className="w-full max-w-xl bg-[#fafaf8] text-[#232528] h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-[#e5e3dc]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#e5e3dc] flex items-center justify-between bg-[#fafaf8] sticky top-0 z-10">
          <div>
            <span className="text-[11px] font-bold text-[#232528] bg-[#f6f5f0] px-3 py-1 rounded-full uppercase">
              {voucher.voucher_type.replace('_', ' ')}
            </span>
            <h3 className="text-xl font-black text-[#232528] tracking-tight mt-1.5">{voucher.voucher_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-[#88898b] hover:text-[#232528] hover:bg-[#f6f5f0] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status & Compliance Banner */}
          <div className="p-5 rounded-[24px] bg-[#f6f5f0] border border-[#e5e3dc] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#88898b] uppercase tracking-wider">Approval Status</div>
              <div className="font-extrabold text-sm capitalize text-[#232528] mt-0.5 flex items-center gap-1.5">
                {voucher.status === 'approved' ? (
                  <><CheckCircle2 className="h-4 w-4 text-[#2b3e24]" /> Approved & Synced</>
                ) : (
                  <><Clock className="h-4 w-4 text-[#4d3809]" /> Pending Maker Review</>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-[#88898b] uppercase tracking-wider">Tally Prime Status</div>
              <div className="text-xs font-black text-[#2b3e24] font-mono">XML Bridge Ready</div>
            </div>
          </div>

          {/* Party and Supply Info */}
          <div className="grid grid-cols-2 gap-4 p-5 rounded-[24px] bg-[#f6f5f0] border border-[#e5e3dc] text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase text-[#88898b]">Billed To (Customer)</div>
              <div className="font-extrabold text-sm text-[#232528] mt-1">{voucher.party_name}</div>
              <div className="text-[#88898b] font-mono mt-0.5">GSTIN: {voucher.party_gstin || 'Unregistered / N/A'}</div>
              <div className="text-[#88898b] mt-1">Place of Supply: {voucher.place_of_supply || 'N/A'}</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase text-[#88898b]">Billed From (Seller)</div>
              <div className="font-extrabold text-sm text-[#232528] mt-1">
                {companyName || 'Tally Company Not Linked'}
              </div>
              <div className="text-[#88898b] font-mono mt-0.5">
                GSTIN: {companyGstin || 'Connect Tally to view'}
              </div>
              <div className="text-[#88898b] mt-1">
                {companyName ? 'Synced via Tally XML Bridge' : 'Connect Tally First'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#e5e3dc] rounded-[24px] overflow-hidden bg-white">
            <div className="bg-[#f6f5f0] px-5 py-3 border-b border-[#e5e3dc] text-[11px] font-black uppercase text-[#88898b] flex justify-between">
              <span>Item & Description</span>
              <span>Amount (₹)</span>
            </div>
            <div className="divide-y divide-[#efeee9] text-xs p-3">
              {voucher.items && voucher.items.length > 0 ? (
                voucher.items.map((item, idx) => (
                  <div key={idx} className="p-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#232528]">{item.item_name}</div>
                      <div className="text-[11px] text-[#88898b]">
                        HSN: {item.hsn_code || 'N/A'} | Qty: {item.quantity} Nos @ ₹{item.unit_price.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="font-black text-[#232528] font-mono">
                      ₹{item.total_item_amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#232528]">
                      {voucher.narration || `${voucher.voucher_type.replace('_', ' ').toUpperCase()} Entry`}
                    </div>
                    <div className="text-[11px] text-[#88898b]">Ledger / Account: {voucher.party_name}</div>
                  </div>
                  <div className="font-black text-[#232528] font-mono">
                    ₹{(voucher.total_amount - (voucher.tax_amount || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grand Totals Card (Matte Charcoal) */}
          <div className="p-6 rounded-[28px] bg-[#232528] text-white space-y-2 shadow-xl">
            <div className="flex justify-between text-xs text-[#c9c8c5]">
              <span>Taxable Subtotal</span>
              <span className="font-mono text-white">₹{(voucher.total_amount - (voucher.tax_amount || 0)).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-[#c9c8c5]">
              <span>GST Breakdown (18%)</span>
              <span className="font-mono text-white">₹{(voucher.tax_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-white/15 pt-3 flex justify-between text-lg font-black text-white">
              <span>Grand Total</span>
              <span className="text-[#f5ba41] font-mono">₹{voucher.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Government NIC E-Invoice Section */}
          <div className="p-5 rounded-[24px] bg-[#8F94FB]/15 border border-[#8F94FB]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#5b5fd8]" />
                <div>
                  <h4 className="font-black text-xs text-[#2c307a]">Govt. E-Invoice & E-Way Bill</h4>
                  <p className="text-[11px] text-[#5b5fd8]">AES-256 Direct NIC Gateway</p>
                </div>
              </div>

              {!voucher.irn_number && (
                <button
                  onClick={() => onGenerateIrn(voucher.id)}
                  disabled={generatingIrnId === voucher.id}
                  className="px-4 py-2 bg-[#8F94FB] hover:bg-[#7d82f2] text-white font-bold rounded-full text-xs transition btn-pill disabled:opacity-50"
                >
                  {generatingIrnId === voucher.id ? 'Generating...' : '1-Click IRN'}
                </button>
              )}
            </div>

            {voucher.irn_number && (
              <div className="bg-white p-4 rounded-2xl border border-[#8F94FB]/20 space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-[#88898b] uppercase">Verified IRN Hash</div>
                  <div className="text-[11px] font-mono font-bold text-[#232528] break-all">{voucher.irn_number}</div>
                </div>
                {voucher.eway_bill_no && (
                  <div>
                    <div className="text-[10px] font-bold text-[#88898b] uppercase">E-Way Bill No.</div>
                    <div className="text-xs font-mono font-black text-[#2b3e24]">{voucher.eway_bill_no}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#e5e3dc] bg-[#fafaf8] sticky bottom-0 z-10 flex flex-wrap gap-2 justify-end items-center">
          {onDelete && (activeRole === 'admin' || activeRole === 'manager' || activeRole === 'checker') && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete or cancel voucher ${voucher.voucher_number}?`)) {
                  onDelete(voucher.id);
                  onClose();
                }
              }}
              className="min-h-[44px] px-4 py-2 bg-[#fbeaea] hover:bg-[#f7d6d6] text-[#b91c1c] font-bold rounded-full text-xs flex items-center gap-1.5 btn-pill transition mr-auto"
              title="Delete or cancel this voucher"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => {
                onEdit(voucher);
              }}
              className="min-h-[44px] px-5 py-2 bg-[#f6f5f0] hover:bg-[#edece6] text-[#232528] font-bold rounded-full text-xs flex items-center gap-1.5 btn-pill transition"
            >
              <Edit3 className="h-4 w-4 text-[#88898b]" />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="min-h-[44px] px-5 py-2 bg-[#f6f5f0] hover:bg-[#edece6] text-[#232528] font-bold rounded-full text-xs flex items-center gap-1.5 btn-pill"
          >
            <Printer className="h-4 w-4" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="min-h-[44px] px-6 py-2 bg-[#D2DEC9] hover:bg-[#c2d2b7] text-[#2b3e24] font-black rounded-full text-xs flex items-center gap-1.5 btn-pill shadow-sm"
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
              className="min-h-[44px] px-6 py-2 bg-[#f5ba41] hover:bg-[#e6ab33] text-[#232528] font-black rounded-full text-xs btn-pill shadow-md shadow-[#f5ba41]/20"
            >
              Approve Voucher
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
