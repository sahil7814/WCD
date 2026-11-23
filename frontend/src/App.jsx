import { useCallback, useEffect, useState } from 'react'
import {
  BrowserRouter, Navigate, NavLink, Outlet, Route, Routes,
  useLocation, useNavigate
} from 'react-router-dom'
import { LogOut, Menu, X, AlertCircle, ClipboardPlus, FileText } from 'lucide-react'
import { Box, Button, MenuItem, Paper, Stack, TextField } from '@mui/material'
import { api } from './api'
import { LanguageProvider, useLanguage } from './i18n'
import { getSidebarMenuItems } from './navigation/sidebarMenus'
import { applicationService } from './services/applications/applicationService'
import {
  districtOptions, womanCategoryOptions, disabilityTypeOptions,
  socialCategoryOptions, yesNoOptions
} from './views/applications/applicationFields'
import ApplicationsList from './views/applications/ApplicationsList'
import WomanApplicationForm from './views/applications/WomanApplicationForm'
import EmployeesPage from './views/admin/EmployeesPage'
import DistrictReport from './views/admin/DistrictReport'
import './premium.css'
import './professional.css'
import './login-enhanced.css'

const initialDashboardFilters = {
  search: '',
  district: '',
  status: '',
  womanCategory: '',
  disabilityType: '',
  disabilityPercentage: '',
  socialCategory: '',
  isBpl: ''
}
const disabilityPercentageRanges = [
  ['zero', '0%'],
  ['1-25', '1–25%'],
  ['26-50', '26–50%'],
  ['51-75', '51–75%'],
  ['76-100', '76–100%'],
  ['unspecified', 'Not specified']
]

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem('wcd_user') || 'null')
  } catch {
    return null
  }
}

function Login({ registrationOpen, onLogin }) {
  const { language, toggleLanguage, t } = useLanguage()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [mode, setMode] = useState('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login'
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('wcd_token', data.token)
      onLogin(data.user)
    } catch (requestError) {
      setError(requestError.message || t('loginError'))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(current => current === 'signin' ? 'signup' : 'signin')
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-brand-logos">
          <img className="brand-mark" src="/wcd logo.jpg" alt="WCD Logo" />
          <img className="hp-brand-mark" src="/hplogo.jpg" alt="Government of Himachal Pradesh" />
        </div>
        <div className="login-title">
          <span>{t('portal')}</span>
          <h1>{t('portalSubtitle')}</h1>
          <p>Application Management Portal</p>
        </div>
        <div className="brand-illustration"><div className="hill hill-one" /><div className="hill hill-two" /><div className="sun" /></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-toolbar">
            <div className="login-card-logos">
              <img className="emblem" src="/wcd logo.jpg" alt="WCD Logo" />
              <img className="hp-emblem" src="/hplogo.jpg" alt="Government of Himachal Pradesh" />
            </div>
            <button type="button" className="language-toggle" onClick={toggleLanguage} aria-label="Change language">
              {language === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>
          <h2>{mode === 'signup' ? t('createAccount') : t('welcome')}</h2>
          <p>{mode === 'signup' ? t('createAccountSubtitle') : t('signInSubtitle')}</p>
          {error && <div className="alert-error"><AlertCircle size={18} />{error}</div>}
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <label>{t('fullName')}
                <input type="text" autoComplete="name" required maxLength={150} value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} />
              </label>
            )}
            <label>{t('email')}
              <input type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>{t('password')}
              <input type="password" required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
            </label>
            <button className="primary-button" disabled={loading}>
              {loading ? t('loading') : mode === 'signup' ? t('signUp') : t('signIn')}
            </button>
          </form>
          {registrationOpen && (
            <div className="auth-switch">
              {mode === 'signup' ? t('alreadyAccount') : t('newHere')}
              <button type="button" onClick={switchMode}>{mode === 'signup' ? t('signIn') : t('signUp')}</button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function Sidebar({ user, onLogout }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const items = getSidebarMenuItems(user, t)

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="portal-logo">
          <img className="mini-emblem" src="/wcd logo.jpg" alt="" />
          <div><strong>{t('portal')}</strong><small>{t('portalSubtitle')}</small></div>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="portal-nav">
          <span className="nav-caption">{t('overview')}</span>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user.fullName?.[0] || 'U'}</div>
          <div className="sidebar-user-details">
            <strong>{user.fullName}</strong>
            <small>{user.role === 'ADMIN' ? t('administrator') : `${t('employee')} · ${user.district || '—'}`}</small>
          </div>
          <button title={t('logout')} onClick={onLogout}><LogOut size={18} /></button>
        </div>
      </aside>
    </>
  )
}

function LanguageButton() {
  const { language, toggleLanguage, t } = useLanguage()
  return <button type="button" className="language-toggle" onClick={toggleLanguage}>{t('language')}<span>{language === 'en' ? 'EN' : 'हि'}</span></button>
}

function AdminUsersWidget() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/employees')
      .then(setUsers)
      .catch(requestError => setError(requestError.message))
  }, [])

  return (
    <section className="table-card admin-users-widget">
      <div className="section-heading">
        <div><p>{t('administrator')}</p><h2>{t('employeesList')}</h2></div>
        <button className="text-link" onClick={() => navigate('/admin/employees')}>{t('employeeManagement')}</button>
      </div>
      {error
        ? <div className="empty-state">{error}</div>
        : !users
          ? <div className="empty-state">{t('loading')}</div>
          : users.length === 0
            ? <div className="empty-state">{t('noEmployees')}</div>
            : <div className="modern-table-wrap">
              <table className="modern-table">
                <thead><tr><th>{t('name')}</th><th>{t('email')}</th><th>{t('district')}</th><th>{t('role')}</th></tr></thead>
                <tbody>{users.map(account => (
                  <tr key={account.id}>
                    <td>{account.full_name}</td>
                    <td>{account.email}</td>
                    <td>{account.district || '—'}</td>
                    <td>{account.role === 'ADMIN' ? t('administrator') : t('employee')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
    </section>
  )
}

function Dashboard({ user }) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [today] = useState(() => new Date())
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initialDashboardFilters)

  const loadDashboard = useCallback(async (nextFilters) => {
    try {
      setData(await applicationService.getDashboard(nextFilters))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    applicationService.getDashboard(initialDashboardFilters)
      .then(result => { if (active) setData(result) })
      .catch(requestError => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const updateFilter = event => {
    setFilters(current => ({ ...current, [event.target.name]: event.target.value }))
  }
  const applyFilters = event => {
    event.preventDefault()
    setError('')
    setLoading(true)
    loadDashboard(filters)
  }
  const resetFilters = () => {
    const clearedFilters = { ...initialDashboardFilters }
    setFilters(clearedFilters)
    setError('')
    setLoading(true)
    loadDashboard(clearedFilters)
  }

  if (!data && error) return <div className="alert-error"><AlertCircle size={18} />{error}</div>
  if (!data) return <div className="loading">{t('loading')}</div>

  const cards = [
    { label: t('submittedApplications'), value: data.submitted, icon: FileText, accent: 'blue' },
    { label: t('initiatedApplications'), value: data.initiated, icon: ClipboardPlus, accent: 'amber' }
  ]
  const statusLabel = {
    SUBMITTED: t('statusSubmitted'),
    PENDING: t('statusPending'),
    APPROVED: t('statusApproved'),
    REJECTED: t('statusRejected')
  }

  return (
    <Box className="modern-page">
      <div className="dashboard-welcome">
        <div>
          <p>{t('overview')}{data.district ? ` · ${data.district}` : ''}</p>
          <h1>{t('dashboard')}</h1>
          <span>{today.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        {user.role !== 'ADMIN' && (
          <button className="primary-button" onClick={() => navigate('/applications/new')}>
            <ClipboardPlus size={18} />{t('startApplication')}
          </button>
        )}
      </div>

      {error && <div className="alert-error"><AlertCircle size={18} />{error}</div>}

      <Paper className="filter-panel">
        <Box component="form" className="dashboard-filter-grid" onSubmit={applyFilters}>
          <TextField
            name="search"
            size="small"
            label={t('dashboardSearch')}
            placeholder={t('dashboardSearchHint')}
            value={filters.search}
            onChange={updateFilter}
          />
          {user.role === 'ADMIN'
            ? <TextField name="district" size="small" select label={t('district')} value={filters.district} onChange={updateFilter}>
              <MenuItem value="">{t('allDistricts')}</MenuItem>
              {districtOptions.map(district => <MenuItem key={district} value={district}>{district}</MenuItem>)}
            </TextField>
            : <TextField size="small" label={t('district')} value={user.district || ''} disabled />}
          <TextField name="status" size="small" select label={t('status')} value={filters.status} onChange={updateFilter}>
            <MenuItem value="">{t('allStatuses')}</MenuItem>
            {['SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
              <MenuItem key={status} value={status}>{statusLabel[status]}</MenuItem>
            ))}
          </TextField>
          <TextField name="womanCategory" size="small" select label={t('womanCategory')} value={filters.womanCategory} onChange={updateFilter}>
            <MenuItem value="">{t('allWomanCategories')}</MenuItem>
            {womanCategoryOptions.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <TextField name="disabilityType" size="small" select label={t('disabilityType')} value={filters.disabilityType} onChange={updateFilter}>
            <MenuItem value="">{t('allDisabilityTypes')}</MenuItem>
            {disabilityTypeOptions.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <TextField name="disabilityPercentage" size="small" select label={t('disabilityPercentage')} value={filters.disabilityPercentage} onChange={updateFilter}>
            <MenuItem value="">{t('allDisabilityPercentages')}</MenuItem>
            {disabilityPercentageRanges.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField name="socialCategory" size="small" select label={t('socialCategory')} value={filters.socialCategory} onChange={updateFilter}>
            <MenuItem value="">{t('allSocialCategories')}</MenuItem>
            {socialCategoryOptions.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <TextField name="isBpl" size="small" select label={t('bpl')} value={filters.isBpl} onChange={updateFilter}>
            <MenuItem value="">{t('allBplStatuses')}</MenuItem>
            {yesNoOptions.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={1} className="dashboard-filter-actions">
            <Button type="submit" variant="contained" disabled={loading}>{loading ? t('loading') : t('applyFilters')}</Button>
            <Button type="button" variant="outlined" onClick={resetFilters} disabled={loading}>{t('resetFilters')}</Button>
          </Stack>
        </Box>
      </Paper>

      <div className="stat-grid stat-grid-two">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <article className={`stat-card stat-card-modern ${accent}`} key={label}>
            <div className="stat-icon"><Icon size={22} /></div>
            <div><span>{label}</span><strong>{value}</strong></div>
          </article>
        ))}
      </div>

      {data.districtReport && (
        <DistrictReport report={data.districtReport} />
      )}

      <section className="table-card">
        <div className="section-heading">
          <div><p>{t('overview')}</p><h2>{t('recentSubmitted')}</h2></div>
          <NavLink className="text-link" to="/applications">{t('viewAll')}</NavLink>
        </div>
        <div className="modern-table-wrap">
          <table className="modern-table">
            <thead><tr>
              <th>{t('applicationNumber')}</th><th>{t('applicantName')}</th>
              <th>{t('district')}</th><th>{t('status')}</th><th>{t('actions')}</th>
            </tr></thead>
            <tbody>
              {data.recent.map(row => (
                <tr key={row.id}>
                  <td><strong>{row.application_number}</strong></td>
                  <td>{row.applicant_name}</td>
                  <td>{row.district}</td>
                  <td><span className="status-pill">{statusLabel[row.status] || row.status}</span></td>
                  <td><button className="text-link" onClick={() => navigate(`/applications?applicationId=${encodeURIComponent(row.id)}`)}>{t('view')}</button></td>
                </tr>
              ))}
              {!data.recent.length && <tr><td colSpan="5" className="empty-state">{t('noApplications')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {user.role === 'ADMIN' && <AdminUsersWidget />}
    </Box>
  )
}

function PortalShell({ user, onLogout }) {
  const { language, t } = useLanguage()
  const location = useLocation()
  const [today] = useState(() => new Date())
  return (
    <div className="app-shell modern-shell">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="main-content">
        <header className="topbar modern-topbar">
          <div className="topbar-title">{t('portal')}<span>{t('portalSubtitle')}</span></div>
          <div className="topbar-actions"><span className="topbar-date">{today.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span><LanguageButton /></div>
        </header>
        <div className="content modern-content" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function AppRouter() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(storedUser)
  const [registrationOpen, setRegistrationOpen] = useState(false)

  useEffect(() => {
    api('/auth/registration-status')
      .then(result => setRegistrationOpen(result.registrationOpen))
      .catch(() => setRegistrationOpen(false))
  }, [])

  const login = nextUser => {
    localStorage.setItem('wcd_user', JSON.stringify(nextUser))
    setUser(nextUser)
    navigate(location.pathname === '/' ? '/dashboard' : location.pathname, { replace: true })
  }
  const logout = () => {
    localStorage.removeItem('wcd_token')
    localStorage.removeItem('wcd_user')
    setUser(null)
    navigate('/', { replace: true })
  }

  if (!user) return <Login registrationOpen={registrationOpen} onLogin={login} />

  return (
    <Routes>
      <Route element={<PortalShell user={user} onLogout={logout} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/applications" element={<ApplicationsList adminView={user.role === 'ADMIN'} />} />
        <Route path="/applications/new" element={user.role === 'ADMIN' ? <Navigate to="/dashboard" replace /> : <WomanApplicationForm key="/applications/new" user={user} />} />
        <Route path="/applications/drafts/:draftId" element={user.role === 'ADMIN' ? <Navigate to="/dashboard" replace /> : <WomanApplicationForm key={location.pathname} user={user} />} />
        <Route path="/admin/employees" element={user.role === 'ADMIN' ? <EmployeesPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </LanguageProvider>
  )
}
