-- 🚨 FIX: Add missing blood_pressure column and create vitals_logs table if missing

-- 1. Ensure vitals_logs table exists (Phase 2 Requirement)
CREATE TABLE IF NOT EXISTS public.vitals_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES patients(id),
    clinic_id uuid REFERENCES clinics(id),
    heart_rate integer,
    spo2 integer,
    bp_sys integer,
    bp_dia integer,
    temperature numeric(4,1),
    resp_rate integer,
    blood_pressure text, -- Legacy field support if needed, or derived
    sequence_number integer,
    risk_score integer,
    status text,
    recorded_at timestamptz DEFAULT now(),
    recorded_by uuid
);

-- 2. Add 'blood_pressure' column if missing (triggered the error)
ALTER TABLE public.vitals_logs 
ADD COLUMN IF NOT EXISTS blood_pressure text;

-- 3. Add Phase 2 specific columns if missing
ALTER TABLE public.vitals_logs 
ADD COLUMN IF NOT EXISTS sequence_number integer;

ALTER TABLE public.vitals_logs 
ADD COLUMN IF NOT EXISTS risk_score integer;

-- 4. Force Reload
NOTIFY pgrst, 'reload schema';
