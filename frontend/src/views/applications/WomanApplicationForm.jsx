import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
  InputAdornment, MenuItem, Paper, Stack, TextField, Typography
} from '@mui/material'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PinOutlinedIcon from '@mui/icons-material/PinOutlined'
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined'
import { applicationService } from '../../services/applications/applicationService'
import {
  applicationFieldLabels, initialApplicationForm, districtOptions,
  womanCategoryOptions, disabilityTypeOptions, socialCategoryOptions, yesNoOptions
} from './applicationFields'
import { himachalAdministrativeData } from './himachalAdministrativeData'
import { bilingualLabel, useLanguage } from '../../i18n'

const fieldIcons = {
  womanName: <PersonOutlineOutlinedIcon fontSize="small" />,
  fatherHusbandName: <BadgeOutlinedIcon fontSize="small" />,
  mobileNumber: <PhoneOutlinedIcon fontSize="small" />,
  aadhaarNumber: <LockOutlinedIcon fontSize="small" />,
  villageName: <LocationOnOutlinedIcon fontSize="small" />,
  postOffice: <PinOutlinedIcon fontSize="small" />,
  annualIncome: <CurrencyRupeeOutlinedIcon fontSize="small" />
}

const optionHindi = {
  Bilaspur: 'बिलासपुर',
  Chamba: 'चंबा',
  Hamirpur: 'हमीरपुर',
  Kangra: 'कांगड़ा',
  Kinnaur: 'किन्नौर',
  Kullu: 'कुल्लू',
  'Lahaul & Spiti': 'लाहौल एवं स्पीति',
  Mandi: 'मंडी',
  Shimla: 'शिमला',
  Sirmaur: 'सिरमौर',
  Solan: 'सोलन',
  Una: 'ऊना',
  'Pregnant Woman': 'गर्भवती महिला',
  'Lactating Mother': 'धात्री माता',
  Widow: 'विधवा',
  'Divorced Woman': 'तलाकशुदा महिला',
  'Unmarried Woman': 'अविवाहित महिला',
  'Single Woman': 'एकल महिला',
  Other: 'अन्य',
  'No Disability': 'कोई दिव्यांगता नहीं',
  'Visual Disability': 'दृष्टिबाधिता',
  'Hearing Disability': 'श्रवण दिव्यांगता',
  'Speech and Language Disability': 'वाणी एवं भाषा दिव्यांगता',
  'Locomotor Disability': 'चलन संबंधी दिव्यांगता',
  'Intellectual Disability': 'बौद्धिक दिव्यांगता',
  'Multiple Disabilities': 'बहु-दिव्यांगता',
  General: 'सामान्य',
  'Scheduled Caste': 'अनुसूचित जाति',
  'Scheduled Tribe': 'अनुसूचित जनजाति',
  'Other Backward Class': 'अन्य पिछड़ा वर्ग',
  Yes: 'हाँ',
  No: 'नहीं'
}

function Field({
  label, name, form, update, required, options = [], type = 'text',
  maxLength, helperText, language, disabled
}) {
  const numericNames = [
    'mobileNumber', 'aadhaarNumber', 'disabilityPercentage', 'annualIncome',
    'daughtersUnder18', 'unmarriedDaughters18To45', 'sonsUnder18', 'unmarriedSons18To27'
  ]
  const invalid =
    (name === 'aadhaarNumber' && form[name] && !/^\d{12}$/.test(form[name])) ||
    (name === 'mobileNumber' && form[name] && !/^\d{10}$/.test(form[name])) ||
    (name === 'disabilityPercentage' && form[name] && (Number(form[name]) < 0 || Number(form[name]) > 100))

  return (
    <TextField
      fullWidth
      size="small"
      name={name}
      label={label}
      type={type}
      value={form[name]}
      onChange={event => {
        const value = numericNames.includes(name)
          ? event.target.value.replace(/[^0-9]/g, '')
          : event.target.value
        update({ target: { name, value } })
      }}
      required={required}
      select={options.length > 0}
      disabled={disabled}
      error={Boolean(invalid)}
      helperText={invalid ? (name === 'disabilityPercentage' ? 'Enter a percentage from 0 to 100' : 'Enter a valid number') : helperText}
      slotProps={{
        htmlInput: maxLength ? { maxLength } : undefined,
        input: fieldIcons[name] ? { startAdornment: <InputAdornment position="start">{fieldIcons[name]}</InputAdornment> } : undefined
      }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', minHeight: 48, backgroundColor: '#fff' }, '& .MuiInputLabel-root': { fontSize: 14 } }}
    >
      {options.map(option => {
        const translatedOption = optionHindi[option]
        const label = translatedOption
          ? language === 'hi' ? `${translatedOption} / ${option}` : `${option} / ${translatedOption}`
          : option
        return <MenuItem key={option} value={option}>{label}</MenuItem>
      })}
    </TextField>
  )
}

function Section({ icon, title, children }) {
  return (
    <Paper className="modern-form-section" variant="outlined">
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Avatar sx={{ width: 42, height: 42, bgcolor: '#eaf2ff', color: '#2257a5' }}>{icon}</Avatar>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Paper>
  )
}

export default function WomanApplicationForm({ user }) {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [form, setForm] = useState({
    ...initialApplicationForm,
    district: user.role === 'ADMIN' ? '' : user.district || ''
  })
  const [loadedDraftId, setLoadedDraftId] = useState(null)
  const loaded = !draftId || loadedDraftId === draftId
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!draftId) return undefined

    let active = true
    applicationService.getDraft(draftId)
      .then(draft => {
        if (active) {
          setForm({ ...initialApplicationForm, ...draft.form_data })
          setLoadedDraftId(draft.id)
        }
      })
      .catch(loadError => { if (active) setError(loadError.message) })

    return () => { active = false }
  }, [draftId])

  const saveDraft = useCallback(async (formData = form) => {
    if (draftId && !loaded) return false
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      if (draftId) await applicationService.saveDraft(draftId, formData)
      else await applicationService.createDraft(formData)
      setSaved(true)
      return true
    } catch (saveError) {
      setError(saveError.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [draftId, form, loaded])

  const update = event => {
    setSaved(false)
    const { name, value } = event.target
    setForm(current => name === 'district'
      ? { ...current, district: value, assemblyConstituency: '', cdpoBlock: '' }
      : { ...current, [name]: value })
  }
  const fieldLabel = name => {
    const [english, hindi] = applicationFieldLabels[name]
    return bilingualLabel(english, hindi, language)
  }
  const clearForm = () => {
    setForm({
      ...initialApplicationForm,
      district: user.role === 'ADMIN' ? '' : user.district || ''
    })
    setSaved(false)
    setError('')
  }
  const submit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const application = {
        ...form,
        district: user.role === 'ADMIN' ? form.district : user.district
      }
      if (draftId) await applicationService.submitDraft(draftId, application)
      else await applicationService.create(application)
      navigate('/applications')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }
  const saveAndExit = async () => {
    if (await saveDraft(form)) navigate('/applications?tab=drafts')
  }
  const props = { form, update, language }
  const grid = { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }
  const districtsForForm = user.role === 'ADMIN' ? districtOptions : []
  const districtData = himachalAdministrativeData[form.district] || {}
  const assemblyOptions = districtData.assemblyConstituencies || []
  const developmentBlockOptions = districtData.developmentBlocks || []
  const assemblyFieldOptions = form.assemblyConstituency && !assemblyOptions.includes(form.assemblyConstituency)
    ? [form.assemblyConstituency, ...assemblyOptions]
    : assemblyOptions
  const blockFieldOptions = form.cdpoBlock && !developmentBlockOptions.includes(form.cdpoBlock)
    ? [form.cdpoBlock, ...developmentBlockOptions]
    : developmentBlockOptions

  return (
    <Box className="modern-page">
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={800}>{t('portalSubtitle')}</Typography>
          <Typography component="h1" variant="h4" fontWeight={850}>{t('formTitle')}</Typography>
        </Box>
        <Chip
          label={saving ? t('saving') : saved ? t('saved') : t('saveStatus')}
          color={saving ? 'default' : saved ? 'success' : 'primary'}
          variant="outlined"
          sx={{ mt: { xs: 1, md: 0 }, borderRadius: '8px', fontWeight: 700 }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loaded && !error && <div className="loading">{t('loading')}</div>}

      {loaded && (
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2.5}>
            <Section icon={<PersonOutlineOutlinedIcon />} title={`1. ${t('personalSection')}`}>
              <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2 }}>
                <Field label={fieldLabel('womanName')} name="womanName" required {...props} />
                <Field label={fieldLabel('fatherHusbandName')} name="fatherHusbandName" required {...props} />
                <Field label={fieldLabel('mobileNumber')} name="mobileNumber" required maxLength={10} helperText={language === 'hi' ? 'मोबाइल न होने पर आंगनवाड़ी कार्यकर्ता का नंबर दर्ज करें' : 'If unavailable, enter the Anganwadi worker’s number'} {...props} />
                <Field label={fieldLabel('womanCategory')} name="womanCategory" required options={womanCategoryOptions} {...props} />
                <Field label={fieldLabel('disabilityType')} name="disabilityType" options={disabilityTypeOptions} {...props} />
                <Field label={fieldLabel('disabilityPercentage')} name="disabilityPercentage" type="number" helperText={language === 'hi' ? '0 से 100 तक प्रतिशत दर्ज करें' : 'Enter a value from 0 to 100'} {...props} />
                <Field label={fieldLabel('aadhaarNumber')} name="aadhaarNumber" required maxLength={12} helperText={language === 'hi' ? '12 अंकों का आधार नंबर' : '12-digit Aadhaar number'} {...props} />
                <Field label={fieldLabel('socialCategory')} name="socialCategory" required options={socialCategoryOptions} {...props} />
                <Field label={fieldLabel('isBpl')} name="isBpl" required options={yesNoOptions} {...props} />
              </Box>
            </Section>

            <Section icon={<LocationOnOutlinedIcon />} title={`2. ${t('addressSection')}`}>
              <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2 }}>
                <Field label={fieldLabel('villageName')} name="villageName" required {...props} />
                <Field label={fieldLabel('postOffice')} name="postOffice" {...props} />
                <Field label={fieldLabel('anganwadiCentre')} name="anganwadiCentre" required {...props} />
                <Field label={fieldLabel('gramPanchayat')} name="gramPanchayat" required {...props} />
                {user.role === 'ADMIN'
                  ? <Field label={fieldLabel('district')} name="district" form={form} update={update} required options={districtsForForm} language={language} />
                  : <Field label={fieldLabel('district')} name="district" form={form} update={update} required disabled language={language} />}
                <Field
                  label={fieldLabel('assemblyConstituency')}
                  name="assemblyConstituency"
                  required
                  options={assemblyFieldOptions}
                  disabled={!form.district}
                  helperText={!form.district ? (language === 'hi' ? 'पहले जिला चुनें' : 'Select a district first') : undefined}
                  {...props}
                />
                <Field
                  label={fieldLabel('cdpoBlock')}
                  name="cdpoBlock"
                  required
                  options={blockFieldOptions}
                  disabled={!form.district}
                  helperText={!form.district
                    ? (language === 'hi' ? 'पहले जिला चुनें' : 'Select a district first')
                    : (language === 'hi' ? 'विकल्प जिले की विकास खंड सूची पर आधारित हैं' : 'Options follow the district Development Block list')}
                  {...props}
                />
              </Box>
            </Section>

            <Section icon={<AccountBalanceOutlinedIcon />} title={`3. ${t('familySection')}`}>
              <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2 }}>
                <Field label={fieldLabel('annualIncome')} name="annualIncome" type="number" required helperText={language === 'hi' ? 'कुल वार्षिक आय ₹ में' : 'Total annual income in ₹'} {...props} />
                <Field label={fieldLabel('daughtersUnder18')} name="daughtersUnder18" type="number" {...props} />
                <Field label={fieldLabel('unmarriedDaughters18To45')} name="unmarriedDaughters18To45" type="number" {...props} />
                <Field label={fieldLabel('sonsUnder18')} name="sonsUnder18" type="number" {...props} />
                <Field label={fieldLabel('unmarriedSons18To27')} name="unmarriedSons18To27" type="number" {...props} />
              </Box>
            </Section>

            <Paper className="form-action-bar" elevation={0}>
              <Typography variant="body2" color="text.secondary">{t('verifyDetails')}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="text" startIcon={<RestartAltOutlinedIcon />} onClick={clearForm}>{t('clearForm')}</Button>
                <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={saveAndExit} disabled={saving || submitting}>{t('saveDraft')}</Button>
                <Button type="submit" variant="contained" disabled={saving || submitting} startIcon={submitting ? <CircularProgress size={17} color="inherit" /> : <SaveOutlinedIcon />}>
                  {submitting ? t('submitting') : t('submitApplication')}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      )}
    </Box>
  )
}
