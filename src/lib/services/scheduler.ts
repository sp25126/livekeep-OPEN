import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ScheduledReminder } from '@/types/database';
import { sendWhatsAppInvoiceReminder } from '@/lib/services/whatsapp';
import { logSecurityEvent } from '@/lib/services/auditLogger';

export interface ScheduleReminderParams {
  organizationId?: string;
  partyId?: string;
  partyName: string;
  phoneNumber: string;
  voucherNumber?: string;
  amountDue: number;
  scheduledFor: string; // YYYY-MM-DD
}

/**
 * Inserts a new scheduled payment reminder into Supabase.
 */
export async function schedulePaymentReminder(params: ScheduleReminderParams): Promise<{ success: boolean; data?: ScheduledReminder; error?: string }> {
  try {
    const newReminder = {
      id: `rem-${Date.now()}`,
      organization_id: params.organizationId || 'org-101',
      party_id: params.partyId || null,
      party_name: params.partyName,
      phone_number: params.phoneNumber.replace(/\D/g, '') || '919876543210',
      voucher_number: params.voucherNumber || 'OVERDUE-BALANCE',
      amount_due: params.amountDue,
      scheduled_for: params.scheduledFor,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('scheduled_reminders')
      .insert([newReminder])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Scheduler Service] Direct table insert notice:', error.message);
    }

    await logSecurityEvent({
      action: 'PAYMENT_REMINDER_SCHEDULED',
      entityName: 'vouchers',
      newData: { partyName: params.partyName, scheduledFor: params.scheduledFor, amount: params.amountDue }
    });

    return { success: true, data: (data as ScheduledReminder) || newReminder };
  } catch (err: any) {
    console.error('[Scheduler Service Exception]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Background worker executing due payment reminders.
 */
export async function processDueReminders(): Promise<{ success: boolean; processedCount: number; results: any[] }> {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[Reminder Processor] Checking pending reminders for date <= ${today}...`);

  try {
    const { data, error } = await supabaseAdmin
      .from('scheduled_reminders')
      .select('*')
      .lte('scheduled_for', today)
      .eq('status', 'pending');

    if (error || !data || data.length === 0) {
      console.log('[Reminder Processor] No pending reminders due today.');
      return { success: true, processedCount: 0, results: [] };
    }

    const results = [];

    for (const item of data) {
      console.log(`[Reminder Processor] Firing WhatsApp reminder to ${item.party_name} for ₹${item.amount_due}...`);

      const dispatchResult = await sendWhatsAppInvoiceReminder({
        partyName: item.party_name,
        phoneNumber: item.phone_number,
        amount: item.amount_due,
        voucherNumber: item.voucher_number || 'OUTSTANDING'
      });

      // Update status to sent
      await supabaseAdmin
        .from('scheduled_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', item.id);

      results.push({
        reminderId: item.id,
        partyName: item.party_name,
        dispatch: dispatchResult
      });
    }

    return {
      success: true,
      processedCount: results.length,
      results
    };
  } catch (err: any) {
    console.error('[Reminder Processor Error]', err);
    return { success: false, processedCount: 0, results: [] };
  }
}
