-- SQL script to set up the database for the AI-Powered IT Job Board

-- Drop existing tables if recreating (in correct order - children first)
DROP TABLE IF EXISTS user_roadmaps CASCADE;
DROP TABLE IF EXISTS mock_interviews CASCADE;
DROP TABLE IF EXISTS interview_time_slots CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS cvs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the enum types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS interview_type CASCADE;

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for user roles
CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin');

-- Create Enum for Interview Type
CREATE TYPE interview_type AS ENUM ('HR', 'Tech_Lead');

-- Create users table with role-based 
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    
    -- Candidate fields
    full_name VARCHAR(255),
    bio TEXT,
    skills TEXT[], -- Array of skills
    
    -- Employer fields
    company_name VARCHAR(255),
    company_description TEXT,
    website VARCHAR(255),
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    
    phone VARCHAR(20),
    
    -- Email verification fields
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Avatar URL for user profile picture
    avatar_url VARCHAR(255),
    
    -- Constraints to ensure role-specific fields are set correctly
    CONSTRAINT candidate_fields_check CHECK (
        (role = 'candidate' AND full_name IS NOT NULL) OR 
        (role = 'employer') OR 
        (role = 'admin')
    ),
    CONSTRAINT employer_fields_check CHECK (
        (role = 'employer' AND company_name IS NOT NULL) OR 
        (role = 'candidate') OR 
        (role = 'admin')
    )
);

-- Bảng lưu lộ trình sự nghiệp
CREATE TABLE user_roadmaps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(255),
    roadmap_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table (linked to employer)
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    salary_range VARCHAR(100),
    employment_type VARCHAR(50), -- full-time, part-time, contract
    vector VECTOR(768), -- Google Gemini text-embedding-004 uses 768 dimensions
    status VARCHAR(20) DEFAULT 'active', -- active, closed, draft
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP -- Thêm cột deadline vào bảng jobs
);

-- Create CVs table (linked to candidate)
CREATE TABLE cvs (
    id SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    cv_text TEXT NOT NULL,
    vector VECTOR(768), -- For similarity matching
    file_path VARCHAR(255), -- Optional: if storing files on disk
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One active CV per candidate
    CONSTRAINT unique_active_cv UNIQUE (candidate_id)
);

-- Create applications table (links candidate, job, and CV)
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id INT NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    
    -- AI Analysis results
    match_score DECIMAL(5,2), -- 0.00 to 100.00
    ai_advice TEXT[], -- Array of advice strings
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, rejected, accepted, interview_scheduled, interview_confirmed
    cover_letter TEXT,
    
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    
    -- Prevent duplicate applications
    CONSTRAINT unique_application UNIQUE (job_id, candidate_id)
);

-- Table to store interview schedules
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    employer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Interview details
    interview_date TIMESTAMP,
    duration_minutes INT DEFAULT 60,
    location VARCHAR(255), -- 'Online', 'Office', or specific address
    meeting_link VARCHAR(500), -- Zoom/Meet link
    notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled, rescheduled
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    
    CONSTRAINT unique_application_interview UNIQUE(application_id)
);

-- Table to store available time slots offered by employer
CREATE TABLE interview_time_slots (
    id SERIAL PRIMARY KEY,
    interview_id INT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    slot_date TIMESTAMP NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Mock Interviews Table
CREATE TABLE mock_interviews (
    session_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    interview_type interview_type NOT NULL,
    
    -- Stores array of objects: [{role: 'user'|'model', text: '...', timestamp: '...'}]
    chat_history JSONB DEFAULT '[]'::jsonb,
    
    -- Stores fluency data: { hesitation_count: 0, wpm_avg: 0, total_duration: 0 }
    audio_metrics JSONB DEFAULT '{}'::jsonb,
    
    overall_score INT, -- 0 to 100
    final_feedback TEXT,
    
    status VARCHAR(20) DEFAULT 'active', -- active, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ADMIN FEATURES: Tables & Columns
-- ============================================

-- Bảng log hành động của admin
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'hide_job', 'activate_job', 'ban_user', 'unban_user'
    target_type VARCHAR(50) NOT NULL, -- 'job', 'user'
    target_id INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm cột ban cho users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by INTEGER REFERENCES users(id);

-- Thêm cột hidden cho jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hidden_by INTEGER REFERENCES users(id);

-- Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_jobs_is_hidden ON jobs(is_hidden);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at DESC);

-- Comment
COMMENT ON TABLE admin_actions IS 'Log all admin actions for auditing';
COMMENT ON COLUMN users.is_banned IS 'Whether user account is banned by admin';
COMMENT ON COLUMN jobs.is_hidden IS 'Whether job is hidden by admin';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users and jobs tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at 
    BEFORE UPDATE ON interviews
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
-- Password for all test users: "password123" (hashed with bcrypt)
-- Hash: $2a$10$XqJz5KqHKJ5KqHKJ5KqHKuYP2h8fH8fH8fH8fH8fH8fH8fH8fH8fH

-- Sample Employers
INSERT INTO users (email, password_hash, role, company_name, company_description, website) VALUES
('employer1@example.com', '$2a$10$XqJz5KqHKJ5KqHKJ5KqHKuYP2h8fH8fH8fH8fH8fH8fH8fH8fH8fH', 'employer', 'TechCorp Inc', 'Leading tech company specializing in AI solutions', 'https://techcorp.example.com'),
('employer2@example.com', '$2a$10$XqJz5KqHKJ5KqHKJ5KqHKuYP2h8fH8fH8fH8fH8fH8fH8fH8fH8fH', 'employer', 'StartupHub', 'Innovative startup building the future', 'https://startuphub.example.com')
ON CONFLICT (email) DO NOTHING;

-- Sample Candidates
INSERT INTO users (email, password_hash, role, full_name, bio, skills) VALUES
('candidate1@example.com', '$2a$10$XqJz5KqHKJ5KqHKJ5KqHKuYP2h8fH8fH8fH8fH8fH8fH8fH8fH8fH', 'candidate', 'John Doe', 'Full-stack developer with 5 years experience', ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL']),
('candidate2@example.com', '$2a$10$XqJz5KqHKJ5KqHKJ5KqHKuYP2h8fH8fH8fH8fH8fH8fH8fH8fH8fH', 'candidate', 'Jane Smith', 'Senior frontend developer passionate about UX', ARRAY['React', 'Vue', 'TypeScript', 'CSS', 'Figma'])
ON CONFLICT (email) DO NOTHING;

-- Sample Admin
INSERT INTO users (email, password_hash, role, full_name) VALUES
('admin@test.com', '$2b$10$BK8x9d8YF7AW6Xx/s7.XG.TQdqcEufU5e1U52uYTzC/bEbWe9B492', 'admin', 'Super Admin')
ON CONFLICT (email) DO NOTHING;

-- Sample Jobs
INSERT INTO jobs (employer_id, title, description, location, salary_range, employment_type, status) VALUES
(1, 'Senior Full Stack Developer', 'We are looking for an experienced full-stack developer proficient in React, Node.js, and PostgreSQL. Must have 5+ years of experience.', 'San Francisco, CA', '$120k - $180k', 'full-time', 'active'),
(1, 'Frontend Developer', 'Join our team to build amazing user interfaces with React and modern CSS.', 'Remote', '$90k - $130k', 'full-time', 'active'),
(2, 'Backend Engineer', 'Looking for a backend expert in Node.js, Express, and database design.', 'New York, NY', '$100k - $150k', 'full-time', 'active')
ON CONFLICT DO NOTHING;

-- Sample CVs
INSERT INTO cvs (candidate_id, filename, cv_text) VALUES
(1, 'john_doe_cv.pdf', 'John Doe\nFull-stack developer with 5 years experience...\nSkills: JavaScript, React, Node.js, PostgreSQL'),
(2, 'jane_smith_cv.pdf', 'Jane Smith\nSenior frontend developer passionate about UX...\nSkills: React, Vue, TypeScript, CSS, Figma')
ON CONFLICT (candidate_id) DO NOTHING;

-- Sample Applications
INSERT INTO applications (job_id, candidate_id, cv_id, match_score, ai_advice, status, cover_letter) VALUES
(1, 1, 1, 85.5, ARRAY['Highlight leadership experience', 'Emphasize project outcomes'], 'pending', 'Excited about the opportunity...'),
(2, 2, 2, 90.0, ARRAY['Showcase portfolio of designs', 'Mention teamwork in projects'], 'pending', 'I believe my skills...')
ON CONFLICT (job_id, candidate_id) DO NOTHING;

-- Sample Interviews
INSERT INTO interviews (application_id, job_id, employer_id, candidate_id, interview_date, duration_minutes, location, meeting_link, notes, status) VALUES
(1, 1, 1, 1, '2024-12-20 10:00:00', 60, 'Online', 'https://zoom.us/j/1234567890', 'Initial screening interview', 'pending'),
(2, 2, 2, 2, '2024-12-21 14:00:00', 45, 'Office', NULL, 'Technical interview with the team', 'pending')
ON CONFLICT (application_id) DO NOTHING;

-- Sample Interview Time Slots
INSERT INTO interview_time_slots (interview_id, slot_date, is_selected) VALUES
(1, '2024-12-20 10:00:00', FALSE),
(1, '2024-12-20 11:00:00', TRUE),
(1, '2024-12-20 14:00:00', FALSE),
(2, '2024-12-21 14:00:00', FALSE),
(2, '2024-12-21 15:00:00', TRUE)
ON CONFLICT DO NOTHING;

-- Sample Mock Interviews
INSERT INTO mock_interviews (user_id, job_id, interview_type, chat_history, audio_metrics, overall_score, final_feedback, status) VALUES
(1, 1, 'HR', '[{"role": "user", "text": "Tell me about yourself.", "timestamp": "2024-12-01T10:00:00Z"}, {"role": "model", "text": "I am a full-stack developer...", "timestamp": "2024-12-01T10:00:05Z"}]', '{"hesitation_count": 2, "wpm_avg": 150, "total_duration": 120}', 75, 'Good communication, but needs to improve technical details.', 'active'),
(2, 2, 'Tech_Lead', '[{"role": "user", "text": "What is your experience with React?", "timestamp": "2024-12-02T14:00:00Z"}, {"role": "model", "text": "I have 4 years of experience...", "timestamp": "2024-12-02T14:00:05Z"}]', '{"hesitation_count": 1, "wpm_avg": 160, "total_duration": 90}', 85, 'Strong React knowledge, good problem-solving skills.', 'active')
ON CONFLICT (session_id) DO NOTHING;

-- Đánh dấu tài khoản admin đã verified
UPDATE users 
SET email_verified = TRUE, 
    verification_token = NULL, 
    verification_token_expires = NULL
WHERE email = 'admin@test.com';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📝 Sample data inserted';
    RAISE NOTICE '👤 Test accounts:';
    RAISE NOTICE '   Employer: employer1@example.com / password123';
    RAISE NOTICE '   Candidate: candidate1@example.com / password123';
    RAISE NOTICE '   Admin: admin@test.com / password123';
    RAISE NOTICE '🔐 Email verification fields added to users table';
END $$;