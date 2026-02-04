-- Add UNIQUE constraint to admin_id to allow upsert by admin_id
ALTER TABLE public.hospitals 
ADD CONSTRAINT hospitals_admin_id_unique UNIQUE (admin_id);
