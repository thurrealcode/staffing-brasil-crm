import { supabase } from './supabase'
import { notifyAdmins } from './notificationsService'
import { syncEventoGoogleCalendar, deleteEventoGoogleCalendar } from './googleCalendarService'

// ── Mapeamento DB (snake_case) ↔ App (camelCase) ──────────────

function fromDB(row) {
  return {
    id:               row.id,
    titulo:           row.titulo,
    tipo:             row.tipo,
    data:             row.data,
    horario:          row.horario,
    empresa:          row.empresa,
    contato:          row.contato,
    local:            row.local,
    status:           row.status,
    observacoes:      row.observacoes,
    participantes:    row.participantes    ?? '',
    empresaId:        row.empresa_id,
    candidatoId:      row.candidato_id,
    leadId:           row.lead_id,
    responsavelNome:  row.responsavel_nome  ?? '',
    responsavelEmail: row.responsavel_email ?? '',
    googleEventId:    row.google_event_id   ?? null,
    meetLink:         row.meet_link         ?? null,
    syncStatus:       row.sync_status       ?? null,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  }
}

function toDB(evento) {
  return {
    titulo:            evento.titulo            ?? '',
    tipo:              evento.tipo              ?? 'Reunião',
    data:              evento.data,
    horario:           evento.horario           ?? '',
    empresa:           evento.empresa           ?? '',
    contato:           evento.contato           ?? '',
    local:             evento.local             ?? '',
    status:            evento.status            ?? 'Agendado',
    observacoes:       evento.observacoes       ?? '',
    participantes:     evento.participantes      ?? '',
    empresa_id:        evento.empresaId         || null,
    candidato_id:      evento.candidatoId       || null,
    lead_id:           evento.leadId            || null,
    responsavel_nome:  evento.responsavelNome   ?? '',
    responsavel_email: evento.responsavelEmail  ?? '',
  }
}

// Busca e-mail do lead ou empresa vinculados ao evento (para auto-preencher participantes)
export async function getEmailFromEvento(evento) {
  if (evento.participantes) return null

  if (evento.leadId) {
    const { data } = await supabase.from('leads').select('email').eq('id', evento.leadId).maybeSingle()
    return data?.email || null
  }

  if (evento.empresaId) {
    const { data } = await supabase.from('empresas').select('contato_email').eq('id', evento.empresaId).maybeSingle()
    return data?.contato_email || null
  }

  return null
}

// ── CRUD ──────────────────────────────────────────────────────

export async function fetchAgenda() {
  const { data, error } = await supabase
    .from('agenda')
    .select('*')
    .order('data', { ascending: true })
    .order('horario', { ascending: true })

  if (error) throw error
  return data.map(fromDB)
}

export async function createEvento(evento) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Usuário não autenticado.')
  const responsavelNome = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''

  const { data, error } = await supabase
    .from('agenda')
    .insert({ ...toDB(evento), user_id: user.id, responsavel_nome: responsavelNome, responsavel_email: user.email || '' })
    .select()
    .single()

  if (error) throw error
  notifyAdmins({ type: 'agenda', content: `Novo evento: ${evento.titulo}`, link: '/agenda', excludeUserId: user.id })
  const eventoMapped = fromDB(data)
  syncEventoGoogleCalendar(eventoMapped) // fire-and-forget: não bloqueia o fluxo
  return eventoMapped
}

export async function updateEvento(id, evento) {
  const { data, error } = await supabase
    .from('agenda')
    .update(toDB(evento))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  const eventoMapped = fromDB(data)
  syncEventoGoogleCalendar(eventoMapped) // re-sync: atualiza no Google Calendar
  return eventoMapped
}

export async function deleteEvento(id) {
  // Remove do Google Calendar primeiro (enquanto o registro ainda existe no banco)
  await deleteEventoGoogleCalendar(id)

  const { error } = await supabase
    .from('agenda')
    .delete()
    .eq('id', id)

  if (error) throw error
}
