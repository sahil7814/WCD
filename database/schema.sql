CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE',
  district VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(30) UNIQUE NOT NULL,
  applicant_name VARCHAR(150) NOT NULL,
  guardian_name VARCHAR(150),
  gender VARCHAR(20),
  aadhaar_number VARCHAR(12),
  mobile_number VARCHAR(10),
  email VARCHAR(150),
  district VARCHAR(100) NOT NULL,
  gram_panchayat VARCHAR(100),
  village VARCHAR(150),
  category VARCHAR(30),
  scheme_name VARCHAR(150),
  annual_income NUMERIC(12,2),
  woman_category VARCHAR(100),
  disability_type VARCHAR(100),
  disability_percentage NUMERIC(5,2),
  post_office VARCHAR(100),
  anganwadi_centre VARCHAR(150),
  assembly_constituency VARCHAR(150),
  cdpo_block VARCHAR(150),
  daughters_under18 INTEGER,
  unmarried_daughters18_to45 INTEGER,
  sons_under18 INTEGER,
  unmarried_sons18_to27 INTEGER,
  social_category VARCHAR(50),
  is_bpl VARCHAR(10),
  status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(254);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'EMPLOYEE';

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS category VARCHAR(30),
  ADD COLUMN IF NOT EXISTS scheme_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS woman_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS disability_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS disability_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS post_office VARCHAR(100),
  ADD COLUMN IF NOT EXISTS anganwadi_centre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS assembly_constituency VARCHAR(150),
  ADD COLUMN IF NOT EXISTS cdpo_block VARCHAR(150),
  ADD COLUMN IF NOT EXISTS daughters_under18 INTEGER,
  ADD COLUMN IF NOT EXISTS unmarried_daughters18_to45 INTEGER,
  ADD COLUMN IF NOT EXISTS sons_under18 INTEGER,
  ADD COLUMN IF NOT EXISTS unmarried_sons18_to27 INTEGER,
  ADD COLUMN IF NOT EXISTS social_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_bpl VARCHAR(10);

CREATE TABLE IF NOT EXISTS application_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district VARCHAR(100),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_drafts_district_updated_idx
  ON application_drafts (district, updated_at DESC);
