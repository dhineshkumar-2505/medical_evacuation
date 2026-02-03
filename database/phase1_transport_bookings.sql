-- ============================================================================
-- PHASE 1: CLINICAL-TRANSPORT INTEGRATION - DATABASE FOUNDATION
-- ============================================================================
-- Run this in Supabase SQL Editor to create the necessary tables and fields

-- 1. Add risk_score to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100);

COMMENT ON COLUMN public.patients.risk_score IS 'Patient risk score (0-100) for vehicle recommendation. 0-30: Low, 31-60: Moderate, 61-100: High/Critical';

-- 2. Create transport_bookings table
CREATE TABLE IF NOT EXISTS public.transport_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- References
    evacuation_id UUID REFERENCES public.evacuations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.transport_companies(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Patient & Risk Assessment
    patient_risk_score INTEGER CHECK (patient_risk_score >= 0 AND patient_risk_score <= 100),
    recommended_vehicle_type TEXT CHECK (recommended_vehicle_type IN ('helicopter', 'ambulance', 'ship', 'boat')),
    
    -- Booking Details
    booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN (
        'pending',           -- Waiting for provider acceptance
        'confirmed',         -- Provider accepted
        'driver_assigned',   -- Driver assigned to booking
        'in_progress',       -- Transport started
        'completed',         -- Successfully delivered
        'cancelled'          -- Cancelled by clinic or provider
    )),
    
    -- Location Details
    pickup_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    
    -- Timing
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    driver_assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    
    -- Additional Info
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    special_requirements TEXT,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_evacuation ON public.transport_bookings(evacuation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_company ON public.transport_bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON public.transport_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON public.transport_bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON public.transport_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_clinic ON public.transport_bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.transport_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_at ON public.transport_bookings(requested_at DESC);

-- 4. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transport_bookings_updated_at 
    BEFORE UPDATE ON public.transport_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Clinics can view and create their own bookings
CREATE POLICY "Clinics can view their own bookings"
    ON public.transport_bookings
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT id FROM public.clinics WHERE admin_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can create bookings"
    ON public.transport_bookings
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT id FROM public.clinics WHERE admin_id = auth.uid()
        )
    );

CREATE POLICY "Clinics can update their pending bookings"
    ON public.transport_bookings
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT id FROM public.clinics WHERE admin_id = auth.uid()
        )
        AND booking_status = 'pending'
    );

-- Transport providers can view bookings for their company
CREATE POLICY "Providers can view their bookings"
    ON public.transport_bookings
    FOR SELECT
    USING (
        company_id IN (
            SELECT id FROM public.transport_companies WHERE user_id = auth.uid()
        )
    );

-- Transport providers can update bookings assigned to them
CREATE POLICY "Providers can update their bookings"
    ON public.transport_bookings
    FOR UPDATE
    USING (
        company_id IN (
            SELECT id FROM public.transport_companies WHERE user_id = auth.uid()
        )
    );

-- Drivers can view their assigned bookings
CREATE POLICY "Drivers can view their bookings"
    ON public.transport_bookings
    FOR SELECT
    USING (
        driver_id IN (
            SELECT id FROM public.drivers WHERE user_id = auth.uid()
        )
    );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
    ON public.transport_bookings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Enable real-time for transport_bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_bookings;

-- 8. Add comments for documentation
COMMENT ON TABLE public.transport_bookings IS 'Links evacuation requests with transport providers, vehicles, and drivers';
COMMENT ON COLUMN public.transport_bookings.booking_status IS 'pending → confirmed → driver_assigned → in_progress → completed/cancelled';
COMMENT ON COLUMN public.transport_bookings.urgency IS 'Urgency level: low, medium, high, critical';
COMMENT ON COLUMN public.transport_bookings.recommended_vehicle_type IS 'System-recommended vehicle type based on patient risk score';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if risk_score was added to patients
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'risk_score';

-- Check if transport_bookings table was created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'transport_bookings';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transport_bookings';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'transport_bookings';
