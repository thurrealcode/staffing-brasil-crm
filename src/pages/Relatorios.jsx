import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Download, Calendar, Users, Building2,
  UserCheck, Briefcase, Target, AlertCircle, RefreshCw, Loader2, Medal
} from 'lucide-react'
import { fetchRelatoriosData } from '../lib/relatoriosService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Exportar PDF ──────────────────────────────────────────────

function exportarPDF({ periodo, kpisMap, funil, segmentos, recrutamento, totalContratados, contratadosTrend }) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const agora = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const mesRef = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  // ── Header ──
  doc.setFillColor(15, 15, 17)
  doc.rect(0, 0, W, 36, 'F')

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(250, 250, 250)
  doc.text('Staffing Brasil CRM', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 160, 170)
  doc.text('Relatório de Desempenho · ' + periodo, 14, 24)
  doc.text('Gerado em ' + agora, 14, 30)

  doc.setFontSize(9)
  doc.setTextColor(239, 68, 68)
  doc.text('Referência: ' + mesRef, W - 14, 24, { align: 'right' })

  // ── Seção 1: KPIs ──
  let y = 46
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 35)
  doc.text('1. Indicadores-Chave (KPIs)', 14, y)
  y += 6

  const kpiRows = KPI_CONFIG.map(k => {
    const d = kpisMap[k.key] ?? {}
    return [k.label, String(d.valor ?? '—'), String(d.variacao ?? d.label ?? '—')]
  })

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor', 'Variação']],
    body: kpiRows,
    styles: { fontSize: 10, cellPadding: 4, textColor: [30, 30, 35] },
    headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 50, halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  // ── Seção 2: Funil de Conversão ──
  y = doc.lastAutoTable.finalY + 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 35)
  doc.text('2. Funil de Conversão', 14, y)
  y += 6

  const funilRows = funil.map((item, i) => {
    const base = funil[0]?.value || 1
    const pct  = i === 0 ? '100%' : Math.round((item.value / base) * 100) + '%'
    return [item.name, String(item.value), pct]
  })

  autoTable(doc, {
    startY: y,
    head: [['Etapa', 'Leads', '% do Topo']],
    body: funilRows.length ? funilRows : [['Sem dados no período', '—', '—']],
    styles: { fontSize: 10, cellPadding: 4, textColor: [30, 30, 35] },
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 40, halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  // ── Seção 3: Segmentos ──
  y = doc.lastAutoTable.finalY + 10

  if (y > 230) { doc.addPage(); y = 20 }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 35)
  doc.text('3. Leads por Segmento', 14, y)
  y += 6

  const segRows = segmentos.map(s => [s.name, String(s.value), s.pct + '%'])

  autoTable(doc, {
    startY: y,
    head: [['Segmento', 'Leads', 'Participação']],
    body: segRows.length ? segRows : [['Sem dados no período', '—', '—']],
    styles: { fontSize: 10, cellPadding: 4, textColor: [30, 30, 35] },
    headStyles: { fillColor: [168, 85, 247], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 40, halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  // ── Seção 4: Recrutamento ──
  y = doc.lastAutoTable.finalY + 10

  if (y > 220) { doc.addPage(); y = 20 }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 35)
  doc.text('4. Funil de Recrutamento', 14, y)
  y += 6

  const recrutRows = recrutamento.map(r => [
    r.name,
    String(r.triagem    ?? 0),
    String(r.entrevista ?? 0),
    String(r.aprovado   ?? 0),
    String(r.contratado ?? 0),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Mês', 'Triagem', 'Entrevista', 'Aprovado', 'Contratado']],
    body: recrutRows.length ? recrutRows : [['Sem dados', '—', '—', '—', '—']],
    styles: { fontSize: 9, cellPadding: 3.5, textColor: [30, 30, 35] },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: 30 } },
    margin: { left: 14, right: 14 },
  })

  // ── Sumário final ──
  y = doc.lastAutoTable.finalY + 10

  if (y > 240) { doc.addPage(); y = 20 }

  doc.setFillColor(248, 249, 250)
  doc.roundedRect(14, y, W - 28, 22, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 35)
  doc.text('Candidatos Colocados no Período', 20, y + 8)
  doc.setFontSize(16)
  doc.setTextColor(239, 68, 68)
  doc.text(String(totalContratados), 20, y + 18)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(contratadosTrend?.label ? contratadosTrend.label + ' vs período anterior' : '', 40, y + 18)

  // ── Footer em todas as páginas ──
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 170)
    doc.text('Staffing Brasil CRM · Confidencial', 14, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Página ${i} de ${pages}`, W - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }

  const nomeArquivo = `relatorio-staffing-${periodo.toLowerCase().replace(/\s+/g, '-')}.pdf`
  doc.save(nomeArquivo)
}

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
  const [periodo,    setPeriodo]    = useState('Últimos 3 meses')
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [exporting,  setExporting]  = useState(false)

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
  const desempenho       = data?.desempenho        ?? []

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
          <button
            className="btn-secondary"
            style={{ fontSize: 13, opacity: (loading || exporting) ? 0.6 : 1, cursor: (loading || exporting) ? 'not-allowed' : 'pointer' }}
            disabled={loading || exporting}
            onClick={async () => {
              setExporting(true)
              await new Promise(r => setTimeout(r, 50))
              try {
                exportarPDF({ periodo, kpisMap, funil, segmentos, recrutamento, totalContratados, contratadosTrend })
              } finally {
                setExporting(false)
              }
            }}
          >
            {exporting
              ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Gerando...</>
              : <><Download size={13} /> Exportar PDF</>}
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

      {/* ── Desempenho por Consultor ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
        style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Medal size={15} style={{ color: '#f59e0b' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>Desempenho por Consultor</div>
        </div>
        <div style={{ fontSize: 12, color: '#52525b', marginBottom: 20 }}>
          Leads cadastrados, reuniões agendadas e prospecções no período
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: 120, height: 13, borderRadius: 4 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '100%', height: 6, borderRadius: 3 }} />
                </div>
                <div className="skeleton" style={{ width: 30, height: 13, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : desempenho.length === 0 ? (
          <p style={{ fontSize: 13, color: '#52525b', textAlign: 'center', padding: '16px 0' }}>
            Nenhuma ação registrada no período
          </p>
        ) : (
          <>
            {/* Header da tabela */}
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 80px 100px 70px', gap: 8, alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
              <div />
              <div style={{ fontSize: 10, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Consultor</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Leads</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Reuniões</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Prospecções</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Total</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {desempenho.map((p, i) => {
                const maxTotal = desempenho[0]?.total || 1
                const barPct   = Math.round((p.total / maxTotal) * 100)
                const medal    = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c35' : null
                const initials = p.nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
                return (
                  <motion.div key={p.nome}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                    style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '12px 16px' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 80px 80px 100px 70px', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      {/* Avatar */}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: medal ? `${medal}22` : 'rgba(59,130,246,0.12)', border: `1.5px solid ${medal || 'rgba(59,130,246,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: medal || '#3b82f6', lineHeight: 1 }}>{initials}</span>
                      </div>

                      {/* Nome */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nome}
                        {medal && <span style={{ marginLeft: 6, fontSize: 14 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>}
                      </div>

                      {/* Leads */}
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{p.leads}</span>
                      </div>

                      {/* Reuniões */}
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{p.reunioes}</span>
                      </div>

                      {/* Prospecções */}
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{p.prospeccoes}</span>
                      </div>

                      {/* Total */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#fafafa' }}>{p.total}</span>
                      </div>
                    </div>

                    {/* Barra de progresso segmentada */}
                    <div style={{ height: 5, background: '#27272a', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      {p.leads > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(p.leads / p.total) * barPct}%` }} transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                          style={{ height: '100%', background: '#3b82f6' }} />
                      )}
                      {p.reunioes > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(p.reunioes / p.total) * barPct}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                          style={{ height: '100%', background: '#ef4444' }} />
                      )}
                      {p.prospeccoes > 0 && (
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(p.prospeccoes / p.total) * barPct}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                          style={{ height: '100%', background: '#f59e0b' }} />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'flex-end' }}>
              {[['#3b82f6', 'Leads'], ['#ef4444', 'Reuniões'], ['#f59e0b', 'Prospecções']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 11, color: '#52525b' }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

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
