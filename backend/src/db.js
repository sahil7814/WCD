import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'wcd_portal',
  user: process.env.DB_USER || 'wcd_admin',
  password: process.env.DB_PASSWORD || 'wcd_password'
}

export const pool = new pg.Pool(config)

export const adminPool = new pg.Pool({
  ...config,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_SUPER_PASSWORD || 'wcd_password'
})

export async function initializeDatabase() {
  const roleResult = await adminPool.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [config.user])
  if (!roleResult.rows.length) {
    await adminPool.query(`CREATE ROLE "${config.user}" LOGIN PASSWORD '${config.password}'`)
  }

  const databaseResult = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database])
  if (!databaseResult.rows.length) {
    await adminPool.query(`CREATE DATABASE "${config.database}" OWNER "${config.user}"`)
  }

  await pool.query('SELECT 1')
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'OFFICER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await pool.query(`CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(30) UNIQUE NOT NULL,
    applicant_name VARCHAR(150) NOT NULL,
    guardian_name VARCHAR(150),
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
    bank_name VARCHAR(150),
    account_number VARCHAR(30),
    ifsc_code VARCHAR(11),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)

  const passwordHash = await bcrypt.hash('WCD@123', 10)
  await pool.query(`INSERT INTO users (full_name, email, password_hash, role)
    VALUES ('WCD Administrator', 'admin@wcd.hp.gov.in', $1, 'ADMIN')
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role`, [passwordHash])
}
