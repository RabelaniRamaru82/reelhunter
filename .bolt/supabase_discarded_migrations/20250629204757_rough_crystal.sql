/*
  # ReelApps Database Schema Migration

  1. New Tables
    - `job_postings` - Job postings created by recruiters
    - `job_applications` - Applications from candidates to jobs
    - `candidate_experiences` - Work experience records
    - `recruitment_analytics` - Analytics and metrics for recruiters

  2. Security
    - Enable RLS on all new tables
    - Add policies for proper access control based on user roles
    - Recruiters can manage their own job postings and see applications
    - Candidates can apply to jobs and manage their own data

  3. Sample Data
    - Sample recruiter and candidate profiles
    - Sample job postings with realistic data
    - Sample applications and analytics data
*/

-- Create enum types with proper conflict handling
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'screening', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'freelance', 'internship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'principal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  description text NOT NULL,
  requirements text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  location text NOT NULL,
  remote_allowed boolean DEFAULT false,
  employment_type employment_type DEFAULT 'full-time',
  experience_level experience_level DEFAULT 'mid',
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  status job_status DEFAULT 'draft',
  priority text DEFAULT 'medium',
  ai_analysis_score jsonb,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'applied',
  cover_letter text,
  resume_url text,
  ai_match_score integer,
  recruiter_notes text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- Work experience table (using profile_id to match existing schema)
CREATE TABLE IF NOT EXISTS candidate_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  location text,
  created_at timestamptz DEFAULT now()
);

-- AI match results table
CREATE TABLE IF NOT EXISTS ai_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  skills_match integer CHECK (skills_match >= 0 AND skills_match <= 100),
  culture_match integer CHECK (culture_match >= 0 AND culture_match <= 100),
  experience_match integer CHECK (experience_match >= 0 AND experience_match <= 100),
  reasoning text,
  strengths text[] DEFAULT '{}',
  concerns text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- Recruitment analytics table
CREATE TABLE IF NOT EXISTS recruitment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_date date DEFAULT CURRENT_DATE,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies for our new tables
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('job_postings', 'job_applications', 'candidate_experiences', 
                           'ai_match_results', 'recruitment_analytics')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- RLS Policies for new tables

-- Job postings: Recruiters can manage their own job postings, candidates can read active ones
CREATE POLICY "recruiters_manage_own_jobs" ON job_postings
  FOR ALL USING (recruiter_id = auth.uid());

CREATE POLICY "candidates_read_active_jobs" ON job_postings
  FOR SELECT USING (
    status = 'active' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'candidate'
    )
  );

-- Job applications: Candidates can manage their own applications, recruiters can see applications to their jobs
CREATE POLICY "candidates_manage_own_applications" ON job_applications
  FOR ALL USING (candidate_id = auth.uid());

CREATE POLICY "recruiters_see_job_applications" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE id = job_applications.job_id 
      AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "recruiters_update_job_applications" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE id = job_applications.job_id 
      AND recruiter_id = auth.uid()
    )
  );

-- Candidate experiences (using profile_id to match existing schema)
CREATE POLICY "users_manage_own_experiences" ON candidate_experiences
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "recruiters_read_candidate_experiences" ON candidate_experiences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'recruiter'
    )
  );

-- AI match results
CREATE POLICY "recruiters_see_job_match_results" ON ai_match_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_postings 
      WHERE id = ai_match_results.job_id 
      AND recruiter_id = auth.uid()
    )
  );

CREATE POLICY "candidates_see_own_match_results" ON ai_match_results
  FOR SELECT USING (candidate_id = auth.uid());

-- Recruitment analytics
CREATE POLICY "recruiters_manage_own_analytics" ON recruitment_analytics
  FOR ALL USING (recruiter_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_experiences_profile ON candidate_experiences(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_match_results_job ON ai_match_results(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_match_results_candidate ON ai_match_results(candidate_id);

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;

-- Create triggers for updated_at columns
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data with conflict handling

-- Sample recruiter profiles (using existing user_id structure)
INSERT INTO profiles (user_id, first_name, last_name, email, role, headline, location, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'sarah.johnson@techcorp.com', 'recruiter', 'Senior Technical Recruiter at TechCorp', 'San Francisco, CA', now() - interval '30 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Michael', 'Chen', 'michael.chen@innovatelab.com', 'recruiter', 'Head of Talent Acquisition', 'Austin, TX', now() - interval '25 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Emily', 'Rodriguez', 'emily.rodriguez@startupxyz.com', 'recruiter', 'Recruitment Lead', 'Remote', now() - interval '20 days')
ON CONFLICT (user_id) DO NOTHING;

-- Sample candidate profiles
INSERT INTO profiles (user_id, first_name, last_name, email, role, headline, summary, location, availability, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Alex', 'Thompson', 'alex.thompson@email.com', 'candidate', 'Senior Full-Stack Developer', 'Passionate full-stack developer with 6+ years of experience building scalable web applications. Expert in React, Node.js, and cloud technologies.', 'San Francisco, CA', 'available', now() - interval '15 days'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Maria', 'Garcia', 'maria.garcia@email.com', 'candidate', 'Frontend Developer & UI/UX Designer', 'Creative frontend developer with strong design background. Specializes in React, TypeScript, and modern CSS frameworks.', 'Austin, TX', 'open', now() - interval '12 days'),
  ('550e8400-e29b-41d4-a716-446655440012', 'David', 'Kim', 'david.kim@email.com', 'candidate', 'DevOps Engineer', 'DevOps specialist with expertise in AWS, Kubernetes, and CI/CD pipelines. Passionate about automation and infrastructure as code.', 'Seattle, WA', 'available', now() - interval '10 days'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Jessica', 'Brown', 'jessica.brown@email.com', 'candidate', 'Data Scientist', 'Data scientist with machine learning expertise. Experienced in Python, TensorFlow, and statistical analysis.', 'New York, NY', 'open', now() - interval '8 days'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Robert', 'Wilson', 'robert.wilson@email.com', 'candidate', 'Backend Developer', 'Backend specialist focused on scalable APIs and microservices. Expert in Python, Go, and distributed systems.', 'Remote', 'available', now() - interval '5 days')
ON CONFLICT (user_id) DO NOTHING;

-- Get profile IDs for the sample users
DO $$
DECLARE
    recruiter1_profile_id uuid;
    recruiter2_profile_id uuid;
    recruiter3_profile_id uuid;
    candidate1_profile_id uuid;
    candidate2_profile_id uuid;
    candidate3_profile_id uuid;
BEGIN
    -- Get profile IDs
    SELECT id INTO recruiter1_profile_id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
    SELECT id INTO recruiter2_profile_id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440002';
    SELECT id INTO recruiter3_profile_id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440003';
    SELECT id INTO candidate1_profile_id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440010';
    SELECT id INTO candidate2_profile_id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
    SELECT id INTO candidate3_profile_id FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440012';

    -- Sample job postings (only if we have recruiter profiles)
    IF recruiter1_profile_id IS NOT NULL THEN
        INSERT INTO job_postings (id, recruiter_id, title, company, description, requirements, skills, location, remote_allowed, employment_type, experience_level, salary_min, salary_max, status, ai_analysis_score, created_at) VALUES
          ('660e8400-e29b-41d4-a716-446655440001', recruiter1_profile_id, 'Senior React Developer', 'TechCorp Inc.', 'We are looking for a senior React developer to join our growing team and help build the next generation of our platform. You will work on challenging problems and have the opportunity to mentor junior developers.', 
           ARRAY['5+ years React experience', 'TypeScript proficiency', 'Team leadership experience', 'Experience with modern testing frameworks'], 
           ARRAY['React', 'TypeScript', 'Node.js', 'Jest', 'AWS'], 
           'San Francisco, CA', true, 'full-time', 'senior', 120000, 160000, 'active', 
           '{"clarity": 85, "realism": 90, "inclusivity": 80, "overall": 85}', now() - interval '5 days')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    IF recruiter2_profile_id IS NOT NULL THEN
        INSERT INTO job_postings (id, recruiter_id, title, company, description, requirements, skills, location, remote_allowed, employment_type, experience_level, salary_min, salary_max, status, ai_analysis_score, created_at) VALUES
          ('660e8400-e29b-41d4-a716-446655440002', recruiter2_profile_id, 'Full Stack Engineer', 'InnovateLab', 'Join our fast-paced startup as a full-stack engineer. You will work across our entire technology stack and have significant impact on product direction.', 
           ARRAY['3+ years full-stack experience', 'React and Node.js proficiency', 'Database design experience', 'Startup experience preferred'], 
           ARRAY['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'], 
           'Austin, TX', true, 'full-time', 'mid', 90000, 130000, 'active', 
           '{"clarity": 78, "realism": 85, "inclusivity": 88, "overall": 84}', now() - interval '3 days')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    IF recruiter3_profile_id IS NOT NULL THEN
        INSERT INTO job_postings (id, recruiter_id, title, company, description, requirements, skills, location, remote_allowed, employment_type, experience_level, salary_min, salary_max, status, ai_analysis_score, created_at) VALUES
          ('660e8400-e29b-41d4-a716-446655440003', recruiter3_profile_id, 'DevOps Engineer', 'StartupXYZ', 'We need a DevOps engineer to scale our infrastructure and improve our deployment processes. You will work with cutting-edge cloud technologies.', 
           ARRAY['AWS expertise', 'Kubernetes experience', 'CI/CD pipeline setup', 'Infrastructure as Code'], 
           ARRAY['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins'], 
           'Remote', true, 'full-time', 'senior', 110000, 150000, 'active', 
           '{"clarity": 82, "realism": 88, "inclusivity": 75, "overall": 82}', now() - interval '2 days')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Sample work experiences (using profile_id)
    IF candidate1_profile_id IS NOT NULL THEN
        INSERT INTO candidate_experiences (profile_id, company, position, description, start_date, end_date, is_current, location) VALUES
          (candidate1_profile_id, 'TechStart Inc.', 'Senior Full-Stack Developer', 'Led development of core platform features, mentored junior developers, and improved application performance by 50%.', '2021-01-01', null, true, 'San Francisco, CA'),
          (candidate1_profile_id, 'WebSolutions LLC', 'Full-Stack Developer', 'Developed and maintained multiple client applications using React and Node.js.', '2019-06-01', '2020-12-31', false, 'San Francisco, CA')
        ON CONFLICT DO NOTHING;
    END IF;

    IF candidate2_profile_id IS NOT NULL THEN
        INSERT INTO candidate_experiences (profile_id, company, position, description, start_date, end_date, is_current, location) VALUES
          (candidate2_profile_id, 'DesignCorp', 'Frontend Developer', 'Built responsive web applications and collaborated closely with design team to implement pixel-perfect UIs.', '2021-03-01', null, true, 'Austin, TX'),
          (candidate2_profile_id, 'Creative Agency', 'Junior Frontend Developer', 'Developed marketing websites and landing pages for various clients.', '2020-01-01', '2021-02-28', false, 'Austin, TX')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Sample AI match results (only if we have both job postings and candidate profiles)
    IF recruiter1_profile_id IS NOT NULL AND candidate1_profile_id IS NOT NULL THEN
        INSERT INTO ai_match_results (job_id, candidate_id, overall_score, skills_match, culture_match, experience_match, reasoning, strengths, concerns) VALUES
          ('660e8400-e29b-41d4-a716-446655440001', candidate1_profile_id, 92, 95, 88, 93, 
           'Exceptional technical skills alignment with 6+ years React experience. Strong leadership background matches team mentoring requirements. Excellent cultural fit for fast-paced environment.',
           ARRAY['React expertise', 'Team leadership', 'Problem solving', 'System architecture'],
           ARRAY['Limited AWS experience compared to requirements'])
        ON CONFLICT (job_id, candidate_id) DO NOTHING;
    END IF;

    IF recruiter2_profile_id IS NOT NULL AND candidate1_profile_id IS NOT NULL THEN
        INSERT INTO ai_match_results (job_id, candidate_id, overall_score, skills_match, culture_match, experience_match, reasoning, strengths, concerns) VALUES
          ('660e8400-e29b-41d4-a716-446655440002', candidate1_profile_id, 89, 90, 92, 85, 
           'Perfect full-stack experience with strong React and Node.js skills. Excellent cultural fit for startup environment with proven ability to work across the stack.',
           ARRAY['Full-stack capabilities', 'Startup experience', 'Technical leadership'],
           ARRAY['Salary expectations may be above range'])
        ON CONFLICT (job_id, candidate_id) DO NOTHING;
    END IF;

    -- Sample job applications
    IF candidate1_profile_id IS NOT NULL THEN
        INSERT INTO job_applications (job_id, candidate_id, status, cover_letter, ai_match_score, applied_at) VALUES
          ('660e8400-e29b-41d4-a716-446655440001', candidate1_profile_id, 'shortlisted', 
           'I am excited about the opportunity to join TechCorp as a Senior React Developer. With 6+ years of React experience and a passion for mentoring, I believe I would be a great fit for your team.',
           92, now() - interval '2 days'),
          ('660e8400-e29b-41d4-a716-446655440002', candidate1_profile_id, 'interviewed', 
           'The full-stack engineer position at InnovateLab aligns perfectly with my experience and career goals. I am excited about the opportunity to work in a fast-paced startup environment.',
           89, now() - interval '1 day')
        ON CONFLICT (job_id, candidate_id) DO NOTHING;
    END IF;

    IF candidate3_profile_id IS NOT NULL THEN
        INSERT INTO job_applications (job_id, candidate_id, status, cover_letter, ai_match_score, applied_at) VALUES
          ('660e8400-e29b-41d4-a716-446655440003', candidate3_profile_id, 'offered', 
           'I am very interested in the DevOps Engineer position at StartupXYZ. My expertise in AWS, Kubernetes, and infrastructure automation would be valuable for scaling your platform.',
           95, now() - interval '3 days')
        ON CONFLICT (job_id, candidate_id) DO NOTHING;
    END IF;

    -- Sample recruitment analytics
    IF recruiter1_profile_id IS NOT NULL THEN
        INSERT INTO recruitment_analytics (recruiter_id, metric_name, metric_value, metric_date, metadata) VALUES
          (recruiter1_profile_id, 'applications_received', 45, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440001"}'),
          (recruiter1_profile_id, 'candidates_shortlisted', 12, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440001"}'),
          (recruiter1_profile_id, 'time_to_hire', 18, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440001"}'),
          (recruiter1_profile_id, 'match_accuracy', 89, CURRENT_DATE - 1, '{"ai_powered": true}')
        ON CONFLICT DO NOTHING;
    END IF;

    IF recruiter2_profile_id IS NOT NULL THEN
        INSERT INTO recruitment_analytics (recruiter_id, metric_name, metric_value, metric_date, metadata) VALUES
          (recruiter2_profile_id, 'applications_received', 67, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440002"}'),
          (recruiter2_profile_id, 'candidates_shortlisted', 23, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440002"}'),
          (recruiter2_profile_id, 'time_to_hire', 15, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440002"}'),
          (recruiter2_profile_id, 'match_accuracy', 84, CURRENT_DATE - 1, '{"ai_powered": true}')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Update job posting application counts
UPDATE job_postings SET applications_count = (
  SELECT COUNT(*) FROM job_applications WHERE job_id = job_postings.id
);