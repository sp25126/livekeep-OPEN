'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Receipt, 
  CreditCard, 
  ShoppingBag, 
  ShoppingCart, 
  Scale, 
  ArrowLeftRight, 
  FileEdit, 
  Plus, 
  X, 
  ArrowLeft,
  Sparkles,
  FileCheck2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Voucher, VoucherType } from '@/types/database';

import OrderForm from './forms/vouchers/OrderForm';
import AdjustmentForm from './forms/vouchers/AdjustmentForm';
import ContraForm from './forms/vouchers/ContraForm';
import CashFlowForm from './forms/vouchers/CashFlowForm';

interface CreateTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitVoucher: (voucher: Partial<Voucher>) => void;
  initialType?: VoucherType;
}

interface VoucherMenuOption {
  type: VoucherType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  badge?: string;
  shortcut?: string;
}

export const TRANSACTION_OPTIONS: VoucherMenuOption[] = [
  {
    type: 'quotation',
    title: 'Quotation',
    subtitle: 'Price estimate & proforma quote',
    icon: FileSpreadsheet,
    accent: 'bg-amber-100 text-amber-800',
    shortcut: 'Alt + Q'
  },
  {
    type: 'sales_bill',
    title: 'Sales',
    subtitle: 'Tax invoice with auto GST/IRN',
    icon: TrendingUp,
    accent: 'bg-emerald-100 text-emerald-800',
    badge: 'Popular',
    shortcut: 'Alt + S'
  },
  {
    type: 'receipt',
    title: 'Receipt',
    subtitle: 'Customer collection & bank inflow',
    icon: Receipt,
    accent: 'bg-emerald-100 text-emerald-800',
    shortcut: 'Alt + R'
  },
  {
    type: 'payment',
    title: 'Payment',
    subtitle: 'Vendor & expense bank payouts',
    icon: CreditCard,
    accent: 'bg-rose-100 text-rose-800',
    shortcut: 'Alt + P'
  },
  {
    type: 'sales_order',
    title: 'Sales Order',
    subtitle: 'Customer booking & delivery schedule',
    icon: ShoppingBag,
    accent: 'bg-blue-100 text-blue-800'
  },
  {
    type: 'purchase',
    title: 'Purchase',
    subtitle: 'Vendor bills & inward stock purchase',
    icon: ShoppingCart,
    accent: 'bg-purple-100 text-purple-800'
  },
  {
    type: 'journal',
    title: 'Journal',
    subtitle: 'Multi-ledger Dr/Cr adjustments',
    icon: Scale,
    accent: 'bg-indigo-100 text-indigo-800',
    shortcut: 'Alt + J'
  },
  {
    type: 'contra',
    title: 'Contra',
    subtitle: 'Bank ⇋ Cash internal transfer',
    icon: ArrowLeftRight,
    accent: 'bg-amber-100 text-amber-800',
    shortcut: 'Alt + C'
  },
  {
    type: 'purchase_order',
    title: 'Purchase Order',
    subtitle: 'Procurement orders to vendors',
    icon: ShoppingCart,
    accent: 'bg-blue-100 text-blue-800'
  },
  {
    type: 'credit_note',
    title: 'Credit Note',
    subtitle: 'Sales return / GST discount credit',
    icon: FileEdit,
    accent: 'bg-rose-100 text-rose-800'
  },
  {
    type: 'debit_note',
    title: 'Debit Note',
    subtitle: 'Purchase return / vendor rate variance',
    icon: FileText,
    accent: 'bg-orange-100 text-orange-800'
  }
];

export default function CreateTransactionSheet({
  isOpen,
  onClose,
  onSubmitVoucher,
  initialType
}: CreateTransactionSheetProps) {
  const [selectedType, setSelectedType] = useState<VoucherType | null>(initialType || null);

  if (!isOpen) return null;

  const handleSelectType = (type: VoucherType) => {
    setSelectedType(type);
  };

  const handleFormSubmit = (voucherData: Partial<Voucher>) => {
    onSubmitVoucher(voucherData);
    setSelectedType(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-t-[32px] sm:rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
          <div className="flex items-center space-x-2">
            {selectedType && (
              <button
                onClick={() => setSelectedType(null)}
                className="p-1 rounded-xl hover:bg-[#f6f5f0] text-[#555] hover:text-[#232528] mr-1"
                title="Back to all voucher types"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-base sm:text-lg font-black text-[#232528] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#f5ba41]" />
              {selectedType ? `Create ${selectedType.replace('_', ' ').toUpperCase()}` : 'Create Transaction'}
            </h3>
          </div>

          <button
            onClick={() => {
              setSelectedType(null);
              onClose();
            }}
            className="text-[#88898b] hover:text-[#232528] p-2 text-base"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: 11-Voucher Grid Selection */}
        {!selectedType ? (
          <div className="space-y-3">
            <p className="text-xs text-[#88898b]">
              Select a transaction class to open the specialized accounting form:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TRANSACTION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    onClick={() => handleSelectType(opt.type)}
                    className="group bg-white hover:bg-[#fafaf8] border border-[#e5e3dc] hover:border-[#f5ba41] rounded-2xl p-3 text-left transition-all duration-150 shadow-xs hover:shadow-md flex flex-col justify-between space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${opt.accent} shadow-inner`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {opt.badge && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#f5ba41]/20 text-[#232528]">
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-xs text-[#232528] group-hover:text-black flex items-center justify-between">
                        <span>{opt.title}</span>
                      </div>
                      <div className="text-[10px] text-[#88898b] line-clamp-1 mt-0.5">
                        {opt.subtitle}
                      </div>
                    </div>

                    {opt.shortcut && (
                      <span className="text-[9px] font-mono text-[#88898b] bg-[#f6f5f0] px-1.5 py-0.5 rounded self-start">
                        {opt.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Step 2: Dedicated Form for the Selected Voucher Type */
          <div className="pt-1">
            {selectedType === 'sales_order' || selectedType === 'purchase_order' || selectedType === 'quotation' || selectedType === 'sales_bill' || selectedType === 'purchase' ? (
              <OrderForm
                voucherType={selectedType === 'purchase_order' || selectedType === 'purchase' ? 'purchase_order' : 'sales_order'}
                onSubmit={handleFormSubmit}
                onCancel={() => setSelectedType(null)}
              />
            ) : selectedType === 'journal' || selectedType === 'credit_note' || selectedType === 'debit_note' ? (
              <AdjustmentForm
                voucherType={selectedType as 'journal' | 'credit_note' | 'debit_note'}
                onSubmit={handleFormSubmit}
                onCancel={() => setSelectedType(null)}
              />
            ) : selectedType === 'contra' ? (
              <ContraForm
                onSubmit={handleFormSubmit}
                onCancel={() => setSelectedType(null)}
              />
            ) : (
              <CashFlowForm
                voucherType={selectedType as 'receipt' | 'payment'}
                onSubmit={handleFormSubmit}
                onCancel={() => setSelectedType(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
