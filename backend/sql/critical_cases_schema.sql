-- ============================================================================
-- CRITICAL CASES TABLE - Clinical → Hospital Communication Flow
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create Critical Cases Table
CREATE TABLE IF NOT EXISTS public.critical_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    target_hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'shared' CHECK (status IN ('shared', 'acknowledged')),
    acknowledged_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_critical_cases_patient ON public.critical_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_critical_cases_clinic ON public.critical_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_critical_cases_hospital ON public.critical_cases(target_hospital_id);
CREATE INDEX IF NOT EXISTS idx_critical_cases_status ON public.critical_cases(status);

-- 3. Enable RLS
ALTER TABLE public.critical_cases ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Clinics can view their own shared cases" ON public.critical_cases;
DROP POLICY IF EXISTS "Hospitals can view cases shared to them" ON public.critical_cases;
DROP POLICY IF EXISTS "Clinics can create critical cases" ON public.critical_cases;
DROP POLICY IF EXISTS "Hospitals can acknowledge cases" ON public.critical_cases;

-- Clinics can view cases they shared
CREATE POLICY "Clinics can view their own shared cases"
    ON public.critical_cases FOR SELECT
    USING (
        clinic_id IN (SELECT id FROM public.clinics WHERE admin_id = auth.uid())
    );

-- Hospitals can view cases shared to them
CREATE POLICY "Hospitals can view cases shared to them"
    ON public.critical_cases FOR SELECT
    USING (
        target_hospital_id IN (SELECT id FROM public.hospitals WHERE admin_id = auth.uid())
    );

-- Clinics can create critical cases
CREATE POLICY "Clinics can create critical cases"
    ON public.critical_cases FOR INSERT
    WITH CHECK (
        clinic_id IN (SELECT id FROM public.clinics WHERE admin_id = auth.uid())
    );

-- Hospitals can update (acknowledge) cases
CREATE POLICY "Hospitals can acknowledge cases"
    ON public.critical_cases FOR UPDATE
    USING (
        target_hospital_id IN (SELECT id FROM public.hospitals WHERE admin_id = auth.uid())
    );

-- 5. Add is_critical flag to patients table (if not exists)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_patients_critical ON public.patients(is_critical) WHERE is_critical = TRUE;

-- 6. Success message
SELECT '✅ Critical Cases table created with RLS policies!' AS status;
