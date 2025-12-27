-- Migration: Add additional employer profile fields
-- Date: 2025-12-27

-- Thêm các cột mới vào bảng users cho employer
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_industry VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_founded_year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_benefits TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_linkedin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_twitter VARCHAR(255);

-- Update existing employer_fields_check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS employer_fields_check;
ALTER TABLE users ADD CONSTRAINT employer_fields_check CHECK (
    (role = 'employer' AND company_name IS NOT NULL) OR 
    (role = 'candidate') OR 
    (role = 'admin')
);

-- Add comment to table
COMMENT ON COLUMN users.company_address IS 'Physical office address of the company';
COMMENT ON COLUMN users.company_size IS 'Number of employees range (e.g., 1-10, 11-50, etc.)';
COMMENT ON COLUMN users.company_industry IS 'Industry/sector of the company';
COMMENT ON COLUMN users.company_founded_year IS 'Year the company was founded';
COMMENT ON COLUMN users.company_benefits IS 'Array of company benefits/perks';
COMMENT ON COLUMN users.social_linkedin IS 'Company LinkedIn profile URL';
COMMENT ON COLUMN users.social_facebook IS 'Company Facebook page URL';
COMMENT ON COLUMN users.social_twitter IS 'Company Twitter/X profile URL';
