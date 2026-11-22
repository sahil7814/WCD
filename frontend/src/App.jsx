import { useEffect, useState } from 'react'
import { LayoutDashboard, ClipboardPlus, FileText, LogOut, Users, Clock3, CheckCircle2, AlertCircle, Menu, X } from 'lucide-react'
import { api } from './api'
import './premium.css'
import './professional.css'
import './login-enhanced.css'
import ApplicationForm from './views/applications/ApplicationForm'
import ApplicationsList from './views/applications/ApplicationsList'
import WomanApplicationForm from './views/applications/WomanApplicationForm'

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: 'admin@wcd.hp.gov.in', password: 'WCD@123' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event) => {
    event.preventEvent?.()
    event.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('wcd_token', data.token)
      onLogin(data.user)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  return <main className="login-page">
    <section className="login-brand">
      <div className="login-brand-logos">
        <img className="brand-mark" src="/wcd logo.jpg" alt="WCD Logo" />
        <img className="hp-brand-mark" src="/hplogo.jpg" alt="Government of Himachal Pradesh" />
      </div>
      <div className="login-title"><span>Government of Himachal Pradesh</span><h1>Women & Child Development</h1><p>Application Management Portal</p></div>
      <div className="brand-illustration"><div className="hill hill-one" /><div className="hill hill-two" /><div className="sun" /></div>
    </section>
    <section className="login-panel">
      <div className="login-card">
        <div className="login-card-logos">
          <img className="emblem" src="/wcd logo.jpg" alt="WCD Logo" />
          <img className="hp-emblem" src="/hplogo.jpg" alt="Government of Himachal Pradesh" />
        </div>
        <h2>Welcome back</h2><p>Sign in to manage applications</p>
        {error && <div className="alert-error"><AlertCircle size={18} />{error}</div>}
        <form onSubmit={submit}>
          <label>Email Address<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button className="primary-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="demo-note">Demo account is prefilled for local setup</div>
      </div>
    </section>
  </main>
}

function Sidebar({ page, setPage, user, onLogout }) {
  const [open, setOpen] = useState(false)
  const items = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'new', label: 'New Application', icon: ClipboardPlus }, { id: 'applications', label: 'Applications', icon: FileText }]
  return <>
    <button className="mobile-menu" onClick={() => setOpen(true)}><Menu /></button>
    <aside className={open ? 'sidebar open' : 'sidebar'}>
      <button className="sidebar-close" onClick={() => setOpen(false)}><X /></button>
      <div className="portal-logo"><img className="mini-emblem" src="/wcd logo.jpg" alt="WCD Logo" /><div><strong>WCD Portal</strong><small>Himachal Pradesh</small></div></div>
      <nav>{items.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setOpen(false) }}><Icon size={20} />{label}</button>)}</nav>
      <div className="sidebar-user"><div className="avatar">{user.fullName?.[0] || 'A'}</div><div><strong>{user.fullName}</strong><small>{user.role}</small></div><button title="Logout" onClick={onLogout}><LogOut size={18} /></button></div>
    </aside>
  </>
}

function Dashboard({ setPage }) {
  const [data, setData] = useState(null)
  useEffect(() => { api('/dashboard').then(setData).catch(() => setData({ total: 0, submitted: 0, approved: 0, pending: 0, recent: [] })) }, [])
  if (!data) return <div className="loading">Loading dashboard...</div>
  const cards = [
    { label: 'Total Applications', value: data.total, icon: Users, color: 'blue' },
    { label: 'Submitted', value: data.submitted, icon: FileText, color: 'violet' },
    { label: 'Pending Review', value: data.pending, icon: Clock3, color: 'amber' },
    { label: 'Approved', value: data.approved, icon: CheckCircle2, color: 'green' }
  ]
  return <><div className="page-heading"><div><p>Overview</p><h1>Dashboard</h1></div><button className="primary-button small" onClick={() => setPage('new')}>+ New Application</button></div>
    <div className="stat-grid">{cards.map(({ label, value, icon: Icon, color }) => <div className="stat-card" key={label}><div className={`stat-icon ${color}`}><Icon /></div><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
    <section className="panel"><div className="panel-heading"><h2>Recent Applications</h2><button onClick={() => setPage('applications')}>View all</button></div>
      <div className="table-wrap"><table><thead><tr><th>Application No.</th><th>Applicant</th><th>District</th><th>Scheme</th><th>Status</th></tr></thead><tbody>
        {data.recent.map(row => <tr key={row.id}><td>{row.application_number}</td><td>{row.applicant_name}</td><td>{row.district}</td><td>{row.scheme_name}</td><td><span className="status">{row.status}</span></td></tr>)}
        {!data.recent.length && <tr><td colSpan="5" className="empty">No applications registered yet</td></tr>}
      </tbody></table></div>
    </section>
  </>
}

function Applications() {
  return <ApplicationsList />
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('wcd_user') || 'null'))
  const [page, setPage] = useState('dashboard')
  const login = u => { localStorage.setItem('wcd_user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('wcd_token'); localStorage.removeItem('wcd_user'); setUser(null) }
  if (!user) return <Login onLogin={login} />
  return <div className="app-shell"><Sidebar page={page} setPage={setPage} user={user} onLogout={logout} /><main className="main-content"><header className="topbar"><div>Government of Himachal Pradesh</div><div className="date">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div></header><div className="content">{page === 'dashboard' && <Dashboard setPage={setPage} />} {page === 'new' && <WomanApplicationForm onSaved={() => setPage('applications')} />} {page === 'applications' && <Applications />}</div></main></div>
}
