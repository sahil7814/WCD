import { useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import PinOutlinedIcon from '@mui/icons-material/PinOutlined'
import CurrencyRupeeOutlinedIcon from '@mui/icons-material/CurrencyRupeeOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { applicationService } from '../../services/applications/applicationService'
import {
  initialApplicationForm,
  districtOptions,
  genderOptions,
  categoryOptions,
  schemeOptions
} from './applicationFields'

const fieldIcons = {
  applicantName: <PersonOutlineOutlinedIcon fontSize="small" />,
  guardianName: <BadgeOutlinedIcon fontSize="small" />,
  dateOfBirth: <CalendarMonthOutlinedIcon fontSize="small" />,
  aadhaarNumber: <LockOutlinedIcon fontSize="small" />,
  mobileNumber: <PhoneOutlinedIcon fontSize="small" />,
  email: <EmailOutlinedIcon fontSize="small" />,
  district: <LocationOnOutlinedIcon fontSize="small" />,
  block: <LocationOnOutlinedIcon fontSize="small" />,
  gramPanchayat: <LocationOnOutlinedIcon fontSize="small" />,
  village: <HomeOutlinedIcon fontSize="small" />,
  address: <HomeOutlinedIcon fontSize="small" />,
  pincode: <PinOutlinedIcon fontSize="small" />,
  annualIncome: <CurrencyRupeeOutlinedIcon fontSize="small" />,
  bankName: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
  accountNumber: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
  ifscCode: <AccountBalanceOutlinedIcon fontSize="small" />
}

function FormField({
  label,
  name,
  form,
  update,
  type = 'text',
  required = false,
  options = [],
  helperText,
  maxLength
}) {
  const hasError =
    (name === 'aadhaarNumber' && form[name] && !/^\d{12}$/.test(form[name])) ||
    (name === 'mobileNumber' && form[name] && !/^\d{10}$/.test(form[name])) ||
    (name === 'pincode' && form[name] && !/^\d{6}$/.test(form[name]))

  const formattedHelper = hasError
    ? name === 'aadhaarNumber'
      ? 'Enter a valid 12-digit Aadhaar number'
      : name === 'mobileNumber'
        ? 'Enter a valid 10-digit mobile number'
        : 'Enter a valid 6-digit PIN code'
    : helperText

  return (
    <TextField
      fullWidth
      size="small"
      name={name}
      label={label}
      type={type}
      value={form[name]}
      onChange={update}
      required={required}
      select={options.length > 0}
      error={hasError}
      helperText={formattedHelper}
      slotProps={{
        htmlInput: maxLength ? { maxLength } : undefined,
        inputLabel: type === 'date' ? { shrink: true } : undefined,
        input: fieldIcons[name] ? {
          startAdornment: <InputAdornment position="start">{fieldIcons[name]}</InputAdornment>
        } : undefined
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          minHeight: 44,
          transition: 'border-color .15s ease, box-shadow .15s ease',
          '&:hover': { boxShadow: '0 2px 8px rgba(29,93,153,.06)' },
          '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(29,93,153,.10)' }
        },
        '& .MuiInputLabel-root': { fontSize: 14 },
        '& .MuiFormHelperText-root': { marginLeft: 0, fontSize: 11 }
      }}
    >
      {options.map(option => (
        <MenuItem key={option} value={option}>{option}</MenuItem>
      ))}
    </TextField>
  )
}

function FormSection({ icon, title, description, step, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.25, md: 3 },
        borderRadius: 3,
        borderColor: '#dde6f0',
        boxShadow: '0 12px 36px rgba(27,65,105,.06)',
        background: 'linear-gradient(145deg, #ffffff 0%, #fbfdff 100%)'
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
        <Avatar sx={{ bgcolor: '#edf5fb', color: '#1d5d99', width: 46, height: 46 }}>
          {icon}
        </Avatar>
        <Box flex={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
            
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.25}>{description}</Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Paper>
  )
}

export default function ApplicationForm({ onSaved }) {
  const [form, setForm] = useState(initialApplicationForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const updateField = event => {
    const { name, value } = event.target
    const numericFields = ['aadhaarNumber', 'mobileNumber', 'pincode', 'accountNumber', 'annualIncome']

    setForm(current => ({
      ...current,
      [name]: numericFields.includes(name) ? value.replace(/[^0-9]/g, '') : value
    }))
  }

  const clearForm = () => {
    setForm(initialApplicationForm)
    setMessage('')
  }

  const submitApplication = async event => {
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

  const fieldProps = { form, update: updateField }
  const gridColumns = { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing={1.2}>
            Citizen Service
          </Typography>
          <Typography component="h1" variant="h4" fontWeight={800} letterSpacing="-.8px">
            Register Application
          </Typography>
        </Box>
        <Chip
          label="New Application"
          color="primary"
          variant="outlined"
          sx={{ mt: { xs: 1.5, md: 0 }, fontWeight: 700, borderRadius: 2 }}
        />
      </Stack>

      <Paper variant="outlined" sx={{ px: { xs: 1.5, md: 3 }, py: 2, mb: 2.5, borderRadius: 3, borderColor: '#dde6f0' }}>
        <Stepper alternativeLabel>
          {['Applicant', 'Address', 'Scheme'].map(label => (
            <Step key={label} active>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {message && (
        <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2.5, borderRadius: 2.5 }}>
          {message}
        </Alert>
      )}

      <Box component="form" onSubmit={submitApplication}>
        <Stack spacing={2.5}>
          <FormSection
            title="Applicant Information"
            icon={<PersonOutlineOutlinedIcon />}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 2 }}>
              <FormField label="Applicant Name" name="applicantName" required {...fieldProps} />
              <FormField label="Father / Mother / Guardian Name" name="guardianName" {...fieldProps} />
              <FormField label="Date of Birth" name="dateOfBirth" required type="date" {...fieldProps} />
              {/* <FormField label="Gender" name="gender" options={genderOptions} {...fieldProps} /> */}
              <FormField label="Aadhaar Number" name="aadhaarNumber" required helperText="12-digit number" maxLength={12} {...fieldProps} />
              <FormField label="Mobile Number" name="mobileNumber" required type="tel" helperText="10-digit number" maxLength={10} {...fieldProps} />
            </Box>
          </FormSection>

          <FormSection
            title="Address Information"
            icon={<LocationOnOutlinedIcon />}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 2 }}>
              <FormField label="District" name="district" required options={districtOptions} {...fieldProps} />
              <FormField label="Block" name="block" {...fieldProps} />
              <FormField label="Gram Panchayat" name="gramPanchayat" {...fieldProps} />
              <FormField label="Village / Town" name="village" {...fieldProps} />
              <FormField label="Address" name="address" {...fieldProps} />
              <FormField label="PIN Code" name="pincode" helperText="6-digit PIN code" maxLength={6} {...fieldProps} />
            </Box>
          </FormSection>

          <FormSection
            title="Scheme & Financial Details"
            icon={<AccountBalanceOutlinedIcon />}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 2 }}>
              <FormField label="Category" name="category" options={categoryOptions} {...fieldProps} />
              <FormField label="Scheme Name" name="schemeName" required options={schemeOptions} {...fieldProps} />
              <FormField label="Annual Income" name="annualIncome" type="number" {...fieldProps} />
              <FormField label="Bank Name" name="bankName" {...fieldProps} />
              <FormField label="Account Number" name="accountNumber" {...fieldProps} />
              <FormField label="IFSC Code" name="ifscCode" {...fieldProps} />
              <FormField label="Email Address" name="email" type="email" {...fieldProps} />
            </Box>
          </FormSection>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5ebf3', bgcolor: '#f8fafc' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Please review all details before submission.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width={{ xs: '100%', sm: 'auto' }}>
                <Button variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={clearForm} sx={{ minHeight: 48 }}>
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}
                  disabled={saving}
                  sx={{ minWidth: { xs: '100%', sm: 210 }, minHeight: 48, boxShadow: '0 8px 22px rgba(29,93,153,.24)' }}
                >
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
