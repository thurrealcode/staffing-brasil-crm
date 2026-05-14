import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, FileText, Download, Eye, Trash2,
  RefreshCw, AlertCircle, ChevronUp, ChevronDown,
  Upload, Clock, CheckCircle, FileCheck, Building2, Briefcase,
  DollarSign, User, Calendar, Flag, ExternalLink, Edit2,
} from 'lucide-react'
import { fetchContratos, createContrato, updateContrato, deleteContrato, addTimelineEntry } from '../lib/contratosService'
import { useAuth } from '../context/AuthContext'

// ── Configurações ─────────────────────────────────────────────

const STATUS_CONFIG = {
  'Rascunho':              { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.25)' },
  'Aguardando Assinatura': { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)'  },
  'Ativo':                 { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)'   },
  'Encerrado':             { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.25)'  },
  'Cancelado':             { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)'   },
}

const PRIORITY_CONFIG = {
  'Baixa':   { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.20)' },
  'Normal':  { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.20)'  },
  'Alta':    { color: '#f97316', bg: 'rgba(249,115,22,0.10)',   border: 'rgba(249,115,22,0.20)'  },
  'Urgente': { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',    border: 'rgba(239,68,68,0.20)'   },
}

const STATUS_LIST    = Object.keys(STATUS_CONFIG)
const PRIORITY_LIST  = Object.keys(PRIORITY_CONFIG)

const EMPTY_FORM = {
  empresa: '', vaga: '', valor: '', status: 'Rascunho',
  responsavel: '', data: '', prioridade: 'Normal', observacoes: '',
}

// ── Helpers ───────────────────────────────────────────────────

function fmtBRL(val) {
  const n = Number(val)
  if (!n) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Sub-components ────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG['Rascunho']
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function PriorityBadge({ prioridade }) {
  const c = PRIORITY_CONFIG[prioridade] || PRIORITY_CONFIG['Normal']
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
      <Flag size={9} />
      {prioridade}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flex: 1, minWidth: 0 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry, onClose }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
      <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Tentar novamente</button>}
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}><X size={14} /></button>}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ padding: '15px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[160, 120, 90, 80, 100, 80, 70, 50].map((w, j) => (
            <div key={j} className="skeleton" style={{ height: 13, width: w, borderRadius: 4, flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── PDF Upload Field ──────────────────────────────────────────

function PdfUploadField({ file, onChange, existingUrl }) {
  const ref = useRef(null)
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        PDF do Contrato
      </label>
      <div
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${file ? '#22c55e' : '#d1d5db'}`,
          borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
          background: file ? 'rgba(34,197,94,0.04)' : '#fafafa',
          transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = file ? '#22c55e' : '#94a3b8'; e.currentTarget.style.background = file ? 'rgba(34,197,94,0.06)' : '#f1f5f9' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = file ? '#22c55e' : '#d1d5db'; e.currentTarget.style.background = file ? 'rgba(34,197,94,0.04)' : '#fafafa' }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: file ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {file ? <CheckCircle size={15} style={{ color: '#22c55e' }} /> : <Upload size={15} style={{ color: '#94a3b8' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {file ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </>
          ) : existingUrl ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>PDF já anexado</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Clique para substituir</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Clique para selecionar PDF</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Apenas arquivos .pdf</div>
            </>
          )}
        </div>
        {file && (
          <button type="button" onClick={e => { e.stopPropagation(); onChange(null) }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  )
}

// ── Modal: Novo / Editar Contrato ─────────────────────────────

function ContratoModal({ contrato, saving, onClose, onSave }) {
  const [form, setForm] = useState(contrato ? { ...contrato } : { ...EMPTY_FORM })
  const [pdfFile, setPdfFile] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.empresa.trim() || !form.vaga.trim()) return
    onSave(form, pdfFile)
  }

  const isEdit = !!contrato?.id
  const inp = {
    width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a',
    padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }
  const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 18, width: '100%', maxWidth: 600, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}>

        <div style={{ padding: '22px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 1 }}>{isEdit ? 'Editar Contrato' : 'Novo Contrato'}</h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{isEdit ? 'Atualize as informações do contrato' : 'Preencha os dados do novo contrato'}</p>
          </div>
          <button onClick={onClose} disabled={saving} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 6 }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Empresa *</label>
              <input required value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa cliente" style={inp} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Vaga *</label>
              <input required value={form.vaga} onChange={e => set('vaga', e.target.value)} placeholder="Título da vaga / serviço" style={inp} />
            </div>

            <div>
              <label style={lbl}>Valor (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" style={inp} />
            </div>

            <div>
              <label style={lbl}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} style={inp} />
            </div>

            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>
                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Prioridade</label>
              <select value={form.prioridade} onChange={e => set('prioridade', e.target.value)} style={inp}>
                {PRIORITY_LIST.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Responsável</label>
              <input value={form.responsavel} onChange={e => set('responsavel', e.target.value)} placeholder="Nome do responsável" style={inp} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3}
                placeholder="Anotações relevantes sobre o contrato..."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.55 }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <PdfUploadField file={pdfFile} onChange={setPdfFile} existingUrl={form.pdf_url} />
            </div>

          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '10px 16px', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 9, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saving ? 0.7 : 1, boxShadow: '0 2px 12px rgba(239,68,68,0.25)' }}>
              {saving ? (
                <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              ) : (
                <><FileCheck size={13} /> {isEdit ? 'Salvar Alterações' : 'Criar Contrato'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Modal: Detalhes do Contrato ───────────────────────────────

function DetalhesModal({ contrato, onClose, onEdit, onDelete, onAddNote }) {
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await onAddNote(contrato.id, { note: noteText.trim(), status: contrato.status })
      setNoteText('')
      setAddingNote(false)
    } finally {
      setSavingNote(false)
    }
  }

  const sc = STATUS_CONFIG[contrato.status] || STATUS_CONFIG['Rascunho']
  const timeline = [...(contrato.timeline || [])].reverse()

  const TimelineIcon = ({ status }) => {
    if (status === 'Ativo') return <CheckCircle size={13} style={{ color: '#22c55e' }} />
    if (status === 'Cancelado') return <X size={13} style={{ color: '#ef4444' }} />
    if (status === 'Encerrado') return <FileCheck size={13} style={{ color: '#3b82f6' }} />
    if (status === 'Aguardando Assinatura') return <Clock size={13} style={{ color: '#f59e0b' }} />
    return <FileText size={13} style={{ color: '#94a3b8' }} />
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 18, width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{contrato.empresa}</h2>
              <StatusBadge status={contrato.status} />
            </div>
            <p style={{ fontSize: 13, color: '#64748b' }}>{contrato.vaga}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => onEdit(contrato)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '7px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Edit2 size={12} /> Editar
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Métricas rápidas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: DollarSign, label: 'Valor', value: fmtBRL(contrato.valor), color: '#22c55e' },
              { icon: Calendar,   label: 'Data',  value: fmtDate(contrato.data), color: '#3b82f6' },
              { icon: Flag,       label: 'Prioridade', value: contrato.prioridade || '—', color: (PRIORITY_CONFIG[contrato.prioridade] || PRIORITY_CONFIG['Normal']).color },
            ].map(m => (
              <div key={m.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <m.icon size={13} style={{ color: m.color }} />
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <InfoRow icon={User} label="Responsável" value={contrato.responsavel || '—'} />
            <InfoRow icon={Building2} label="Empresa" value={contrato.empresa} />
            <InfoRow icon={Briefcase} label="Vaga" value={contrato.vaga} />
            <InfoRow icon={Clock} label="Criado em" value={fmtDate(contrato.created_at?.slice(0, 10))} />
          </div>

          {/* Observações */}
          {contrato.observacoes && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Observações</div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{contrato.observacoes}</p>
            </div>
          )}

          {/* PDF */}
          {contrato.pdf_url && (
            <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={17} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>Contrato PDF anexado</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Clique para visualizar ou baixar</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={contrato.pdf_url} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '7px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={12} /> Visualizar
                </a>
                <a href={contrato.pdf_url} download
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '7px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Download size={12} /> Baixar
                </a>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Histórico do Processo</div>
              <button onClick={() => setAddingNote(v => !v)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '5px 11px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Plus size={11} /> Adicionar nota
              </button>
            </div>

            <AnimatePresence>
              {addingNote && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'flex', gap: 10 }}>
                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} placeholder="Digite uma nota para o histórico..."
                      style={{ flex: 1, background: '#fff', border: '1px solid #d1d5db', borderRadius: 7, padding: '8px 11px', fontSize: 12, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#0f172a' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}
                        style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '7px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: !noteText.trim() ? 0.5 : 1 }}>
                        {savingNote ? '...' : 'Salvar'}
                      </button>
                      <button onClick={() => setAddingNote(false)}
                        style={{ background: 'none', border: '1px solid #e2e8f0', color: '#94a3b8', padding: '7px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {timeline.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>Nenhum evento registrado ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {timeline.map((entry, i) => {
                  const tc = STATUS_CONFIG[entry.status] || STATUS_CONFIG['Rascunho']
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                      {/* Line */}
                      {i < timeline.length - 1 && (
                        <div style={{ position: 'absolute', left: 15, top: 30, bottom: 0, width: 1, background: '#e2e8f0' }} />
                      )}
                      {/* Dot */}
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${tc.bg}`, border: `1.5px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                        <TimelineIcon status={entry.status} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <StatusBadge status={entry.status} />
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDateTime(entry.at)}</span>
                        </div>
                        {entry.note && <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.55 }}>{entry.note}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Delete */}
          <div style={{ borderTop: '1px solid #fef2f2', paddingTop: 16 }}>
            <button onClick={() => onDelete(contrato)}
              style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <Trash2 size={13} /> Excluir Contrato
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
      <Icon size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0, minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Contratos() {
  const { user } = useAuth()
  const [contratos, setContratos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)

  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')

  const [sortKey, setSortKey]     = useState('created_at')
  const [sortAsc, setSortAsc]     = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingContrato, setEditingContrato] = useState(null)
  const [viewingContrato, setViewingContrato] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchContratos()
      setContratos(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── CRUD ──────────────────────────────────────────────────

  const handleSave = async (form, pdfFile) => {
    setSaving(true)
    try {
      if (editingContrato) {
        const updated = await updateContrato(editingContrato.id, form, pdfFile)
        setContratos(prev => prev.map(c => c.id === updated.id ? updated : c))
        setViewingContrato(updated)
      } else {
        const created = await createContrato(form, pdfFile)
        setContratos(prev => [created, ...prev])
      }
      setShowModal(false)
      setEditingContrato(null)
    } catch (e) {
      alert(e.message || 'Erro ao salvar contrato')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (contrato) => {
    if (!window.confirm(`Excluir o contrato de "${contrato.empresa}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteContrato(contrato.id, contrato.pdf_path)
      setContratos(prev => prev.filter(c => c.id !== contrato.id))
      setViewingContrato(null)
    } catch (e) {
      alert(e.message || 'Erro ao excluir')
    }
  }

  const handleAddNote = async (id, entry) => {
    const updated = await addTimelineEntry(id, entry)
    setContratos(prev => prev.map(c => c.id === updated.id ? updated : c))
    setViewingContrato(updated)
  }

  const openEdit = (contrato) => {
    setEditingContrato(contrato)
    setViewingContrato(null)
    setShowModal(true)
  }

  // ── Filtro + sort ─────────────────────────────────────────

  const filtered = contratos
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.empresa?.toLowerCase().includes(q) || c.vaga?.toLowerCase().includes(q) || c.responsavel?.toLowerCase().includes(q)
      const matchStatus = filterStatus === 'Todos' || c.status === filterStatus
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let va = a[sortKey] ?? ''
      let vb = b[sortKey] ?? ''
      if (sortKey === 'valor') { va = Number(va); vb = Number(vb) }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  // ── Métricas ──────────────────────────────────────────────

  const total         = contratos.length
  const totalAtivo    = contratos.filter(c => c.status === 'Ativo').reduce((s, c) => s + Number(c.valor || 0), 0)
  const aguardando    = contratos.filter(c => c.status === 'Aguardando Assinatura').length
  const encerrados    = contratos.filter(c => c.status === 'Encerrado').length

  // ── Coluna header ─────────────────────────────────────────

  function ColHeader({ label, sortable, colKey, style }) {
    const active = sortKey === colKey
    return (
      <th onClick={sortable ? () => handleSort(colKey) : undefined}
        style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: active ? '#ef4444' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, cursor: sortable ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none', ...style }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {sortable && active && (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
        </div>
      </th>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Contratos</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : `${total} contrato${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setEditingContrato(null); setShowModal(true) }}
          style={{ background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 14px rgba(239,68,68,0.28)' }}>
          <Plus size={15} /> Novo Contrato
        </motion.button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <MetricCard icon={FileText}    label="Total de Contratos"        value={total}           color="#6366f1" />
        <MetricCard icon={DollarSign}  label="Valor Total Ativo"         value={fmtBRL(totalAtivo)} color="#22c55e" sub={totalAtivo > 0 ? 'Em contratos ativos' : undefined} />
        <MetricCard icon={Clock}       label="Aguardando Assinatura"     value={aguardando}      color="#f59e0b" />
        <MetricCard icon={CheckCircle} label="Encerrados"                value={encerrados}      color="#3b82f6" />
      </div>

      {error && <ErrorBanner message={error} onRetry={load} onClose={() => setError(null)} />}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa, vaga, responsável..."
            style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 9, padding: '9px 12px 9px 34px', fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Todos', ...STATUS_LIST].map(s => {
            const active = filterStatus === s
            const c = STATUS_CONFIG[s]
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: active ? `1px solid ${c?.border || '#e2e8f0'}` : '1px solid #e2e8f0', background: active ? (c?.bg || '#f1f5f9') : '#fff', color: active ? (c?.color || '#475569') : '#64748b', transition: 'all 0.12s' }}>
                {s}
              </button>
            )
          })}
        </div>
        <button onClick={load} title="Atualizar" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '9px 11px', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Tabela */}
      <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e4e4e7' }}>
              <tr>
                <ColHeader label="Empresa"     sortable colKey="empresa"     />
                <ColHeader label="Vaga"        sortable colKey="vaga"        />
                <ColHeader label="Valor"       sortable colKey="valor"       />
                <ColHeader label="Status"      sortable colKey="status"      />
                <ColHeader label="Responsável" sortable colKey="responsavel" />
                <ColHeader label="Data"        sortable colKey="data"        />
                <ColHeader label="Prioridade"  sortable colKey="prioridade"  />
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>PDF</th>
                <th style={{ padding: '10px 14px' }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><TableSkeleton /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8', fontSize: 14 }}>
                    <FileText size={32} style={{ color: '#e2e8f0', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                    {search || filterStatus !== 'Todos' ? 'Nenhum contrato encontrado com esses filtros.' : 'Nenhum contrato cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <motion.tr key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setViewingContrato(c)}
                  >
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.empresa}</div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 12, color: '#475569' }}>{c.vaga}</div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fmtBRL(c.valor)}</div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.responsavel || '—'}</div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(c.data)}</div>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <PriorityBadge prioridade={c.prioridade} />
                    </td>
                    <td style={{ padding: '13px 14px', textAlign: 'center' }}>
                      {c.pdf_url ? (
                        <a href={c.pdf_url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          title="Visualizar PDF"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', textDecoration: 'none' }}>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(c) }}
                        style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b' }}
                      >
                        <Edit2 size={11} /> Editar
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer da tabela */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            {filterStatus !== 'Todos' || search ? (
              <button onClick={() => { setSearch(''); setFilterStatus('Todos') }}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                Limpar filtros
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <ContratoModal
            key="modal-novo"
            contrato={editingContrato}
            saving={saving}
            onClose={() => { setShowModal(false); setEditingContrato(null) }}
            onSave={handleSave}
          />
        )}
        {viewingContrato && !showModal && (
          <DetalhesModal
            key="modal-detalhes"
            contrato={viewingContrato}
            onClose={() => setViewingContrato(null)}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAddNote={handleAddNote}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
