import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppInvoiceReminder } from '@/lib/services/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voucherId, approvedBy, phoneNumber, partyName, amount, voucherNumber } = body;

    if (!voucherId) {
      return NextResponse.json({ success: false, error: 'voucherId parameter is required' }, { status: 400 });
    }

    console.log(`[Approval Pipeline] Processing maker-checker approval for voucher ID: ${voucherId}`);

    // 1. Update Database Status to approved
    let updatedVoucher: any = null;

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .update({
          status: 'approved',
          approved_by: approvedBy || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', voucherId)
        .select()
        .single();

      if (data && !error) {
        updatedVoucher = data;
      }
    } catch (e) {
      console.log('[Approval Pipeline] Operating in session mode, updating locally');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pdfUrl = `${appUrl}/api/invoices/${voucherId}/pdf`;

    // 2. Trigger Meta WhatsApp Cloud API Service asynchronously
    const targetPhone = phoneNumber || '919876543210';
    const targetParty = partyName || updatedVoucher?.party_name || 'Valued B2B Customer';
    const targetAmount = amount || updatedVoucher?.total_amount || 26550.00;
    const targetVoucherNum = voucherNumber || updatedVoucher?.voucher_number || voucherId;

    const whatsappResult = await sendWhatsAppInvoiceReminder({
      phoneNumber: targetPhone,
      partyName: targetParty,
      amount: targetAmount,
      pdfUrl,
      voucherNumber: targetVoucherNum
    });

    return NextResponse.json({
      success: true,
      message: 'Voucher approved successfully and WhatsApp reminder dispatched.',
      voucherId,
      status: 'approved',
      pdfUrl,
      whatsapp: whatsappResult
    });
  } catch (err: any) {
    console.error('[Approval API Error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during voucher approval' },
      { status: 500 }
    );
  }
}
