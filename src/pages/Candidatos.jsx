import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Brain, ChevronRight, Award, MapPin, Briefcase, RefreshCw, Pencil, Trash2, AlertCircle, Eye, Download, FileText } from 'lucide-react'
import { fetchCandidatos, createCandidato, updateCandidato, deleteCandidato, uploadCurriculo, getCurriculoUrl } from '../lib/candidatosService'

const STATUS_CONFIG = {
  'Triagem':           { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
  'Entrevista':        { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  'Aprovado':          { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)' },
  'Enviado ao Cliente':{ color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
  'Contratado':        { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  'Reprovado':         { color: '#6b7280', bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.2)' },
}

const AI_PARECERES = [
  'Candidato com perfil técnico sólido. Experiência comprovada nas tecnologias exigidas. Comunicação clara durante triagem. Alta compatibilidade com a cultura organizacional. Recomendo avançar para entrevista técnica.',
  'Profissional com histórico consistente. Certificações relevantes e projetos de impacto. Perfil colaborativo e orientado a resultados. Compatibilidade estimada em 88% com a vaga.',
  'Candidato demonstra profundo conhecimento técnico. Background em empresas de médio e grande porte. Disponibilidade imediata. Recomendado para fase final de seleção.',
]

const STATUSES = Object.keys(STATUS_CONFIG)

// ── Utilitários ───────────────────────────────────────────────

function curFileName(path) {
  if (!path) return ''
  return path.split('/').pop().replace(/^\d+_/, '')
}

function ScoreBar({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }}
          style={{ height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
      <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 100, height: 11, borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ width: '100%', height: 4, borderRadius: 2, marginBottom: 14 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="skeleton" style={{ width: 60, height: 11, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 70, height: 11, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Modal de visualização ─────────────────────────────────────

function CandidatoViewModal({ candidato, onClose, onEdit, onDelete, deleting }) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText] = useState('')
  const [curLoading, setCurLoading] = useState(null)

  const generateAI = async () => {
    setAiLoading(true)
    setAiText('')
    await new Promise(r => setTimeout(r, 1800))
    setAiText(AI_PARECERES[Math.floor(Math.random() * AI_PARECERES.length)])
    setAiLoading(false)
  }

  const handleCurriculo = async (action) => {
    setCurLoading(action)
    try {
      const url = await getCurriculoUrl(candidato.curriculo)
      if (action === 'view') {
        window.open(url, '_blank')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = curFileName(candidato.curriculo)
        a.click()
      }
    } catch (err) {
      alert('Erro ao acessar currículo: ' + err.message)
    } finally {
      setCurLoading(null)
    }
  }

  const cfg = STATUS_CONFIG[candidato.status] || STATUS_CONFIG['Triagem']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{candidato.nome}</h2>
            <div style={{ fontSize: 13, color: '#64748b' }}>{candidato.vaga} · {candidato.empresa}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={onEdit}
              style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Pencil size={12} /> Editar
            </button>
            <button onClick={onDelete} disabled={deleting}
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444', padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, opacity: deleting ? 0.6 : 1 }}>
              {deleting ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> : <Trash2 size={12} />}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Status',      value: <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{candidato.status}</span> },
              { label: 'Experiência', value: candidato.experiencia },
              { label: 'Cidade',      value: candidato.cidade },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Score */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>COMPATIBILIDADE COM A VAGA</div>
            <ScoreBar score={candidato.score} />
          </div>

          {/* Skills */}
          {candidato.habilidades?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Habilidades</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {candidato.habilidades.map(h => (
                  <span key={h} style={{ background: '#f1f5f9', border: '1px solid #e4e4e7', color: '#475569', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {candidato.observacoes && (
            <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Observações</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{candidato.observacoes}</div>
            </div>
          )}

          {/* IA Parecer */}
          <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiText ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={14} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#a855f7' }}>Parecer IA</span>
              </div>
              <button onClick={generateAI} disabled={aiLoading}
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                {aiLoading ? '⟳ Gerando...' : 'Gerar Parecer'}
              </button>
            </div>
            {aiText && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginTop: 4 }}>
                {aiText}
              </motion.p>
            )}
          </div>

          {/* Currículo */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Currículo</div>
            {candidato.curriculo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8 }}>
                  <FileText size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{curFileName(candidato.curriculo)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleCurriculo('view')} disabled={!!curLoading}
                    style={{ flex: 1, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: curLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: curLoading && curLoading !== 'view' ? 0.5 : 1 }}>
                    {curLoading === 'view' ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> : <Eye size={14} />} Visualizar
                  </button>
                  <button onClick={() => handleCurriculo('download')} disabled={!!curLoading}
                    style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: curLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: curLoading && curLoading !== 'download' ? 0.5 : 1 }}>
                    {curLoading === 'download' ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> : <Download size={14} />} Download
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FileText size={14} /> Nenhum currículo anexado
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Modal de formulário (criar / editar) ──────────────────────

const EMPTY_FORM = { nome: '', vaga: '', empresa: '', experiencia: '', cidade: '', status: 'Triagem', score: 0, observacoes: '', habilidades: '', curriculo: null, data: '' }

const ACCEPTED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

function CandidatoFormModal({ initial, onClose, onSave, saving }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(
    initial
      ? { ...initial, habilidades: (initial.habilidades ?? []).join(', ') }
      : EMPTY_FORM
  )
  const [curFile, setCurFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Tipo não suportado. Use PDF, DOC ou DOCX.')
      e.target.value = ''
      return
    }
    setCurFile(file)
  }

  const clearFile = () => {
    setCurFile(null)
    set('curriculo', null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nome.trim()) return

    let curriculo = form.curriculo
    if (curFile) {
      setUploading(true)
      try {
        curriculo = await uploadCurriculo(curFile)
      } catch (err) {
        alert('Erro ao enviar currículo: ' + err.message)
        setUploading(false)
        return
      }
      setUploading(false)
    }

    onSave({
      ...form,
      score:       Number(form.score) || 0,
      habilidades: form.habilidades.split(',').map(s => s.trim()).filter(Boolean),
      curriculo,
    })
  }

  const isBusy = saving || uploading
  const inputStyle = { width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, display: 'block' }

  const hasExistingFile = !!form.curriculo && !curFile
  const fileLabel = curFile ? curFile.name : hasExistingFile ? curFileName(form.curriculo) : 'Selecionar PDF, DOC ou DOCX'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{isEdit ? 'Editar Candidato' : 'Novo Candidato'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nome *</label>
              <input required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vaga</label>
              <input value={form.vaga} onChange={e => set('vaga', e.target.value)} placeholder="Ex: Dev Sênior React" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Empresa</label>
              <input value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Empresa da vaga" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Experiência</label>
              <input value={form.experiencia} onChange={e => set('experiencia', e.target.value)} placeholder="Ex: 5 anos" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Score (0–100)</label>
              <input type="number" min={0} max={100} value={form.score} onChange={e => set('score', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Habilidades (separadas por vírgula)</label>
              <input value={form.habilidades} onChange={e => set('habilidades', e.target.value)} placeholder="React, TypeScript, Node.js" style={inputStyle} />
            </div>

            {/* Currículo upload */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Currículo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label htmlFor="curriculo-upload"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', fontSize: 13, color: (curFile || hasExistingFile) ? '#0f172a' : '#9ca3af', overflow: 'hidden' }}>
                  <FileText size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileLabel}</span>
                  <input ref={fileRef} id="curriculo-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
                {(curFile || hasExistingFile) && (
                  <button type="button" onClick={clearFile}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {hasExistingFile && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Arquivo atual. Selecione outro para substituir.</div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Notas sobre o candidato..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={isBusy}
              style={{ flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isBusy ? 0.7 : 1 }}>
              {uploading
                ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Enviando currículo...</>
                : saving
                  ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Salvando...</>
                  : (isEdit ? 'Salvar Alterações' : 'Adicionar Candidato')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Candidatos() {
  const [candidatos,  setCandidatos]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [deletingId,  setDeletingId]  = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterStatus,setFilterStatus]= useState('Todos')
  const [selected,    setSelected]    = useState(null)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)

  const loadCandidatos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCandidatos(await fetchCandidatos())
    } catch (err) {
      setError(err.message || 'Erro ao carregar candidatos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCandidatos() }, [loadCandidatos])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await updateCandidato(editTarget.id, data)
        setCandidatos(prev => prev.map(c => c.id === updated.id ? updated : c))
        if (selected?.id === updated.id) setSelected(updated)
      } else {
        const created = await createCandidato(data)
        setCandidatos(prev => [created, ...prev])
      }
      setFormOpen(false)
      setEditTarget(null)
    } catch (err) {
      alert(err.message || 'Erro ao salvar candidato')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este candidato?')) return
    setDeletingId(id)
    try {
      await deleteCandidato(id)
      setCandidatos(prev => prev.filter(c => c.id !== id))
      setSelected(null)
    } catch (err) {
      alert(err.message || 'Erro ao excluir candidato')
    } finally {
      setDeletingId(null)
    }
  }

  const openEdit = (c) => {
    setEditTarget(c)
    setSelected(null)
    setFormOpen(true)
  }

  const filtered = candidatos
    .filter(c => filterStatus === 'Todos' || c.status === filterStatus)
    .filter(c => !search || [c.nome, c.vaga, c.cidade, c.empresa].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Candidatos</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : `${filtered.length} candidato${filtered.length !== 1 ? 's' : ''} em processo`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadCandidatos} title="Atualizar"
            style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#64748b', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="btn-primary" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <Plus size={15} /> Novo Candidato
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={loadCandidatos} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input placeholder="Buscar candidato, vaga, cidade..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#ffffff', border: '1px solid #e4e4e7', color: '#0f172a', padding: '8px 12px 8px 34px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#374151', padding: '8px 14px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
          <option>Todos</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14, background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12 }}>
          <div style={{ width: 48, height: 48, background: '#f1f5f9', border: '1px solid #e4e4e7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} style={{ color: '#9ca3af' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              {search || filterStatus !== 'Todos' ? 'Nenhum candidato encontrado' : 'Nenhum candidato cadastrado'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {search || filterStatus !== 'Todos' ? 'Tente ajustar os filtros de busca' : 'Adicione o primeiro candidato para começar'}
            </div>
          </div>
          {!search && filterStatus === 'Todos' && (
            <button className="btn-primary" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
              <Plus size={14} /> Adicionar primeiro candidato
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((c, i) => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG['Triagem']
            const isDeleting = deletingId === c.id
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(c)}
                style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s', opacity: isDeleting ? 0.5 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                whileHover={{ y: -2, borderColor: '#cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.nome}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.vaga}</div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>{c.status}</span>
                </div>

                {/* Score */}
                <div style={{ marginBottom: 12 }}>
                  <ScoreBar score={c.score} />
                </div>

                {/* Info */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {c.experiencia && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Briefcase size={11} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{c.experiencia}</span>
                    </div>
                  )}
                  {c.cidade && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{c.cidade}</span>
                    </div>
                  )}
                  {c.curriculo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={11} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 11, color: '#64748b' }}>Currículo</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {c.habilidades?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    {c.habilidades.slice(0, 3).map(h => (
                      <span key={h} style={{ background: '#f1f5f9', border: '1px solid #e4e4e7', color: '#475569', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 500 }}>{h}</span>
                    ))}
                    {c.habilidades.length > 3 && (
                      <span style={{ color: '#94a3b8', fontSize: 10, padding: '2px 4px' }}>+{c.habilidades.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(c)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                      title="Editar">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} disabled={isDeleting}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                      title="Excluir">
                      {isDeleting ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 12 }}>⟳</span> : <Trash2 size={12} />}
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Ver perfil <ChevronRight size={12} />
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {selected && (
          <CandidatoViewModal
            key="view"
            candidato={selected}
            onClose={() => setSelected(null)}
            onEdit={() => openEdit(selected)}
            onDelete={() => handleDelete(selected.id)}
            deleting={deletingId === selected?.id}
          />
        )}
        {formOpen && (
          <CandidatoFormModal
            key="form"
            initial={editTarget}
            onClose={() => { setFormOpen(false); setEditTarget(null) }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
