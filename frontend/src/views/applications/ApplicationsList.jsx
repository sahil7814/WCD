import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, Drawer, IconButton, MenuItem, Paper,
  Stack, Tab, Tabs, TextField, Typography
} from '@mui/material'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { applicationService } from '../../services/applications/applicationService'
import { applicationFieldLabels } from './applicationFields'
import { bilingualLabel, useLanguage } from '../../i18n'

const fieldRows = [
  ['womanName', 'applicant_name', 'personalSection'],
  ['fatherHusbandName', 'guardian_name', 'personalSection'],
  ['mobileNumber', 'mobile_number', 'personalSection'],
  ['aadhaarNumber', 'aadhaar_number', 'personalSection'],
  ['womanCategory', 'woman_category', 'personalSection'],
  ['socialCategory', 'social_category', 'personalSection'],
  ['disabilityType', 'disability_type', 'disability'],
  ['disabilityPercentage', 'disability_percentage', 'disability'],
  ['villageName', 'village', 'address'],
  ['postOffice', 'post_office', 'address'],
  ['anganwadiCentre', 'anganwadi_centre', 'address'],
  ['gramPanchayat', 'gram_panchayat', 'address'],
  ['district', 'district', 'district'],
  ['assemblyConstituency', 'assembly_constituency', 'address'],
  ['cdpoBlock', 'cdpo_block', 'address'],
  ['annualIncome', 'annual_income', 'family'],
  ['daughtersUnder18', 'daughters_under18', 'family'],
  ['unmarriedDaughters18To45', 'unmarried_daughters18_to45', 'family'],
  ['sonsUnder18', 'sons_under18', 'family'],
  ['unmarriedSons18To27', 'unmarried_sons18_to27', 'family'],
  ['isBpl', 'is_bpl', 'personalSection']
]

export default function ApplicationsList({ adminView = false }) {
  const { language, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState([])
  const [tab, setTab] = useState(() => !adminView && new URLSearchParams(location.search).get('tab') === 'drafts' ? 'drafts' : 'submitted')
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      applicationService.getAll(),
      adminView ? Promise.resolve([]) : applicationService.getDrafts()
    ])
      .then(([applications, applicationDrafts]) => {
        if (active) {
          setRows(applications)
          setDrafts(applicationDrafts)
        }
      })
      .catch(loadError => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [adminView])

  const applicationId = new URLSearchParams(location.search).get('applicationId')
  const selected = rows.find(row => row.id === selectedId)
    || rows.find(row => row.id === applicationId)
    || null
  const districts = useMemo(() => [...new Set([
    ...rows.map(row => row.district),
    ...drafts.map(row => row.district)
  ].filter(Boolean))].sort(), [rows, drafts])

  const filteredRows = useMemo(() => rows.filter(row => {
    const text = search.trim().toLowerCase()
    const searchable = [
      row.application_number, row.applicant_name, row.guardian_name,
      row.mobile_number, row.district, row.village
    ].join(' ').toLowerCase()
    return (!text || searchable.includes(text))
      && (!district || row.district === district)
      && (!status || row.status === status)
  }), [rows, search, district, status])

  const filteredDrafts = useMemo(() => drafts.filter(draft => {
    const data = draft.form_data || {}
    const text = search.trim().toLowerCase()
    const searchable = [data.womanName, data.mobileNumber, draft.district].join(' ').toLowerCase()
    return (!text || searchable.includes(text)) && (!district || draft.district === district)
  }), [drafts, search, district])

  const changeTab = (_event, nextTab) => {
    setTab(nextTab)
    navigate({ pathname: '/applications', search: nextTab === 'drafts' ? '?tab=drafts' : '' }, { replace: true })
  }
  const closeDetails = () => {
    setSelectedId(null)
    if (applicationId) navigate('/applications', { replace: true })
  }

  const selectedFields = selected
    ? fieldRows.map(([formKey, dbKey, section]) => ({
      label: bilingualLabel(...applicationFieldLabels[formKey], language),
      value: selected[dbKey],
      section
    }))
    : []
  const statusLabel = {
    SUBMITTED: t('statusSubmitted'),
    PENDING: t('statusPending'),
    APPROVED: t('statusApproved'),
    REJECTED: t('statusRejected')
  }

  return (
    <Box className="modern-page">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2.5}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={800}>{t('portalSubtitle')}</Typography>
          <Typography component="h1" variant="h4" fontWeight={850}>{t('applications')}</Typography>
        </Box>
        {!adminView && <Button variant="contained" onClick={() => navigate('/applications/new')}>{t('startApplication')}</Button>}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper className="filter-panel">
        {!adminView && (
          <Tabs value={tab} onChange={changeTab} variant="scrollable" scrollButtons="auto">
            <Tab value="submitted" label={`${t('submittedTab')} (${rows.length})`} />
            <Tab value="drafts" label={`${t('initiatedTab')} (${drafts.length})`} />
          </Tabs>
        )}
        <Box className="filter-grid">
          <TextField
            size="small"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('search')}
            label={t('search')}
            slotProps={{ input: { startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> } }}
          />
          <TextField size="small" select label={t('district')} value={district} onChange={event => setDistrict(event.target.value)}>
            <MenuItem value="">{t('allDistricts')}</MenuItem>
            {districts.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          {(adminView || tab === 'submitted') && (
            <TextField size="small" select label={t('status')} value={status} onChange={event => setStatus(event.target.value)}>
              <MenuItem value="">{t('allStatuses')}</MenuItem>
              {['SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'].map(value => <MenuItem key={value} value={value}>{statusLabel[value]}</MenuItem>)}
            </TextField>
          )}
        </Box>
      </Paper>

      <Paper className="table-card">
        {loading
          ? <Typography className="empty-state">{t('loading')}</Typography>
          : tab === 'submitted'
            ? filteredRows.length === 0
              ? <Typography className="empty-state">{t('noApplications')}</Typography>
              : <Box className="modern-table-wrap">
                <table className="modern-table">
                  <thead><tr>
                    <th>{t('applicationNumber')}</th><th>{t('applicantName')}</th>
                    <th>{t('district')}</th><th>{t('mobile')}</th><th>{t('status')}</th><th>{t('actions')}</th>
                  </tr></thead>
                  <tbody>{filteredRows.map(row => (
                    <tr key={row.id}>
                      <td><strong>{row.application_number}</strong></td>
                      <td>{row.applicant_name}</td>
                      <td>{row.district}</td>
                      <td>{row.mobile_number || '—'}</td>
                      <td><Chip size="small" label={statusLabel[row.status] || row.status} color={row.status === 'APPROVED' ? 'success' : 'primary'} /></td>
                      <td><Button size="small" startIcon={<VisibilityOutlinedIcon />} onClick={() => setSelectedId(row.id)}>{t('view')}</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </Box>
            : filteredDrafts.length === 0
              ? <Typography className="empty-state">{t('noDrafts')}</Typography>
              : <Box className="modern-table-wrap">
                <table className="modern-table">
                  <thead><tr>
                    <th>{t('applicantName')}</th><th>{t('district')}</th><th>{t('mobile')}</th><th>{t('updated')}</th><th>{t('status')}</th><th>{t('actions')}</th>
                  </tr></thead>
                  <tbody>{filteredDrafts.map(draft => (
                    <tr key={draft.id}>
                      <td>{draft.form_data?.womanName || '—'}</td>
                      <td>{draft.district || '—'}</td>
                      <td>{draft.form_data?.mobileNumber || '—'}</td>
                      <td>{new Date(draft.updated_at).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}</td>
                      <td><Chip size="small" label={t('statusInitiated')} color="warning" /></td>
                      <td><Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => navigate(`/applications/drafts/${draft.id}`)}>{t('continue')}</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </Box>}
      </Paper>

      <Drawer open={Boolean(selected)} onClose={closeDetails} anchor="right" sx={{ '& .MuiDrawer-paper': { width: '100%', maxWidth: 720, boxSizing: 'border-box', bgcolor: '#f5f8fc' } }}>
        {selected && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box>
                <Typography variant="overline" color="primary.main">{t('applicationDetails')}</Typography>
                <Typography variant="h5" fontWeight={850}>{selected.applicant_name}</Typography>
                <Typography color="text.secondary">{selected.application_number} · {selected.district}</Typography>
              </Box>
              <IconButton onClick={closeDetails} aria-label={t('close')}><CloseOutlinedIcon /></IconButton>
            </Stack>
            <Stack spacing={2}>
              {['personalSection', 'disability', 'address', 'family'].map(section => {
                const items = selectedFields.filter(field => field.section === section && field.value)
                if (!items.length) return null
                return (
                  <Paper className="detail-section" key={section}>
                    <Typography fontWeight={800} mb={1}>{t(section)}</Typography>
                    <Box className="detail-grid">
                      {items.map(item => (
                        <Box key={item.label}>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography variant="body2" fontWeight={650}>{item.value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )
              })}
            </Stack>
          </Box>
        )}
      </Drawer>
    </Box>
  )
}
