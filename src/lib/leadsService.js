import { supabase } from './supabase'

// ── Mapeamento DB (snake_case) ↔ App (camelCase) ──────────────

function fromDB(row) {
  return {
    id:               row.id,
    empresa:          row.empresa,
    contato:          row.contato,
    whatsapp:         row.whatsapp,
    email:            row.email,
    cidade:           row.cidade,
    segmento:         row.segmento,
    status:           row.status,
    ultimoContato:    row.ultimo_contato ?? '',
    observacoes:      row.observacoes,
    tags:             row.tags ?? [],
    responsavelNome:  row.responsavel_nome  ?? '',
    responsavelEmail: row.responsavel_email ?? '',
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}

function toDB(lead) {
  return {
    empresa:          lead.empresa          ?? '',
    contato:          lead.contato          ?? '',
    whatsapp:         lead.whatsapp         ?? '',
    email:            lead.email            ?? '',
    cidade:           lead.cidade           ?? '',
    segmento:         lead.segmento         ?? '',
    status:           lead.status           ?? 'Novo Lead',
    ultimo_contato:   lead.ultimoContato    || null,
    observacoes:      lead.observacoes      ?? '',
    tags:             lead.tags             ?? [],
    responsavel_nome:  lead.responsavelNome  ?? '',
    responsavel_email: lead.responsavelEmail ?? '',
  }
}

// ── CRUD ──────────────────────────────────────────────────────

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(fromDB)
}

export async function createLead(lead) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Usuário não autenticado.')
  const responsavelNome = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''

  const { data, error } = await supabase
    .from('leads')
    .insert({ ...toDB(lead), user_id: user.id, responsavel_nome: responsavelNome, responsavel_email: user.email || '' })
    .select()
    .single()

  if (error) throw error
  return fromDB(data)
}

export async function updateLead(id, lead) {
  const { data, error } = await supabase
    .from('leads')
    .update(toDB(lead))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return fromDB(data)
}

export async function deleteLead(id) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}
