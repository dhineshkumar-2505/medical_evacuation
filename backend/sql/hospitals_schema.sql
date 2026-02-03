-- ============================================================================
-- HOSPITALS TABLE - Land Hospital Portal Schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL, -- Chennai, Kerala, Coimbatore, Puducherry
    city TEXT,
    address TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    facility_type TEXT DEFAULT 'multi_specialty', -- multi_specialty, trauma_center, etc.
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email TEXT,
    status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_region ON public.hospitals(region);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON public.hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_admin ON public.hospitals(admin_id);

-- 3. Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Drop existing policies first to act idempotently
DROP POLICY IF EXISTS "Anyone can view active hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Hospital admins can update own hospital" ON public.hospitals;
DROP POLICY IF EXISTS "Anyone can register a hospital" ON public.hospitals;
DROP POLICY IF EXISTS "Admins can manage all hospitals" ON public.hospitals;

-- All authenticated users can view active hospitals (for clinic referrals)
-- OR their own hospital (for dashboard)
CREATE POLICY "Anyone can view active hospitals"
    ON public.hospitals FOR SELECT
    USING (status = 'active' OR admin_id = auth.uid());

-- Hospital admins can update their own hospital
CREATE POLICY "Hospital admins can update own hospital"
    ON public.hospitals FOR UPDATE
    USING (admin_id = auth.uid());

-- Anyone can insert (registration)
CREATE POLICY "Anyone can register a hospital"
    ON public.hospitals FOR INSERT
    WITH CHECK (true);

-- ADMIN POLICY (Fix for missing pending list)
-- Admins can view and update ALL hospitals
CREATE POLICY "Admins can manage all hospitals"
    ON public.hospitals FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 5. Update evacuations table to link to hospitals
ALTER TABLE public.evacuations ADD COLUMN IF NOT EXISTS target_hospital_id UUID REFERENCES public.hospitals(id);

-- 6. Create region mapping table for clinic -> hospital region
CREATE TABLE IF NOT EXISTS public.region_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    origin_region TEXT NOT NULL UNIQUE, -- Andaman, Lakshadweep, Ooty, Kodaikanal
    target_region TEXT NOT NULL -- Chennai, Kerala, Coimbatore
);

-- 7. Seed region mappings
INSERT INTO public.region_mappings (origin_region, target_region) VALUES
    ('Andaman', 'Chennai'),
    ('Nicobar', 'Chennai'),
    ('Lakshadweep', 'Kerala'),
    ('Ooty', 'Coimbatore'),
    ('Kodaikanal', 'Coimbatore')
ON CONFLICT (origin_region) DO NOTHING;

-- 8. Update profiles role check to include hospital_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'clinic_doctor', 'transport_pilot', 'hospital_admin'));

-- 9. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_hospitals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hospitals_updated_at ON public.hospitals;
CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON public.hospitals
    FOR EACH ROW EXECUTE FUNCTION update_hospitals_updated_at();

-- 10. Success message
SELECT '✅ Hospitals table, policies (including Admin access), and region mappings updated!' AS status;
