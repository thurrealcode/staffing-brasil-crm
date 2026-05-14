import { supabase } from './supabase'

export async function fetchContratos() {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createContrato(contrato, pdfFile) {
  let pdf_url = null
  let pdf_path = null

  if (pdfFile) {
    const ext = pdfFile.name.split('.').pop()
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { data: up, error: upErr } = await supabase.storage
      .from('contratos')
      .upload(filename, pdfFile, { contentType: pdfFile.type })
    if (upErr) throw new Error('Erro ao enviar PDF: ' + upErr.message)
    pdf_path = up.path
    const { data: urlData } = supabase.storage.from('contratos').getPublicUrl(pdf_path)
    pdf_url = urlData.publicUrl
  }

  const timeline = [{
    status: contrato.status || 'Rascunho',
    at: new Date().toISOString(),
    note: 'Contrato criado',
  }]

  const { data, error } = await supabase
    .from('contratos')
    .insert({ ...contrato, pdf_url, pdf_path, timeline })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateContrato(id, updates, pdfFile) {
  let { pdf_url, pdf_path } = updates

  if (pdfFile) {
    if (pdf_path) await supabase.storage.from('contratos').remove([pdf_path])
    const ext = pdfFile.name.split('.').pop()
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { data: up, error: upErr } = await supabase.storage
      .from('contratos')
      .upload(filename, pdfFile, { contentType: pdfFile.type })
    if (upErr) throw new Error('Erro ao enviar PDF: ' + upErr.message)
    pdf_path = up.path
    const { data: urlData } = supabase.storage.from('contratos').getPublicUrl(pdf_path)
    pdf_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('contratos')
    .update({ ...updates, pdf_url, pdf_path, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteContrato(id, pdf_path) {
  if (pdf_path) await supabase.storage.from('contratos').remove([pdf_path])
  const { error } = await supabase.from('contratos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addTimelineEntry(id, entry) {
  const { data: row, error: fetchErr } = await supabase
    .from('contratos')
    .select('timeline')
    .eq('id', id)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  const timeline = [...(row.timeline || []), { ...entry, at: new Date().toISOString() }]
  const { data, error } = await supabase
    .from('contratos')
    .update({ timeline, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
