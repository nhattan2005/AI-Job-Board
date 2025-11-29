-- SQL script to set up the database for the AI-Powered IT Job Board

-- Drop existing tables if recreating
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS cvs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ENUM for user roles
CREATE TYPE user_role AS ENUM ('candidate', 'employer');

-- Create users table with role-based fields
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
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints to ensure role-specific fields are set correctly
    CONSTRAINT candidate_fields_check CHECK (
        (role = 'candidate' AND full_name IS NOT NULL) OR 
        (role = 'employer')
    ),
    CONSTRAINT employer_fields_check CHECK (
        (role = 'employer' AND company_name IS NOT NULL) OR 
        (role = 'candidate')
    )
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CVs table (linked to candidate)
CREATE TABLE cvs (
    id SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    cv_text TEXT NOT NULL,
    vector VECTOR(768), -- For similarity matching
    file_path VARCHAR(500), -- Optional: if storing files on disk
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
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, rejected, accepted
    cover_letter TEXT,
    
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    
    -- Prevent duplicate applications
    CONSTRAINT unique_application UNIQUE (job_id, candidate_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_cvs_candidate ON cvs(candidate_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users and jobs tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
-- Password for all test users: "password123" (hashed with bcrypt)
-- Hash generated with: bcrypt.hashSync('password123', 10)

-- Sample Employers
INSERT INTO users (email, password_hash, role, company_name, company_description, website) VALUES
('employer1@example.com', '$2b$10$rZ7qKY5Z5Z5Z5Z5Z5Z5Z5u', 'employer', 'TechCorp Inc', 'Leading tech company specializing in AI solutions', 'https://techcorp.example.com'),
('employer2@example.com', '$2b$10$rZ7qKY5Z5Z5Z5Z5Z5Z5Z5u', 'employer', 'StartupHub', 'Innovative startup building the future', 'https://startuphub.example.com');

-- Sample Candidates
INSERT INTO users (email, password_hash, role, full_name, bio, skills) VALUES
('candidate1@example.com', '$2b$10$rZ7qKY5Z5Z5Z5Z5Z5Z5Z5u', 'candidate', 'John Doe', 'Full-stack developer with 5 years experience', ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL']),
('candidate2@example.com', '$2b$10$rZ7qKY5Z5Z5Z5Z5Z5Z5Z5u', 'candidate', 'Jane Smith', 'Senior frontend developer passionate about UX', ARRAY['React', 'Vue', 'TypeScript', 'CSS', 'Figma']);

-- Sample Jobs
INSERT INTO jobs (employer_id, title, description, location, salary_range, employment_type, status) VALUES
(1, 'Senior Full Stack Developer', 'We are looking for an experienced full-stack developer proficient in React, Node.js, and PostgreSQL. Must have 5+ years of experience.', 'San Francisco, CA', '$120k - $180k', 'full-time', 'active'),
(1, 'Frontend Developer', 'Join our team to build amazing user interfaces with React and modern CSS.', 'Remote', '$90k - $130k', 'full-time', 'active'),
(2, 'Backend Engineer', 'Looking for a backend expert in Node.js, Express, and database design.', 'New York, NY', '$100k - $150k', 'full-time', 'active');