-- Enable Row Level Security on transport tables
ALTER TABLE transport_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRANSPORT COMPANIES POLICIES
-- ============================================================================

-- Allow authenticated users to read all transport companies (for admin portal)
CREATE POLICY "Allow authenticated users to read all transport companies"
ON transport_companies
FOR SELECT
TO authenticated
USING (true);

-- Allow users to read their own transport company
CREATE POLICY "Allow users to read own transport company"
ON transport_companies
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own transport company (registration)
CREATE POLICY "Allow users to insert own transport company"
ON transport_companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own transport company
CREATE POLICY "Allow users to update own transport company"
ON transport_companies
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VEHICLES POLICIES
-- ============================================================================

-- Allow company owners to manage their vehicles
CREATE POLICY "Allow company to read own vehicles"
ON vehicles
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow company to insert own vehicles"
ON vehicles
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow company to update own vehicles"
ON vehicles
FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow company to delete own vehicles"
ON vehicles
FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- DRIVERS POLICIES
-- ============================================================================

-- Allow company owners to manage their drivers
CREATE POLICY "Allow company to read own drivers"
ON drivers
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
    OR auth.uid() = user_id
);

CREATE POLICY "Allow company to insert own drivers"
ON drivers
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow company to update own drivers"
ON drivers
FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
    OR auth.uid() = user_id
)
WITH CHECK (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
    OR auth.uid() = user_id
);

CREATE POLICY "Allow company to delete own drivers"
ON drivers
FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT id FROM transport_companies WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- TRANSPORT REQUESTS POLICIES
-- ============================================================================

-- Allow clinics and transport companies to read relevant requests
CREATE POLICY "Allow reading transport requests"
ON transport_requests
FOR SELECT
TO authenticated
USING (
    clinic_id IN (SELECT id FROM clinics WHERE admin_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM transport_companies WHERE user_id = auth.uid()
    )
);

-- Allow clinics to create transport requests
CREATE POLICY "Allow clinics to create transport requests"
ON transport_requests
FOR INSERT
TO authenticated
WITH CHECK (
    clinic_id IN (SELECT id FROM clinics WHERE admin_id = auth.uid())
);

-- ============================================================================
-- DRIVER NOTIFICATIONS POLICIES
-- ============================================================================

-- Allow drivers to read their own notifications
CREATE POLICY "Allow drivers to read own notifications"
ON driver_notifications
FOR SELECT
TO authenticated
USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

-- Allow system to insert notifications
CREATE POLICY "Allow inserting driver notifications"
ON driver_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- TRANSPORT ASSIGNMENTS POLICIES
-- ============================================================================

-- Allow drivers and companies to read assignments
CREATE POLICY "Allow reading transport assignments"
ON transport_assignments
FOR SELECT
TO authenticated
USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    OR driver_id IN (
        SELECT d.id FROM drivers d
        JOIN transport_companies tc ON d.company_id = tc.id
        WHERE tc.user_id = auth.uid()
    )
);

-- Allow drivers to update their assignments
CREATE POLICY "Allow drivers to update own assignments"
ON transport_assignments
FOR UPDATE
TO authenticated
USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
)
WITH CHECK (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

-- Allow inserting assignments
CREATE POLICY "Allow inserting transport assignments"
ON transport_assignments
FOR INSERT
TO authenticated
WITH CHECK (true);
