import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Typography
} from '@mui/material'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { api } from '../../api'
import { useLanguage } from '../../i18n'
import { districtOptions } from '../applications/applicationFields'

const emptyEmployee = { fullName: '', email: '', district: '' }

export default function EmployeesPage() {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(emptyEmployee)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [search, setSearch] = useState('')

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return employees
    return employees.filter(employee => [
      employee.full_name, employee.email, employee.district
    ].some(value => String(value || '').toLowerCase().includes(query)))
  }, [employees, search])

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setEmployees(await api('/admin/employees'))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    api('/admin/employees')
      .then(result => { if (active) setEmployees(result) })
      .catch(loadError => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))

  const createEmployee = async event => {
    event.preventDefault()
    setCreating(true)
    setError('')
    setMessage('')
    setCreatedCredentials(null)
    try {
      const result = await api('/admin/employees', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      setForm(emptyEmployee)
      setMessage(t('employeeCreated'))
      setCreatedCredentials({
        email: result.employee.email,
        password: result.initialPassword
      })
      await loadEmployees()
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Box className="modern-page">
      <Box className="page-heading">
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={800}>{t('portalSubtitle')}</Typography>
          <Typography component="h1" variant="h4" fontWeight={850}>{t('employeeManagement')}</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Paper className="modern-form-section" component="form" onSubmit={createEmployee}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
          <PersonAddAlt1OutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>{t('createEmployee')}</Typography>
        </Stack>
        <Box className="employee-create-grid">
          <TextField name="fullName" label={t('fullName')} required value={form.fullName} onChange={update} inputProps={{ maxLength: 150 }} />
          <TextField name="email" label={t('email')} type="email" required value={form.email} onChange={update} />
          <TextField name="district" label={t('assignedDistrict')} select required value={form.district} onChange={update}>
            {districtOptions.map(district => <MenuItem key={district} value={district}>{district}</MenuItem>)}
          </TextField>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} mt={2.5}>
          <Typography variant="body2" color="text.secondary">{t('employeePasswordNote')}</Typography>
          <Button type="submit" variant="contained" disabled={creating} startIcon={<PersonAddAlt1OutlinedIcon />}>
            {creating ? t('loading') : t('createEmployee')}
          </Button>
        </Stack>
      </Paper>

      <Paper className="modern-form-section employee-list-section">
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} mb={2}>
          <Typography variant="h6" fontWeight={800}>{t('employeesList')}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t('searchEmployees')}
              aria-label={t('searchEmployees')}
              sx={{ minWidth: { sm: 340 } }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment>,
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')} aria-label={t('clearFilters')}>
                        <ClearOutlinedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <Chip label={search ? `${filteredEmployees.length} / ${employees.length} ${t('results')}` : `${employees.length} ${t('results')}`} />
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('passwordSecurityNote')}</Typography>
        {loading
          ? <Typography color="text.secondary">{t('loading')}</Typography>
          : filteredEmployees.length === 0
            ? <Typography color="text.secondary">{employees.length ? t('noEmployeeMatches') : t('noEmployees')}</Typography>
            : <Box className="employee-table-wrap">
              <table className="modern-table">
                <thead>
                <tr><th>{t('name')}</th><th>{t('username')}</th><th>{t('district')}</th><th>{t('password')}</th><th>{t('role')}</th></tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td>{employee.full_name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.district || '—'}</td>
                    <td>{createdCredentials?.email === employee.email
                      ? <code>{createdCredentials.password}</code>
                      : <Typography component="span" variant="caption" color="text.secondary">{t('passwordStoredHashed')}</Typography>}</td>
                      <td><Chip size="small" label={employee.role} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>}
      </Paper>
    </Box>
  )
}
