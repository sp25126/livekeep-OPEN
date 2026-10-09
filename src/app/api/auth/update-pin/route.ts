import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logSecurityEvent } from '@/lib/services/auditLogger';

const DEFAULT_PIN_HASH = crypto.createHash('sha256').update('123456').digest('hex');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPin, newPin, autoLockMinutes = 3 } = body;

    if (!newPin || typeof newPin !== 'string' || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json(
        { success: false, error: 'New PIN must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    if (!currentPin || typeof currentPin !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Current PIN is required to authorize changes.' },
        { status: 400 }
      );
    }

    // 1. Fetch existing PIN hash
    let expectedHash = DEFAULT_PIN_HASH;
    try {
      const { data } = await supabaseAdmin
        .from('system_security')
        .select('pin_hash')
        .eq('id', 1)
        .maybeSingle();

      if (data?.pin_hash) {
        expectedHash = data.pin_hash;
      }
    } catch (e) {
      console.warn('[Update PIN] Table lookup fallback:', e);
    }

    // 2. Validate current PIN
    const incomingCurrentHash = crypto.createHash('sha256').update(currentPin.trim()).digest('hex');
    const isCurrentValid = crypto.timingSafeEqual(
      Buffer.from(incomingCurrentHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Current PIN is incorrect.' },
        { status: 401 }
      );
    }

    // 3. Hash new PIN and update table
    const newPinHash = crypto.createHash('sha256').update(newPin.trim()).digest('hex');
    const safeAutoLock = Math.max(1, Math.min(60, Number(autoLockMinutes) || 3));

    const { error: upsertError } = await supabaseAdmin
      .from('system_security')
      .upsert({
        id: 1,
        pin_hash: newPinHash,
        auto_lock_minutes: safeAutoLock,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('[Update PIN Error]', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to persist new PIN in database.' },
        { status: 500 }
      );
    }

    await logSecurityEvent({
      action: 'MASTER_PIN_UPDATED',
      entityName: 'system_security',
      newData: { auto_lock_minutes: safeAutoLock }
    });

    return NextResponse.json({
      success: true,
      message: 'Master Security PIN updated successfully.',
      autoLockMinutes: safeAutoLock
    });
  } catch (err: any) {
    console.error('[Update PIN Exception]', err);
    return NextResponse.json(
      { success: false, error: 'Internal error updating PIN.' },
      { status: 500 }
    );
  }
}
