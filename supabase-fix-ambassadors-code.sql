-- FIX: Add missing code column to ambassadors table
-- Run this BEFORE Step 3

-- Add code column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ambassadors' AND column_name = 'code'
  ) THEN
    ALTER TABLE ambassadors ADD COLUMN code TEXT;
    ALTER TABLE ambassadors ADD CONSTRAINT ambassadors_code_unique UNIQUE (code);
  END IF;
END $$;

-- Populate code for any existing rows (use substring of md5 of id)
UPDATE ambassadors 
SET code = 'AMB' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 6))
WHERE code IS NULL;

-- Make code NOT NULL after populating
ALTER TABLE ambassadors ALTER COLUMN code SET NOT NULL;

-- Verify it worked
SELECT id, code, email FROM ambassadors LIMIT 5;

SELECT 'ambassadors.code column added and populated!' as status;
