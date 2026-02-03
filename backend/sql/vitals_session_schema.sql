-- Add is_session_closed column to vitals_logs for session management
ALTER TABLE public.vitals_logs 
ADD COLUMN IF NOT EXISTS is_session_closed BOOLEAN DEFAULT FALSE;

-- Create an index to optimize active session queries
CREATE INDEX IF NOT EXISTS idx_vitals_session_closed 
ON public.vitals_logs(patient_id, is_session_closed);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
