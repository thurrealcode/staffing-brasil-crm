import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Plus, Menu, LayoutDashboard, Users, Building2, UserCheck, GitBranch, Calendar, MessageSquare, BarChart3, Sparkles, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PAGE_META = {
  '/dashboard':    { title: 'Dashboard',            icon: LayoutDashboard },
  '/leads':        { title: 'Leads',                icon: Users },
  '/empresas':     { title: 'Empresas',             icon: Building2 },
  '/candidatos':   { title: 'Candidatos',           icon: UserCheck },
  '/pipeline':     { title: 'Pipeline Comercial',   icon: GitBranch },
  '/agenda':       { title: 'Agenda',               icon: Calendar },
  '/mensagens':    { title: 'Mensagens',            icon: MessageSquare },
  '/relatorios':   { title: 'Relatórios',           icon: BarChart3 },
  '/ia':           { title: 'IA Integrada',         icon: Sparkles },
  '/configuracoes':{ title: 'Configurações',        icon: Settings },
}

const QUICK_LINKS = [
  { label: 'Novo Lead',       path: '/leads',      icon: Users },
  { label: 'Nova Empresa',    path: '/empresas',   icon: Building2 },
  { label: 'Novo Candidato',  path: '/candidatos', icon: UserCheck },
  { label: 'Novo Evento',     path: '/agenda',     icon: Calendar },
]

const TYPE_DOT = {
  message:   '#3b82f6',
  lead:      '#a855f7',
  candidato: '#22c55e',
  agenda:    '#f59e0b',
  info:      '#ef4444',
}

export default function Header({ isMobile, onMobileMenu }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [notifications, setNotifications] = useState([])
  const notifRef = useRef(notifications)

  useEffect(() => { notifRef.current = notifications }, [notifications])

  const meta = PAGE_META[location.pathname] || { title: 'CRM', icon: LayoutDashboard }
  const PageIcon = meta.icon
  const unreadCount = notifications.filter(n => !n.read).length

  // Fetch notifications on mount
  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data || []))
  }, [user])

  // Realtime: new notifications
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const marcarLidas = async () => {
    if (!user || unreadCount === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  const handleNotifClick = async (n) => {
    setNotifOpen(false)
    if (!n.read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    }
    if (n.link) navigate(n.link)
  }

  const formatTime = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
    if (diff < 1) return 'agora'
    if (diff < 60) return `${diff}min`
    if (diff < 1440) return `${Math.floor(diff / 60)}h`
    return `${Math.floor(diff / 1440)}d`
  }

  return (
    <header style={{
      height: 56,
      background: 'rgba(255,255,255,0.97)',
      borderBottom: '1px solid #e4e4e7',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
      position: 'sticky', top: 0, zIndex: 40,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>

      {isMobile && (
        <button onClick={onMobileMenu}
          style={{ width: 34, height: 34, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}>
          <Menu size={16} />
        </button>
      )}

      {/* Page title */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ width: 26, height: 26, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PageIcon size={13} style={{ color: '#ef4444' }} />
        </div>
        <h1 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.title}
        </h1>
      </div>

      {/* Search */}
      {!isMobile && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#0f172a', padding: '6px 12px 6px 30px', borderRadius: 8, fontSize: 12, width: 200, outline: 'none', fontFamily: 'inherit', transition: 'width 0.2s, border-color 0.2s' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(239,68,68,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.08)'; e.target.style.width = '240px' }}
            onBlur={e => { e.target.style.borderColor = '#e4e4e7'; e.target.style.boxShadow = 'none'; e.target.style.width = '200px'; setSearch('') }}
          />
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setNotifOpen(v => !v); setQuickOpen(false) }}
          style={{ width: 34, height: 34, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', color: '#64748b', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#0f172a' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#64748b' }}
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, delay: 0.5 }}
              style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px rgba(239,68,68,0.5)', border: '1.5px solid #ffffff' }}
            />
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setNotifOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ position: 'absolute', right: 0, top: 42, width: 320, background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 14, zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notificações</span>
                    {unreadCount > 0 && (
                      <span style={{ background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <span onClick={marcarLidas} style={{ fontSize: 11, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}>Marcar lidas</span>
                  )}
                </div>

                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                      <Bell size={22} style={{ color: '#d1d5db', marginBottom: 8 }} />
                      <div style={{ fontSize: 13, color: '#9ca3af' }}>Nenhuma notificação</div>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <motion.div key={n.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          padding: '11px 16px',
                          borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          cursor: n.link ? 'pointer' : 'default',
                          background: !n.read ? 'rgba(59,130,246,0.03)' : 'transparent',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(59,130,246,0.03)' : 'transparent'}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_DOT[n.type] || '#ef4444', flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: !n.read ? '#1f2937' : '#6b7280', lineHeight: 1.4 }}>{n.content}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{formatTime(n.created_at)}</div>
                        </div>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 6 }} />}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Quick add */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setQuickOpen(v => !v); setNotifOpen(false) }} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
          <Plus size={13} />
          {!isMobile && 'Novo'}
        </button>

        <AnimatePresence>
          {quickOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setQuickOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
                style={{ position: 'absolute', right: 0, top: 42, width: 200, background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              >
                <div style={{ padding: '8px 0' }}>
                  {QUICK_LINKS.map((link, i) => {
                    const Icon = link.icon
                    return (
                      <motion.button key={link.path}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => { navigate(link.path); setQuickOpen(false) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s, color 0.12s', textAlign: 'left' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#0f172a' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569' }}
                      >
                        <Icon size={13} style={{ flexShrink: 0 }} />
                        {link.label}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
