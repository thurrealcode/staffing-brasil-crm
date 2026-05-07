import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Download, Calendar, Users, Building2,
  UserCheck, Briefcase, Target, AlertCircle, RefreshCw
} from 'lucide-react'
import { fetchRelatoriosData } from '../lib/relatoriosService'

// ── Constantes ────────────────────────────────────────────────

const PERIODO_OPTS = ['Últimos 7 dias', 'Últimos 30 dias', 'Últimos 3 meses', 'Este ano']

// Config estática dos KPI cards (ícone + cor são imutáveis)
const KPI_CONFIG = [
  { label: 'Total de Leads',        key: 'totalLeads',   icon: Users,      color: '#3b82f6', rgb: '59,130,246'   },
  { label: 'Taxa de Conversão',     key: 'conversao',    icon: Target,     color: '#a855f7', rgb: '168,85,247'  },
  { label: 'Empresas Ativas',       key: 'empresas',     icon: Building2,  color: '#f59e0b', rgb: '245,158,11'  },
  { label: 'Candidatos Colocados',  key: 'contratados',  icon: UserCheck,  color: '#10b981', rgb: '16,185,129'  },
  { label: 'Vagas Abertas',         key: 'vagasAbertas', icon: Briefcase,  color: '#22c55e', rgb: '34,197,94'   },
  { label: 'Reuniões / Eventos',    key: 'reunioes',     icon: Calendar,   color: '#ef4444', rgb: '239,68,68'   },
]

// ── Tooltips ──────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: '#71717a', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill || '#fafafa', margin: '2px 0' }}>
          {p.name}: <strong style={{ color: '#fafafa' }}>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 55, height: 20, borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ width: '55%', height: 22, borderRadius: 5, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
        </div>
      ))}
    </>
  )
}

function ChartSkeleton({ height = 220 }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 8px' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton" style={{ flex: 1, height: `${40 + Math.random() * 60}%`, borderRadius: '4px 4px 0 0' }} />
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export default function Relatorios() {
  const [periodo,  setPeriodo]  = useState('Últimos 3 meses')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchRelatoriosData(periodo))
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { loadData() }, [loadData])

  // Atalhos com fallback para estado vazio
  const kpisMap          = data?.kpisMap          ?? {}
  const chartLeads       = data?.chartLeads       ?? []
  const funil            = data?.funil            ?? []
  const segmentos        = data?.segmentos        ?? []
  const recrutamento     = data?.recrutamento     ?? []
  const contratadosPorMes= data?.contratadosPorMes ?? []
  const totalContratados = data?.totalContratados  ?? 0
  const contratadosTrend = data?.contratadosTrend  ?? { label: '—', positive: true }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>Relatórios</h2>
          <p style={{ fontSize: 13, color: '#52525b' }}>Visão analítica de desempenho comercial e recrutamento</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111113', border: '1px solid #27272a', borderRadius: 8, padding: '8px 12px' }}>
            <Calendar size={13} style={{ color: '#52525b' }} />
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fafafa', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              {PERIODO_OPTS.map(p => <option key={p} style={{ background: '#18181b' }}>{p}</option>)}
            </select>
          </div>
          <button onClick={loadData} title="Atualizar"
            style={{ background: '#111113', border: '1px solid #27272a', color: '#71717a', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={13} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: '#fca5a5', fontSize: 13, flex: 1 }}>{error}</span>
          <button onClick={loadData} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Recarregar</button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {loading ? <KpiSkeleton /> : KPI_CONFIG.map((kpi, i) => {
          const Icon = kpi.icon
          const d    = kpisMap[kpi.key] ?? { valor: '—', label: '—', positive: true }
          const variacao = d.variacao ?? d.label ?? '—'
          const positivo = d.positive ?? d.positivo ?? true
          return (
            <motion.div key={kpi.key}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: '18px 20px' }}
              whileHover={{ borderColor: '#27272a' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, background: `rgba(${kpi.rgb},0.1)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color: kpi.color }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: positivo ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${positivo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 6, padding: '2px 7px' }}>
                  {positivo
                    ? <TrendingUp  size={10} style={{ color: '#22c55e' }} />
                    : <TrendingDown size={10} style={{ color: '#ef4444' }} />}
                  <span style={{ fontSize: 11, color: positivo ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{variacao}</span>
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: -0.5, lineHeight: 1 }}>{d.valor}</div>
              <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{kpi.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Leads por Mês (era: Receita vs Meta) ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>Leads por Mês</div>
          <div style={{ fontSize: 12, color: '#52525b' }}>Leads cadastrados vs fechados — últimos 6 meses</div>
        </div>
        {loading ? <ChartSkeleton height={220} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartLeads}>
              <defs>
                <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fechadosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c20" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#71717a' }} />
              <Area type="monotone" dataKey="leads"    name="Leads"    stroke="#ef4444" strokeWidth={2}   fill="url(#leadsGrad)"   dot={{ fill: '#ef4444', r: 3 }} />
              <Area type="monotone" dataKey="fechados" name="Fechados" stroke="#3b82f6" strokeWidth={2}   fill="url(#fechadosGrad)" strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* ── Funil + Segmentos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Funil de conversão */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>Funil de Conversão</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 20 }}>Leads no período selecionado</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div className="skeleton" style={{ width: '45%', height: 12, borderRadius: 3 }} />
                    <div className="skeleton" style={{ width: 40, height: 12, borderRadius: 3 }} />
                  </div>
                  <div className="skeleton" style={{ width: '100%', height: 5, borderRadius: 3 }} />
                </div>
              ))}
            </div>
          ) : funil.length === 0 ? (
            <p style={{ fontSize: 13, color: '#52525b', textAlign: 'center', paddingTop: 16 }}>Sem leads no período</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funil.map((item, i) => {
                const base   = funil[0]?.value || 1
                const widthPct = Math.round((item.value / base) * 100)
                return (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.fill }} />
                        <span style={{ fontSize: 12, color: '#a1a1aa' }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#fafafa', fontWeight: 600 }}>{item.value}</span>
                        {i > 0 && funil[0].value > 0 && (
                          <span style={{ fontSize: 11, color: '#52525b' }}>
                            ({widthPct}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ height: 5, background: '#1c1c20', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                        style={{ height: '100%', background: item.fill, borderRadius: 3 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Leads por Segmento */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>Leads por Segmento</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Distribuição percentual</div>
          {loading ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 140, height: 140, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ width: '60%', height: 12, borderRadius: 3 }} />
                    <div className="skeleton" style={{ width: 28, height: 12, borderRadius: 3 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : segmentos.length === 0 ? (
            <p style={{ fontSize: 13, color: '#52525b', textAlign: 'center', paddingTop: 16 }}>Sem dados no período</p>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={segmentos} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {segmentos.map((s, i) => <Cell key={i} fill={s.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {segmentos.map(s => (
                  <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.fill, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#a1a1aa' }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#fafafa', fontWeight: 600 }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Recrutamento + Contratados ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Funil de recrutamento */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>Funil de Recrutamento</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 20 }}>Candidatos em cada etapa por mês</div>
          {loading ? <ChartSkeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={recrutamento} barSize={8} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c20" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
                <Bar dataKey="triagem"    name="Triagem"    fill="rgba(59,130,246,0.5)"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="entrevista" name="Entrevista" fill="rgba(168,85,247,0.6)"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="aprovado"   name="Aprovado"   fill="rgba(245,158,11,0.7)"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="contratado" name="Contratado" fill="#ef4444"               radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Candidatos Contratados (era: Tempo Médio) */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>Candidatos Contratados</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 20 }}>Colocações no período</div>
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            {loading ? (
              <>
                <div className="skeleton" style={{ width: 60, height: 36, borderRadius: 6, margin: '0 auto 6px' }} />
                <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 3, margin: '0 auto 10px' }} />
                <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 6, margin: '0 auto' }} />
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#ef4444', letterSpacing: -1 }}>
                  {totalContratados}
                </div>
                <div style={{ fontSize: 12, color: '#52525b' }}>candidatos colocados</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: contratadosTrend.positive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${contratadosTrend.positive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 6, padding: '2px 8px', marginTop: 6 }}>
                  {contratadosTrend.positive
                    ? <TrendingUp  size={11} style={{ color: '#22c55e' }} />
                    : <TrendingDown size={11} style={{ color: '#ef4444' }} />}
                  <span style={{ fontSize: 11, color: contratadosTrend.positive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {contratadosTrend.label} vs anterior
                  </span>
                </div>
              </>
            )}
          </div>
          {loading ? <ChartSkeleton height={110} /> : (
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={contratadosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c20" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="contratados" name="Contratados" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  )
}
