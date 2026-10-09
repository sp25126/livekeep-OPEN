import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type SecurityAction = 
  | 'USER_LOGIN'
  | 'USER_CREATED'
  | 'ROLE_ELEVATED'
  | 'PASSWORD_RESET'
  | 'USER_DELETED'
  | 'VOUCHER_CREATED'
  | 'VOUCHER_APPROVED'
  | 'VOUCHER_CANCELLED'
  | 'VOUCHER_PDF_ACCESSED'
  | 'IRN_GENERATED'
  | 'TALLY_SYNC_ATTEMPTED'
  | 'TALLY_SYNC_FAILED'
  | 'PIN_AUTH_FAILED'
  | 'PIN_AUTH_SUCCESS'
  | 'MASTER_PIN_UPDATED';

export interface SecurityEventPayload {
  userId?: string | null;
  action: SecurityAction | string;
  entityName: 'vouchers' | 'profiles' | 'auth' | 'nic_compliance' | 'tally_bridge' | 'system_security' | 'security_lock' | string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
}

/**
 * Enterprise Audit Logging Service
 * Records write-only immutable events to PostgreSQL system_audit_logs
 */
export async function logSecurityEvent({
  userId,
  action,
  entityName,
  entityId,
  ipAddress,
  metadata = {},
  oldData,
  newData
}: SecurityEventPayload): Promise<boolean> {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG] [${timestamp}] action=${action} entity=${entityName}:${entityId || 'N/A'} user=${userId || 'system'}`);

  try {
    // Only attempt Supabase write if URL is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabaseAdmin.from('system_audit_logs').insert([
        {
          user_id: userId || null,
          action,
          entity_name: entityName,
          entity_id: entityId || null,
          ip_address: ipAddress || null,
          old_data: oldData ? JSON.stringify(oldData) : null,
          new_data: newData ? JSON.stringify(newData) : (metadata ? JSON.stringify(metadata) : null),
          created_at: timestamp
        }
      ]);

      if (error) {
        console.warn(`[AUDIT LOG WARN] Could not persist to system_audit_logs table:`, error.message);
        return false;
      }
      return true;
    }
  } catch (err: any) {
    console.warn(`[AUDIT LOG EXCEPTION] Failed to write audit event:`, err?.message || err);
  }

  return true;
}
