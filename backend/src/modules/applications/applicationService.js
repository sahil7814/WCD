import crypto from 'node:crypto'

export function validateApplication(application) {
  if (!application || typeof application !== 'object' || Array.isArray(application)) {
    return 'Application data is required'
  }

  const womanName = application.womanName || application.applicantName
  if (typeof womanName !== 'string' || !womanName.trim()) {
    return 'Woman name is required'
  }
  if (typeof application.district !== 'string' || !application.district.trim()) {
    return 'District is required'
  }

  const requiredFields = [
    [application.fatherHusbandName || application.guardianName, 'Father / husband name'],
    [application.mobileNumber, 'Mobile number'],
    [application.womanCategory, 'Woman category'],
    [application.aadhaarNumber, 'Aadhaar number'],
    [application.socialCategory, 'Social category'],
    [application.isBpl, 'BPL status'],
    [application.villageName || application.village, 'Village'],
    [application.anganwadiCentre, 'Anganwadi Centre'],
    [application.gramPanchayat, 'Gram Panchayat'],
    [application.assemblyConstituency, 'Assembly constituency'],
    [application.cdpoBlock, 'CDPO block'],
    [application.annualIncome, 'Annual income']
  ]
  const missingField = requiredFields.find(([value]) => typeof value !== 'string' || !value.trim())
  if (missingField) return `${missingField[1]} is required`
  if (!/^\d{10}$/.test(application.mobileNumber)) {
    return 'Mobile number must contain 10 digits'
  }
  if (!/^\d{12}$/.test(application.aadhaarNumber)) {
    return 'Aadhaar number must contain 12 digits'
  }

  for (const [field, label] of [
    ['annualIncome', 'Annual income'],
    ['disabilityPercentage', 'Disability percentage'],
    ['daughtersUnder18', 'Daughters under 18'],
    ['unmarriedDaughters18To45', 'Unmarried daughters aged 18 to 45'],
    ['sonsUnder18', 'Sons under 18'],
    ['unmarriedSons18To27', 'Unmarried sons aged 18 to 27']
  ]) {
    const value = application[field]
    if (value !== undefined && value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      return `${label} must be a non-negative number`
    }
  }

  for (const [field, label] of [
    ['daughtersUnder18', 'Daughters under 18'],
    ['unmarriedDaughters18To45', 'Unmarried daughters aged 18 to 45'],
    ['sonsUnder18', 'Sons under 18'],
    ['unmarriedSons18To27', 'Unmarried sons aged 18 to 27']
  ]) {
    const value = application[field]
    if (value !== undefined && value !== '' && !Number.isInteger(Number(value))) {
      return `${label} must be a whole number`
    }
  }

  if (application.disabilityPercentage && Number(application.disabilityPercentage) > 100) {
    return 'Disability percentage cannot exceed 100'
  }
  return null
}

export function generateApplicationNumber() {
  const year = new Date().getFullYear()
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `WCD-${year}-${suffix}`
}

export async function insertApplication(database, application, userId, district) {
  const optional = value => value === undefined || value === '' ? null : value
  const values = [
    generateApplicationNumber(),
    (application.womanName || application.applicantName).trim(),
    optional(application.fatherHusbandName || application.guardianName),
    optional(application.aadhaarNumber),
    optional(application.mobileNumber),
    district,
    optional(application.gramPanchayat),
    optional(application.villageName || application.village),
    optional(application.socialCategory || application.category),
    'Mahila Application',
    optional(application.annualIncome),
    optional(application.womanCategory),
    optional(application.disabilityType),
    optional(application.disabilityPercentage),
    optional(application.postOffice),
    optional(application.anganwadiCentre),
    optional(application.assemblyConstituency),
    optional(application.cdpoBlock),
    optional(application.daughtersUnder18),
    optional(application.unmarriedDaughters18To45),
    optional(application.sonsUnder18),
    optional(application.unmarriedSons18To27),
    optional(application.socialCategory),
    optional(application.isBpl),
    userId
  ]
  const result = await database.query(`INSERT INTO applications
    (application_number, applicant_name, guardian_name, aadhaar_number, mobile_number,
     district, gram_panchayat, village, category, scheme_name, annual_income,
     woman_category, disability_type, disability_percentage, post_office,
     anganwadi_centre, assembly_constituency, cdpo_block, daughters_under18,
     unmarried_daughters18_to45, sons_under18, unmarried_sons18_to27,
     social_category, is_bpl, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
    RETURNING *`, values)
  return result.rows[0]
}
