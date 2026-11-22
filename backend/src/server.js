import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { pool, adminPool, initializeDatabase } from './db.js'
import {
  readApplications,
  writeApplications,
  withDatabaseFallback as withDatabaseOrFallback,
  validateApplication,
  buildFallbackApplication,
  generateApplicationNumber
} from './modules/applications/applicationService.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Authentication required' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'development-secret')
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'PostgreSQL connected' })
  } catch (error) {
    res.json({ status: 'ok', database: 'Local JSON fallback', message: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const userResult = await withDatabaseOrFallback(
      async () => {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
        return result.rows[0]
      },
      async () => email.toLowerCase() === 'admin@wcd.hp.gov.in'
        ? { id: 'local-admin', email, full_name: 'WCD Administrator', role: 'ADMIN' }
        : null
    )

    if (!userResult) return res.status(401).json({ message: 'Invalid email or password' })

    let validPassword
    try {
      validPassword = await bcrypt.compare(password, userResult.password_hash)
    } catch {
      validPassword = false
    }
    if (!userResult.password_hash) validPassword = password === 'WCD@123'
    if (!validPassword) return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign(
      { id: userResult.id, email: userResult.email, role: userResult.role },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '8h' }
    )
    res.json({ token, user: { id: userResult.id, fullName: userResult.full_name || userResult.fullName, email: userResult.email, role: userResult.role } })
  } catch (error) {
    res.status(503).json({ message: 'Unable to process login', detail: error.message })
  }
})

app.get('/api/dashboard', auth, async (_req, res) => {
  try {
    const result = await withDatabaseOrFallback(
      async () => {
        const counts = await pool.query(`SELECT COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status='SUBMITTED')::int AS submitted,
          COUNT(*) FILTER (WHERE status='APPROVED')::int AS approved,
          COUNT(*) FILTER (WHERE status='PENDING')::int AS pending FROM applications`)
        const recent = await pool.query('SELECT * FROM applications ORDER BY created_at DESC LIMIT 5')
        return { ...counts.rows[0], recent: recent.rows }
      },
      async () => {
        const rows = await readApplications()
        return {
          total: rows.length,
          submitted: rows.filter(row => row.status === 'SUBMITTED').length,
          approved: rows.filter(row => row.status === 'APPROVED').length,
          pending: rows.filter(row => row.status === 'PENDING').length,
          recent: rows.slice(0, 5)
        }
      }
    )
    res.json(result)
  } catch (error) {
    res.status(503).json({ message: 'Unable to load dashboard', detail: error.message })
  }
})

app.get('/api/applications', auth, async (_req, res) => {
  try {
    const rows = await withDatabaseOrFallback(
      async () => (await pool.query('SELECT * FROM applications ORDER BY created_at DESC')).rows,
      readApplications
    )
    res.json(rows)
  } catch (error) {
    res.status(503).json({ message: 'Unable to load applications', detail: error.message })
  }
})

app.post('/api/applications', auth, async (req, res) => {
  try {
    const b = req.body
    const validationError = validateApplication(b)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const applicationNumber = generateApplicationNumber()
    const result = await withDatabaseOrFallback(
      async () => {
        const values = [
          applicationNumber,
          b.womanName || b.applicantName,
          b.fatherHusbandName || b.guardianName || null,
          b.aadhaarNumber || null,
          b.mobileNumber || null,
          b.district,
          b.gramPanchayat || null,
          b.villageName || b.village || null,
          b.socialCategory || b.category || null,
          'Mahila Application',
          b.annualIncome || null,
          b.womanCategory || null,
          b.disabilityType || null,
          b.disabilityPercentage || null,
          b.postOffice || null,
          b.anganwadiCentre || null,
          b.assemblyConstituency || null,
          b.cdpoBlock || null,
          b.daughtersUnder18 || null,
          b.unmarriedDaughters18To45 || null,
          b.sonsUnder18 || null,
          b.unmarriedSons18To27 || null,
          b.socialCategory || null,
          b.isBpl || null,
          req.user.id
        ]
        return (await pool.query(`INSERT INTO applications
          (application_number, applicant_name, guardian_name, aadhaar_number, mobile_number,
           district, gram_panchayat, village, category, scheme_name, annual_income,
           woman_category, disability_type, disability_percentage, post_office,
           anganwadi_centre, assembly_constituency, cdpo_block, daughters_under18,
           unmarried_daughters18_to45, sons_under18, unmarried_sons18_to27,
           social_category, is_bpl, created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
          RETURNING *`, values)).rows[0]
      },
      async () => {
        const rows = await readApplications()
        const row = buildFallbackApplication(b, applicationNumber)
        await writeApplications([row, ...rows])
        return row
      }
    )
    res.status(201).json(result)
  } catch (error) {
    res.status(503).json({ message: 'Unable to save application', detail: error.message })
  }
})

app.patch('/api/applications/:id/status', auth, async (req, res) => {
  try {
    const { status, remarks } = req.body
    const result = await withDatabaseOrFallback(
      async () => (await pool.query(
        'UPDATE applications SET status=$1, remarks=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
        [status, remarks || null, req.params.id]
      )) .rows[0],
      async () => {
        const rows = await readApplications()
        const index = rows.findIndex(row => row.id === req.params.id)
        if (index < 0) return null
        rows[index] = { ...rows[index], status, remarks: remarks || null, updated_at: new Date().toISOString() }
        await writeApplications(rows)
        return rows[index]
      }
    )
    if (!result) return res.status(404).json({ message: 'Application not found' })
    res.json(result)
  } catch (error) {
    res.status(503).json({ message: 'Unable to update application', detail: error.message })
  }
})

const port = Number(process.env.PORT || 5000)

initializeDatabase()
  .then(() => app.listen(port, () => console.log(`WCD API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('PostgreSQL initialization failed:', error.message)
    app.listen(port, () => console.log(`WCD API running in database recovery mode on http://localhost:${port}`))
  })
