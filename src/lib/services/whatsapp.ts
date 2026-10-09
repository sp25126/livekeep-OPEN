export interface WhatsAppReminderParams {
  phoneNumber?: string;
  partyName: string;
  amount: number;
  pdfUrl?: string;
  voucherNumber: string;
  partyGstin?: string;
  irnNumber?: string;
}

/**
 * Option A (100% Free Forever):
 * Generates direct wa.me link with pre-formatted invoice text and PDF attachment link.
 * Requires ZERO Meta developer accounts, ZERO API fees, and works on any phone number.
 */
export function generateDirectWhatsAppUrl(params: WhatsAppReminderParams): string {
  const cleanPhone = (params.phoneNumber || '').replace(/\D/g, '');
  const message = `*Tax Invoice: ${params.voucherNumber}*\n\nDear *${params.partyName}*,\nYour invoice for *₹${Number(params.amount).toLocaleString('en-IN')}* is generated.\n\n*Billing Summary:*\n• Invoice No: ${params.voucherNumber}\n• Total Amount: ₹${Number(params.amount).toLocaleString('en-IN')}\n• GSTIN: ${params.partyGstin || 'Unregistered'}\n${params.irnNumber ? `• Verified IRN: ${params.irnNumber.substring(0, 16)}...\n` : ''}${params.pdfUrl ? `• Download PDF: ${params.pdfUrl}\n` : ''}\nThank you for your business!`;
  
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Universal WhatsApp Sender:
 * Defaults to Option A (100% Free Direct Protocol) when Meta credentials are not configured or WHATSAPP_MODE=direct.
 */
export async function sendWhatsAppInvoiceReminder(
  params: WhatsAppReminderParams
): Promise<{ success: boolean; data?: any; error?: string; directUrl?: string; mode: 'direct_free' | 'meta_cloud' }> {
  const directUrl = generateDirectWhatsAppUrl(params);
  const isDirectMode = process.env.WHATSAPP_MODE === 'direct' || !process.env.META_PHONE_NUMBER_ID || !process.env.META_WHATSAPP_TOKEN;

  if (isDirectMode) {
    console.log(`[WhatsApp Service - Option A (Free)] Generated 1-Tap Direct WhatsApp Link for Voucher #${params.voucherNumber}`);
    return {
      success: true,
      mode: 'direct_free',
      directUrl,
      data: {
        method: 'direct_protocol_wa_me',
        directUrl,
        note: '100% Free WhatsApp delivery protocol (Option A active)'
      }
    };
  }

  // Meta Cloud API (Option B)
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID!;
  const whatsappToken = process.env.META_WHATSAPP_TOKEN!;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'payment_reminder_v1';
  const cleanPhone = (params.phoneNumber || '919876543210').replace(/\D/g, '');

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.partyName },
            { type: 'text', text: params.voucherNumber },
            { type: 'text', text: `₹${params.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
          ]
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('[WhatsApp Meta API Notice] Falling back to Option A Free link:', data);
      return { success: true, mode: 'direct_free', directUrl, data };
    }

    return { success: true, mode: 'meta_cloud', data, directUrl };
  } catch (err: any) {
    console.warn('[WhatsApp Exception] Falling back to Option A Free link:', err);
    return { success: true, mode: 'direct_free', directUrl };
  }
}
