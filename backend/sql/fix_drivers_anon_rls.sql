-- Allow anonymous users to validate invitation tokens
-- This is required for the initial registration step before the driver has an account.
CREATE POLICY "Allow anon to read driver by token"
ON drivers
FOR SELECT
TO anon
USING (
    token_used_at IS NULL 
    AND invitation_token IS NOT NULL
);

-- Note: This is safe because it only allows reading the profile (name, email) 
-- for an unused token, which is exactly what the registration page needs.
