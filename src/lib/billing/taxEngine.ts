/**
 * Automated Tax Calculation & GST Billing Engine
 * Standardized for Indian Goods and Services Tax (GST) Compliance
 */

export interface InvoiceLineItem {
  itemName?: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // Percentage e.g. 18 for 18%
}

export interface ItemTaxBreakdown {
  itemName?: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface TaxCalculationResult {
  subtotal: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  isInterState: boolean;
  sellerStateCode: string;
  buyerStateCode: string;
  itemBreakdowns: ItemTaxBreakdown[];
}

/**
 * Normalizes state code to 2-digit string
 */
export function normalizeStateCode(codeOrGstin?: string): string {
  if (!codeOrGstin) return '24'; // Default to Gujarat (24)
  const cleaned = codeOrGstin.trim();
  // If GSTIN (15 chars) extract first 2 digits
  if (cleaned.length >= 2) {
    const prefix = cleaned.substring(0, 2);
    if (/^\d{2}$/.test(prefix)) {
      return prefix;
    }
  }
  return '24';
}

/**
 * Precision round to 2 decimal places (Banker's round safe)
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates line-item and overall invoice taxes based on GST rules
 * 
 * Rules:
 * - Intra-State (sellerStateCode === buyerStateCode): CGST (50%) + SGST (50%), IGST = 0
 * - Inter-State (sellerStateCode !== buyerStateCode): IGST (100%), CGST = 0, SGST = 0
 */
export function calculateInvoiceTaxes(
  items: InvoiceLineItem[],
  sellerStateCode: string = '24',
  buyerStateCode: string = '24'
): TaxCalculationResult {
  const normSeller = normalizeStateCode(sellerStateCode);
  const normBuyer = normalizeStateCode(buyerStateCode);
  const isInterState = normSeller !== normBuyer;

  let totalTaxable = 0;
  let totalTaxAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const itemBreakdowns: ItemTaxBreakdown[] = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const rate = Number(item.taxRate) || 0;

    const taxableAmount = round2(qty * price);
    const itemTax = round2((taxableAmount * rate) / 100);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = itemTax;
    } else {
      cgst = round2(itemTax / 2);
      sgst = round2(itemTax - cgst); // Ensure sum matches exact itemTax
    }

    const totalAmount = round2(taxableAmount + itemTax);

    totalTaxable += taxableAmount;
    totalTaxAmount += itemTax;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    return {
      itemName: item.itemName,
      hsnCode: item.hsnCode || '9983',
      quantity: qty,
      unitPrice: price,
      taxableAmount,
      taxRate: rate,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount
    };
  });

  const subtotal = round2(totalTaxable);
  const grandTotal = round2(subtotal + totalTaxAmount);

  return {
    subtotal,
    totalTax: round2(totalTaxAmount),
    cgst: round2(totalCgst),
    sgst: round2(totalSgst),
    igst: round2(totalIgst),
    grandTotal,
    isInterState,
    sellerStateCode: normSeller,
    buyerStateCode: normBuyer,
    itemBreakdowns
  };
}
