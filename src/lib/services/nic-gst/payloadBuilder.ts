import { nicConfig } from './config';

export interface SellerProfile {
  gstin: string;
  legalName: string;
  tradeName?: string;
  address: string;
  location: string;
  pincode: number;
  stateCode: string;
}

export const defaultSellerProfile: SellerProfile = {
  gstin: nicConfig.gstin || '24AAACL9999P1Z2',
  legalName: 'Livekeeping Open Enterprises Pvt Ltd',
  tradeName: 'Livekeeping Open',
  address: 'Plot 42, GIDC Electronic Zone, Sector 25',
  location: 'Gandhinagar',
  pincode: 382028,
  stateCode: '24'
};

/**
 * Maps a voucher object into the Indian Government GST INV-01 standard JSON schema.
 */
export function buildInvoicePayload(voucher: any, sellerProfile: SellerProfile = defaultSellerProfile) {
  const dateObj = voucher.created_at ? new Date(voucher.created_at) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const docDate = `${day}/${month}/${year}`;

  const partyGstin = voucher.party_gstin || '24AAACA12341ZV';
  const buyerStateCode = partyGstin.slice(0, 2) || '24';
  const isInterState = buyerStateCode !== sellerProfile.stateCode;

  const totalAmount = parseFloat(voucher.total_amount || 0);
  const taxAmount = parseFloat(voucher.tax_amount || 0);
  const taxableValue = totalAmount - taxAmount;

  // Map Items
  const items = (voucher.items && voucher.items.length > 0) ? voucher.items : [
    {
      item_name: 'Industrial Controller Module',
      hsn_code: '84713010',
      quantity: 1,
      unit_price: taxableValue,
      tax_rate: 18,
      cgst_amount: isInterState ? 0 : taxAmount / 2,
      sgst_amount: isInterState ? 0 : taxAmount / 2,
      igst_amount: isInterState ? taxAmount : 0,
      total_item_amount: totalAmount
    }
  ];

  const itemList = items.map((item: any, idx: number) => {
    const qty = parseFloat(item.quantity || 1);
    const unitPrice = parseFloat(item.unit_price || taxableValue);
    const assAmt = qty * unitPrice;
    const rate = parseFloat(item.tax_rate || 18);

    const cgst = isInterState ? 0 : (assAmt * (rate / 2)) / 100;
    const sgst = isInterState ? 0 : (assAmt * (rate / 2)) / 100;
    const igst = isInterState ? (assAmt * rate) / 100 : 0;
    const totItemVal = assAmt + cgst + sgst + igst;

    return {
      SlNo: String(idx + 1),
      PrdDesc: item.item_name || 'Standard Goods',
      IsServc: 'N',
      HsnCd: item.hsn_code || '84713010',
      Qty: qty,
      Unit: 'NOS',
      UnitPrice: unitPrice,
      TotAmt: assAmt,
      Discount: 0,
      PreTaxVal: 0,
      AssAmt: assAmt,
      GstRt: rate,
      IgstAmt: parseFloat(igst.toFixed(2)),
      CgstAmt: parseFloat(cgst.toFixed(2)),
      SgstAmt: parseFloat(sgst.toFixed(2)),
      CesAmt: 0,
      CesNonAdvlAmt: 0,
      StateCesRt: 0,
      StateCesAmt: 0,
      StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: parseFloat(totItemVal.toFixed(2))
    };
  });

  const totalAssVal = itemList.reduce((sum: number, i: any) => sum + i.AssAmt, 0);
  const totalCgstVal = itemList.reduce((sum: number, i: any) => sum + i.CgstAmt, 0);
  const totalSgstVal = itemList.reduce((sum: number, i: any) => sum + i.SgstAmt, 0);
  const totalIgstVal = itemList.reduce((sum: number, i: any) => sum + i.IgstAmt, 0);
  const totalInvVal = totalAssVal + totalCgstVal + totalSgstVal + totalIgstVal;

  const payload: any = {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: 'B2B',
      RegRev: 'N',
      EcmGstin: null,
      IgstOnIntra: 'N'
    },
    DocDtls: {
      Typ: voucher.voucher_type === 'credit_note' ? 'CRN' : 'INV',
      No: voucher.voucher_number || `INV/${year}/${Date.now()}`,
      Dt: docDate
    },
    SellerDtls: {
      Gstin: sellerProfile.gstin,
      LglNm: sellerProfile.legalName,
      TrdNm: sellerProfile.tradeName || sellerProfile.legalName,
      Addr1: sellerProfile.address,
      Loc: sellerProfile.location,
      Pin: sellerProfile.pincode,
      Stcd: sellerProfile.stateCode
    },
    BuyerDtls: {
      Gstin: partyGstin,
      LglNm: voucher.party_name || 'Acme Industrial Solutions Pvt Ltd',
      TrdNm: voucher.party_name || 'Acme Industrial',
      Pos: buyerStateCode,
      Addr1: voucher.billing_address || 'Plot 42, GIDC Estate, Vatva',
      Loc: 'Ahmedabad',
      Pin: 382445,
      Stcd: buyerStateCode
    },
    ItemList: itemList,
    ValDtls: {
      AssVal: parseFloat(totalAssVal.toFixed(2)),
      CgstVal: parseFloat(totalCgstVal.toFixed(2)),
      SgstVal: parseFloat(totalSgstVal.toFixed(2)),
      IgstVal: parseFloat(totalIgstVal.toFixed(2)),
      CesVal: 0,
      StCesVal: 0,
      Discount: 0,
      OthChrg: 0,
      RndOffAmt: 0,
      TotInvVal: parseFloat(totalInvVal.toFixed(2))
    }
  };

  // If value >= 50,000, attach E-Way Bill Generation details
  if (totalInvVal >= 50000) {
    payload.EwbDtls = {
      TransId: '24AAACT1234T1Z5',
      TransName: 'National Road Logistics',
      TransMode: '1', // Road
      Distance: 120,
      TransDocNo: `LR-${Date.now().toString().slice(-6)}`,
      TransDocDt: docDate,
      VehNo: 'GJ01AB1234',
      VehType: 'R' // Regular
    };
  }

  return payload;
}
