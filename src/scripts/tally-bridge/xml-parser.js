const { create } = require('xmlbuilder2');

/**
 * Converts a Supabase voucher JSON record into a standard Tally XML Import Envelope.
 * Supports: Sales, Receipt, Payment, Contra, Purchase, Credit Note, Quotation, Delivery Challan.
 * 
 * @param {Object} voucher - Supabase voucher record
 * @param {string} [companyName='Livekeeping Enterprises'] - Active company in Tally
 * @returns {string} XML string formatted for Tally Prime
 */
function jsonToTallyXML(voucher, companyName = 'Livekeeping Enterprises') {
  const dateObj = voucher.created_at ? new Date(voucher.created_at) : new Date();
  const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');

  const totalAmount = parseFloat(voucher.total_amount || 0);
  const taxAmount = parseFloat(voucher.tax_amount || 0);
  const subtotal = Math.max(0, totalAmount - taxAmount);

  const partyName = voucher.party_name || 'Cash';
  const partyGstin = voucher.party_gstin || '';
  const voucherNum = voucher.voucher_number || `VCH-${Date.now()}`;
  const vchTypeRaw = voucher.voucher_type || 'sales_bill';

  const fromAccount = voucher.from_account || 'HDFC Bank Account';
  const toAccount = voucher.to_account || 'Cash in Hand';
  const placeOfSupply = voucher.place_of_supply || '24-Gujarat';
  const isInterState = placeOfSupply.startsWith('24') === false && partyGstin && !partyGstin.startsWith('24');

  let voucherTypeName = 'Sales';
  let ledgerEntries = [];

  switch (vchTypeRaw) {
    case 'receipt':
      voucherTypeName = 'Receipt';
      ledgerEntries = [
        // 1. Bank/Cash Debited (Asset increases)
        {
          LEDGERNAME: fromAccount,
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'NO',
          AMOUNT: (-totalAmount).toFixed(2)
        },
        // 2. Customer Credited
        {
          LEDGERNAME: partyName,
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'YES',
          AMOUNT: totalAmount.toFixed(2)
        }
      ];
      break;

    case 'payment':
      voucherTypeName = 'Payment';
      ledgerEntries = [
        // 1. Vendor/Party Debited
        {
          LEDGERNAME: partyName,
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'YES',
          AMOUNT: (-totalAmount).toFixed(2)
        },
        // 2. Bank/Cash Credited (Asset decreases)
        {
          LEDGERNAME: fromAccount,
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'NO',
          AMOUNT: totalAmount.toFixed(2)
        }
      ];
      break;

    case 'contra':
      voucherTypeName = 'Contra';
      ledgerEntries = [
        // 1. Receiving Bank/Cash Debited
        {
          LEDGERNAME: toAccount,
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'NO',
          AMOUNT: (-totalAmount).toFixed(2)
        },
        // 2. Source Bank/Cash Credited
        {
          LEDGERNAME: fromAccount,
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'NO',
          AMOUNT: totalAmount.toFixed(2)
        }
      ];
      break;

    case 'purchase_order':
    case 'purchase':
      voucherTypeName = 'Purchase';
      ledgerEntries = [
        // 1. Purchase Account Debited
        {
          LEDGERNAME: 'Purchase Account',
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'NO',
          AMOUNT: (-subtotal).toFixed(2)
        }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({
            LEDGERNAME: 'Input IGST',
            ISDEEMEDPOSITIVE: 'YES',
            ISPARTYLEDGER: 'NO',
            AMOUNT: (-taxAmount).toFixed(2)
          });
        } else {
          const splitTax = (taxAmount / 2).toFixed(2);
          ledgerEntries.push(
            { LEDGERNAME: 'Input CGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) },
            { LEDGERNAME: 'Input SGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) }
          );
        }
      }
      // 2. Supplier Credited
      ledgerEntries.push({
        LEDGERNAME: partyName,
        ISDEEMEDPOSITIVE: 'NO',
        ISPARTYLEDGER: 'YES',
        AMOUNT: totalAmount.toFixed(2)
      });
      break;

    case 'credit_note':
      voucherTypeName = 'Credit Note';
      ledgerEntries = [
        // 1. Sales Return Debited
        {
          LEDGERNAME: 'Sales Returns',
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'NO',
          AMOUNT: (-subtotal).toFixed(2)
        }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({
            LEDGERNAME: 'Output IGST',
            ISDEEMEDPOSITIVE: 'YES',
            ISPARTYLEDGER: 'NO',
            AMOUNT: (-taxAmount).toFixed(2)
          });
        } else {
          const splitTax = (taxAmount / 2).toFixed(2);
          ledgerEntries.push(
            { LEDGERNAME: 'Output CGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) },
            { LEDGERNAME: 'Output SGST', ISDEEMEDPOSITIVE: 'YES', ISPARTYLEDGER: 'NO', AMOUNT: (-splitTax).toFixed(2) }
          );
        }
      }
      // 2. Customer Credited
      ledgerEntries.push({
        LEDGERNAME: partyName,
        ISDEEMEDPOSITIVE: 'NO',
        ISPARTYLEDGER: 'YES',
        AMOUNT: totalAmount.toFixed(2)
      });
      break;

    case 'sales_bill':
    default:
      voucherTypeName = 'Sales';
      ledgerEntries = [
        // 1. Customer Debited
        {
          LEDGERNAME: partyName,
          ISDEEMEDPOSITIVE: 'YES',
          ISPARTYLEDGER: 'YES',
          AMOUNT: (-totalAmount).toFixed(2)
        },
        // 2. Sales Account Credited
        {
          LEDGERNAME: 'Sales Account',
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'NO',
          AMOUNT: subtotal.toFixed(2)
        }
      ];
      if (taxAmount > 0) {
        if (isInterState) {
          ledgerEntries.push({
            LEDGERNAME: 'Output IGST',
            ISDEEMEDPOSITIVE: 'NO',
            ISPARTYLEDGER: 'NO',
            AMOUNT: taxAmount.toFixed(2)
          });
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

  // Construct XML using clean Object Representation
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
              VOUCHER: {
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
                'ALLLEDGERENTRIES.LIST': ledgerEntries
              }
            }
          }
        }
      }
    }
  };

  return create(envelopeObj).end({ prettyPrint: true });
}

module.exports = { jsonToTallyXML };
