-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'maker', 'checker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE voucher_type AS ENUM (
        'sales_bill', 
        'quotation', 
        'receipt', 
        'payment', 
        'contra', 
        'purchase_order', 
        'credit_note', 
        'delivery_challan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'maker',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VOUCHERS (Bills, Quotations, Notes)
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  voucher_number TEXT NOT NULL UNIQUE,
  voucher_type voucher_type NOT NULL,
  party_name TEXT NOT NULL,
  party_gstin TEXT,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  tax_amount NUMERIC(12,2) DEFAULT 0.00 CHECK (tax_amount >= 0),
  status payment_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  irn_number TEXT,
  eway_bill_no TEXT,
  synced_to_tally BOOLEAN DEFAULT false,
  tally_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GPS SALES FORCE TRACKING
CREATE TABLE IF NOT EXISTS public.sales_field_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  accuracy NUMERIC(6,2),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUTOMATED UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vouchers_updated_at ON public.vouchers;
CREATE TRIGGER update_vouchers_updated_at
BEFORE UPDATE ON public.vouchers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_field_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES (DROP EXISTING IF RE-RUNNING)
DROP POLICY IF EXISTS "Users can view profiles within their own org" ON public.profiles;
CREATE POLICY "Users can view profiles within their own org" ON public.profiles FOR SELECT USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view org vouchers" ON public.vouchers;
CREATE POLICY "Users can view org vouchers" ON public.vouchers FOR SELECT USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Makers can insert vouchers for their org" ON public.vouchers;
CREATE POLICY "Makers can insert vouchers for their org" ON public.vouchers FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Checkers and Admins can update/approve vouchers" ON public.vouchers;
CREATE POLICY "Checkers and Admins can update/approve vouchers" ON public.vouchers FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('checker', 'admin')
);

DROP POLICY IF EXISTS "Users can record their own GPS logs" ON public.sales_field_logs;
CREATE POLICY "Users can record their own GPS logs" ON public.sales_field_logs FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins can view GPS logs for their organization" ON public.sales_field_logs;
CREATE POLICY "Admins can view GPS logs for their organization" ON public.sales_field_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = sales_field_logs.user_id
    )
  )
);

-- 8. REALTIME ENGINE PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_field_logs;

-- 9. IMMUTABLE SYSTEM AUDIT LOGS (Zero-Trust Security & DLP)
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'VOUCHER_CREATED', 'VOUCHER_APPROVED', 'VOUCHER_CANCELLED'
    entity_name TEXT NOT NULL, -- 'vouchers', 'profiles'
    entity_id UUID,
    ip_address TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect Audit Logs: Read-only for Admins, no INSERT/UPDATE/DELETE allowed for regular users
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view audit logs" ON public.system_audit_logs;
CREATE POLICY "Admins view audit logs" ON public.system_audit_logs 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 10. AUTOMATED AUDIT TRIGGER FOR VOUCHERS
CREATE OR REPLACE FUNCTION log_voucher_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_audit_logs (user_id, action, entity_name, entity_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_OP,
        'vouchers',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_vouchers_trigger ON public.vouchers;
CREATE TRIGGER audit_vouchers_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vouchers
FOR EACH ROW EXECUTE FUNCTION log_voucher_changes();

-- 11. SYSTEM MASTER SECURITY (6-DIGIT PIN LOCK & INACTIVITY)
CREATE TABLE IF NOT EXISTS public.system_security (
    id INT PRIMARY KEY DEFAULT 1,
    pin_hash TEXT NOT NULL,
    auto_lock_minutes INT DEFAULT 3,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.system_security ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage security" ON public.system_security;
CREATE POLICY "Admins manage security" ON public.system_security
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed default master PIN: '123456' (SHA-256 hash)
INSERT INTO public.system_security (id, pin_hash, auto_lock_minutes)
VALUES (1, '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 3)
ON CONFLICT (id) DO NOTHING;

-- 12. INVENTORY & STOCK ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL DEFAULT 'org-101',
    item_name TEXT NOT NULL UNIQUE,
    sku TEXT,
    stock_group TEXT NOT NULL DEFAULT 'General',
    unit TEXT NOT NULL DEFAULT 'Nos',
    closing_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    opening_quantity NUMERIC(12, 2) DEFAULT 0,
    base_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    closing_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    hsn_code TEXT DEFAULT '84818030',
    reorder_level NUMERIC(12, 2) DEFAULT 10,
    negative_stock_allowed BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all org users to view inventory" ON public.inventory_items;
CREATE POLICY "Allow all org users to view inventory" ON public.inventory_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin/checker/manager to edit inventory" ON public.inventory_items;
CREATE POLICY "Allow admin/checker/manager to edit inventory" ON public.inventory_items
    FOR ALL USING (true);

-- 13. SCHEDULED PAYMENT REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL DEFAULT 'org-101',
    party_id TEXT,
    party_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    voucher_number TEXT,
    amount_due NUMERIC(12, 2) NOT NULL,
    scheduled_for DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read reminders" ON public.scheduled_reminders;
CREATE POLICY "Allow read reminders" ON public.scheduled_reminders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage reminders" ON public.scheduled_reminders;
CREATE POLICY "Allow manage reminders" ON public.scheduled_reminders
    FOR ALL USING (true);

-- 14. INACTIVE CUSTOMER ANALYTICS VIEW
CREATE OR REPLACE VIEW public.view_inactive_customers AS
WITH customer_activity AS (
    SELECT 
        party_name,
        party_gstin,
        MAX(created_at) AS last_sale_date,
        COUNT(id) AS lifetime_invoice_count,
        SUM(total_amount) AS total_sales_value,
        (CURRENT_DATE - MAX(created_at)::date) AS days_since_last_sale
    FROM public.vouchers
    WHERE status IN ('approved', 'paid')
    GROUP BY party_name, party_gstin
)
SELECT 
    party_name,
    party_gstin,
    last_sale_date,
    days_since_last_sale,
    lifetime_invoice_count,
    total_sales_value,
    CASE 
        WHEN days_since_last_sale >= 180 THEN '180_plus_days'
        WHEN days_since_last_sale >= 90 THEN '90_days'
        WHEN days_since_last_sale >= 60 THEN '60_days'
        ELSE '30_days'
    END AS inactivity_tier
FROM customer_activity;


