import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Building2, Briefcase, UserCheck, Calendar, CheckCircle, TrendingUp, Activity, Clock, ArrowUpRight, ChevronRight, AlertCircle, XCircle } from 'lucide-react'
import { fetchDashboardData } from '../lib/dashboardService'
import { fetchCancelamentos } from '../lib/cancelamentosService'
import { useAuth } from '../context/AuthContext'

// ── Hooks ─────────────────────────────────────────────────────

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

// ── Animações ─────────────────────────────────────────────────

function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) { setVal(0); return }
    let start = 0
    const step = Math.max(1, Math.ceil(target / 40))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(start)
    }, 28)
    return () => clearInterval(timer)
  }, [target])
  return <>{val}</>
}

// ── Configuração dos KPI cards ────────────────────────────────

const KPI_CARDS = [
  { label: 'Leads Ativos',       key: 'leadsAtivos',          icon: Users,       color: '#3b82f6', glow: 'rgba(59,130,246,0.08)',  trend: 'Ativos',      path: '/leads'      },
  { label: 'Empresas',           key: 'totalEmpresas',         icon: Building2,   color: '#a855f7', glow: 'rgba(168,85,247,0.08)',  trend: 'Cadastradas', path: '/empresas'   },
  { label: 'Vagas Abertas',      key: 'vagasAbertas',          icon: Briefcase,   color: '#f59e0b', glow: 'rgba(245,158,11,0.08)',  trend: 'Abertas',     path: '/candidatos' },
  { label: 'Candidatos Ativos',  key: 'candidatosAtivos',      icon: UserCheck,   color: '#22c55e', glow: 'rgba(34,197,94,0.08)',   trend: 'Em processo', path: '/candidatos' },
  { label: 'Reuniões Agendadas', key: 'reunioesAgendadas',     icon: Calendar,    color: '#ef4444', glow: 'rgba(239,68,68,0.08)',   trend: 'Próximas',    path: '/agenda'     },
  { label: 'Contratações',       key: 'contratacoesFechadas',  icon: CheckCircle, color: '#10b981', glow: 'rgba(16,185,129,0.08)',  trend: 'Fechadas',    path: '/relatorios' },
]

const COLOR_RGB = {
  '#3b82f6': '59,130,246',
  '#a855f7': '168,85,247',
  '#f59e0b': '245,158,11',
  '#22c55e': '34,197,94',
  '#ef4444': '239,68,68',
  '#10b981': '16,185,129',
}

const ACTIVITY_ICONS = { 'user-plus': Users, 'calendar': Calendar, 'check-circle': CheckCircle, 'file-text': Briefcase, 'send': ArrowUpRight }

// ── Tooltip customizado ───────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 13px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#64748b', marginBottom: 5, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, margin: '2px 0' }}>{p.name}: <strong style={{ color: '#0f172a' }}>{p.value}</strong></p>
      ))}
    </div>
  )
}

// ── Skeleton dos KPI cards ────────────────────────────────────

function KpiSkeleton({ count }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 5 }} />
          </div>
          <div className="skeleton" style={{ width: '50%', height: 26, borderRadius: 6, marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton" style={{ width: '60%', height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 13, height: 13, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </>
  )
}

// ── Dados padrão enquanto carrega ─────────────────────────────

const EMPTY_FUNIL = [
  { name: 'Total Leads', fill: '#3b82f6', count: 0, value: 0 },
  { name: 'Contato',     fill: '#a855f7', count: 0, value: 0 },
  { name: 'Reunião',     fill: '#f59e0b', count: 0, value: 0 },
  { name: 'Proposta',    fill: '#f97316', count: 0, value: 0 },
  { name: 'Fechado',     fill: '#22c55e', count: 0, value: 0 },
]

// ── Componente principal ──────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const w = useWindowWidth()
  const isSmall = w < 900

  const kpiCols    = isSmall ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
  const chartCols  = isSmall ? '1fr' : '1fr 1fr'
  const bottomCols = isSmall ? '1fr' : '1fr 300px'

  const [dashData,      setDashData]      = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [cancelamentos, setCancelamentos] = useState([])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dash, cancels] = await Promise.all([fetchDashboardData(), fetchCancelamentos()])
      setDashData(dash)
      setCancelamentos(cancels)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  function tempoRelativo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'agora'
    if (mins < 60) return `há ${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `há ${hrs}h`
    const days = Math.floor(hrs / 24)
    return `há ${days}d`
  }

  const kpis       = dashData?.kpis
  const funil      = dashData?.funil      ?? EMPTY_FUNIL
  const atividades = dashData?.atividades ?? []
  const heroStats  = dashData?.heroStats  ?? { conversao: '—', emProcesso: '— candidatos' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbff 100%)',
          border: '1px solid #e4e4e7', borderRadius: 16, padding: isSmall ? '22px 22px' : '28px 32px',
          position: 'relative', overflow: 'hidden', cursor: 'default',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 90% at 90% 50%, rgba(239,68,68,0.05), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 30% 40% at 5% 15%, rgba(59,130,246,0.04), transparent)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20, padding: '3px 10px', marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, letterSpacing: 0.8 }}>SISTEMA ATIVO</span>
          </div>
          <h1 style={{ fontSize: isSmall ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.25 }}>
            Olá, {user?.name?.split(' ')[0]} 👋<br />
            <span style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Staffing Brasil CRM
            </span>
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 440, lineHeight: 1.6, marginBottom: 18 }}>
            Gerencie recrutamento, clientes, candidatos e oportunidades em um único painel.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { icon: TrendingUp, color: '#22c55e', rgb: '34,197,94',   text: 'Conversão',   value: heroStats.conversao   },
              { icon: Activity,   color: '#3b82f6', rgb: '59,130,246',  text: 'Em processo', value: heroStats.emProcesso  },
            ].map(({ icon: Icon, color, rgb, text, value }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, background: `rgba(${rgb},0.1)`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>{text}: <strong style={{ color: '#1f2937' }}>{value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{error}</span>
          <button onClick={loadDashboard} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Recarregar</button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: 14 }}>
        {loading ? (
          <KpiSkeleton count={6} />
        ) : (
          KPI_CARDS.map((kpi, i) => {
            const Icon = kpi.icon
            const val  = kpis?.[kpi.key] ?? 0
            return (
              <motion.div key={kpi.key}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35 }}
                onClick={() => navigate(kpi.path)}
                whileHover={{ y: -3, borderColor: '#cbd5e1' }}
                style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${kpi.glow}, transparent)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative' }}>
                  <div style={{ width: 34, height: 34, background: `rgba(${COLOR_RGB[kpi.color]},0.08)`, border: `1px solid ${kpi.color}22`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} style={{ color: kpi.color }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 5, padding: '2px 7px' }}>
                    <TrendingUp size={9} style={{ color: '#22c55e' }} />
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>{kpi.trend}</span>
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: -1, lineHeight: 1, position: 'relative' }}>
                  <AnimatedNumber target={val} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{kpi.label}</span>
                  <ChevronRight size={13} style={{ color: '#9ca3af' }} />
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: chartCols, gap: 16 }}>
        {/* Pipeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Pipeline Comercial</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Leads por mês</div>
            </div>
            <span style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>{new Date().getFullYear()}</span>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={dashData?.chartPipeline ?? []}>
              <defs>
                <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="Leads" stroke="#ef4444" strokeWidth={2.5} fill="url(#pipelineGrad)" dot={{ fill: '#ef4444', r: 4, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recrutamento */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Recrutamento</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Candidatos × Contratados</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ color: 'rgba(59,130,246,0.5)', label: 'Cand.' }, { color: '#ef4444', label: 'Contrat.' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={dashData?.chartRecrutamento ?? []} barSize={9} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="candidatos" name="Candidatos"  fill="rgba(59,130,246,0.5)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="contratados" name="Contratados" fill="#ef4444"              radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: bottomCols, gap: 16 }}>
        {/* Funil de conversão */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Funil de Conversão</div>
            {loading && <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 3 }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funil.map((item, i) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.fill }} />
                    <span style={{ fontSize: 12, color: '#475569' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!loading && item.count > 0 && (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.count}</span>
                    )}
                    <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{item.value}%</span>
                  </div>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: loading ? '0%' : `${item.value}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${item.fill}, ${item.fill}dd)`, borderRadius: 3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Atividade recente */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Atividade Recente</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '90%', height: 12, borderRadius: 3, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: '45%', height: 10, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : atividades.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingTop: 20 }}>Sem atividade recente</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {atividades.map((a, i) => {
                const Icon = ACTIVITY_ICONS[a.icon] || Activity
                return (
                  <motion.div key={a.id}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.07 }}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <div style={{ width: 28, height: 28, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={12} style={{ color: '#64748b' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{a.texto}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Clock size={9} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>{a.tempo}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Cancelamentos ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Cancelamentos Recentes</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Reuniões canceladas ou excluídas com motivo registrado</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '2px 10px' }}>
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>{cancelamentos.length}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '55%', height: 13, borderRadius: 3, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: '80%', height: 11, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        ) : cancelamentos.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Nenhum cancelamento registrado</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {cancelamentos.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.58 + i * 0.05 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < cancelamentos.length - 1 ? '1px solid #f8f9fa' : 'none' }}
              >
                <div style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <XCircle size={14} style={{ color: '#ef4444' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{c.titulo}</span>
                    <span style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{c.tipo}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#ef4444', fontStyle: 'italic', marginBottom: 4 }}>"{c.motivo}"</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>por <strong style={{ color: '#374151' }}>{c.cancelado_por_nome || c.cancelado_por_email}</strong></span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>·</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} style={{ color: '#9ca3af' }} />
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{tempoRelativo(c.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.4) } 50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(239,68,68,0) } }`}</style>
    </div>
  )
}
