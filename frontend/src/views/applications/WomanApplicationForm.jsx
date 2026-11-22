import { useState } from 'react'
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Divider,
  InputAdornment, MenuItem, Paper, Stack, TextField, Typography
} from '@mui/material'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined'
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
  initialApplicationForm, districtOptions, womanCategoryOptions,
  disabilityTypeOptions, socialCategoryOptions, yesNoOptions
} from './applicationFields'

const fieldIcons = {
  womanName: <PersonOutlineOutlinedIcon fontSize="small" />,
  fatherHusbandName: <BadgeOutlinedIcon fontSize="small" />,
  mobileNumber: <PhoneOutlinedIcon fontSize="small" />,
  aadhaarNumber: <LockOutlinedIcon fontSize="small" />,
  villageName: <LocationOnOutlinedIcon fontSize="small" />,
  postOffice: <PinOutlinedIcon fontSize="small" />,
  pincode: <PinOutlinedIcon fontSize="small" />,
  annualIncome: <CurrencyRupeeOutlinedIcon fontSize="small" />
}

function Field({ label, name, form, update, required, options = [], type = 'text', maxLength, helperText }) {
  const numericNames = ['mobileNumber', 'aadhaarNumber', 'disabilityPercentage', 'annualIncome', 'daughtersUnder18', 'unmarriedDaughters18To45', 'sonsUnder18', 'unmarriedSons18To27']
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
      error={invalid}
      helperText={invalid ? (name === 'disabilityPercentage' ? 'Enter a percentage from 0 to 100' : 'Enter a valid number') : helperText}
      slotProps={{
        htmlInput: maxLength ? { maxLength } : undefined,
        input: fieldIcons[name] ? { startAdornment: <InputAdornment position="start">{fieldIcons[name]}</InputAdornment> } : undefined
      }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', minHeight: 44, backgroundColor: '#fff' }, '& .MuiInputLabel-root': { fontSize: 14 } }}
    >
      {options.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
    </TextField>
  )
}

function Section({ icon, title, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: '8px', borderColor: '#dde6f0', background: '#fff' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Avatar sx={{ width: 38, height: 38, bgcolor: '#edf5fb', color: '#1d5d99' }}>{icon}</Avatar>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  )
}

export default function WomanApplicationForm({ onSaved }) {
  const [form, setForm] = useState(initialApplicationForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const clearForm = () => { setForm(initialApplicationForm); setMessage('') }

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await applicationService.create(form)
      setMessage('Application registered successfully')
      setForm(initialApplicationForm)
      window.setTimeout(onSaved, 700)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const props = { form, update }
  const grid = { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={2.5}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={800}>Women &amp; Child Development</Typography>
          <Typography component="h1" variant="h4" fontWeight={800}>Woman Application Form</Typography>
        </Box>
        <Chip label="New Application" color="primary" variant="outlined" sx={{ mt: { xs: 1, md: 0 }, borderRadius: '6px' }} />
      </Stack>

      {message && <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2, borderRadius: '6px' }}>{message}</Alert>}

      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <Section title="1. Woman and Contact Information" icon={<PersonOutlineOutlinedIcon />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2 }}>
              <Field label="Full Name of Woman" name="womanName" required {...props} />
              <Field label="Father's / Husband's Name" name="fatherHusbandName" required {...props} />
              <Field label="Mobile / Contact Number" name="mobileNumber" required maxLength={10} helperText="If the woman has no mobile phone, enter the Anganwadi worker's number" {...props} />
              <Field label="Category of Woman" name="womanCategory" required options={womanCategoryOptions} {...props} />
              <Field label="Type of Disability" name="disabilityType" options={disabilityTypeOptions} {...props} />
              <Field label="Percentage of Disability (%)" name="disabilityPercentage" type="number" helperText="Enter a value from 0 to 100" {...props} />
              <Field label="Aadhaar Number of Woman" name="aadhaarNumber" required maxLength={12} helperText="12-digit Aadhaar number" {...props} />
              <Field label="Social Category" name="socialCategory" required options={socialCategoryOptions} {...props} />
              <Field label="Does the Woman Belong to a BPL Family?" name="isBpl" required options={yesNoOptions} {...props} />
            </Box>
          </Section>

          <Section title="2. Address and Local Administration" icon={<LocationOnOutlinedIcon />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2 }}>
              <Field label="Name of Village" name="villageName" required {...props} />
              <Field label="Post Office" name="postOffice" {...props} />
              <Field label="Name of Anganwadi Centre" name="anganwadiCentre" required {...props} />
              <Field label="Name of Gram Panchayat / Urban Body" name="gramPanchayat" required {...props} />
              <Field label="District" name="district" required options={districtOptions} {...props} />
              <Field label="Assembly Constituency" name="assemblyConstituency" required {...props} />
              <Field label="CDPO Development Block" name="cdpoBlock" required {...props} />
            </Box>
          </Section>

          <Section title="3. Income and Family Details" icon={<AccountBalanceOutlinedIcon />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: grid, gap: 2 }}>
              <Field label="Total Annual Income from All Sources" name="annualIncome" required helperText="Total annual income in ₹" {...props} />
              <Field label="Number of Daughters Aged 0–18 Years" name="daughtersUnder18" type="number" {...props} />
              <Field label="Number of Unmarried Daughters Aged 18–45 Years" name="unmarriedDaughters18To45" type="number" {...props} />
              <Field label="Number of Sons Aged 0–18 Years" name="sonsUnder18" type="number" {...props} />
              <Field label="Number of Unmarried Sons Aged 18–27 Years" name="unmarriedSons18To27" type="number" {...props} />
            </Box>
          </Section>

          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5ebf3', borderRadius: '8px', bgcolor: '#f8fafc' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1.5}>
              <Typography variant="body2" color="text.secondary">Please verify all details before submission.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width={{ xs: '100%', sm: 'auto' }}>
                <Button variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={clearForm} sx={{ minHeight: 44 }}>Clear Form</Button>
                <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <SaveOutlinedIcon />} sx={{ minWidth: 210, minHeight: 44 }}>
                  {saving ? 'Submitting...' : 'Submit Application'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  )
}
