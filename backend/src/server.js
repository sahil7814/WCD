import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { pool, initializeDatabase } from './db.js'
import {
  insertApplication,
  validateApplication
} from './modules/applications/applicationService.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const app = express()
const districts = [
  'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu',
  'Lahaul & Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'
]
const womanCategories = [
  'Pregnant Woman', 'Lactating Mother', 'Widow', 'Divorced Woman',
  'Unmarried Woman', 'Single Woman', 'Other'
]
const disabilityTypes = [
  'No Disability', 'Visual Disability', 'Hearing Disability',
  'Speech and Language Disability', 'Locomotor Disability',
  'Intellectual Disability', 'Multiple Disabilities', 'Other'
]
const socialCategories = ['General', 'Scheduled Caste', 'Scheduled Tribe', 'Other Backward Class']
const disabilityPercentageFilters = {
  zero: 'disability_percentage = 0',
  '1-25': 'disability_percentage > 0 AND disability_percentage <= 25',
  '26-50': 'disability_percentage > 25 AND disability_percentage <= 50',
  '51-75': 'disability_percentage > 50 AND disability_percentage <= 75',
  '76-100': 'disability_percentage > 75 AND disability_percentage <= 100',
  unspecified: 'disability_percentage IS NULL'
}

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication required' })

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET || 'development-secret')
    const result = await pool.query(
      'SELECT id, email, full_name, role, district FROM users WHERE id = $1',
      [claims.id]
    )
    if (!result.rows[0]) return res.status(401).json({ message: 'Account no longer exists' })
    req.user = result.rows[0]
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired session' })
    }
    console.error('Authentication lookup failed:', error.message)
    res.status(503).json({ message: 'Unable to verify account; check the database connection' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Administrator access required' })
  }
  next()
}

const employeeOnly = (req, res, next) => {
  if (req.user.role === 'ADMIN') {
    return res.status(403).json({ message: 'Administrators cannot access application forms' })
  }
  next()
}

function getDistrictForUser(user, requestedDistrict) {
  if (user.role === 'ADMIN') {
    return districts.includes(requestedDistrict) ? requestedDistrict : null
  }
  if (!user.district || (requestedDistrict && requestedDistrict !== user.district)) {
    return null
  }
  return user.district
}

function requireDistrict(user, res) {
  if (user.role !== 'ADMIN' && !user.district) {
    res.status(403).json({ message: 'Ask an administrator to assign your district' })
    return false
  }
  return true
}

function buildApplicationFilter(user, filters, firstParameter = 1) {
  const conditions = []
  const values = []
  const addCondition = (build, value) => {
    values.push(value)
    conditions.push(build(`$${firstParameter + values.length - 1}`))
  }

  const district = user.role === 'ADMIN' ? filters.district : user.district
  if (district) addCondition(parameter => `district = ${parameter}`, district)
  if (filters.status) addCondition(parameter => `status = ${parameter}`, filters.status)
  if (filters.womanCategory) addCondition(parameter => `woman_category = ${parameter}`, filters.womanCategory)
  if (filters.disabilityType) addCondition(parameter => `disability_type = ${parameter}`, filters.disabilityType)
  if (filters.socialCategory) addCondition(parameter => `social_category = ${parameter}`, filters.socialCategory)
  if (filters.isBpl) addCondition(parameter => `is_bpl = ${parameter}`, filters.isBpl)
  if (filters.disabilityPercentage) conditions.push(disabilityPercentageFilters[filters.disabilityPercentage])
  if (filters.search) {
    addCondition(
      parameter => `(application_number ILIKE ${parameter}
        OR applicant_name ILIKE ${parameter}
        OR mobile_number ILIKE ${parameter}
        OR village ILIKE ${parameter})`,
      `%${filters.search}%`
    )
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  }
}

async function getDistrictApplicationReport(filter, selectedDistrict) {
  const unclassified = 'Unclassified / Verify district'
  const reportDistricts = selectedDistrict
    ? [selectedDistrict]
    : [...districts, unclassified]
  const result = await pool.query(
    `WITH aggregated AS (
       SELECT
         CASE WHEN district = ANY($1::text[]) THEN district ELSE $2::text END AS district,
         COALESCE(SUM(COALESCE(daughters_under18, 0)), 0)::int AS daughters_0_18,
         COALESCE(SUM(COALESCE(unmarried_daughters18_to45, 0)), 0)::int AS unmarried_daughters_18_45,
         COUNT(*)::int AS survey_entries
       FROM applications
       ${filter.where}
       GROUP BY 1
     ),
     report_districts AS (
       SELECT unnest($1::text[]) AS district
     )
     SELECT
       report_districts.district,
       COALESCE(aggregated.daughters_0_18, 0)::int AS daughters_0_18,
       COALESCE(aggregated.unmarried_daughters_18_45, 0)::int AS unmarried_daughters_18_45,
       COALESCE(aggregated.survey_entries, 0)::int AS survey_entries
     FROM report_districts
     LEFT JOIN aggregated USING (district)
     ORDER BY CASE
       WHEN report_districts.district = $2 THEN array_length($1::text[], 1) + 1
       ELSE array_position($1::text[], report_districts.district)
     END`,
    [reportDistricts, unclassified, ...filter.values]
  )

  const rows = result.rows.map(row => ({
    ...row,
    total_daughters: row.daughters_0_18 + row.unmarried_daughters_18_45
  }))
  const grandTotal = rows.reduce((total, row) => ({
    daughters_0_18: total.daughters_0_18 + row.daughters_0_18,
    unmarried_daughters_18_45: total.unmarried_daughters_18_45 + row.unmarried_daughters_18_45,
    total_daughters: total.total_daughters + row.total_daughters,
    survey_entries: total.survey_entries + row.survey_entries
  }), {
    daughters_0_18: 0,
    unmarried_daughters_18_45: 0,
    total_daughters: 0,
    survey_entries: 0
  })

  return { rows, grandTotal }
}

async function getApplicationBreakdown(expression, filter) {
  const result = await pool.query(
    `SELECT ${expression} AS label, COUNT(*)::int AS count
     FROM applications ${filter.where}
     GROUP BY 1
     ORDER BY count DESC, label ASC`,
    filter.values
  )
  return result.rows
}

function createSession(user, res, status = 200) {
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: '8h' }
  )
  res.status(status).json({
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      district: user.district
    }
  })
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'PostgreSQL connected' })
  } catch (error) {
    console.error('Database health check failed:', error.message)
    res.status(503).json({ status: 'error', database: 'PostgreSQL unavailable' })
  }
})

app.get('/api/auth/registration-status', async (_req, res) => {
  try {
    const result = await pool.query("SELECT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN') AS has_admin")
    res.json({ registrationOpen: !result.rows[0].has_admin })
  } catch (error) {
    console.error('Registration status lookup failed:', error.message)
    res.status(503).json({ message: 'Unable to check registration status' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password } = req.body || {}
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!normalizedName || normalizedName.length > 150) {
    return res.status(400).json({ message: 'Name is required and must be 150 characters or fewer' })
  }
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'A valid email address is required' })
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 bytes' })
  }

  try {
    const adminResult = await pool.query("SELECT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN') AS has_admin")
    if (adminResult.rows[0].has_admin) {
      return res.status(403).json({ message: 'Registration is closed; ask an administrator to create your account' })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, role, district`,
      [normalizedName, normalizedEmail, passwordHash]
    )
    createSession(result.rows[0], res, 201)
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }
    console.error('User registration failed:', error.message)
    res.status(503).json({ message: 'Unable to register user; check the database connection' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, district, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    )
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    createSession(user, res)
  } catch (error) {
    console.error('Login failed:', error.message)
    res.status(503).json({ message: 'Unable to process login; check the database connection' })
  }
})

app.get('/api/dashboard', auth, async (req, res) => {
  if (!requireDistrict(req.user, res)) return

  const requestedDistrict = req.query.district
  if (requestedDistrict !== undefined && (
    typeof requestedDistrict !== 'string' ||
    (req.user.role === 'ADMIN' && requestedDistrict !== '' && !districts.includes(requestedDistrict)) ||
    (req.user.role !== 'ADMIN' && requestedDistrict !== req.user.district)
  )) {
    return res.status(400).json({ message: 'Select a valid district' })
  }
  const status = req.query.status
  if (status !== undefined && (
    typeof status !== 'string' ||
    !['SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)
  )) {
    return res.status(400).json({ message: 'Select a valid application status' })
  }
  const search = req.query.search
  if (search !== undefined && (typeof search !== 'string' || search.length > 100)) {
    return res.status(400).json({ message: 'Search text must be 100 characters or fewer' })
  }
  const categoricalFilters = [
    ['womanCategory', womanCategories],
    ['disabilityType', disabilityTypes],
    ['socialCategory', socialCategories],
    ['isBpl', ['Yes', 'No']]
  ]
  for (const [field, allowedValues] of categoricalFilters) {
    const value = req.query[field]
    if (value !== undefined && (typeof value !== 'string' || !allowedValues.includes(value))) {
      return res.status(400).json({ message: `Select a valid ${field} filter` })
    }
  }
  const disabilityPercentage = req.query.disabilityPercentage
  if (disabilityPercentage !== undefined && (
    typeof disabilityPercentage !== 'string' ||
    !Object.prototype.hasOwnProperty.call(disabilityPercentageFilters, disabilityPercentage)
  )) {
    return res.status(400).json({ message: 'Select a valid disability percentage range' })
  }

  try {
    const filters = {
      district: typeof requestedDistrict === 'string' && requestedDistrict ? requestedDistrict : null,
      search: typeof search === 'string' ? search.trim() : '',
      status: typeof status === 'string' ? status : '',
      womanCategory: req.query.womanCategory || '',
      disabilityType: req.query.disabilityType || '',
      disabilityPercentage: disabilityPercentage || '',
      socialCategory: req.query.socialCategory || '',
      isBpl: req.query.isBpl || ''
    }
    const applicationFilter = buildApplicationFilter(req.user, filters)
    const districtFilter = buildApplicationFilter(req.user, filters, 3)
    const draftDistrict = req.user.role === 'ADMIN' ? filters.district : req.user.district
    const draftQuery = draftDistrict
      ? 'SELECT COUNT(*)::int AS initiated FROM application_drafts WHERE district = $1'
      : 'SELECT COUNT(*)::int AS initiated FROM application_drafts'
    const draftValues = draftDistrict ? [draftDistrict] : []
    const breakdownsPromise = Promise.all([
      getApplicationBreakdown("COALESCE(NULLIF(BTRIM(woman_category), ''), 'Not specified')", applicationFilter),
      getApplicationBreakdown("COALESCE(NULLIF(BTRIM(disability_type), ''), 'Not specified')", applicationFilter),
      getApplicationBreakdown(`CASE
        WHEN disability_percentage IS NULL THEN 'Not specified'
        WHEN disability_percentage = 0 THEN '0%'
        WHEN disability_percentage <= 25 THEN '1–25%'
        WHEN disability_percentage <= 50 THEN '26–50%'
        WHEN disability_percentage <= 75 THEN '51–75%'
        ELSE '76–100%'
      END`, applicationFilter),
      getApplicationBreakdown("COALESCE(NULLIF(BTRIM(social_category), ''), 'Not specified')", applicationFilter),
      getApplicationBreakdown("COALESCE(NULLIF(BTRIM(is_bpl), ''), 'Not specified')", applicationFilter)
    ])
    const [submitted, initiated, recent, districtReport, breakdowns] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS submitted FROM applications ${applicationFilter.where}`, applicationFilter.values),
      pool.query(draftQuery, draftValues),
      pool.query(
        `SELECT id, application_number, applicant_name, district, status
         FROM applications ${applicationFilter.where}
         ORDER BY created_at DESC LIMIT 5`,
        applicationFilter.values
      ),
      getDistrictApplicationReport(districtFilter, filters.district || (req.user.role === 'ADMIN' ? null : req.user.district)),
      breakdownsPromise
    ])
    res.json({
      submitted: submitted.rows[0].submitted,
      initiated: initiated.rows[0].initiated,
      district: req.user.role === 'ADMIN' ? filters.district : req.user.district,
      recent: recent.rows,
      districtReport: {
        ...districtReport,
        breakdowns: {
          womanCategory: breakdowns[0],
          disabilityType: breakdowns[1],
          disabilityPercentage: breakdowns[2],
          socialCategory: breakdowns[3],
          bpl: breakdowns[4]
        }
      }
    })
  } catch (error) {
    console.error('Dashboard load failed:', error.message)
    res.status(503).json({ message: 'Unable to load dashboard from the database' })
  }
})

app.get('/api/admin/employees', auth, adminOnly, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, district, created_at
       FROM users ORDER BY created_at DESC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Employee list failed:', error.message)
    res.status(503).json({ message: 'Unable to load employees' })
  }
})

app.post('/api/admin/employees', auth, adminOnly, async (req, res) => {
  const { fullName, email, district } = req.body || {}
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const password = process.env.EMPLOYEE_DEFAULT_PASSWORD

  if (!normalizedName || normalizedName.length > 150) {
    return res.status(400).json({ message: 'Name is required and must be 150 characters or fewer' })
  }
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'A valid email address is required' })
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(503).json({ message: 'Set a valid EMPLOYEE_DEFAULT_PASSWORD in backend/.env (8–72 bytes)' })
  }
  if (!districts.includes(district)) {
    return res.status(400).json({ message: 'Select a valid Himachal Pradesh district' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, district)
       VALUES ($1, $2, $3, 'EMPLOYEE', $4)
       RETURNING id, full_name, email, role, district, created_at`,
      [normalizedName, normalizedEmail, passwordHash, district]
    )
    res.status(201).json({
      employee: result.rows[0],
      initialPassword: password
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }
    console.error('Employee creation failed:', error.message)
    res.status(503).json({ message: 'Unable to create employee account' })
  }
})

app.get('/api/applications', auth, async (req, res) => {
  if (!requireDistrict(req.user, res)) return

  try {
    const result = req.user.role === 'ADMIN'
      ? await pool.query('SELECT * FROM applications ORDER BY created_at DESC')
      : await pool.query(
        'SELECT * FROM applications WHERE district = $1 ORDER BY created_at DESC',
        [req.user.district]
      )
    res.json(result.rows)
  } catch (error) {
    console.error('Application list failed:', error.message)
    res.status(503).json({ message: 'Unable to load applications from the database' })
  }
})

app.get('/api/applications/drafts', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return

  try {
    const result = req.user.role === 'ADMIN'
      ? await pool.query('SELECT * FROM application_drafts ORDER BY updated_at DESC')
      : await pool.query(
        'SELECT * FROM application_drafts WHERE district = $1 ORDER BY updated_at DESC',
        [req.user.district]
      )
    res.json(result.rows)
  } catch (error) {
    console.error('Draft list failed:', error.message)
    res.status(503).json({ message: 'Unable to load initiated applications' })
  }
})

app.post('/api/applications/drafts', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return
  const formData = req.body?.formData
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return res.status(400).json({ message: 'Draft form data must be an object' })
  }
  const district = req.user.role === 'ADMIN'
    ? (formData.district || null)
    : req.user.district
  if (district && !districts.includes(district)) {
    return res.status(400).json({ message: 'Select a valid district' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO application_drafts (district, form_data, created_by)
       VALUES ($1, $2::jsonb, $3)
       RETURNING *`,
      [district, JSON.stringify({ ...formData, district }), req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Draft creation failed:', error.message)
    res.status(503).json({ message: 'Unable to create draft' })
  }
})

app.get('/api/applications/drafts/:id', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return

  try {
    const result = req.user.role === 'ADMIN'
      ? await pool.query('SELECT * FROM application_drafts WHERE id = $1', [req.params.id])
      : await pool.query(
        'SELECT * FROM application_drafts WHERE id = $1 AND district = $2',
        [req.params.id, req.user.district]
      )
    if (!result.rows[0]) return res.status(404).json({ message: 'Draft not found' })
    res.json(result.rows[0])
  } catch (error) {
    console.error('Draft load failed:', error.message)
    res.status(503).json({ message: 'Unable to load draft' })
  }
})

app.patch('/api/applications/drafts/:id', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return
  const formData = req.body?.formData
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return res.status(400).json({ message: 'Draft form data must be an object' })
  }
  const requestedDistrict = formData.district || null
  const district = req.user.role === 'ADMIN' ? requestedDistrict : req.user.district
  if (requestedDistrict && !districts.includes(requestedDistrict)) {
    return res.status(400).json({ message: 'Select a valid district' })
  }

  try {
    const result = req.user.role === 'ADMIN'
      ? await pool.query(
        `UPDATE application_drafts SET district = $1, form_data = $2::jsonb, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [district, JSON.stringify({ ...formData, district }), req.params.id]
      )
      : await pool.query(
        `UPDATE application_drafts SET form_data = $1::jsonb, updated_at = NOW()
         WHERE id = $2 AND district = $3 RETURNING *`,
        [JSON.stringify({ ...formData, district }), req.params.id, req.user.district]
      )
    if (!result.rows[0]) return res.status(404).json({ message: 'Draft not found' })
    res.json(result.rows[0])
  } catch (error) {
    console.error('Draft save failed:', error.message)
    res.status(503).json({ message: 'Unable to save draft' })
  }
})

app.post('/api/applications/drafts/:id/submit', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return
  const submittedForm = req.body?.formData
  if (!submittedForm || typeof submittedForm !== 'object' || Array.isArray(submittedForm)) {
    return res.status(400).json({ message: 'Application form data must be an object' })
  }

  const client = await pool.connect()
  let transactionStarted = false
  try {
    await client.query('BEGIN')
    transactionStarted = true
    const draftResult = req.user.role === 'ADMIN'
      ? await client.query('SELECT * FROM application_drafts WHERE id = $1 FOR UPDATE', [req.params.id])
      : await client.query(
        'SELECT * FROM application_drafts WHERE id = $1 AND district = $2 FOR UPDATE',
        [req.params.id, req.user.district]
      )
    const draft = draftResult.rows[0]
    if (!draft) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(404).json({ message: 'Draft not found' })
    }

    const formData = { ...draft.form_data, ...submittedForm }
    const district = req.user.role === 'ADMIN'
      ? (submittedForm.district || draft.district)
      : req.user.district
    if (!districts.includes(district)) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ message: 'Select a valid district before submitting' })
    }
    formData.district = district
    const validationError = validateApplication(formData)
    if (validationError) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(400).json({ message: validationError })
    }

    const application = await insertApplication(client, formData, req.user.id, district)
    await client.query('DELETE FROM application_drafts WHERE id = $1', [draft.id])
    await client.query('COMMIT')
    transactionStarted = false
    res.status(201).json(application)
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK')
    console.error('Draft submission failed:', error.message)
    res.status(503).json({ message: 'Unable to submit application to the database' })
  } finally {
    client.release()
  }
})

app.post('/api/applications', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return
  const district = getDistrictForUser(req.user, req.body?.district)
  if (!district) return res.status(403).json({ message: 'Select your assigned district' })
  const application = { ...req.body, district }
  const validationError = validateApplication(application)
  if (validationError) return res.status(400).json({ message: validationError })

  try {
    const result = await insertApplication(pool, application, req.user.id, district)
    res.status(201).json(result)
  } catch (error) {
    console.error('Application save failed:', error.message)
    res.status(503).json({ message: 'Unable to save application to the database' })
  }
})

app.patch('/api/applications/:id/status', auth, employeeOnly, async (req, res) => {
  if (!requireDistrict(req.user, res)) return
  const { status, remarks } = req.body || {}
  if (!['SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Select a valid application status' })
  }

  try {
    const result = req.user.role === 'ADMIN'
      ? await pool.query(
        'UPDATE applications SET status=$1, remarks=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
        [status, remarks || null, req.params.id]
      )
      : await pool.query(
        `UPDATE applications SET status=$1, remarks=$2, updated_at=NOW()
         WHERE id=$3 AND district=$4 RETURNING *`,
        [status, remarks || null, req.params.id, req.user.district]
      )
    if (!result.rows[0]) return res.status(404).json({ message: 'Application not found' })
    res.json(result.rows[0])
  } catch (error) {
    console.error('Application status update failed:', error.message)
    res.status(503).json({ message: 'Unable to update application in the database' })
  }
})

const port = Number(process.env.PORT || 5000)

initializeDatabase()
  .then(() => app.listen(port, () => console.log(`WCD API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('PostgreSQL initialization failed:', error.message)
    app.listen(port, () => console.log(`WCD API running; PostgreSQL is unavailable on http://localhost:${port}`))
  })
