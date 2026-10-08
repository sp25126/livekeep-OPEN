import { supabase } from '@/lib/supabase';
import { Voucher } from '@/types/database';

const OFFLINE_QUEUE_KEY = 'livekeep_offline_queue';

export function getOfflineQueue(): Partial<Voucher>[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading offline queue from localStorage:', e);
    return [];
  }
}

export function getOfflineQueueCount(): number {
  return getOfflineQueue().length;
}

export function queueOfflineVoucher(voucherData: Partial<Voucher>): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
    queue.push({
      ...voucherData,
      created_at: voucherData.created_at || new Date().toISOString()
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[Offline Sync] Voucher #${voucherData.voucher_number} queued locally in localStorage.`);
  } catch (e) {
    console.error('Error saving to offline queue:', e);
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  console.log(`[Offline Sync Engine] Flushing ${queue.length} offline voucher(s) to Supabase...`);
  const remainingQueue: Partial<Voucher>[] = [];
  let flushedCount = 0;

  for (const item of queue) {
    try {
      const { error } = await supabase.from('vouchers').insert([
        {
          organization_id: item.organization_id || 'org-101',
          voucher_number: item.voucher_number,
          voucher_type: item.voucher_type || 'sales_bill',
          party_name: item.party_name,
          party_gstin: item.party_gstin,
          total_amount: item.total_amount,
          tax_amount: item.tax_amount,
          status: item.status || 'pending'
        }
      ]);

      if (error) {
        console.warn(`[Offline Sync] Failed to sync voucher #${item.voucher_number}, keeping in queue:`, error.message);
        remainingQueue.push(item);
      } else {
        console.log(`[Offline Sync] Voucher #${item.voucher_number} successfully synced to Supabase!`);
        flushedCount++;
      }
    } catch (err) {
      console.error(`[Offline Sync] Network error syncing voucher #${item.voucher_number}:`, err);
      remainingQueue.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  return flushedCount;
}
