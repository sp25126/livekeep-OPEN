const axios = require('axios');

const TALLY_ENDPOINT = process.env.TALLY_URL || 'http://localhost:9000';

/**
 * Dispatches an XML payload to local Tally Prime and updates Supabase sync status.
 * @param {string} xmlString - Formatted Tally Envelope XML
 * @param {string} voucherId - Supabase Voucher ID
 * @param {Object} [supabaseClient] - Optional initialized Supabase client
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
async function postToTally(xmlString, voucherId, supabaseClient) {
  console.log(`[Tally Dispatcher] Sending XML to Tally Prime at ${TALLY_ENDPOINT}...`);

  try {
    const response = await axios.post(TALLY_ENDPOINT, xmlString, {
      headers: {
        'Content-Type': 'text/xml;charset=utf-8',
        'Accept': 'text/xml'
      },
      timeout: 10000
    });

    const responseData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    console.log(`[Tally Prime Response]:\n`, responseData);

    const isCreated = responseData.includes('<CREATED>1</CREATED>') || responseData.includes('<ALTERED>1</ALTERED>') || responseData.includes('"success":true');
    const hasErrors = responseData.includes('<ERRORS>') && !responseData.includes('<ERRORS>0</ERRORS>');

    if (isCreated && !hasErrors) {
      console.log(`✅ [Tally Dispatcher] Voucher ${voucherId} synced successfully to Tally!`);

      if (supabaseClient && voucherId) {
        await supabaseClient
          .from('vouchers')
          .update({
            synced_to_tally: true,
            tally_sync_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', voucherId);
      }

      return { success: true, response: responseData };
    } else {
      const errorMsg = `Tally returned error in envelope: ${responseData.slice(0, 300)}`;
      console.error(`❌ [Tally Dispatcher Error]:`, errorMsg);

      if (supabaseClient && voucherId) {
        await supabaseClient
          .from('vouchers')
          .update({
            synced_to_tally: false,
            tally_sync_error: errorMsg,
            updated_at: new Date().toISOString()
          })
          .eq('id', voucherId);
      }

      return { success: false, error: errorMsg };
    }
  } catch (error) {
    const errDesc = error.code === 'ECONNREFUSED'
      ? `Cannot connect to Tally Prime on ${TALLY_ENDPOINT}. Please verify Tally Prime is running and ODBC/HTTP Server is enabled on port 9000.`
      : error.message;

    console.error(`❌ [Tally Dispatcher Connection Error]: ${errDesc}`);

    if (supabaseClient && voucherId) {
      try {
        await supabaseClient
          .from('vouchers')
          .update({
            synced_to_tally: false,
            tally_sync_error: errDesc,
            updated_at: new Date().toISOString()
          })
          .eq('id', voucherId);
      } catch (dbErr) {
        console.warn('[Tally Dispatcher] Failed to update error status in Supabase:', dbErr.message);
      }
    }

    return { success: false, error: errDesc };
  }
}

module.exports = { postToTally };
