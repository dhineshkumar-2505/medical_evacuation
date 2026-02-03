-- Add operating_location column to transport_companies table
ALTER TABLE transport_companies 
ADD COLUMN IF NOT EXISTS operating_location VARCHAR(50);

-- Add check constraint for valid locations
ALTER TABLE transport_companies
DROP CONSTRAINT IF EXISTS valid_location;

ALTER TABLE transport_companies
ADD CONSTRAINT valid_location 
CHECK (operating_location IN ('Ooty', 'Kodaikanal', 'Andaman & Nicobar', 'Lakshadweep'));

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'transport_companies' 
AND column_name = 'operating_location';
