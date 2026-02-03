-- 🚨 RUN THIS IN SUPABASE SQL EDITOR TO FIX EVERYTHING 🚨

-- 1. Force PostgREST to refresh its schema cache (Fixes PGRST204 errors)
NOTIFY pgrst, 'reload schema';

-- 2. Ensure the 'patients' table exists with all required columns
CREATE TABLE IF NOT EXISTS public.patients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Safely add ALL potential missing columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_id text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS blood_type text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinic_id uuid;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status text DEFAULT 'stable';

-- 4. Grant Permissions (security check)
GRANT ALL ON TABLE public.patients TO postgres;
GRANT ALL ON TABLE public.patients TO service_role;
GRANT ALL ON TABLE public.patients TO authenticated;
GRANT ALL ON TABLE public.patients TO anon;

-- 5. Show the result to confirm columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients';
