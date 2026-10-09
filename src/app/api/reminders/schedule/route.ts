import { NextRequest, NextResponse } from 'next/server';
import { schedulePaymentReminder } from '@/lib/services/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partyName, phoneNumber, amountDue, scheduledFor, voucherNumber } = body;

    if (!partyName || !amountDue || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: 'Party Name, Amount Due, and Scheduled Date (YYYY-MM-DD) are required.' },
        { status: 400 }
      );
    }

    const result = await schedulePaymentReminder({
      partyName,
      phoneNumber: phoneNumber || '919876543210',
      amountDue: Number(amountDue),
      scheduledFor,
      voucherNumber: voucherNumber || 'BAL-DUE'
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Payment reminder successfully scheduled for ${partyName} on ${scheduledFor}.`,
      reminder: result.data
    });
  } catch (err: any) {
    console.error('[API Schedule Reminder Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
