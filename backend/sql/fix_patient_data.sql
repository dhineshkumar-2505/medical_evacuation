-- ======================================================================
-- FIX PATIENT VISIBILITY
-- Run this in Supabase SQL Editor to link patients to your clinic
-- ======================================================================

DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    -- 1. Get the first available clinic (assuming single-user dev environment)
    SELECT id INTO v_clinic_id FROM clinics LIMIT 1;

    IF v_clinic_id IS NULL THEN
        RAISE NOTICE 'No clinic found. Please register a clinic first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Linking patients to Clinic ID: %', v_clinic_id;

    -- 2. Update existing patients to belong to this clinic
    UPDATE patients 
    SET clinic_id = v_clinic_id 
    WHERE clinic_id IS NULL OR clinic_id != v_clinic_id;

    -- 3. Done
    RAISE NOTICE 'Update complete. Patients should now be visible.';
    
END $$;
