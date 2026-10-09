import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logSecurityEvent } from '@/lib/services/auditLogger';

// In-memory rate limiting map: ip -> { failedAttempts: number, lockoutUntil: number }
const rateLimitMap = new Map<string, { failedAttempts: number; lockoutUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Default Master PIN is '123456'
const DEFAULT_PIN_HASH = crypto.createHash('sha256').update('123456').digest('hex');

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();

    // 1. Check Rate Limiting
    const attemptRecord = rateLimitMap.get(ip);
    if (attemptRecord && attemptRecord.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((attemptRecord.lockoutUntil - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Security lockout active for ${remainingSeconds} seconds.`,
          lockedOut: true,
          remainingSeconds
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    // 2. Hash incoming PIN
    const incomingHash = crypto.createHash('sha256').update(pin.trim()).digest('hex');

    // 3. Fetch Master PIN from Supabase
    let expectedHash = DEFAULT_PIN_HASH;
    let autoLockMinutes = 3;

    try {
      const { data, error } = await supabaseAdmin
        .from('system_security')
        .select('pin_hash, auto_lock_minutes')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data?.pin_hash) {
        expectedHash = data.pin_hash;
        autoLockMinutes = data.auto_lock_minutes || 3;
      }
    } catch (e) {
      console.warn('[Verify PIN] System security table lookup fallback to default PIN:', e);
    }

    // 4. Constant-Time Hash Comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(incomingHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );

    if (!isValid) {
      // Increment failed attempts
      const currentAttempts = (attemptRecord?.failedAttempts || 0) + 1;
      let lockoutUntil = 0;

      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        lockoutUntil = now + LOCKOUT_MS;
      }

      rateLimitMap.set(ip, { failedAttempts: currentAttempts, lockoutUntil });

      await logSecurityEvent({
        action: 'PIN_AUTH_FAILED',
        entityName: 'security_lock',
        ipAddress: ip,
        newData: { failedAttempts: currentAttempts, lockoutUntil }
      });

      const remaining = MAX_FAILED_ATTEMPTS - currentAttempts;
      return NextResponse.json(
        {
          success: false,
          error: currentAttempts >= MAX_FAILED_ATTEMPTS
            ? 'Account locked for 15 minutes due to multiple failed attempts.'
            : `Incorrect Security PIN. ${remaining} attempt(s) remaining.`,
          remainingAttempts: Math.max(0, remaining),
          lockedOut: currentAttempts >= MAX_FAILED_ATTEMPTS
        },
        { status: 401 }
      );
    }

    // 5. Successful Unlock - Reset rate limit
    rateLimitMap.delete(ip);

    // Create a signed session token
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'master-security-salt';
    const expiresAt = now + autoLockMinutes * 60 * 1000;
    const tokenPayload = `${ip}:${expiresAt}:${autoLockMinutes}`;
    const signature = crypto.createHmac('sha256', secret).update(tokenPayload).digest('hex');
    const signedToken = Buffer.from(JSON.stringify({ payload: tokenPayload, signature, expiresAt })).toString('base64');

    await logSecurityEvent({
      action: 'PIN_AUTH_SUCCESS',
      entityName: 'security_lock',
      ipAddress: ip,
      newData: { autoLockMinutes }
    });

    return NextResponse.json({
      success: true,
      token: signedToken,
      autoLockMinutes,
      message: 'Master Security PIN verified.'
    });
  } catch (err: any) {
    console.error('[Verify PIN Exception]', err);
    return NextResponse.json(
      { success: false, error: 'Internal security authentication error.' },
      { status: 500 }
    );
  }
}
