'use client';

import React from 'react';
import { 
  TrendingUp, 
  ArrowDownLeft, 
  ShoppingCart, 
  ArrowUpRight, 
  Receipt, 
  CreditCard, 
  Building, 
  Banknote, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Voucher } from '@/types/database';

interface MetricsGridProps {
  vouchers: Voucher[];
  isLoading?: boolean;
  onSelectMetric?: (metricId: string) => void;
}

export interface MetricItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeText: string;
  badgeBg: string;
  route: string;
}

export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function MetricsGrid({ vouchers, isLoading = false, onSelectMetric }: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 animate-pulse space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#e5e3dc]/70 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3 w-12 sm:w-16 bg-[#e5e3dc]/80 rounded" />
                  <div className="h-2 w-16 sm:w-24 bg-[#e5e3dc]/50 rounded hidden sm:block" />
                </div>
              </div>
              <div className="h-3.5 w-10 bg-[#e5e3dc]/60 rounded-full" />
            </div>
            <div className="pt-2 border-t border-[#f0eee6] flex justify-between items-center">
              <div className="h-5 sm:h-6 w-20 sm:w-24 bg-[#e5e3dc]/80 rounded" />
              <div className="h-3 w-6 sm:w-8 bg-[#e5e3dc]/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Aggregate dynamic metrics from live vouchers strictly
  const salesTotal = vouchers
    .filter(v => v.voucher_type === 'sales_bill')
    .reduce((acc, v) => acc + (v.total_amount || 0), 0);

  const purchaseTotal = vouchers
    .filter(v => v.voucher_type === 'purchase_order' || (v.voucher_type as string) === 'purchase')
    .reduce((acc, v) => acc + (v.total_amount || 0), 0);

  const receivablesTotal = vouchers
    .filter(v => v.voucher_type === 'sales_bill' && v.status === 'pending')
    .reduce((acc, v) => acc + (v.total_amount || 0), 0);

  const payablesTotal = vouchers
    .filter(v => (v.voucher_type === 'purchase_order' || (v.voucher_type as string) === 'purchase') && v.status === 'pending')
    .reduce((acc, v) => acc + (v.total_amount || 0), 0);

  const receiptTotal = vouchers
    .filter(v => v.voucher_type === 'receipt')
    .reduce((acc, v) => acc + (v.total_amount || 0), 0);

  const paymentTotal = vouchers
    .filter(v => v.voucher_type === 'payment')
    .reduce((acc, v) => acc + (v.total_amount || 0), 0);

  // Bank & Cash Balance calculations purely from recorded cash/bank transactions
  const bankBalance = vouchers
    .filter(v => v.payment_mode === 'bank' || v.payment_mode === 'cheque' || v.payment_mode === 'upi')
    .reduce((acc, v) => {
      if (v.voucher_type === 'receipt') return acc + (v.total_amount || 0);
      if (v.voucher_type === 'payment') return acc - (v.total_amount || 0);
      return acc;
    }, 0);

  const cashBalance = vouchers
    .filter(v => v.payment_mode === 'cash')
    .reduce((acc, v) => {
      if (v.voucher_type === 'receipt') return acc + (v.total_amount || 0);
      if (v.voucher_type === 'payment') return acc - (v.total_amount || 0);
      return acc;
    }, 0);

  const metrics: MetricItem[] = [
    {
      id: 'sales',
      title: 'Sales',
      subtitle: 'Total B2B & Tax Invoices',
      amount: salesTotal,
      icon: TrendingUp,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Sales Revenue',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard?filter=sales'
    },
    {
      id: 'receivables',
      title: 'Receivables',
      subtitle: 'Customer Dues to Collect',
      amount: receivablesTotal,
      icon: ArrowDownLeft,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Pending Inflow',
      badgeBg: 'bg-amber-100 text-amber-800',
      route: '/dashboard/reports?tab=receivables'
    },
    {
      id: 'purchase',
      title: 'Purchase',
      subtitle: 'Vendor Procurement & Orders',
      amount: purchaseTotal,
      icon: ShoppingCart,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Procurement',
      badgeBg: 'bg-blue-100 text-blue-800',
      route: '/dashboard?filter=purchase'
    },
    {
      id: 'payables',
      title: 'Payables',
      subtitle: 'Pending Vendor Bills',
      amount: payablesTotal,
      icon: ArrowUpRight,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Pending Outflow',
      badgeBg: 'bg-rose-100 text-rose-800',
      route: '/dashboard/reports?tab=payables'
    },
    {
      id: 'receipt',
      title: 'Receipt',
      subtitle: 'Customer Payments Inflow',
      amount: receiptTotal,
      icon: Receipt,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Collections',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard?filter=receipt'
    },
    {
      id: 'payment',
      title: 'Payment',
      subtitle: 'Vendor & Expense Outflows',
      amount: paymentTotal,
      icon: CreditCard,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Expenses',
      badgeBg: 'bg-amber-100 text-amber-800',
      route: '/dashboard?filter=payment'
    },
    {
      id: 'bank',
      title: 'Bank',
      subtitle: 'Net Bank Transactions',
      amount: bankBalance,
      icon: Building,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Live Ledgers',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard/reports?tab=ledgers'
    },
    {
      id: 'cash',
      title: 'Cash',
      subtitle: 'Net Cash In Hand',
      amount: cashBalance,
      icon: Banknote,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Cash Register',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard/reports?tab=ledgers'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => onSelectMetric && onSelectMetric(item.id)}
            className="group relative bg-[#fafaf8] hover:bg-white border border-[#e5e3dc] hover:border-[#f5ba41] rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-1">
              <div className="flex items-center space-x-2 sm:space-x-3 truncate">
                <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${item.accentColor} shadow-inner`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-xs sm:text-sm text-[#232528] group-hover:text-black truncate">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-[#88898b] font-medium truncate hidden sm:block">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${item.badgeBg}`}>
                {item.badgeText}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1.5 sm:pt-2 border-t border-[#f0eee6]">
              <span className="font-black text-sm sm:text-lg text-[#232528] font-mono tracking-tight truncate">
                {formatIndianCurrency(item.amount)}
              </span>
              <div className="text-[10px] sm:text-[11px] font-bold text-[#88898b] group-hover:text-[#232528] flex items-center gap-0.5 transition shrink-0 ml-1">
                <span>View</span>
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
