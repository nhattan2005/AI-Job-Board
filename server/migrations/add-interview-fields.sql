-- Add new columns to interviews table for interview details
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Online',
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
