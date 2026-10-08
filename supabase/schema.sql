-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'maker', 'checker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE voucher_type AS ENUM ('sales_bill', 'quotation', 'credit_note');
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
