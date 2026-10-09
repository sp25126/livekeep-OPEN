import { NextResponse } from 'next/server';
import http from 'http';

function checkTallyPort(port = 9000, host = '127.0.0.1', timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host,
        port,
        path: '/',
        method: 'GET',
        timeout: timeoutMs,
      },
      () => {
        resolve(true);
      }
    );

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

export async function GET() {
  try {
    const isPortOpen = await checkTallyPort(9000);
    return NextResponse.json({
      connected: isPortOpen,
      port: 9000,
      host: '127.0.0.1',
      endpoint: 'http://localhost:9000',
      message: isPortOpen
        ? 'Tally Prime XML Server is online on port 9000.'
        : 'Tally Prime is offline. Please start Tally Prime and enable XML/ODBC Server.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error?.message || 'Check failed' },
      { status: 200 }
    );
  }
}
