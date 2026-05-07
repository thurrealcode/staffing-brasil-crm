import { supabase } from './supabase'

// ── Mapeamento DB (snake_case) ↔ App (camelCase) ──────────────

function fromDB(row) {
  return {
    id:          row.id,
    nome:        row.nome,
    vaga:        row.vaga,
    empresa:     row.empresa,
    experiencia: row.experiencia,
    cidade:      row.cidade,
    nivel:       row.nivel,
    status:      row.status,
    score:       row.score,
    observacoes: row.observacoes,
    habilidades: row.habilidades ?? [],
    curriculo:   row.curriculo,
    data:        row.data ?? '',
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

function toDB(candidato) {
  return {
    nome:        candidato.nome        ?? '',
    vaga:        candidato.vaga        ?? '',
    empresa:     candidato.empresa     ?? '',
    experiencia: candidato.experiencia ?? '',
    cidade:      candidato.cidade      ?? '',
    nivel:       candidato.nivel       ?? 'Pleno',
    status:      candidato.status      ?? 'Triagem',
    score:       Number(candidato.score) || 0,
    observacoes: candidato.observacoes ?? '',
    habilidades: candidato.habilidades ?? [],
    curriculo:   candidato.curriculo   ?? '',
    data:        candidato.data        || null,
  }
}

// ── CRUD ──────────────────────────────────────────────────────

export async function fetchCandidatos() {
  const { data, error } = await supabase
    .from('candidatos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(fromDB)
}

export async function createCandidato(candidato) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('candidatos')
    .insert({ ...toDB(candidato), user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return fromDB(data)
}

export async function updateCandidato(id, candidato) {
  const { data, error } = await supabase
    .from('candidatos')
    .update(toDB(candidato))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return fromDB(data)
}

export async function deleteCandidato(id) {
  const { error } = await supabase
    .from('candidatos')
    .delete()
    .eq('id', id)

  if (error) throw error
}
