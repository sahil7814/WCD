CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'OFFICER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number VARCHAR(30) UNIQUE NOT NULL,
  applicant_name VARCHAR(150) NOT NULL,
  guardian_name VARCHAR(150),
  date_of_birth DATE,
  gender VARCHAR(20),
  aadhaar_number VARCHAR(12),
  mobile_number VARCHAR(10),
  email VARCHAR(150),
  district VARCHAR(100) NOT NULL,
  block VARCHAR(100),
  gram_panchayat VARCHAR(100),
  village VARCHAR(150),
  address TEXT,
  pincode VARCHAR(6),
  category VARCHAR(30),
  scheme_name VARCHAR(150),
  annual_income NUMERIC(12,2),
  bank_name VARCHAR(150),
  account_number VARCHAR(30),
  ifsc_code VARCHAR(11),
  status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  remarks TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
