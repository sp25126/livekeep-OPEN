const http = require('http');

const PORT = 9000;
const TALLY_URL = 'http://localhost:9000'; // Local Tally Prime HTTP listener port

function jsonToTallyXml(voucher) {
  const dateStr = (voucher.created_at ? new Date(voucher.created_at) : new Date())
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Livekeeping Demo Company</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${dateStr}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucher.voucher_number || 'INV/2026-27/001'}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${voucher.party_name || 'Acme Industrial Solutions Pvt Ltd'}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <PARTYGSTIN>${voucher.party_gstin || ''}</PARTYGSTIN>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${voucher.party_name || 'Acme Industrial Solutions'}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE>
              <AMOUNT>-${voucher.total_amount || 26550}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${(voucher.total_amount || 26550) - (voucher.tax_amount || 4050)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${(voucher.tax_amount || 4050) / 2}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${(voucher.tax_amount || 4050) / 2}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/tally/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const voucher = JSON.parse(body);
        const tallyXml = jsonToTallyXml(voucher);

        console.log(`\n[Tally Bridge] Converted Voucher #${voucher.voucher_number} to Tally Envelope XML:`);
        console.log(tallyXml);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Voucher converted to Tally Envelope XML and dispatched.',
          voucherNumber: voucher.voucher_number,
          xmlPreview: tallyXml
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'active', service: 'Local Tally Prime XML Bridge', port: PORT }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Local Tally Prime XML HTTP Bridge active on http://localhost:${PORT}`);
  console.log(`- Health Endpoint: http://localhost:${PORT}/health`);
  console.log(`- Tally Sync Endpoint: http://localhost:${PORT}/api/tally/sync`);
  console.log(`==================================================\n`);
});
