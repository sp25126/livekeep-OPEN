const { create } = require('xmlbuilder2');

/**
 * Converts a Supabase voucher JSON record into a standard Tally XML Import Envelope.
 * Supports all 11 standard Tally Prime voucher classes:
 * - Quotation
 * - Sales (sales_bill)
 * - Receipt
 * - Payment
 * - Sales Order (sales_order)
 * - Purchase
 * - Journal
 * - Contra
 * - Purchase Order (purchase_order)
 * - Credit Note
 * - Debit Note
 * - Delivery Challan (delivery_challan)
 * 
 * @param {Object} voucher - Supabase voucher record
 * @param {string} [companyName='Company'] - Active company in Tally
 * @returns {string} XML string formatted for Tally Prime
 */
function jsonToTallyXML(voucher, companyName = 'Company') {
  const dateObj = voucher.created_at || voucher.voucher_date ? new Date(voucher.created_at || voucher.voucher_date) : new Date();
  const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');

  const totalAmount = parseFloat(voucher.total_amount || 0);
  const taxAmount = parseFloat(voucher.tax_amount || 0);
  const subtotal = Math.max(0, totalAmount - taxAmount);

  const partyName = voucher.party_name || 'Cash';
  const partyGstin = voucher.party_gstin || '';
  const voucherNum = voucher.voucher_number || `VCH-${Date.now()}`;
  const vchTypeRaw = voucher.voucher_type || 'sales_bill';

  const fromAccount = voucher.from_account || 'Bank Account';
  const toAccount = voucher.to_account || 'Cash Account';
  const placeOfSupply = voucher.place_of_supply || '24-Gujarat';
  const isInterState = placeOfSupply.startsWith('24') === false && partyGstin && !partyGstin.startsWith('24');

  let voucherTypeName = 'Sales';
  let ledgerEntries = [];
  let orderList = undefined;
  let originatingInvoiceNo = voucher.original_invoice_no;
  let originatingInvoiceDate = voucher.original_invoice_date ? voucher.original_invoice_date.replace(/-/g, '') : undefined;

  switch (vchTypeRaw) {
    case 'quotation':
      voucherTypeName = 'Quotation';
      ledgerEntries = [
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'YES', AMOUNT: (-totalAmount).toFixed(2) },
        { LEDGERNAME: 'Sales Account', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: subtotal.toFixed(2) }
      ];
      break;

    case 'sales_order':
      voucherTypeName = 'Sales Order';
      orderList = {
        ORDERNAME: voucher.order_number || voucherNum,
        DUEDATE: voucher.expected_delivery_date ? voucher.expected_delivery_date.replace(/-/g, '') : dateStr
      };
      ledgerEntries = [
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'YES', AMOUNT: (-totalAmount).toFixed(2) },
        { LEDGERNAME: 'Sales Account', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: subtotal.toFixed(2) }
      ];
      break;

    case 'purchase_order':
      voucherTypeName = 'Purchase Order';
      orderList = {
        ORDERNAME: voucher.order_number || voucherNum,
        DUEDATE: voucher.expected_delivery_date ? voucher.expected_delivery_date.replace(/-/g, '') : dateStr
      };
      ledgerEntries = [
        { LEDGERNAME: 'Purchase Account', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-subtotal).toFixed(2) },
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'YES', AMOUNT: totalAmount.toFixed(2) }
      ];
      break;

    case 'journal':
      voucherTypeName = 'Journal';
      if (Array.isArray(voucher.debit_ledgers) && voucher.debit_ledgers.length > 0) {
        voucher.debit_ledgers.forEach(d => {
          ledgerEntries.push({
            LEDGERNAME: d.ledger_name,
            ISDEEMEDPOSITIVE: 'YES',
            ISPARTYLEDGER: 'NO',
            AMOUNT: (-parseFloat(d.amount || 0)).toFixed(2)
          });
        });
      } else {
        ledgerEntries.push({
          LEDGERNAME: 'General Adjustment A/c',
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'NO',
          AMOUNT: (-totalAmount).toFixed(2)
        });
      }

      if (Array.isArray(voucher.credit_ledgers) && voucher.credit_ledgers.length > 0) {
        voucher.credit_ledgers.forEach(c => {
          ledgerEntries.push({
            LEDGERNAME: c.ledger_name,
            ISDEEMEDPOSITIVE: 'NO',
            ISPARTYLEDGER: 'NO',
            AMOUNT: parseFloat(c.amount || 0).toFixed(2)
          });
        });
      } else {
        ledgerEntries.push({
          LEDGERNAME: partyName,
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'YES',
          AMOUNT: totalAmount.toFixed(2)
        });
      }
      break;

    case 'contra':
      voucherTypeName = 'Contra';
      ledgerEntries = [
        // Receiving Bank/Cash Debited
        { LEDGERNAME: toAccount, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-totalAmount).toFixed(2) },
        // Source Bank/Cash Credited
        { LEDGERNAME: fromAccount, ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: totalAmount.toFixed(2) }
      ];
      break;

    case 'receipt':
      voucherTypeName = 'Receipt';
      ledgerEntries = [
        // Bank/Cash Debited
        { LEDGERNAME: toAccount || fromAccount, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-totalAmount).toFixed(2) },
        // Customer Credited
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'YES', AMOUNT: totalAmount.toFixed(2) }
      ];
      break;

    case 'payment':
      voucherTypeName = 'Payment';
      ledgerEntries = [
        // Vendor/Party Debited
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'YES', AMOUNT: (-totalAmount).toFixed(2) },
        // Bank/Cash Credited
        { LEDGERNAME: fromAccount, ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: totalAmount.toFixed(2) }
      ];
      break;

    case 'purchase':
      voucherTypeName = 'Purchase';
      ledgerEntries = [
        { LEDGERNAME: 'Purchase Account', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-subtotal).toFixed(2) }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({ LEDGERNAME: 'Input IGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-taxAmount).toFixed(2) });
        } else {
          const splitTax = (taxAmount / 2).toFixed(2);
          ledgerEntries.push(
            { LEDGERNAME: 'Input CGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) },
            { LEDGERNAME: 'Input SGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) }
          );
        }
      }
      ledgerEntries.push({ LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'YES', AMOUNT: totalAmount.toFixed(2) });
      break;

    case 'credit_note':
      voucherTypeName = 'Credit Note';
      ledgerEntries = [
        { LEDGERNAME: 'Sales Returns', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-subtotal).toFixed(2) }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({ LEDGERNAME: 'Output IGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-taxAmount).toFixed(2) });
        } else {
          const splitTax = (taxAmount / 2).toFixed(2);
          ledgerEntries.push(
            { LEDGERNAME: 'Output CGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) },
            { LEDGERNAME: 'Output SGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) }
          );
        }
      }
      ledgerEntries.push({ LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'YES', AMOUNT: totalAmount.toFixed(2) });
      break;

    case 'debit_note':
      voucherTypeName = 'Debit Note';
      ledgerEntries = [
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'YES', AMOUNT: (-totalAmount).toFixed(2) },
        { LEDGERNAME: 'Purchase Returns', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: subtotal.toFixed(2) }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({ LEDGERNAME: 'Input IGST', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: taxAmount.toFixed(2) });
        } else {
          const splitTax = (taxAmount / 2).toFixed(2);
          ledgerEntries.push(
            { LEDGERNAME: 'Input CGST', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: splitTax },
            { LEDGERNAME: 'Input SGST', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: splitTax }
          );
        }
      }
      break;

    case 'delivery_challan':
      voucherTypeName = 'Delivery Note';
      ledgerEntries = [
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'YES', AMOUNT: (-totalAmount).toFixed(2) },
        { LEDGERNAME: 'Sales Account', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: totalAmount.toFixed(2) }
      ];
      break;

    case 'sales_bill':
    default:
      voucherTypeName = 'Sales';
      ledgerEntries = [
        { LEDGERNAME: partyName, ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'YES', AMOUNT: (-totalAmount).toFixed(2) },
        { LEDGERNAME: 'Sales Account', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: subtotal.toFixed(2) }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({ LEDGERNAME: 'Output IGST', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: taxAmount.toFixed(2) });
        } else {
          const splitTax = (taxAmount / 2).toFixed(2);
          ledgerEntries.push(
            { LEDGERNAME: 'Output CGST', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: splitTax },
            { LEDGERNAME: 'Output SGST', ISDEEMEDPOSITIVE: 'NO', ISPARTYLEDGER: 'NO', AMOUNT: splitTax }
          );
        }
      }
      break;
  }

  // Construct XML Payload Object
  const voucherNode = {
    '@VCHTYPE': voucherTypeName,
    '@ACTION': 'Create',
    '@OBJVIEW': 'Accounting Voucher View',
    DATE: dateStr,
    GUID: voucher.id || `livekeep-${Date.now()}`,
    VOUCHERTYPENAME: voucherTypeName,
    VOUCHERNUMBER: voucherNum,
    PARTYLEDGERNAME: partyName,
    PERSISTEDVIEW: 'Accounting Voucher View',
    PARTYGSTIN: partyGstin,
    PLACEOFSUPPLY: placeOfSupply,
    NARRATION: voucher.narration || undefined,
    ORIGINATINGINVOICENO: originatingInvoiceNo || undefined,
    ORIGINATINGINVOICEDATE: originatingInvoiceDate || undefined,
    'ALLORDERLIST.LIST': orderList,
    'ALLLEDGERENTRIES.LIST': ledgerEntries
  };

  const envelopeObj = {
    ENVELOPE: {
      HEADER: {
        TALLYREQUEST: 'Import Data'
      },
      BODY: {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: 'Vouchers',
            STATICVARIABLES: {
              SVCURRENTCOMPANY: companyName
            }
          },
          REQUESTDATA: {
            TALLYMESSAGE: {
              '@xmlns:UDF': 'TallyUDF',
              VOUCHER: voucherNode
            }
          }
        }
      }
    }
  };

  return create(envelopeObj).end({ prettyPrint: true });
}

module.exports = { jsonToTallyXML };
