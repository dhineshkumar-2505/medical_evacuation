-- ======================================================================
-- 🏥 CLINICAL PORTAL - COMPLETE DATABASE FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- ======================================================================

-- 1. Create vitals_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vitals_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Core Vitals
    heart_rate integer,
    spo2 integer,
    blood_pressure text,
    temperature numeric(4,1),
    respiratory_rate integer,
    notes text,
    
    -- Metadata
    recorded_at timestamptz DEFAULT now(),
    recorded_by uuid,
    
    -- Phase 2 Analytics
    sequence_number integer,
    risk_score integer,
    status text DEFAULT 'stable'
);

-- 2. Add ALL potentially missing columns (safe operation)
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS heart_rate integer;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS spo2 integer;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS blood_pressure text;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS temperature numeric(4,1);
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS respiratory_rate integer;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS recorded_at timestamptz DEFAULT now();
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS recorded_by uuid;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS sequence_number integer;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS risk_score integer;
ALTER TABLE public.vitals_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'stable';

-- 3. Permissions (ensure frontend can access)
GRANT ALL ON TABLE public.vitals_logs TO postgres;
GRANT ALL ON TABLE public.vitals_logs TO service_role;
GRANT ALL ON TABLE public.vitals_logs TO authenticated;
GRANT ALL ON TABLE public.vitals_logs TO anon;

-- 4. Force PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- 5. Verify (optional - will show all columns)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vitals_logs'
ORDER BY ordinal_position;
