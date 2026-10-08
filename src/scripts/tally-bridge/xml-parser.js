const { create } = require('xmlbuilder2');

/**
 * Converts a Supabase voucher JSON record into a standard Tally XML Import Envelope.
 * @param {Object} voucher - Supabase voucher record
 * @param {string} [companyName='Livekeeping Company'] - Active company in Tally
 * @returns {string} XML string formatted for Tally Prime
 */
function jsonToTallyXML(voucher, companyName = 'Livekeeping Company') {
  const dateObj = voucher.created_at ? new Date(voucher.created_at) : new Date();
  const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');

  const totalAmount = parseFloat(voucher.total_amount || 0);
  const taxAmount = parseFloat(voucher.tax_amount || 0);
  const subtotal = totalAmount - taxAmount;

  const partyName = voucher.party_name || 'Cash';
  const partyGstin = voucher.party_gstin || '';
  const voucherNum = voucher.voucher_number || `INV-${Date.now()}`;
  const voucherType = voucher.voucher_type === 'credit_note' ? 'Credit Note' : 'Sales';

  const placeOfSupply = voucher.place_of_supply || '24-Gujarat';
  const isInterState = placeOfSupply.startsWith('24') === false && partyGstin && !partyGstin.startsWith('24');

  // Build Ledger Entries array
  const ledgerEntries = [
    // 1. Party Ledger Entry (Debit - Negative in Tally)
    {
      LEDGERNAME: partyName,
      ISDEEMEDPOSITIVE: 'YES',
      ISPARTYLEDGER: 'YES',
      AMOUNT: (-totalAmount).toFixed(2)
    },
    // 2. Sales Account Ledger Entry (Credit - Positive in Tally)
    {
      LEDGERNAME: 'Sales Account',
      ISDEEMEDPOSITIVE: 'NO',
      ISPARTYLEDGER: 'NO',
      AMOUNT: subtotal.toFixed(2)
    }
  ];

  // 3. Tax Breakdown Entries (CGST/SGST or IGST)
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
        {
          LEDGERNAME: 'Output CGST',
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'NO',
          AMOUNT: splitTax
        },
        {
          LEDGERNAME: 'Output SGST',
          ISDEEMEDPOSITIVE: 'NO',
          ISPARTYLEDGER: 'NO',
          AMOUNT: splitTax
        }
      );
    }
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
                '@VCHTYPE': voucherType,
                '@ACTION': 'Create',
                '@OBJVIEW': 'Invoice Voucher View',
                DATE: dateStr,
                GUID: voucher.id || `livekeep-${Date.now()}`,
                VOUCHERTYPENAME: voucherType,
                VOUCHERNUMBER: voucherNum,
                PARTYLEDGERNAME: partyName,
                PERSISTEDVIEW: 'Invoice Voucher View',
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

  const doc = create({ version: '1.0', encoding: 'UTF-8' }, envelopeObj);
  return doc.end({ prettyPrint: true });
}

module.exports = { jsonToTallyXML };
