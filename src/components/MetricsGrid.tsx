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

export default function MetricsGrid({ vouchers, onSelectMetric }: MetricsGridProps) {
  // Aggregate dynamic metrics from vouchers
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

  // Bank & Cash Balance calculations (sample baseline + ledger mutations)
  const bankBalance = 4852400 + receiptTotal - paymentTotal;
  const cashBalance = 348500;

  const metrics: MetricItem[] = [
    {
      id: 'sales',
      title: 'Sales',
      subtitle: 'Total B2B & Tax Invoices',
      amount: salesTotal || 1248000,
      icon: TrendingUp,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: '+14.2% YoY',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard?filter=sales'
    },
    {
      id: 'receivables',
      title: 'Receivables',
      subtitle: 'Customer Dues to Collect',
      amount: receivablesTotal || 842000,
      icon: ArrowDownLeft,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Due Now',
      badgeBg: 'bg-amber-100 text-amber-800',
      route: '/dashboard/reports?tab=receivables'
    },
    {
      id: 'purchase',
      title: 'Purchase',
      subtitle: 'Vendor Procurement & Orders',
      amount: purchaseTotal || 795400,
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
      amount: payablesTotal || 412000,
      icon: ArrowUpRight,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Pending Pay',
      badgeBg: 'bg-rose-100 text-rose-800',
      route: '/dashboard/reports?tab=payables'
    },
    {
      id: 'receipt',
      title: 'Receipt',
      subtitle: 'Customer Payments Inflow',
      amount: receiptTotal || 620000,
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
      amount: paymentTotal || 340000,
      icon: CreditCard,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Expenses',
      badgeBg: 'bg-amber-100 text-amber-800',
      route: '/dashboard?filter=payment'
    },
    {
      id: 'bank',
      title: 'Bank',
      subtitle: 'Live HDFC & SBI Accounts',
      amount: bankBalance,
      icon: Building,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: '3 Accounts',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard/reports?tab=ledgers'
    },
    {
      id: 'cash',
      title: 'Cash',
      subtitle: 'Cash in Hand & Petty Cash',
      amount: cashBalance,
      icon: Banknote,
      accentColor: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Petty Cash',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      route: '/dashboard/reports?tab=ledgers'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => onSelectMetric && onSelectMetric(item.id)}
            className="group relative bg-[#fafaf8] hover:bg-white border border-[#e5e3dc] hover:border-[#f5ba41] rounded-[24px] p-4 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${item.accentColor} shadow-inner`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#232528] group-hover:text-black">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-[#88898b] font-medium line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                {item.badgeText}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-[#f0eee6]">
              <span className="font-black text-base sm:text-lg text-[#232528] font-mono tracking-tight">
                {formatIndianCurrency(item.amount)}
              </span>
              <div className="text-[11px] font-bold text-[#88898b] group-hover:text-[#232528] flex items-center gap-0.5 transition">
                <span>View</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
