/* 
  RUN THIS IN YOUR SUPABASE SQL EDITOR 
  TO ENABLE CLINICAL PORTAL ONBOARDING 
*/

-- 1. Add admin_id to clinics to link them to the registered doctor/admin user
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- 2. Add admin_email to clinics for contact (optional but good for admin view)
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- 3. Update Status Comment
COMMENT ON COLUMN public.clinics.status IS 'pending_approval, active, suspended';
