-- 1. Fix Hospital Portal resubmission
-- Add UNIQUE constraint to admin_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_admin_id_unique') THEN
        ALTER TABLE public.hospitals ADD CONSTRAINT hospitals_admin_id_unique UNIQUE (admin_id);
    END IF;
END $$;

-- 2. Fix Clinical Portal resubmission
-- Add admin_id column if it somehow missing (it should be there as used in code)
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Add UNIQUE constraint to admin_id for clinics
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinics_admin_id_unique') THEN
        ALTER TABLE public.clinics ADD CONSTRAINT clinics_admin_id_unique UNIQUE (admin_id);
    END IF;
END $$;
