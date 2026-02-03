-- Emergency Transport Management System - Migration Script
-- This removes old transport tables and integrates with hospital system
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Remove old foreign key constraint from evacuations table
-- ============================================================================
DO $$ 
BEGIN
  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'evacuations_transport_route_id_fkey'
  ) THEN
    ALTER TABLE public.evacuations 
    DROP CONSTRAINT evacuations_transport_route_id_fkey;
    RAISE NOTICE 'Dropped foreign key constraint: evacuations_transport_route_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop old transport tables (CASCADE to remove dependencies)
-- ============================================================================
DROP TABLE IF EXISTS public.transport_routes CASCADE;
DROP TABLE IF EXISTS public.transport_providers CASCADE;

SELECT '✅ Old transport_routes and transport_providers tables removed' AS message;

-- ============================================================================
-- STEP 3: Modify evacuations table to work with new system
-- ============================================================================
-- We'll keep transport_route_id column but it won't be used anymore
-- The new system uses transport_requests and transport_assignments instead

COMMENT ON COLUMN public.evacuations.transport_route_id IS 
  'DEPRECATED: Now using transport_requests and transport_assignments tables instead';

-- ============================================================================
-- STEP 4: Enable PostGIS extension for geographic queries
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- TABLE 1: transport_companies
-- Replaces old transport_providers with enhanced company management
-- ============================================================================
CREATE TABLE IF NOT EXISTS transport_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  business_registration_number TEXT,
  operating_license TEXT,
  service_coverage_radius_km INTEGER DEFAULT 50,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE transport_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own company"
  ON transport_companies
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE 2: vehicles
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE vehicle_type_enum AS ENUM ('helicopter', 'ambulance', 'boat', 'land_ambulance', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status_enum AS ENUM ('available', 'assigned', 'maintenance', 'offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE equipment_level_enum AS ENUM ('basic', 'advanced', 'icu', 'air_ambulance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES transport_companies(id) ON DELETE CASCADE,
  vehicle_type vehicle_type_enum NOT NULL,
  vehicle_name TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 1,
  medical_equipment_level equipment_level_enum DEFAULT 'basic',
  current_status vehicle_status_enum DEFAULT 'available',
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies manage own vehicles"
  ON vehicles
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE 3: drivers
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE driver_status_enum AS ENUM ('available', 'on_trip', 'off_duty');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES transport_companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry_date DATE NOT NULL,
  certifications JSONB DEFAULT '[]',
  assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  current_status driver_status_enum DEFAULT 'off_duty',
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMPTZ,
  invitation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  token_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_company_status 
  ON drivers(company_id, current_status);
CREATE INDEX IF NOT EXISTS idx_drivers_location 
  ON drivers USING GIST ((ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326)::geography));

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies manage own drivers"
  ON drivers
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Drivers update own status"
  ON drivers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Companies insert drivers"
  ON drivers
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE 4: transport_requests
-- Links to existing evacuations table from hospital system
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE severity_enum AS ENUM ('critical', 'urgent', 'stable', 'non_urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS transport_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evacuation_id UUID REFERENCES public.evacuations(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  patient_id UUID REFERENCES public.patients(id),
  patient_reference_id TEXT NOT NULL,
  severity_level severity_enum NOT NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_latitude DECIMAL(10, 8) NOT NULL,
  destination_longitude DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  required_transport_type vehicle_type_enum NOT NULL,
  required_equipment_level equipment_level_enum DEFAULT 'basic',
  special_requirements TEXT,
  search_radius_km INTEGER DEFAULT 50,
  status request_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON transport_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_evacuation ON transport_requests(evacuation_id);
CREATE INDEX IF NOT EXISTS idx_requests_pickup_location 
  ON transport_requests USING GIST ((ST_SetSRID(ST_MakePoint(pickup_longitude, pickup_latitude), 4326)::geography));

ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read requests"
  ON transport_requests
  FOR SELECT
  USING (true);

CREATE POLICY "System creates requests"
  ON transport_requests
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TABLE 5: driver_notifications
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE notification_status_enum AS ENUM ('sent', 'seen', 'accepted', 'declined', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS driver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES transport_requests(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  notification_status notification_status_enum DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  seen_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  distance_km DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_notifications_driver_status 
  ON driver_notifications(driver_id, notification_status);
CREATE INDEX IF NOT EXISTS idx_notifications_request 
  ON driver_notifications(request_id);

ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers see own notifications"
  ON driver_notifications
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System creates notifications"
  ON driver_notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TABLE 6: transport_assignments
-- Links transport requests to drivers and vehicles
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE assignment_status_enum AS ENUM (
    'accepted', 
    'en_route_pickup', 
    'patient_loaded', 
    'en_route_hospital', 
    'delivered', 
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS transport_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE REFERENCES transport_requests(id) ON DELETE CASCADE,
  evacuation_id UUID REFERENCES public.evacuations(id),
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES transport_companies(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  pickup_started_at TIMESTAMPTZ,
  patient_loaded_at TIMESTAMPTZ,
  delivery_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  current_status assignment_status_enum DEFAULT 'accepted',
  cancellation_reason TEXT,
  driver_notes TEXT,
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_distance_km DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_assignments_driver_status 
  ON transport_assignments(driver_id, current_status);
CREATE INDEX IF NOT EXISTS idx_assignments_company 
  ON transport_assignments(company_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_assignments_evacuation 
  ON transport_assignments(evacuation_id);

ALTER TABLE transport_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read assignments"
  ON transport_assignments
  FOR SELECT
  USING (true);

CREATE POLICY "Drivers update own assignments"
  ON transport_assignments
  FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System creates assignments"
  ON transport_assignments
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_transport_companies_updated_at ON transport_companies;
CREATE TRIGGER update_transport_companies_updated_at 
  BEFORE UPDATE ON transport_companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at 
  BEFORE UPDATE ON vehicles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at 
  BEFORE UPDATE ON drivers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transport_requests_updated_at ON transport_requests;
CREATE TRIGGER update_transport_requests_updated_at 
  BEFORE UPDATE ON transport_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Sync evacuation status with transport assignment
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_evacuation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When transport assignment is completed, update evacuation status
  IF NEW.current_status = 'delivered' AND NEW.evacuation_id IS NOT NULL THEN
    UPDATE public.evacuations 
    SET 
      status = 'completed',
      completion_time = NEW.completed_at
    WHERE id = NEW.evacuation_id;
  END IF;
  
  -- When transport is in progress, update evacuation status
  IF NEW.current_status IN ('en_route_pickup', 'patient_loaded', 'en_route_hospital') 
     AND NEW.evacuation_id IS NOT NULL THEN
    UPDATE public.evacuations 
    SET status = 'in_transit'
    WHERE id = NEW.evacuation_id AND status != 'in_transit';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_evacuation_on_assignment_update ON transport_assignments;
CREATE TRIGGER sync_evacuation_on_assignment_update
  AFTER UPDATE ON transport_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_evacuation_status();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '✅ Emergency Transport Management System integrated successfully!' AS status;
SELECT 'Hospital tables preserved: clinics, patients, evacuations, profiles, vitals_logs' AS preserved;
SELECT 'Old tables removed: transport_providers, transport_routes' AS removed;
SELECT 'New tables created: transport_companies, vehicles, drivers, transport_requests, driver_notifications, transport_assignments' AS created;
SELECT 'Integration: evacuations ↔ transport_requests ↔ transport_assignments' AS integration;
