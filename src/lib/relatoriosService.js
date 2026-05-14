import { supabase } from './supabase'

// ── Constantes ────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const SEG_FILLS   = ['#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#22c55e', '#52525b']

// ── Datas do período ──────────────────────────────────────────

function periodDates(periodo) {
  const now = new Date()
  let start, prevStart, prevEnd

  switch (periodo) {
    case 'Últimos 7 dias':
      start     = new Date(now.getTime() - 7  * 86400000)
      prevEnd   = new Date(start)
      prevStart = new Date(now.getTime() - 14 * 86400000)
      break
    case 'Últimos 30 dias':
      start     = new Date(now.getTime() - 30 * 86400000)
      prevEnd   = new Date(start)
      prevStart = new Date(now.getTime() - 60 * 86400000)
      break
    case 'Este ano':
      start     = new Date(now.getFullYear(), 0, 1)
      prevEnd   = new Date(start)
      prevStart = new Date(now.getFullYear() - 1, 0, 1)
      break
    default: // 'Últimos 3 meses'
      start     = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      prevEnd   = new Date(start)
      prevStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  return {
    start:        start.toISOString(),
    prevStart:    prevStart.toISOString(),
    prevEnd:      prevEnd.toISOString(),
    sixMonthsAgo: sixMonthsAgo.toISOString(),
  }
}

// ── Cálculo de tendência ──────────────────────────────────────

function calcTrend(curr, prev) {
  if (prev === 0 && curr === 0) return { label: '—',      positive: true }
  if (prev === 0)               return { label: 'Novo',   positive: true }
  const pct = Math.round(((curr - prev) / prev) * 100)
  return { label: pct >= 0 ? `+${pct}%` : `${pct}%`, positive: pct >= 0 }
}

// ── Builders dos gráficos ─────────────────────────────────────

function lastNMonths(n) {
  const now    = new Date()
  const months = {}
  for (let i = n - 1; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = MONTH_NAMES[d.getMonth()]
  }
  return months
}

export function buildLeadsChart(leads) {
  const months = lastNMonths(6)
  return Object.entries(months).map(([key, name]) => ({
    name,
    leads:    leads.filter(l => l.created_at?.slice(0, 7) === key).length,
    fechados: leads.filter(l => l.created_at?.slice(0, 7) === key && l.status === 'Fechado').length,
  }))
}

export function buildRelatoriosFunil(leads) {
  const total   = leads.length
  const countIn = (...ss) => leads.filter(l => ss.includes(l.status)).length
  return [
    { name: 'Leads',    fill: '#3b82f6', value: total },
    { name: 'Contato',  fill: '#a855f7', value: countIn('Contato Feito', 'Interessado', 'Reunião', 'Proposta', 'Fechado') },
    { name: 'Reunião',  fill: '#f59e0b', value: countIn('Reunião', 'Proposta', 'Fechado') },
    { name: 'Proposta', fill: '#f97316', value: countIn('Proposta', 'Fechado') },
    { name: 'Fechado',  fill: '#22c55e', value: countIn('Fechado') },
  ]
}

export function buildSegmentos(leads) {
  if (!leads.length) return []
  const counts = {}
  leads.forEach(l => {
    const seg = l.segmento?.trim() || 'Outros'
    counts[seg] = (counts[seg] || 0) + 1
  })
  const total = leads.length
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count], i) => ({
      name: name.length > 14 ? name.slice(0, 14) + '…' : name,
      value: count,                                    // para o PieChart (proporção)
      pct:   Math.round((count / total) * 100),        // para exibição em %
      fill:  SEG_FILLS[i % SEG_FILLS.length],
    }))
}

export function buildRecrutamento(candidatos) {
  const months = lastNMonths(6)
  return Object.entries(months).map(([key, name]) => {
    const inMonth = candidatos.filter(c => c.created_at?.slice(0, 7) === key)
    return {
      name,
      triagem:    inMonth.filter(c => c.status === 'Triagem').length,
      entrevista: inMonth.filter(c => c.status === 'Entrevista').length,
      aprovado:   inMonth.filter(c => c.status === 'Aprovado').length,
      contratado: inMonth.filter(c => c.status === 'Contratado').length,
    }
  })
}

export function buildContratadosPorMes(candidatos) {
  const months = lastNMonths(6)
  return Object.entries(months).map(([key, name]) => ({
    name,
    contratados: candidatos.filter(c => c.created_at?.slice(0, 7) === key && c.status === 'Contratado').length,
  }))
}

// ── Desempenho por consultor ──────────────────────────────────

export function buildDesempenho(leads, agenda, prospeccao) {
  const map = {}

  const add = (nome, field) => {
    const key = nome?.trim() || 'Sem responsável'
    if (!map[key]) map[key] = { nome: key, leads: 0, reunioes: 0, prospeccoes: 0 }
    map[key][field]++
  }

  leads.forEach(l => add(l.responsavel_nome, 'leads'))
  agenda.forEach(a => add(a.responsavel_nome, 'reunioes'))
  prospeccao.forEach(p => add(p.responsavel_nome, 'prospeccoes'))

  return Object.values(map)
    .map(p => ({ ...p, total: p.leads + p.reunioes + p.prospeccoes }))
    .sort((a, b) => b.total - a.total)
}

// ── Query principal ───────────────────────────────────────────

export async function fetchRelatoriosData(periodo) {
  const { start, prevStart, prevEnd, sixMonthsAgo } = periodDates(periodo)

  // 16 queries em paralelo — single round trip
  const [
    // Contagens do período atual
    rLeads, rFechados, rContratados, rAgenda,
    // Totais não periódicos
    rEmpresas, rVagas,
    // Contagens do período anterior (tendência)
    rLeadsPrev, rFechadosPrev, rContratadosPrev, rAgendaPrev,
    // Dados brutos para charts
    rPeriodLeads,   // leads do período → funil + segmentos
    rChartLeads,    // últimos 6 meses  → gráfico de área
    rChartCands,    // últimos 6 meses  → funil recrutamento + linha
    // Desempenho por consultor
    rDeseLeads, rDeseAgenda, rDeseProsp,
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', start),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', start).eq('status', 'Fechado'),
    supabase.from('candidatos').select('*', { count: 'exact', head: true }).gte('created_at', start).eq('status', 'Contratado'),
    supabase.from('agenda').select('*', { count: 'exact', head: true }).gte('created_at', start),

    supabase.from('empresas').select('*', { count: 'exact', head: true }),
    supabase.from('empresas').select('vagas_abertas'),

    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', prevEnd),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', prevEnd).eq('status', 'Fechado'),
    supabase.from('candidatos').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', prevEnd).eq('status', 'Contratado'),
    supabase.from('agenda').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', prevEnd),

    supabase.from('leads').select('status, segmento, created_at').gte('created_at', start),
    supabase.from('leads').select('status, created_at').gte('created_at', sixMonthsAgo).order('created_at'),
    supabase.from('candidatos').select('status, created_at').gte('created_at', sixMonthsAgo).order('created_at'),

    supabase.from('leads').select('responsavel_nome').gte('created_at', start),
    supabase.from('agenda').select('responsavel_nome').gte('created_at', start),
    supabase.from('prospeccao').select('responsavel_nome').gte('created_at', start),
  ])

  // Lança o primeiro erro encontrado
  for (const r of [rLeads, rFechados, rContratados, rAgenda, rEmpresas, rVagas,
                   rLeadsPrev, rFechadosPrev, rContratadosPrev, rAgendaPrev,
                   rPeriodLeads, rChartLeads, rChartCands,
                   rDeseLeads, rDeseAgenda, rDeseProsp]) {
    if (r.error) throw r.error
  }

  const leads_n    = rLeads.count         ?? 0
  const fechados_n = rFechados.count      ?? 0
  const cands_n    = rContratados.count   ?? 0
  const agenda_n   = rAgenda.count        ?? 0
  const empresas_n = rEmpresas.count      ?? 0
  const vagas_n    = (rVagas.data ?? []).reduce((s, e) => s + (e.vagas_abertas || 0), 0)

  const leads_prev     = rLeadsPrev.count       ?? 0
  const fechados_prev  = rFechadosPrev.count    ?? 0
  const cands_prev     = rContratadosPrev.count ?? 0
  const agenda_prev    = rAgendaPrev.count      ?? 0

  const convAtual = leads_n    > 0 ? (fechados_n    / leads_n    * 100).toFixed(1) : '0.0'
  const convPrev  = leads_prev > 0 ? (fechados_prev / leads_prev * 100)            : 0
  const convDiff  = leads_prev > 0 ? (parseFloat(convAtual) - convPrev).toFixed(1) : null

  return {
    kpisMap: {
      totalLeads:   { valor: String(leads_n),    ...calcTrend(leads_n,  leads_prev)                                          },
      conversao:    { valor: `${convAtual}%`,    label: convDiff ? `${parseFloat(convDiff) >= 0 ? '+' : ''}${convDiff}pp` : '—', positive: convDiff === null || parseFloat(convDiff) >= 0 },
      empresas:     { valor: String(empresas_n), label: 'Total',     positive: true                                         },
      contratados:  { valor: String(cands_n),    ...calcTrend(cands_n,  cands_prev)                                          },
      vagasAbertas: { valor: String(vagas_n),    label: 'Disponíveis', positive: true                                       },
      reunioes:     { valor: String(agenda_n),   ...calcTrend(agenda_n, agenda_prev)                                        },
    },
    chartLeads:        buildLeadsChart(rChartLeads.data        ?? []),
    funil:             buildRelatoriosFunil(rPeriodLeads.data  ?? []),
    segmentos:         buildSegmentos(rPeriodLeads.data        ?? []),
    recrutamento:      buildRecrutamento(rChartCands.data      ?? []),
    contratadosPorMes: buildContratadosPorMes(rChartCands.data ?? []),
    totalContratados:  cands_n,
    contratadosTrend:  calcTrend(cands_n, cands_prev),
    desempenho:        buildDesempenho(rDeseLeads.data ?? [], rDeseAgenda.data ?? [], rDeseProsp.data ?? []),
  }
}
