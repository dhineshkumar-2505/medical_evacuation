-- ======================================================================
-- COMPLETE CRITICAL FEATURES SETUP
-- Run this ONCE in Supabase SQL Editor to set up all required features
-- ======================================================================

-- ============================================
-- 1. CRITICAL_CASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.critical_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    target_hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'shared' CHECK (status IN ('shared', 'acknowledged', 'transferred', 'closed')),
    notes TEXT,
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_critical_cases_hospital ON public.critical_cases(target_hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_critical_cases_clinic ON public.critical_cases(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_critical_cases_patient ON public.critical_cases(patient_id);

-- Enable RLS
ALTER TABLE public.critical_cases ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be tightened later)
DROP POLICY IF EXISTS "Allow all for critical_cases" ON public.critical_cases;
CREATE POLICY "Allow all for critical_cases" ON public.critical_cases FOR ALL USING (true);

-- ============================================
-- 2. PATIENTS TABLE UPDATES
-- ============================================
-- Add is_critical column
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- Add index for critical patient queries
CREATE INDEX IF NOT EXISTS idx_patients_is_critical 
ON public.patients(clinic_id, is_critical) 
WHERE is_critical = TRUE;

-- ============================================
-- 3. VITALS_LOGS TABLE UPDATES
-- ============================================
-- Add is_session_closed column for session management
ALTER TABLE public.vitals_logs 
ADD COLUMN IF NOT EXISTS is_session_closed BOOLEAN DEFAULT FALSE;

-- Add index for active session queries
CREATE INDEX IF NOT EXISTS idx_vitals_session_closed 
ON public.vitals_logs(patient_id, is_session_closed);

-- ============================================
-- 4. NOTIFY POSTGREST TO RELOAD SCHEMA
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION QUERY (optional - run to verify)
-- ============================================
-- SELECT 
--     'critical_cases' as table_name, 
--     (SELECT COUNT(*) FROM critical_cases) as row_count
-- UNION ALL
-- SELECT 
--     'patients.is_critical', 
--     (SELECT COUNT(*) FROM patients WHERE is_critical = TRUE);
