-- ======================================================================
-- ADD is_critical COLUMN TO PATIENTS TABLE
-- Run this in Supabase SQL Editor
-- ======================================================================

-- Add is_critical column if it doesn't exist
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on critical patients
CREATE INDEX IF NOT EXISTS idx_patients_is_critical 
ON public.patients(clinic_id, is_critical) 
WHERE is_critical = TRUE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
