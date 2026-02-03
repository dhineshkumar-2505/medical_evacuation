-- ======================================================================
-- QUICK REGION SETUP - NO MANUAL EDITS NEEDED
-- Run this entire script in Supabase SQL Editor
-- ======================================================================

-- 1. Add region column to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS region TEXT;

-- 2. Set default region for all existing clinics (you can change individual ones later)
UPDATE public.clinics 
SET region = 'Andaman' 
WHERE region IS NULL OR region = '';

-- 3. Create region_mappings table
CREATE TABLE IF NOT EXISTS public.region_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    origin_region TEXT NOT NULL UNIQUE,
    target_region TEXT NOT NULL
);

-- 4. Insert ALL region mappings
INSERT INTO public.region_mappings (origin_region, target_region) VALUES
    ('Andaman', 'Chennai'),
    ('Nicobar', 'Chennai'),
    ('Port Blair', 'Chennai'),
    ('Lakshadweep', 'Kerala'),
    ('Kavaratti', 'Kerala'),
    ('Agatti', 'Kerala'),
    ('Minicoy', 'Kerala'),
    ('Ooty', 'Coimbatore'),
    ('Kodaikanal', 'Coimbatore')
ON CONFLICT (origin_region) DO UPDATE 
SET target_region = EXCLUDED.target_region;

-- 5. Verify the setup
SELECT 
    '=== CLINICS ===' AS section,
    name AS item,
    region AS value
FROM public.clinics

UNION ALL

SELECT 
    '=== MAPPINGS ===' AS section,
    origin_region AS item,
    target_region AS value
FROM public.region_mappings
ORDER BY section, item;

-- 6. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ======================================================================
-- ✅ DONE! All clinics now have region = 'Andaman'
-- 
-- To change individual clinic regions later, copy your clinic ID from 
-- the verification output above and run:
-- UPDATE public.clinics SET region = 'Lakshadweep' WHERE id = 'paste-actual-uuid-here';
-- ======================================================================
