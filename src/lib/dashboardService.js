import { supabase } from './supabase'

// ── Constantes ────────────────────────────────────────────────

const ACTIVE_LEAD_STATUSES = ['Novo Lead', 'Contato Feito', 'Interessado', 'Reunião', 'Proposta']
const ACTIVE_CAND_STATUSES = ['Triagem', 'Entrevista', 'Aprovado', 'Enviado ao Cliente']
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ── Helpers ───────────────────────────────────────────────────

// Retorna os últimos N meses como { 'YYYY-MM': 'NomeAbrev' }
function lastNMonths(n) {
  const now = new Date()
  const months = {}
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = MONTH_NAMES[d.getMonth()]
  }
  return months
}

function buildPipelineChart(leads) {
  const months = lastNMonths(6)
  return Object.entries(months).map(([key, name]) => ({
    name,
    value: leads.filter(l => l.created_at?.slice(0, 7) === key).length,
  }))
}

function buildRecrutamentoChart(candidatos) {
  const months = lastNMonths(6)
  return Object.entries(months).map(([key, name]) => ({
    name,
    candidatos: candidatos.filter(c => c.created_at?.slice(0, 7) === key).length,
    contratados: candidatos.filter(c => c.created_at?.slice(0, 7) === key && c.status === 'Contratado').length,
  }))
}

function buildFunil(leads) {
  const total   = leads.length
  const pct     = n => (total > 0 ? Math.round((n / total) * 100) : 0)
  const countIn = (...statuses) => leads.filter(l => statuses.includes(l.status)).length

  const fechado  = countIn('Fechado')
  const proposta = countIn('Proposta', 'Fechado')
  const reuniao  = countIn('Reunião', 'Proposta', 'Fechado')
  const contato  = countIn('Contato Feito', 'Interessado', 'Reunião', 'Proposta', 'Fechado')

  return [
    { name: 'Total Leads', fill: '#3b82f6', count: total,    value: 100       },
    { name: 'Contato',     fill: '#a855f7', count: contato,  value: pct(contato)  },
    { name: 'Reunião',     fill: '#f59e0b', count: reuniao,  value: pct(reuniao)  },
    { name: 'Proposta',    fill: '#f97316', count: proposta, value: pct(proposta) },
    { name: 'Fechado',     fill: '#22c55e', count: fechado,  value: pct(fechado)  },
  ]
}

function relTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (h < 1)  return 'Agora'
  if (h < 24) return `${h}h atrás`
  if (d < 7)  return `${d}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function buildAtividades(leadsR, candidatosR, agendaR) {
  const items = [
    ...leadsR.map((l, i) => ({
      id:    `lead-${i}`,
      icon:  'send',
      texto: `Novo lead: ${l.empresa} · ${l.status}`,
      tempo: relTime(l.created_at),
      _ts:   l.created_at,
    })),
    ...candidatosR.map((c, i) => ({
      id:    `cand-${i}`,
      icon:  c.status === 'Contratado' ? 'check-circle' : 'user-plus',
      texto: `Candidato ${c.nome} · ${c.status}`,
      tempo: relTime(c.created_at),
      _ts:   c.created_at,
    })),
    ...agendaR.map((a, i) => ({
      id:    `agenda-${i}`,
      icon:  'calendar',
      texto: `${a.titulo} · ${new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}${a.horario ? ' às ' + a.horario : ''}`,
      tempo: 'Em breve',
      _ts:   a.data,
    })),
  ]
  return items.sort((a, b) => (a._ts < b._ts ? 1 : -1)).slice(0, 5)
}

// ── Query principal ───────────────────────────────────────────

export async function fetchDashboardData() {
  const today = new Date().toISOString().split('T')[0]

  const [
    r_leadsAtivos,
    r_empresas,
    r_candidatosAtivos,
    r_reunioes,
    r_contratados,
    r_vagas,
    r_allLeads,
    r_allCandidatos,
    r_leadsRecentes,
    r_candidatosRecentes,
    r_agendaProxima,
  ] = await Promise.all([
    // KPI counts — head:true = só count, sem data (mais rápido)
    supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ACTIVE_LEAD_STATUSES),
    supabase.from('empresas').select('*', { count: 'exact', head: true }),
    supabase.from('candidatos').select('*', { count: 'exact', head: true }).in('status', ACTIVE_CAND_STATUSES),
    supabase.from('agenda').select('*', { count: 'exact', head: true }).gte('data', today).neq('status', 'Cancelado'),
    supabase.from('candidatos').select('*', { count: 'exact', head: true }).eq('status', 'Contratado'),
    // Vagas abertas (soma da coluna)
    supabase.from('empresas').select('vagas_abertas'),
    // Dados completos para charts e funil
    supabase.from('leads').select('status, created_at').order('created_at'),
    supabase.from('candidatos').select('status, created_at').order('created_at'),
    // Atividade recente
    supabase.from('leads').select('empresa, status, created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('candidatos').select('nome, status, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('agenda').select('titulo, tipo, data, horario').gte('data', today).order('data').order('horario').limit(3),
  ])

  // Lança o primeiro erro encontrado
  for (const r of [r_leadsAtivos, r_empresas, r_candidatosAtivos, r_reunioes, r_contratados,
                   r_vagas, r_allLeads, r_allCandidatos, r_leadsRecentes, r_candidatosRecentes, r_agendaProxima]) {
    if (r.error) throw r.error
  }

  const allLeads      = r_allLeads.data      ?? []
  const allCandidatos = r_allCandidatos.data ?? []
  const vagasAbertas  = (r_vagas.data ?? []).reduce((s, e) => s + (e.vagas_abertas || 0), 0)
  const totalLeads    = allLeads.length
  const convPct       = totalLeads > 0
    ? Math.round(allLeads.filter(l => l.status === 'Fechado').length / totalLeads * 100)
    : 0

  return {
    kpis: {
      leadsAtivos:          r_leadsAtivos.count          ?? 0,
      totalEmpresas:        r_empresas.count             ?? 0,
      vagasAbertas,
      candidatosAtivos:     r_candidatosAtivos.count     ?? 0,
      reunioesAgendadas:    r_reunioes.count             ?? 0,
      contratacoesFechadas: r_contratados.count          ?? 0,
    },
    heroStats: {
      conversao:  `${convPct}% fechamento`,
      emProcesso: `${r_candidatosAtivos.count ?? 0} candidatos`,
    },
    chartPipeline:     buildPipelineChart(allLeads),
    chartRecrutamento: buildRecrutamentoChart(allCandidatos),
    funil:             buildFunil(allLeads),
    atividades:        buildAtividades(r_leadsRecentes.data ?? [], r_candidatosRecentes.data ?? [], r_agendaProxima.data ?? []),
  }
}
