import pg from 'pg'
import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'wcd_portal',
  user: process.env.DB_USER || 'wcd_admin',
  password: process.env.DB_PASSWORD || 'wcd_password'
}

export const pool = new pg.Pool(config)

export async function initializeDatabase() {
  await pool.query('SELECT 1')
  const schema = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8')
  await pool.query(schema)
}
