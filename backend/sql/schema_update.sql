-- 🚨 Run this SQL in your Supabase SQL Editor to fix the schema error

-- 1. Add missing 'blood_type' column
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS blood_type text CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- 2. Add missing contact columns
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS contact_number text;

ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS emergency_contact text;

-- 3. Verify columns exist (Optional, just for confirmation)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients';
