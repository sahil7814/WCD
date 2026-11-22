import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { applicationService } from '../../services/applications/applicationService'

const emptyFilters = {
  search: '',
  district: '',
  status: ''
}

function DetailItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0, p: 1.25, border: '1px solid #edf1f5', borderRadius: '6px', bgcolor: '#fff' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.35, lineHeight: 1.35 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={750} sx={{ overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

function DetailSection({ title, step, fields }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', borderColor: '#dde6f0' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <Chip label={step} size="small" sx={{ height: 24, borderRadius: '5px', bgcolor: '#edf5fb', color: '#1d5d99', fontWeight: 800 }} />
        <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
        {fields.map(field => <DetailItem key={field.label} {...field} />)}
      </Box>
    </Paper>
  )
}

export default function ApplicationsList() {
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    applicationService.getAll()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  const districts = useMemo(() => [...new Set(rows.map(row => row.district).filter(Boolean))].sort(), [rows])
  const categories = useMemo(() => [...new Set(rows.map(row => row.social_category || row.category).filter(Boolean))].sort(), [rows])

  const filteredRows = useMemo(() => rows.filter(row => {
    const searchText = filters.search.trim().toLowerCase()
    const searchable = [
      row.application_number,
      row.applicant_name,
      row.guardian_name,
      row.mobile_number,
      row.aadhaar_number,
      row.district,
      row.village,
      row.anganwadi_centre,
      row.gram_panchayat
    ].join(' ').toLowerCase()

    return (!searchText || searchable.includes(searchText))
      && (!filters.district || row.district === filters.district)
      && (!filters.status || row.status === filters.status)
  }), [rows, filters])

  const updateFilter = event => {
    setFilters(current => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2.5}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight={800}>Records</Typography>
          <Typography component="h1" variant="h6" fontWeight={800}>All Applications</Typography>
        </Box>
        <Chip label={`${filteredRows.length} results`} sx={{ mt: { xs: 1, sm: 0 }, borderRadius: '6px', fontWeight: 700 }} />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: '8px', borderColor: '#dde6f0' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: '2fr 1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
          <TextField
            name="search"
            size="small"
            value={filters.search}
            onChange={updateFilter}
            placeholder="Search name, mobile, Aadhaar or application number"
            label="Search"
            slotProps={{ input: { startAdornment: <SearchOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> } }}
          />
          <TextField name="district" size="small" select label="District" value={filters.district} onChange={updateFilter}>
            <MenuItem value="">All districts</MenuItem>
            {districts.map(district => <MenuItem key={district} value={district}>{district}</MenuItem>)}
          </TextField>
          <TextField name="status" size="small" select label="Status" value={filters.status} onChange={updateFilter}>
            <MenuItem value="">All statuses</MenuItem>
            {['SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'].map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
        </Box>
        <Stack direction="row" justifyContent="flex-end" mt={1.5}>
          <Button
            size="small"
            variant="text"
            startIcon={<FilterAltOffOutlinedIcon />}
            onClick={() => setFilters(emptyFilters)}
          >
            Clear filters
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: '8px', borderColor: '#dde6f0', overflow: 'hidden' }}>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 850, '& th': { textAlign: 'left', bgcolor: '#f7f9fc', p: 1.5, fontSize: 12, color: '#64748b', borderBottom: '1px solid #e5ebf3' }, '& td': { p: 1.5, fontSize: 13, borderBottom: '1px solid #edf1f5' } }}>
            <thead>
              <tr>
                <th>Application No.</th>
                <th>Applicant Name</th>
                <th>Mobile</th>
                <th>District</th>
                <th>Category</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.id}>
                  <td><Typography variant="body2" fontWeight={800}>{row.application_number}</Typography></td>
                  <td>{row.applicant_name}</td>
                  <td>{row.mobile_number || '—'}</td>
                  <td>{row.district}</td>
                  <td>{row.social_category || row.category || '—'}</td>
                  <td><Chip size="small" label={row.status || 'SUBMITTED'} sx={{ borderRadius: '5px', height: 26 }} /></td>
                  <td>
                    <Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => setSelected(row)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {!filteredRows.length && (
                <tr><td colSpan="7" align="center"><Typography py={4} color="text.secondary">No applications found</Typography></td></tr>
              )}
            </tbody>
          </Box>
        </Box>
      </Paper>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        anchor="right"
        sx={{ '& .MuiDrawer-paper': { width: '100%', maxWidth: 680, boxSizing: 'border-box', bgcolor: '#f7f9fc' } }}
      >
        {selected && (
          <>
            <Box sx={{ position: 'sticky', top: 0, zIndex: 2, px: 3, py: 2, bgcolor: '#12355b', color: '#fff' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.75, letterSpacing: 1 }}>APPLICATION RECORD</Typography>
                  <Typography variant="h5" fontWeight={800} mt={0.25}>{selected.applicant_name || 'Applicant'}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.82, mt: 0.5 }}>
                    {selected.application_number} · {selected.district || 'District not specified'}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelected(null)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.10)' }}>
                  <CloseOutlinedIcon />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} mt={1.5}>
                <Chip size="small" label={selected.status || 'SUBMITTED'} sx={{ bgcolor: '#fff', color: '#12355b', fontWeight: 800, borderRadius: '5px' }} />
                <Chip size="small" label={selected.mobile_number || 'No mobile'} sx={{ bgcolor: 'rgba(255,255,255,.12)', color: '#fff', borderRadius: '5px' }} />
              </Stack>
            </Box>

            <Box sx={{ p: 3, pb: 11 }}>
              <Stack spacing={2}>
                <DetailSection title="Woman & Contact Details" step="1" fields={[
                  { label: 'Woman Name', value: selected.applicant_name },
                  { label: 'Father / Husband Name', value: selected.guardian_name },
                  { label: 'Mobile Number', value: selected.mobile_number },
                  { label: 'Aadhaar Number', value: selected.aadhaar_number },
                  { label: 'Woman Category', value: selected.woman_category },
                  { label: 'Social Category', value: selected.social_category || selected.category },
                  { label: 'BPL Family', value: selected.is_bpl }
                ]} />
                <DetailSection title="Disability Details" step="2" fields={[
                  { label: 'Disability Type', value: selected.disability_type },
                  { label: 'Disability Percentage', value: selected.disability_percentage ? `${selected.disability_percentage}%` : '' }
                ]} />
                <DetailSection title="Address Details" step="3" fields={[
                  { label: 'Village', value: selected.village },
                  { label: 'Post Office', value: selected.post_office },
                  { label: 'Anganwadi Centre', value: selected.anganwadi_centre },
                  { label: 'Gram Panchayat / Urban Body', value: selected.gram_panchayat },
                  { label: 'District', value: selected.district },
                  { label: 'Assembly Constituency', value: selected.assembly_constituency },
                  { label: 'CDPO Block', value: selected.cdpo_block }
                ]} />
                <DetailSection title="Income & Family Details" step="4" fields={[
                  { label: 'Annual Income', value: selected.annual_income ? `₹${selected.annual_income}` : '' },
                  { label: 'Daughters Under 18', value: selected.daughters_under18 },
                  { label: 'Unmarried Daughters 18–45', value: selected.unmarried_daughters18_to45 },
                  { label: 'Sons Under 18', value: selected.sons_under18 },
                  { label: 'Unmarried Sons 18–27', value: selected.unmarried_sons18_to27 }
                ]} />
                <Divider />
                <DetailSection title="Application Status" step="5" fields={[
                  { label: 'Status', value: selected.status },
                  { label: 'Submitted On', value: selected.created_at ? new Date(selected.created_at).toLocaleString('en-IN') : '' },
                  { label: 'Remarks', value: selected.remarks }
                ]} />
              </Stack>
            </Box>

            <Paper elevation={8} sx={{ position: 'fixed', bottom: 0, right: 0, width: { xs: '100%', sm: 680 }, p: 1.5, px: 3, borderTop: '1px solid #dde6f0', bgcolor: '#fff', zIndex: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Review complete application record</Typography>
                <Button variant="contained" onClick={() => setSelected(null)} sx={{ minWidth: 120 }}>Close</Button>
              </Stack>
            </Paper>
          </>
        )}
      </Drawer>
    </Box>
  )
}
