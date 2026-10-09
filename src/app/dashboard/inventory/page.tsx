'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InventoryItem } from '@/types/database';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  TrendingDown, 
  Layers, 
  RefreshCw,
  IndianRupee,
  Edit3,
  Trash2,
  Boxes,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'negative_stock' | 'low_stock'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newGroup, setNewGroup] = useState('Industrial Hardware');
  const [newUnit, setNewUnit] = useState('Nos');
  const [newQty, setNewQty] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newHsn, setNewHsn] = useState('84818030');
  const [newReorder, setNewReorder] = useState('10');

  // Adjustment Form State
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Count Correction');

  useEffect(() => {
    async function loadFromDb() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setItems(data as InventoryItem[]);
        }
      } catch (e) {
        console.error('Failed to load live inventory data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadFromDb();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.hsn_code && item.hsn_code.includes(searchTerm));

    const matchesGroup = groupFilter === 'all' || item.stock_group === groupFilter;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = item.closing_quantity > 0;
    if (stockFilter === 'out_of_stock') matchesStock = item.closing_quantity === 0;
    if (stockFilter === 'negative_stock') matchesStock = item.closing_quantity < 0;
    if (stockFilter === 'low_stock') matchesStock = item.closing_quantity > 0 && item.closing_quantity <= (item.reorder_level || 10);

    return matchesSearch && matchesGroup && matchesStock;
  });

  const totalValuation = items.reduce((acc, i) => acc + (i.closing_quantity > 0 ? i.closing_value : 0), 0);
  const negativeStockCount = items.filter((i) => i.closing_quantity < 0).length;
  const outOfStockCount = items.filter((i) => i.closing_quantity === 0).length;
  const lowStockCount = items.filter((i) => i.closing_quantity > 0 && i.closing_quantity <= (i.reorder_level || 10)).length;

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newRate) return;

    const qty = parseFloat(newQty) || 0;
    const rate = parseFloat(newRate) || 0;

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      organization_id: 'org-101',
      item_name: newItemName,
      sku: newSku || `SKU-${Date.now().toString().slice(-4)}`,
      stock_group: newGroup,
      unit: newUnit,
      closing_quantity: qty,
      opening_quantity: qty,
      base_rate: rate,
      closing_value: qty * rate,
      hsn_code: newHsn,
      reorder_level: parseFloat(newReorder) || 10,
      negative_stock_allowed: true,
      last_synced_at: new Date().toISOString()
    };

    setItems([item, ...items]);
    setIsNewModalOpen(false);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

    try {
      await supabase.from('inventory_items').insert([item]);
    } catch (e) {
      console.log('Saved inventory item locally');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustQty) return;

    const qtyDelta = parseFloat(adjustQty);
    const updatedQty = selectedItem.closing_quantity + qtyDelta;
    const updatedValue = updatedQty * selectedItem.base_rate;

    const updated = {
      ...selectedItem,
      closing_quantity: updatedQty,
      closing_value: updatedValue,
      updated_at: new Date().toISOString()
    };

    setItems(items.map((i) => (i.id === selectedItem.id ? updated : i)));
    setIsAdjustModalOpen(false);
    setAdjustQty('');

    try {
      await supabase.from('inventory_items').update({
        closing_quantity: updatedQty,
        closing_value: updatedValue,
        updated_at: updated.updated_at
      }).eq('id', selectedItem.id);
    } catch (e) {
      console.log('Adjusted stock locally');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) return;
    setItems(items.filter((i) => i.id !== id));
    try {
      await supabase.from('inventory_items').delete().eq('id', id);
    } catch (e) {
      console.log('Deleted stock item locally');
    }
  };

  return (
    <div className="min-h-screen bg-[#ecebe6] text-[#232528] p-3 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e3dc] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2.5 rounded-full bg-[#fafaf8] hover:bg-[#edece6] text-[#232528] transition btn-pill border border-[#e5e3dc]"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#232528] tracking-tight flex items-center gap-2">
                <Package className="h-6 w-6 text-[#f5ba41]" /> Inventory & Stock Control
              </h1>
              <p className="text-xs text-[#88898b]">Live closing stock balances, negative stock alerts, and Tally Prime sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#f5ba41] hover:bg-[#e6ab33] text-[#232528] text-xs font-black shadow-md shadow-[#f5ba41]/20 transition btn-pill"
            >
              <Plus className="h-4 w-4" /> Add Stock Item
            </button>
          </div>
        </header>

        {/* Top Metric Pastel Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 sm:p-5 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] animate-pulse space-y-2">
                <div className="h-3 w-20 bg-[#e5e3dc] rounded-full"></div>
                <div className="h-7 w-28 bg-[#e5e3dc] rounded-md"></div>
                <div className="h-3 w-24 bg-[#e5e3dc] rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total Valuation */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#d2dec9] text-[#24351e] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#24351e]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Total Valuation</span>
                  <span className="p-1 rounded-full bg-[#bccbb2] text-[#24351e]">
                    <IndianRupee className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">
                  ₹{totalValuation.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#24351e]/80 mt-1 font-bold">{items.length} Active Stock Items</div>
              </div>
            </div>

            {/* Card 2: Negative Stock Alerts (Urgent) */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#fbeaea] text-[#b91c1c] shadow-sm relative overflow-hidden flex flex-col justify-between border border-rose-200">
              <div>
                <div className="flex items-center justify-between text-[#b91c1c]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Negative Stock</span>
                  <span className="p-1 rounded-full bg-rose-200 text-[#b91c1c]">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">{negativeStockCount}</div>
                <div className="text-[10px] text-[#b91c1c] mt-1 font-bold">Oversold / Unbilled Inflows</div>
              </div>
            </div>

            {/* Card 3: Out of Stock */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#fbe29d] text-[#4d3809] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#4d3809]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Out of Stock</span>
                  <span className="p-1 rounded-full bg-[#e8cd84] text-[#4d3809]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">{outOfStockCount}</div>
                <div className="text-[10px] text-[#4d3809]/80 mt-1 font-bold">Zero Balance Items</div>
              </div>
            </div>

            {/* Card 4: Low Stock Warnings */}
            <div className="p-4 sm:p-5 rounded-[28px] bg-[#dfe5ec] text-[#1e293b] shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#1e293b]/80 mb-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Low Stock (Reorder)</span>
                  <span className="p-1 rounded-full bg-[#cbd5e1] text-[#1e293b]">
                    <TrendingDown className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono mt-1">{lowStockCount}</div>
                <div className="text-[10px] text-[#1e293b]/80 mt-1 font-bold">Below Threshold Level</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#88898b]" />
            <input
              type="text"
              placeholder="Search item name, SKU, or HSN code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#f6f5f0] border-none rounded-full text-xs sm:text-sm font-medium text-[#232528] placeholder-[#88898b] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' },
              { id: 'negative_stock', label: `Negative Stock (${negativeStockCount})`, alert: negativeStockCount > 0 },
              { id: 'low_stock', label: 'Low Stock' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap btn-pill ${
                  stockFilter === tab.id
                    ? 'bg-[#232528] text-white shadow-sm'
                    : tab.alert
                    ? 'bg-rose-100 text-rose-700 font-black'
                    : 'bg-[#f6f5f0] text-[#88898b] hover:text-[#232528]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Items List (Desktop Table + Mobile Cards) */}
        <div className="rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e3dc] bg-[#f6f5f0] text-[11px] font-extrabold uppercase tracking-wider text-[#88898b]">
                      <th className="py-4 px-6">Item Name & SKU</th>
                      <th className="py-4 px-6">Group</th>
                      <th className="py-4 px-6 text-right">Quantity</th>
                      <th className="py-4 px-6 text-right">Base Rate</th>
                      <th className="py-4 px-6 text-right">Closing Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efeee9]">
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-6 space-y-1"><div className="h-4 w-48 bg-[#e5e3dc] rounded"></div><div className="h-3 w-20 bg-[#e5e3dc] rounded-full"></div></td>
                        <td className="py-4 px-6"><div className="h-5 w-24 bg-[#e5e3dc] rounded-full"></div></td>
                        <td className="py-4 px-6 text-right"><div className="h-5 w-16 bg-[#e5e3dc] rounded-full ml-auto"></div></td>
                        <td className="py-4 px-6 text-right"><div className="h-4 w-20 bg-[#e5e3dc] rounded ml-auto"></div></td>
                        <td className="py-4 px-6 text-right"><div className="h-5 w-24 bg-[#e5e3dc] rounded ml-auto"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#e5e3dc] animate-pulse space-y-2">
                    <div className="h-4 w-40 bg-[#e5e3dc] rounded"></div>
                    <div className="h-3 w-28 bg-[#e5e3dc] rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-10 w-10 text-[#88898b] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-[#232528]">No Inventory Items Found</h3>
              <p className="text-xs text-[#88898b] mt-1 max-w-sm mx-auto">
                {searchTerm || stockFilter !== 'all' || groupFilter !== 'all'
                  ? 'No inventory items match your search or filter criteria.'
                  : 'No inventory items have been synced or created yet. Click "+ Add Stock Item" to create one.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e3dc] bg-[#f6f5f0] text-[11px] font-extrabold uppercase tracking-wider text-[#88898b]">
                      <th className="py-4 px-6">Item Name & SKU</th>
                      <th className="py-4 px-6">Group / Category</th>
                      <th className="py-4 px-6">HSN Code</th>
                      <th className="py-4 px-6 text-right">Closing Quantity</th>
                      <th className="py-4 px-6 text-right">Base Rate</th>
                      <th className="py-4 px-6 text-right">Closing Value</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efeee9] text-xs">
                    {filteredItems.map((item) => {
                      const isNegative = item.closing_quantity < 0;
                      const isLow = item.closing_quantity > 0 && item.closing_quantity <= (item.reorder_level || 10);
                      const isOut = item.closing_quantity === 0;

                      return (
                        <tr key={item.id} className="hover:bg-[#f6f5f0]/80 transition">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-sm text-[#232528]">{item.item_name}</div>
                            <div className="text-[11px] text-[#88898b] font-mono mt-0.5">SKU: {item.sku}</div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="px-3 py-1 rounded-full bg-[#f6f5f0] text-[#232528] text-[11px] font-bold">
                              {item.stock_group}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-mono text-[#88898b]">
                            {item.hsn_code || '84818030'}
                          </td>

                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-mono font-black text-sm px-3 py-1 rounded-full ${
                              isNegative 
                                ? 'bg-rose-100 text-rose-700 font-extrabold ring-2 ring-rose-300 animate-pulse' 
                                : isOut
                                ? 'bg-amber-100 text-amber-800'
                                : isLow
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {isNegative && <ShieldAlert className="h-3.5 w-3.5" />}
                              {item.closing_quantity} {item.unit}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold text-[#232528]">
                            ₹{item.base_rate.toLocaleString('en-IN')}
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-black text-sm text-[#232528]">
                            <span className={isNegative ? 'text-rose-600' : 'text-[#232528]'}>
                              ₹{item.closing_value.toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsAdjustModalOpen(true);
                                }}
                                className="px-3 py-1 bg-[#f6f5f0] hover:bg-[#edece6] text-[#232528] rounded-full text-xs font-bold transition btn-pill"
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 bg-[#fbeaea] hover:bg-[#f7d6d6] text-rose-700 rounded-full transition btn-pill"
                                title="Delete Stock Item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col space-y-4 md:hidden p-4">
                {filteredItems.map((item) => {
                  const isNegative = item.closing_quantity < 0;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-white border border-[#e5e3dc] space-y-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#232528]">{item.item_name}</h4>
                          <div className="text-[11px] text-[#88898b] font-mono mt-0.5">SKU: {item.sku} | HSN: {item.hsn_code}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                          isNegative ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.closing_quantity} {item.unit}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#efeee9] flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-[#88898b] block">Closing Value</span>
                          <span className="font-mono font-black text-sm text-[#232528]">₹{item.closing_value.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsAdjustModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#f6f5f0] text-[#232528] font-bold rounded-full text-xs"
                          >
                            Adjust
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE STOCK ITEM MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-lg font-black text-[#232528] flex items-center gap-2">
                <Package className="h-5 w-5 text-[#f5ba41]" /> Add New Stock Item
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#88898b] hover:text-[#232528]">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Copper Bushing 50mm"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1">Stock Group</label>
                  <input
                    type="text"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1">Unit of Measure</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528]"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Mtrs">Mtrs</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1">Opening Quantity</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    placeholder="100"
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#232528] mb-1">Base Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="1250"
                    className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full btn-pill shadow-md shadow-[#f5ba41]/20"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-base font-black text-[#232528]">
                Adjust Stock: {selectedItem.item_name}
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-[#88898b]">✕</button>
            </div>

            <p className="text-xs text-[#88898b]">
              Current Closing Balance: <strong className="text-[#232528] font-mono">{selectedItem.closing_quantity} {selectedItem.unit}</strong>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Quantity Change (+ to add, - to reduce)</label>
                <input
                  type="number"
                  required
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. +10 or -5"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-mono text-[#232528] focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-2.5 text-xs font-bold text-[#232528]"
                >
                  <option value="Stock Count Correction">Physical Stock Verification</option>
                  <option value="Damaged / Scrapped">Damaged / Rejected Stock</option>
                  <option value="Sample Dispatch">Sales Demonstration Sample</option>
                  <option value="Opening Balance Correction">Opening Balance Correction</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-white bg-[#232528] hover:bg-[#1b1c1e] rounded-full btn-pill shadow-md"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
