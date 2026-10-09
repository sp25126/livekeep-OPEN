'use client';

import React, { useState } from 'react';
import { ShoppingBag, Calendar, Truck, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Voucher, VoucherType, VoucherItem } from '@/types/database';
import { calculateInvoiceTaxes } from '@/lib/billing/taxEngine';

interface OrderFormProps {
  voucherType: 'sales_order' | 'purchase_order';
  onSubmit: (voucherData: Partial<Voucher>) => void;
  onCancel: () => void;
}

export default function OrderForm({ voucherType, onSubmit, onCancel }: OrderFormProps) {
  const isSales = voucherType === 'sales_order';
  const [partyName, setPartyName] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [orderNumber, setOrderNumber] = useState(
    `${isSales ? 'SO' : 'PO'}/2026-27/${Math.floor(100 + Math.random() * 900)}`
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [termsOfDelivery, setTermsOfDelivery] = useState('');

  const [items, setItems] = useState<VoucherItem[]>([
    {
      item_name: '',
      hsn_code: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total_item_amount: 0
    }
  ]);

  const recalculateItems = (newItems: VoucherItem[]) => {
    const sellerState = '24';
    const buyerState = partyGstin.trim().slice(0, 2) || '24';

    const calc = calculateInvoiceTaxes(
      newItems.map(i => ({
        itemName: i.item_name,
        hsnCode: i.hsn_code,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        taxRate: i.tax_rate
      })),
      sellerState,
      buyerState
    );

    const updated = newItems.map((item, idx) => {
      const b = calc.itemBreakdowns[idx];
      return {
        ...item,
        cgst_amount: b?.cgstAmount || 0,
        sgst_amount: b?.sgstAmount || 0,
        igst_amount: b?.igstAmount || 0,
        total_item_amount: b?.totalAmount || 0
      };
    });

    setItems(updated);
  };

  const addItemRow = () => {
    const updated = [
      ...items,
      {
        item_name: '',
        hsn_code: '84818030',
        quantity: 1,
        unit_price: 1000,
        tax_rate: 18,
        cgst_amount: 90,
        sgst_amount: 90,
        igst_amount: 0,
        total_item_amount: 1180
      }
    ];
    recalculateItems(updated);
  };

  const updateItem = (index: number, field: keyof VoucherItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    recalculateItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    recalculateItems(updated);
  };

  const totalAmount = items.reduce((acc, i) => acc + (i.total_item_amount || 0), 0);
  const totalTax = items.reduce((acc, i) => acc + (i.cgst_amount + i.sgst_amount + i.igst_amount), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName) return;

    onSubmit({
      voucher_type: voucherType,
      voucher_number: orderNumber,
      order_number: orderNumber,
      party_name: partyName,
      party_gstin: partyGstin,
      total_amount: totalAmount,
      tax_amount: totalTax,
      status: 'pending',
      expected_delivery_date: expectedDeliveryDate,
      terms_of_delivery: termsOfDelivery,
      items
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 text-xs font-bold text-[#88898b] uppercase pb-1 border-b border-[#e5e3dc]">
        <ShoppingBag className="h-4 w-4 text-[#f5ba41]" />
        <span>{isSales ? 'Sales Order Configuration' : 'Purchase Order Configuration'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">
            {isSales ? 'Customer / Buyer Name' : 'Supplier / Vendor Name'}
          </label>
          <input
            type="text"
            required
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder={isSales ? 'e.g. Tata Motors Commercial Ltd' : 'e.g. Jindal Steel & Power Ltd'}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Party GSTIN (15 Digits)</label>
          <input
            type="text"
            value={partyGstin}
            onChange={(e) => setPartyGstin(e.target.value)}
            placeholder="24AAACT1234F1ZX"
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Order Number</label>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Expected Delivery Date</label>
          <input
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#232528] mb-1">Terms of Delivery</label>
          <input
            type="text"
            value={termsOfDelivery}
            onChange={(e) => setTermsOfDelivery(e.target.value)}
            className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#232528]">Order Line Items</label>
          <button
            type="button"
            onClick={addItemRow}
            className="text-[11px] font-bold text-[#232528] bg-[#f5ba41]/20 hover:bg-[#f5ba41]/40 px-3 py-1 rounded-full flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Item
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-[#f6f5f0] rounded-2xl items-center text-xs">
            <div className="col-span-5">
              <input
                type="text"
                required
                value={item.item_name}
                onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                placeholder="Item name / SKU"
                className="w-full bg-white rounded-xl px-2.5 py-1.5 text-xs text-[#232528] border-none"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                placeholder="Qty"
                className="w-full bg-white rounded-xl px-2 py-1.5 text-xs text-[#232528] border-none text-center"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                min="0"
                value={item.unit_price}
                onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                placeholder="Rate"
                className="w-full bg-white rounded-xl px-2 py-1.5 text-xs text-[#232528] border-none text-right font-mono"
              />
            </div>
            <div className="col-span-2 text-right font-bold text-[#232528] font-mono">
              ₹{item.total_item_amount.toLocaleString('en-IN')}
            </div>
            <div className="col-span-1 text-center">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="p-3 bg-[#fafaf8] border border-[#e5e3dc] rounded-2xl flex items-center justify-between text-xs">
        <div>
          <span className="text-[#88898b]">Total Tax (GST): </span>
          <span className="font-bold text-[#232528] font-mono">₹{totalTax.toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span className="text-[#88898b]">Grand Total: </span>
          <span className="font-black text-sm text-[#232528] font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
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
          Save & Queue Order
        </button>
      </div>
    </form>
  );
}
