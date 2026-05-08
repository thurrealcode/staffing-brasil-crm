import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Building2, UserCheck, GitBranch,
  Calendar, MessageSquare, BarChart3, Settings,
  Sparkles, ChevronLeft, ChevronRight, LogOut, PhoneCall
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Comercial',
    items: [
      { to: '/prospeccao', icon: PhoneCall, label: 'Prospecção' },
      { to: '/leads', icon: Users, label: 'Leads' },
      { to: '/empresas', icon: Building2, label: 'Empresas' },
      { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
    ]
  },
  {
    label: 'Recrutamento',
    items: [
      { to: '/candidatos', icon: UserCheck, label: 'Candidatos' },
      { to: '/agenda', icon: Calendar, label: 'Agenda' },
    ]
  },
  {
    label: 'Comunicação',
    items: [
      { to: '/mensagens', icon: MessageSquare, label: 'Mensagens', badge: 3 },
      { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
      { to: '/ia', icon: Sparkles, label: 'IA Integrada' },
    ]
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0b 100%)',
        borderRight: '1px solid #1c1c20',
        display: 'flex', flexDirection: 'column',
        zIndex: 50, overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid #1c1c20', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64, flexShrink: 0 }}>
        <motion.div
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          style={{
            width: 32, height: 32, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 0 20px rgba(239,68,68,0.35)',
          }}
        >
          <span style={{ color: 'white', fontWeight: 800, fontSize: 13, letterSpacing: -0.5 }}>SB</span>
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Staffing Brasil</div>
              <div style={{ fontSize: 10, color: '#3f3f46', fontWeight: 500, letterSpacing: 0.3 }}>CRM Enterprise</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>
                  {section.label}
                </motion.div>
              )}
            </AnimatePresence>
            {collapsed && si > 0 && (
              <div style={{ height: 1, background: '#1c1c20', margin: '6px 10px' }} />
            )}
            {section.items.map(({ to, icon: Icon, label, badge }) => (
              <NavLink key={to} to={to} title={collapsed ? label : undefined}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                style={{ position: 'relative', justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <Icon size={15} className="icon" style={{ flexShrink: 0, minWidth: 15 }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', flex: 1 }}>
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {badge && !collapsed && (
                  <AnimatePresence>
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
                      {badge}
                    </motion.span>
                  </AnimatePresence>
                )}
                {badge && collapsed && (
                  <div style={{ position: 'absolute', top: 6, right: 8, width: 7, height: 7, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #1c1c20', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
        {/* User */}
        <NavLink to="/configuracoes" title={collapsed ? 'Configurações' : undefined}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div style={{
            width: 26, height: 26, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{user?.avatar || 'SB'}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: '#52525b' }}>{user?.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && <Settings size={13} style={{ color: '#52525b', flexShrink: 0 }} />}
        </NavLink>

        <button onClick={handleLogout} className="sidebar-item" title={collapsed ? 'Sair' : undefined}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', color: '#52525b' }}>
          <LogOut size={14} style={{ flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Toggle */}
        <button onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 7,
            borderRadius: 8, background: 'none', border: '1px solid #1c1c20', color: '#3f3f46',
            cursor: 'pointer', transition: 'all 0.15s ease', width: '100%', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#71717a' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1c1c20'; e.currentTarget.style.color = '#3f3f46' }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </motion.aside>
  )
}
