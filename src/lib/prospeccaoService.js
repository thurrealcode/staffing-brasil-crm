import { supabase } from './supabase'

// ── Mapeamento ────────────────────────────────────────────────

function fromDB(row) {
  return {
    id:                 row.id,
    empresa:            row.empresa,
    segmento:           row.segmento,
    telefone:           row.telefone,
    cidade:             row.cidade,
    nomeDecisor:        row.nome_decisor,
    cargoDecisor:       row.cargo_decisor,
    contatoSecretaria:  row.contato_secretaria,
    status:             row.status,
    ultimaLigacao:      row.ultima_ligacao ?? '',
    proximaAcao:        row.proxima_acao,
    dataProximoContato: row.data_proximo_contato ?? '',
    observacoes:        row.observacoes,
    responsavelNome:    row.responsavel_nome  ?? '',
    responsavelEmail:   row.responsavel_email ?? '',
    createdAt:          row.created_at,
  }
}

function toDB(p) {
  return {
    empresa:              p.empresa             ?? '',
    segmento:             p.segmento            ?? '',
    telefone:             p.telefone            ?? '',
    cidade:               p.cidade              ?? '',
    nome_decisor:         p.nomeDecisor         ?? '',
    cargo_decisor:        p.cargoDecisor        ?? '',
    contato_secretaria:   p.contatoSecretaria   ?? '',
    status:               p.status              ?? 'Não ligado',
    ultima_ligacao:       p.ultimaLigacao       || null,
    proxima_acao:         p.proximaAcao         ?? '',
    data_proximo_contato: p.dataProximoContato  || null,
    observacoes:          p.observacoes         ?? '',
    responsavel_nome:     p.responsavelNome     ?? '',
    responsavel_email:    p.responsavelEmail    ?? '',
  }
}

function atividadeFromDB(row) {
  return {
    id:          row.id,
    descricao:   row.descricao,
    novoStatus:  row.novo_status,
    createdAt:   row.created_at,
  }
}

// ── CRUD prospeccao ───────────────────────────────────────────

export async function fetchProspeccoes() {
  const { data, error } = await supabase
    .from('prospeccao')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(fromDB)
}

export async function createProspeccao(p) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Usuário não autenticado.')
  const responsavelNome = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''

  const { data, error } = await supabase
    .from('prospeccao')
    .insert({ ...toDB(p), user_id: user.id, responsavel_nome: responsavelNome, responsavel_email: user.email || '' })
    .select()
    .single()
  if (error) throw error
  return fromDB(data)
}

export async function updateProspeccao(id, p) {
  const { data, error } = await supabase
    .from('prospeccao')
    .update(toDB(p))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return fromDB(data)
}

export async function deleteProspeccao(id) {
  const { error } = await supabase
    .from('prospeccao')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Atividades / timeline ─────────────────────────────────────

export async function fetchAtividades(prospeccaoId) {
  const { data, error } = await supabase
    .from('prospeccao_atividades')
    .select('*')
    .eq('prospeccao_id', prospeccaoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(atividadeFromDB)
}

export async function createAtividade(prospeccaoId, descricao, novoStatus) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Usuário não autenticado.')

  const { error } = await supabase
    .from('prospeccao_atividades')
    .insert({
      prospeccao_id: prospeccaoId,
      user_id:       user.id,
      descricao,
      novo_status:   novoStatus || null,
    })
  if (error) throw error
}
