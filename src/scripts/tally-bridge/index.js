const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const { createClient } = require('@supabase/supabase-js');
const { jsonToTallyXML } = require('./xml-parser');
const { postToTally } = require('./dispatch');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TALLY_COMPANY = process.env.TALLY_COMPANY_NAME || 'Livekeeping Company';

console.log('\n======================================================');
console.log('🚀 LIVEKEEPING ENTERPRISE - TALLY PRIME SYNC BRIDGE');
console.log('======================================================');
console.log(`Supabase URL : ${SUPABASE_URL || 'Not configured'}`);
console.log(`Target Tally : ${process.env.TALLY_URL || 'http://localhost:9000'}`);
console.log(`Company Name : ${TALLY_COMPANY}`);
console.log('======================================================\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase configuration! Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY) are set in .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } }
});

async function processApprovedVoucher(voucher) {
  console.log(`\n📦 [Tally Sync Triggered] Processing Approved Voucher #${voucher.voucher_number} (ID: ${voucher.id})`);
  console.log(`Party Name   : ${voucher.party_name}`);
  console.log(`Total Amount : ₹${voucher.total_amount}`);

  // 1. Generate XML
  const xmlPayload = jsonToTallyXML(voucher, TALLY_COMPANY);
  console.log('\n--- Generated Tally XML Payload ---');
  console.log(xmlPayload);
  console.log('-----------------------------------\n');

  // 2. Dispatch to local Tally Prime
  const result = await postToTally(xmlPayload, voucher.id, supabase);
  return result;
}

// Subscribe to Supabase Realtime changes
function startRealtimeListener() {
  console.log('⏳ Connecting to Supabase Realtime channel [tally-sync-channel]...');

  const channel = supabase
    .channel('tally-sync-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vouchers'
      },
      async (payload) => {
        console.log(`\n🔔 [Realtime Event]: ${payload.eventType} on table vouchers`);

        const newRecord = payload.new;
        const oldRecord = payload.old;

        // Check if status transitioned to approved, or if newly inserted as approved
        const isNowApproved = newRecord && newRecord.status === 'approved';
        const wasPending = !oldRecord || oldRecord.status === 'pending' || oldRecord.status !== 'approved';
        const notYetSynced = newRecord && !newRecord.synced_to_tally;

        if (isNowApproved && (wasPending || notYetSynced)) {
          console.log(`🎯 Voucher #${newRecord.voucher_number} approved! Triggering Tally XML synchronization...`);
          await processApprovedVoucher(newRecord);
        } else {
          console.log(`ℹ️ Voucher #${newRecord ? newRecord.voucher_number : 'N/A'} (status: ${newRecord ? newRecord.status : 'N/A'}) does not require Tally sync.`);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('🟢 [Tally Sync Bridge] Successfully subscribed to live voucher events!');
        console.log('Listening for Maker-Checker approvals in real time...\n');
      } else {
        console.log(`⚠️ Realtime connection status: ${status}`);
      }
    });

  // Handle graceful exit
  process.on('SIGINT', async () => {
    console.log('\nShutting down Tally Sync Bridge...');
    await supabase.removeChannel(channel);
    process.exit(0);
  });
}

// Check for existing pending-sync approved vouchers on startup
async function checkPendingSyncs() {
  try {
    console.log('🔍 Checking for unsynced approved vouchers on startup...');
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('status', 'approved')
      .or('synced_to_tally.is.null,synced_to_tally.eq.false')
      .limit(5);

    if (data && data.length > 0) {
      console.log(`Found ${data.length} approved voucher(s) awaiting Tally sync.`);
      for (const v of data) {
        await processApprovedVoucher(v);
      }
    } else {
      console.log('No pending unsynced approved vouchers found.');
    }
  } catch (err) {
    console.log('Note: Startup query skipped (table columns or initial connection). Proceeding to Realtime listener.');
  }

  startRealtimeListener();
}

checkPendingSyncs();
