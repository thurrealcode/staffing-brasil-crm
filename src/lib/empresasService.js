import { supabase } from './supabase'

// ── Mapeamento DB (snake_case) ↔ App (camelCase) ──────────────

function fromDB(row) {
  return {
    id:                row.id,
    nome:              row.nome,
    cnpj:              row.cnpj,
    segmento:          row.segmento,
    setor:             row.segmento,        // alias usado pelo modal de visualização
    cidade:            row.cidade,
    estado:            row.estado,
    status:            row.status,
    contato:           row.contato_nome,    // alias usado pelo card e modal
    contatoNome:       row.contato_nome,
    email:             row.contato_email,   // alias usado pelo modal
    contatoEmail:      row.contato_email,
    telefone:          row.contato_telefone, // alias usado pelo modal
    contatoTelefone:   row.contato_telefone,
    contatoWhatsapp:   row.contato_whatsapp,
    vagasAbertas:      row.vagas_abertas,
    totalContratacoes: row.total_contratacoes,
    observacoes:       row.observacoes,
    responsavelNome:   row.responsavel_nome  ?? '',
    responsavelEmail:  row.responsavel_email ?? '',
    ultimaInteracao:   row.updated_at,      // alias para campo de data no modal
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  }
}

function toDB(empresa) {
  return {
    nome:               empresa.nome              ?? '',
    cnpj:               empresa.cnpj              ?? '',
    segmento:           empresa.segmento          ?? '',
    cidade:             empresa.cidade            ?? '',
    estado:             empresa.estado            ?? '',
    status:             empresa.status            ?? 'Em Negociação',
    contato_nome:       empresa.contatoNome       ?? '',
    contato_email:      empresa.contatoEmail      ?? '',
    contato_telefone:   empresa.contatoTelefone   ?? '',
    contato_whatsapp:   empresa.contatoWhatsapp   ?? '',
    vagas_abertas:      Number(empresa.vagasAbertas)      || 0,
    total_contratacoes: Number(empresa.totalContratacoes) || 0,
    observacoes:        empresa.observacoes       ?? '',
    responsavel_nome:   empresa.responsavelNome   ?? '',
    responsavel_email:  empresa.responsavelEmail  ?? '',
  }
}

// ── CRUD ──────────────────────────────────────────────────────

export async function fetchEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(fromDB)
}

export async function createEmpresa(empresa) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Usuário não autenticado.')
  const responsavelNome = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''

  const { data, error } = await supabase
    .from('empresas')
    .insert({ ...toDB(empresa), user_id: user.id, responsavel_nome: responsavelNome, responsavel_email: user.email || '' })
    .select()
    .single()

  if (error) throw error
  return fromDB(data)
}

export async function updateEmpresa(id, empresa) {
  const { data, error } = await supabase
    .from('empresas')
    .update(toDB(empresa))
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return fromDB(data)
}

export async function deleteEmpresa(id) {
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id)

  if (error) throw error
}
