export interface WhatsAppReminderParams {
  phoneNumber: string;
  partyName: string;
  amount: number;
  pdfUrl: string;
  voucherNumber: string;
}

export async function sendWhatsAppInvoiceReminder(params: WhatsAppReminderParams): Promise<{ success: boolean; data?: any; error?: string }> {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const whatsappToken = process.env.META_WHATSAPP_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'payment_reminder_v1';

  // Format phone number to clean E.164 without '+' or spaces
  const cleanPhone = params.phoneNumber.replace(/\D/g, '');

  console.log(`[WhatsApp Service] Sending payment reminder for Voucher #${params.voucherNumber} to ${cleanPhone}...`);

  if (!phoneNumberId || !whatsappToken) {
    const warningMsg = `[WhatsApp Service Mock Mode] Meta API credentials missing (META_PHONE_NUMBER_ID or META_WHATSAPP_TOKEN not set). Simulated WhatsApp reminder sent for ${params.voucherNumber} to ${cleanPhone}.`;
    console.warn(warningMsg);
    return {
      success: true,
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: cleanPhone, wa_id: cleanPhone }],
        messages: [{ id: `wamid.mock.${Date.now()}` }],
        note: 'Simulated dispatch. Set Meta API credentials in .env.local to enable live delivery.'
      }
    };
  }

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
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: {
                link: params.pdfUrl,
                filename: `Invoice_${params.voucherNumber.replace(/[\/\\]/g, '_')}.pdf`
              }
            }
          ]
        },
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
      console.error('[WhatsApp Service Error]', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to send WhatsApp message via Meta Cloud API'
      };
    }

    console.log('[WhatsApp Service Success]', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('[WhatsApp Service Exception]', err);
    return { success: false, error: err.message || 'Network exception in Meta WhatsApp API service' };
  }
}
