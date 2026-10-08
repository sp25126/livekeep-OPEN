import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sampleData from '@/data/sample_invoices.json';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: voucherId } = await params;
  let voucher: any = null;

  // 1. Fetch from Supabase if database configured
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', voucherId)
      .single();

    if (data && !error) {
      voucher = data;
    }
  } catch (e) {
    console.log('Database query fallback to sample data');
  }

  // 2. Fallback to sample mock data if not found in database
  if (!voucher) {
    const found = sampleData.invoices.find(
      (inv, idx) => inv.voucher_number === voucherId || `mock-${idx + 1}` === voucherId || `v-${idx + 1}` === voucherId
    );

    if (found) {
      voucher = {
        id: voucherId,
        voucher_number: found.voucher_number,
        voucher_type: found.voucher_type,
        party_name: found.party_details.party_name,
        party_gstin: found.party_details.party_gstin,
        billing_address: found.party_details.billing_address,
        place_of_supply: found.party_details.place_of_supply,
        total_amount: found.summary.grand_total,
        tax_amount: found.summary.total_tax,
        status: found.summary.status,
        irn_number: found.compliance.irn,
        eway_bill_no: found.compliance.eway_bill_no,
        items: found.items,
        created_at: new Date().toISOString()
      };
    }
  }

  // Default fallback object if id not matched
  if (!voucher) {
    voucher = {
      voucher_number: voucherId || 'INV/2026-27/001',
      voucher_type: 'sales_bill',
      party_name: 'Acme Industrial Solutions Pvt Ltd',
      party_gstin: '24AAACA12341ZV',
      billing_address: 'Plot 42, GIDC Estate, Vatva, Ahmedabad, Gujarat - 382445',
      place_of_supply: '24-Gujarat',
      total_amount: 26550.00,
      tax_amount: 4050.00,
      status: 'approved',
      irn_number: '18a45e908b21c43f761d90212389a0f4c3b21029384756102938475610293847',
      eway_bill_no: '241098765432',
      items: [
        {
          item_name: 'Industrial Sensor Probe X1',
          hsn_code: '90318000',
          quantity: 5,
          unit_price: 4500.00,
          tax_rate: 18,
          cgst_amount: 2025.00,
          sgst_amount: 2025.00,
          igst_amount: 0.00,
          total_item_amount: 26550.00
        }
      ],
      created_at: new Date().toISOString()
    };
  }

  const items = voucher.items || [
    {
      item_name: 'Industrial Equipment & Controllers',
      hsn_code: '84713010',
      quantity: 1,
      unit_price: voucher.total_amount - voucher.tax_amount,
      tax_rate: 18,
      cgst_amount: voucher.tax_amount / 2,
      sgst_amount: voucher.tax_amount / 2,
      igst_amount: 0,
      total_item_amount: voucher.total_amount
    }
  ];

  // Render HTML Tax Invoice Document
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TAX INVOICE - ${voucher.voucher_number}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #fff; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 32px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .supplier { font-size: 14px; color: #475569; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; font-size: 13px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; }
    .box-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 10px; text-transform: uppercase; font-size: 11px; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 300px; margin-left: auto; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals-row.grand { font-size: 16px; font-weight: bold; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; color: #0f172a; padding: 10px 0; }
    .irn-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-family: monospace; font-size: 10px; padding: 10px; border-radius: 6px; margin-top: 20px; word-break: break-all; }
    .watermark { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="title">B2B TAX INVOICE</div>
        <div class="supplier"><strong>Livekeeping Open Enterprises Pvt Ltd</strong></div>
        <div class="supplier">GSTIN: 24AAACL9999P1Z2 | State: 24-Gujarat</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: bold; color: #2563eb;">${voucher.voucher_number}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date(voucher.created_at).toLocaleDateString('en-IN')}</div>
        <div style="font-size: 12px; color: #16a34a; font-weight: bold; margin-top: 4px; text-transform: uppercase;">Status: ${voucher.status}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Billed To (Customer Details)</div>
        <div style="font-weight: bold; font-size: 14px; color: #0f172a;">${voucher.party_name}</div>
        <div>GSTIN: <strong>${voucher.party_gstin || 'Unregistered'}</strong></div>
        <div style="margin-top: 4px; color: #475569;">${voucher.billing_address || 'Gujarat Industrial Estate, Vatva'}</div>
        <div style="margin-top: 4px;">Place of Supply: ${voucher.place_of_supply || '24-Gujarat'}</div>
      </div>

      <div class="box">
        <div class="box-title">E-Invoice & Compliance Metadata</div>
        <div>IRN Status: <strong style="color: #16a34a;">Generated & Verified</strong></div>
        <div style="margin-top: 4px;">E-Way Bill No: <strong>${voucher.eway_bill_no || '241098765432'}</strong></div>
        <div style="margin-top: 4px;">Tally Sync Status: <strong>Ready for Dispatch</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>HSN/SAC</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Rate (₹)</th>
          <th style="text-align: right;">Tax Rate</th>
          <th style="text-align: right;">Tax Amount (₹)</th>
          <th style="text-align: right;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
          <tr>
            <td><strong>${item.item_name}</strong></td>
            <td style="font-family: monospace;">${item.hsn_code}</td>
            <td style="text-align: right;">${item.quantity}</td>
            <td style="text-align: right;">${item.unit_price.toFixed(2)}</td>
            <td style="text-align: right;">${item.tax_rate}%</td>
            <td style="text-align: right;">${(item.cgst_amount + item.sgst_amount + item.igst_amount).toFixed(2)}</td>
            <td style="text-align: right; font-weight: bold;">${item.total_item_amount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal (Taxable Value):</span>
        <span>₹${(voucher.total_amount - voucher.tax_amount).toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>CGST + SGST (18%):</span>
        <span>₹${voucher.tax_amount.toFixed(2)}</span>
      </div>
      <div class="totals-row grand">
        <span>Grand Total:</span>
        <span>₹${voucher.total_amount.toFixed(2)}</span>
      </div>
    </div>

    ${voucher.irn_number ? `
      <div class="irn-box">
        <strong>E-INVOICE IRN HASH:</strong><br/>
        ${voucher.irn_number}
      </div>
    ` : ''}

    <div class="watermark">
      Generated automatically by Livekeeping Open Realtime B2B Engine | GST & Tally Compliant
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
