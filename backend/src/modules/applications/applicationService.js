import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import { pool } from '../../db.js'

const applicationsFile = new URL('../../../data/applications.json', import.meta.url)

export async function readApplications() {
  try {
    return JSON.parse(await fs.readFile(applicationsFile, 'utf8'))
  } catch {
    return []
  }
}

export async function writeApplications(rows) {
  await fs.mkdir(new URL('../../../data/', import.meta.url), { recursive: true })
  await fs.writeFile(applicationsFile, JSON.stringify(rows, null, 2))
}

export async function withDatabaseFallback(databaseTask, fallbackTask) {
  try {
    return await databaseTask()
  } catch {
    return await fallbackTask()
  }
}

export function validateApplication(application) {
  const womanName = application.womanName || application.applicantName
  if (!womanName || !application.district) {
    return 'Woman name and district are required'
  }
  if (!application.gramPanchayat && !application.anganwadiCentre) {
    return 'Gram Panchayat or Anganwadi Centre is required'
  }
  return null
}

export function buildFallbackApplication(application, applicationNumber) {
  return {
    id: crypto.randomUUID(),
    application_number: applicationNumber,
    applicant_name: application.womanName || application.applicantName,
    guardian_name: application.fatherHusbandName || application.guardianName || null,
    aadhaar_number: application.aadhaarNumber || null,
    mobile_number: application.mobileNumber || null,
    district: application.district,
    gram_panchayat: application.gramPanchayat || null,
    village: application.villageName || application.village || null,
    category: application.socialCategory || application.category || null,
    scheme_name: 'Mahila Application',
    annual_income: application.annualIncome || null,
    woman_category: application.womanCategory || null,
    disability_type: application.disabilityType || null,
    disability_percentage: application.disabilityPercentage || null,
    post_office: application.postOffice || null,
    anganwadi_centre: application.anganwadiCentre || null,
    assembly_constituency: application.assemblyConstituency || null,
    cdpo_block: application.cdpoBlock || null,
    daughters_under18: application.daughtersUnder18 || null,
    unmarried_daughters18_to45: application.unmarriedDaughters18To45 || null,
    sons_under18: application.sonsUnder18 || null,
    unmarried_sons18_to27: application.unmarriedSons18To27 || null,
    social_category: application.socialCategory || null,
    is_bpl: application.isBpl || null,
    status: 'SUBMITTED',
    created_at: new Date().toISOString()
  }
}

export function generateApplicationNumber() {
  return `WCD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
}

export { pool }
