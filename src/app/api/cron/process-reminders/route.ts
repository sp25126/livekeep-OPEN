import { NextRequest, NextResponse } from 'next/server';
import { processDueReminders } from '@/lib/services/scheduler';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const urlSecret = request.nextUrl.searchParams.get('secret');

    // If CRON_SECRET is configured, enforce authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger.' }, { status: 401 });
    }

    const result = await processDueReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedCount: result.processedCount,
      results: result.results
    });
  } catch (err: any) {
    console.error('[API Cron Reminder Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
