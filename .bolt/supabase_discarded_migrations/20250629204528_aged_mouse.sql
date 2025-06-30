/*
  # Complete ReelApps Database Schema Migration

  1. Database Schema
    - Creates all necessary tables for the recruitment platform
    - Implements proper relationships and constraints
    - Sets up enum types for consistent data

  2. Security
    - Enables Row Level Security (RLS) on all tables
    - Creates comprehensive security policies
    - Ensures data isolation between users

  3. Sample Data
    - Adds realistic sample data for testing
    - Includes recruiters, candidates, jobs, and applications
    - Provides AI match results and analytics data

  4. Performance
    - Creates indexes for efficient queries
    - Sets up triggers for automatic timestamp updates
*/

-- Create enum types with proper conflict handling
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

DO $$ BEGIN
    CREATE TYPE skill_proficiency AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text UNIQUE,
  role user_role NOT NULL DEFAULT 'candidate',
  headline text DEFAULT '',
  summary text DEFAULT '',
  location text DEFAULT '',
  availability text DEFAULT 'open',
  avatar_url text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  phone text,
  years_experience integer DEFAULT 0,
  salary_expectation_min integer,
  salary_expectation_max integer,
  salary_currency text DEFAULT 'USD',
  remote_preference boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Candidate skills table
CREATE TABLE IF NOT EXISTS candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency skill_proficiency DEFAULT 'intermediate',
  years_experience integer DEFAULT 0,
  verified boolean DEFAULT false,
  endorsements_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Candidate projects table
CREATE TABLE IF NOT EXISTS candidate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  technologies text[] DEFAULT '{}',
  role text,
  start_date date,
  end_date date,
  impact text,
  github_url text,
  live_url text,
  image_urls text[] DEFAULT '{}',
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Work experience table
CREATE TABLE IF NOT EXISTS candidate_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Persona analysis table
CREATE TABLE IF NOT EXISTS persona_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emotional_intelligence jsonb,
  work_style jsonb,
  cultural_fit jsonb,
  communication_style text,
  strengths text[] DEFAULT '{}',
  growth_areas text[] DEFAULT '{}',
  ideal_environment text,
  assessment_date timestamptz DEFAULT now(),
  UNIQUE(candidate_id)
);

-- Reviews and recommendations table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_role text,
  relationship text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text NOT NULL,
  skills_highlighted text[] DEFAULT '{}',
  verified boolean DEFAULT false,
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

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies for our tables
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'job_postings', 'job_applications', 'candidate_skills', 
                           'candidate_projects', 'candidate_experiences', 'persona_analyses', 
                           'reviews', 'ai_match_results', 'recruitment_analytics')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- RLS Policies

-- Profiles: Users can read their own profile, recruiters can read candidate profiles
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "recruiters_read_candidate_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles recruiter_profile 
      WHERE recruiter_profile.id = auth.uid() 
      AND recruiter_profile.role = 'recruiter'
    )
    AND role = 'candidate'
  );

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

-- Candidate skills: Users can manage their own skills, recruiters can read candidate skills
CREATE POLICY "users_manage_own_skills" ON candidate_skills
  FOR ALL USING (candidate_id = auth.uid());

CREATE POLICY "recruiters_read_candidate_skills" ON candidate_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'recruiter'
    )
  );

-- Candidate projects: Users can manage their own projects, recruiters can read candidate projects
CREATE POLICY "users_manage_own_projects" ON candidate_projects
  FOR ALL USING (candidate_id = auth.uid());

CREATE POLICY "recruiters_read_candidate_projects" ON candidate_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'recruiter'
    )
  );

-- Candidate experiences
CREATE POLICY "users_manage_own_experiences" ON candidate_experiences
  FOR ALL USING (candidate_id = auth.uid());

CREATE POLICY "recruiters_read_candidate_experiences" ON candidate_experiences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'recruiter'
    )
  );

-- Persona analyses
CREATE POLICY "users_manage_own_persona" ON persona_analyses
  FOR ALL USING (candidate_id = auth.uid());

CREATE POLICY "recruiters_read_persona_analyses" ON persona_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'recruiter'
    )
  );

-- Reviews
CREATE POLICY "users_manage_own_reviews" ON reviews
  FOR ALL USING (candidate_id = auth.uid());

CREATE POLICY "recruiters_read_reviews" ON reviews
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
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_projects_candidate ON candidate_projects(candidate_id);
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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data with conflict handling

-- Sample recruiter profiles
INSERT INTO profiles (id, first_name, last_name, email, role, headline, location, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'sarah.johnson@techcorp.com', 'recruiter', 'Senior Technical Recruiter at TechCorp', 'San Francisco, CA', now() - interval '30 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Michael', 'Chen', 'michael.chen@innovatelab.com', 'recruiter', 'Head of Talent Acquisition', 'Austin, TX', now() - interval '25 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Emily', 'Rodriguez', 'emily.rodriguez@startupxyz.com', 'recruiter', 'Recruitment Lead', 'Remote', now() - interval '20 days')
ON CONFLICT (id) DO NOTHING;

-- Sample candidate profiles
INSERT INTO profiles (id, first_name, last_name, email, role, headline, summary, location, availability, years_experience, salary_expectation_min, salary_expectation_max, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Alex', 'Thompson', 'alex.thompson@email.com', 'candidate', 'Senior Full-Stack Developer', 'Passionate full-stack developer with 6+ years of experience building scalable web applications. Expert in React, Node.js, and cloud technologies.', 'San Francisco, CA', 'available', 6, 120000, 160000, now() - interval '15 days'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Maria', 'Garcia', 'maria.garcia@email.com', 'candidate', 'Frontend Developer & UI/UX Designer', 'Creative frontend developer with strong design background. Specializes in React, TypeScript, and modern CSS frameworks.', 'Austin, TX', 'open', 4, 90000, 130000, now() - interval '12 days'),
  ('550e8400-e29b-41d4-a716-446655440012', 'David', 'Kim', 'david.kim@email.com', 'candidate', 'DevOps Engineer', 'DevOps specialist with expertise in AWS, Kubernetes, and CI/CD pipelines. Passionate about automation and infrastructure as code.', 'Seattle, WA', 'available', 5, 110000, 150000, now() - interval '10 days'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Jessica', 'Brown', 'jessica.brown@email.com', 'candidate', 'Data Scientist', 'Data scientist with machine learning expertise. Experienced in Python, TensorFlow, and statistical analysis.', 'New York, NY', 'open', 3, 100000, 140000, now() - interval '8 days'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Robert', 'Wilson', 'robert.wilson@email.com', 'candidate', 'Backend Developer', 'Backend specialist focused on scalable APIs and microservices. Expert in Python, Go, and distributed systems.', 'Remote', 'available', 7, 130000, 170000, now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- Sample job postings
INSERT INTO job_postings (id, recruiter_id, title, company, description, requirements, skills, location, remote_allowed, employment_type, experience_level, salary_min, salary_max, status, ai_analysis_score, created_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Senior React Developer', 'TechCorp Inc.', 'We are looking for a senior React developer to join our growing team and help build the next generation of our platform. You will work on challenging problems and have the opportunity to mentor junior developers.', 
   ARRAY['5+ years React experience', 'TypeScript proficiency', 'Team leadership experience', 'Experience with modern testing frameworks'], 
   ARRAY['React', 'TypeScript', 'Node.js', 'Jest', 'AWS'], 
   'San Francisco, CA', true, 'full-time', 'senior', 120000, 160000, 'active', 
   '{"clarity": 85, "realism": 90, "inclusivity": 80, "overall": 85}', now() - interval '5 days'),
   
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Full Stack Engineer', 'InnovateLab', 'Join our fast-paced startup as a full-stack engineer. You will work across our entire technology stack and have significant impact on product direction.', 
   ARRAY['3+ years full-stack experience', 'React and Node.js proficiency', 'Database design experience', 'Startup experience preferred'], 
   ARRAY['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'], 
   'Austin, TX', true, 'full-time', 'mid', 90000, 130000, 'active', 
   '{"clarity": 78, "realism": 85, "inclusivity": 88, "overall": 84}', now() - interval '3 days'),
   
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'DevOps Engineer', 'StartupXYZ', 'We need a DevOps engineer to scale our infrastructure and improve our deployment processes. You will work with cutting-edge cloud technologies.', 
   ARRAY['AWS expertise', 'Kubernetes experience', 'CI/CD pipeline setup', 'Infrastructure as Code'], 
   ARRAY['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins'], 
   'Remote', true, 'full-time', 'senior', 110000, 150000, 'active', 
   '{"clarity": 82, "realism": 88, "inclusivity": 75, "overall": 82}', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- Sample candidate skills
INSERT INTO candidate_skills (candidate_id, skill_name, proficiency, years_experience, verified, endorsements_count) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'React', 'expert', 6, true, 15),
  ('550e8400-e29b-41d4-a716-446655440010', 'TypeScript', 'advanced', 4, true, 12),
  ('550e8400-e29b-41d4-a716-446655440010', 'Node.js', 'expert', 5, true, 10),
  ('550e8400-e29b-41d4-a716-446655440010', 'AWS', 'advanced', 3, false, 8),
  ('550e8400-e29b-41d4-a716-446655440010', 'PostgreSQL', 'advanced', 4, true, 6),
  
  ('550e8400-e29b-41d4-a716-446655440011', 'React', 'advanced', 4, true, 8),
  ('550e8400-e29b-41d4-a716-446655440011', 'TypeScript', 'advanced', 3, true, 7),
  ('550e8400-e29b-41d4-a716-446655440011', 'CSS', 'expert', 4, true, 12),
  ('550e8400-e29b-41d4-a716-446655440011', 'Figma', 'expert', 3, true, 9),
  ('550e8400-e29b-41d4-a716-446655440011', 'UI/UX Design', 'expert', 4, true, 11),
  
  ('550e8400-e29b-41d4-a716-446655440012', 'AWS', 'expert', 5, true, 14),
  ('550e8400-e29b-41d4-a716-446655440012', 'Kubernetes', 'expert', 4, true, 10),
  ('550e8400-e29b-41d4-a716-446655440012', 'Docker', 'expert', 5, true, 13),
  ('550e8400-e29b-41d4-a716-446655440012', 'Terraform', 'advanced', 3, true, 8),
  ('550e8400-e29b-41d4-a716-446655440012', 'Jenkins', 'advanced', 4, false, 6),
  
  ('550e8400-e29b-41d4-a716-446655440013', 'Python', 'expert', 3, true, 9),
  ('550e8400-e29b-41d4-a716-446655440013', 'TensorFlow', 'advanced', 2, true, 7),
  ('550e8400-e29b-41d4-a716-446655440013', 'Pandas', 'expert', 3, true, 8),
  ('550e8400-e29b-41d4-a716-446655440013', 'SQL', 'advanced', 3, true, 6),
  ('550e8400-e29b-41d4-a716-446655440013', 'Machine Learning', 'advanced', 2, false, 5),
  
  ('550e8400-e29b-41d4-a716-446655440014', 'Python', 'expert', 7, true, 16),
  ('550e8400-e29b-41d4-a716-446655440014', 'Go', 'advanced', 4, true, 9),
  ('550e8400-e29b-41d4-a716-446655440014', 'PostgreSQL', 'expert', 6, true, 12),
  ('550e8400-e29b-41d4-a716-446655440014', 'Redis', 'advanced', 5, true, 8),
  ('550e8400-e29b-41d4-a716-446655440014', 'Microservices', 'expert', 5, true, 10)
ON CONFLICT DO NOTHING;

-- Sample candidate projects
INSERT INTO candidate_projects (candidate_id, title, description, technologies, role, start_date, end_date, github_url, live_url, featured) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'E-commerce Platform', 'Built a full-stack e-commerce platform with React frontend and Node.js backend. Implemented payment processing, inventory management, and admin dashboard.', 
   ARRAY['React', 'Node.js', 'PostgreSQL', 'Stripe', 'AWS'], 'Lead Developer', '2023-01-01', '2023-06-30', 'https://github.com/alexthompson/ecommerce', 'https://ecommerce-demo.com', true),
   
  ('550e8400-e29b-41d4-a716-446655440011', 'Design System Library', 'Created a comprehensive design system and component library used across multiple products. Improved development efficiency by 40%.', 
   ARRAY['React', 'TypeScript', 'Storybook', 'Figma'], 'UI/UX Lead', '2023-03-01', '2023-09-30', 'https://github.com/mariagarcia/design-system', 'https://design-system-demo.com', true),
   
  ('550e8400-e29b-41d4-a716-446655440012', 'Kubernetes Cluster Management', 'Designed and implemented a multi-environment Kubernetes cluster with automated CI/CD pipelines. Reduced deployment time by 70%.', 
   ARRAY['Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'AWS'], 'DevOps Engineer', '2023-02-01', '2023-08-31', 'https://github.com/davidkim/k8s-cluster', null, true)
ON CONFLICT DO NOTHING;

-- Sample work experiences
INSERT INTO candidate_experiences (candidate_id, company, position, description, start_date, end_date, is_current, location) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'TechStart Inc.', 'Senior Full-Stack Developer', 'Led development of core platform features, mentored junior developers, and improved application performance by 50%.', '2021-01-01', null, true, 'San Francisco, CA'),
  ('550e8400-e29b-41d4-a716-446655440010', 'WebSolutions LLC', 'Full-Stack Developer', 'Developed and maintained multiple client applications using React and Node.js.', '2019-06-01', '2020-12-31', false, 'San Francisco, CA'),
  
  ('550e8400-e29b-41d4-a716-446655440011', 'DesignCorp', 'Frontend Developer', 'Built responsive web applications and collaborated closely with design team to implement pixel-perfect UIs.', '2021-03-01', null, true, 'Austin, TX'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Creative Agency', 'Junior Frontend Developer', 'Developed marketing websites and landing pages for various clients.', '2020-01-01', '2021-02-28', false, 'Austin, TX')
ON CONFLICT DO NOTHING;

-- Sample persona analyses
INSERT INTO persona_analyses (candidate_id, emotional_intelligence, work_style, cultural_fit, communication_style, strengths, growth_areas, ideal_environment) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 
   '{"self_awareness": 85, "empathy": 78, "social_skills": 82, "motivation": 90}',
   '{"collaboration": 88, "independence": 75, "leadership": 85, "adaptability": 80}',
   '{"innovation": 90, "structure": 70, "growth": 95, "impact": 85}',
   'Direct and collaborative communicator who values clear feedback and open dialogue',
   ARRAY['Technical leadership', 'Problem solving', 'Mentoring', 'System architecture'],
   ARRAY['Public speaking', 'Delegation', 'Strategic planning'],
   'Fast-paced environment with opportunities for technical growth and leadership'),
   
  ('550e8400-e29b-41d4-a716-446655440011', 
   '{"self_awareness": 90, "empathy": 95, "social_skills": 88, "motivation": 85}',
   '{"collaboration": 95, "independence": 80, "leadership": 75, "adaptability": 90}',
   '{"innovation": 95, "structure": 75, "growth": 90, "impact": 88}',
   'Empathetic and creative communicator who excels in cross-functional collaboration',
   ARRAY['User experience design', 'Cross-functional collaboration', 'Creative problem solving'],
   ARRAY['Backend development', 'Data analysis', 'Project management'],
   'Creative environment with strong design culture and user-focused mission')
ON CONFLICT (candidate_id) DO NOTHING;

-- Sample reviews
INSERT INTO reviews (candidate_id, reviewer_name, reviewer_role, relationship, rating, feedback, skills_highlighted, verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Sarah Mitchell', 'Engineering Manager', 'manager', 5, 'Alex is an exceptional developer and natural leader. Their technical skills are outstanding, and they have a gift for mentoring junior team members.', 
   ARRAY['React', 'Leadership', 'Mentoring'], true),
   
  ('550e8400-e29b-41d4-a716-446655440011', 'John Davis', 'Product Manager', 'colleague', 5, 'Maria brings incredible creativity and attention to detail to every project. Her ability to translate user needs into beautiful, functional interfaces is remarkable.', 
   ARRAY['UI/UX Design', 'User Research', 'Frontend Development'], true),
   
  ('550e8400-e29b-41d4-a716-446655440012', 'Lisa Chen', 'CTO', 'manager', 5, 'David transformed our infrastructure and deployment processes. His expertise in cloud technologies and automation saved us countless hours and significantly improved our reliability.', 
   ARRAY['AWS', 'Kubernetes', 'Automation'], true)
ON CONFLICT DO NOTHING;

-- Sample AI match results
INSERT INTO ai_match_results (job_id, candidate_id, overall_score, skills_match, culture_match, experience_match, reasoning, strengths, concerns) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 92, 95, 88, 93, 
   'Exceptional technical skills alignment with 6+ years React experience. Strong leadership background matches team mentoring requirements. Excellent cultural fit for fast-paced environment.',
   ARRAY['React expertise', 'Team leadership', 'Problem solving', 'System architecture'],
   ARRAY['Limited AWS experience compared to requirements']),
   
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 78, 82, 85, 68, 
   'Strong React and TypeScript skills with excellent design background. Good cultural fit but experience level slightly below senior requirements.',
   ARRAY['Frontend expertise', 'Design skills', 'User focus'],
   ARRAY['Limited backend experience', 'Junior-level experience for senior role']),
   
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 89, 90, 92, 85, 
   'Perfect full-stack experience with strong React and Node.js skills. Excellent cultural fit for startup environment with proven ability to work across the stack.',
   ARRAY['Full-stack capabilities', 'Startup experience', 'Technical leadership'],
   ARRAY['Salary expectations may be above range']),
   
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 95, 98, 90, 95, 
   'Perfect match for DevOps role with expert-level AWS and Kubernetes skills. Strong experience with infrastructure automation and CI/CD pipelines.',
   ARRAY['AWS expertise', 'Kubernetes mastery', 'Infrastructure automation', 'CI/CD experience'],
   ARRAY['Remote work preference may require coordination'])
ON CONFLICT (job_id, candidate_id) DO NOTHING;

-- Sample job applications
INSERT INTO job_applications (job_id, candidate_id, status, cover_letter, ai_match_score, applied_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'shortlisted', 
   'I am excited about the opportunity to join TechCorp as a Senior React Developer. With 6+ years of React experience and a passion for mentoring, I believe I would be a great fit for your team.',
   92, now() - interval '2 days'),
   
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'interviewed', 
   'The full-stack engineer position at InnovateLab aligns perfectly with my experience and career goals. I am excited about the opportunity to work in a fast-paced startup environment.',
   89, now() - interval '1 day'),
   
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'offered', 
   'I am very interested in the DevOps Engineer position at StartupXYZ. My expertise in AWS, Kubernetes, and infrastructure automation would be valuable for scaling your platform.',
   95, now() - interval '3 days')
ON CONFLICT (job_id, candidate_id) DO NOTHING;

-- Sample recruitment analytics
INSERT INTO recruitment_analytics (recruiter_id, metric_name, metric_value, metric_date, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'applications_received', 45, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440001"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'candidates_shortlisted', 12, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440001"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'time_to_hire', 18, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440001"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'match_accuracy', 89, CURRENT_DATE - 1, '{"ai_powered": true}'),
  
  ('550e8400-e29b-41d4-a716-446655440002', 'applications_received', 67, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440002"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'candidates_shortlisted', 23, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440002"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'time_to_hire', 15, CURRENT_DATE - 1, '{"job_id": "660e8400-e29b-41d4-a716-446655440002"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'match_accuracy', 84, CURRENT_DATE - 1, '{"ai_powered": true}')
ON CONFLICT DO NOTHING;

-- Update job posting application counts
UPDATE job_postings SET applications_count = (
  SELECT COUNT(*) FROM job_applications WHERE job_id = job_postings.id
);