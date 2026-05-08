import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Plus, Search, X, RefreshCw, Pencil, Trash2, AlertCircle,
  Phone, ChevronRight, Clock, CalendarDays, ArrowUpRight, Loader2,
  LayoutList, Kanban, User, MapPin,
} from 'lucide-react'
import {
  fetchProspeccoes, createProspeccao, updateProspeccao, deleteProspeccao,
  fetchAtividades, createAtividade,
} from '../lib/prospeccaoService'
import { createLead } from '../lib/leadsService'

// ── Configuração de status ────────────────────────────────────

const STATUS_CONFIG = {
  'Não ligado':          { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
  'Ligado sem resposta': { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)' },
  'Falou com secretária':{ color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  'Falar com decisor':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  'Interessado':         { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
  'Mandar apresentação': { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)'  },
  'Retornar depois':     { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)'  },
  'Virou lead':          { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)'  },
  'Descartado':          { color: '#6b7280', bg: 'rgba(107,114,128,0.1)',border: 'rgba(107,114,128,0.25)' },
}

const STATUSES = Object.keys(STATUS_CONFIG)

const SEGMENTOS = [
  'Contabilidade', 'Escritório Contábil', 'Advocacia', 'Tecnologia',
  'Logística', 'Indústria', 'Comércio', 'Varejo', 'Saúde',
  'Construção Civil', 'Financeiro', 'Recursos Humanos',
  'Terceirização', 'Consultoria', 'Agência', 'E-commerce', 'Outro',
]

const EMPTY_FORM = {
  empresa: '', segmento: 'Tecnologia', telefone: '', cidade: '',
  nomeDecisor: '', cargoDecisor: '', contatoSecretaria: '',
  status: 'Não ligado', ultimaLigacao: '', proximaAcao: '',
  dataProximoContato: '', observacoes: '',
}

// ── Helpers ───────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

function buildColumns(itens) {
  return STATUSES.reduce((acc, s) => ({
    ...acc,
    [s]: itens.filter(p => p.status === s),
  }), {})
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG['Não ligado']
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function ResponsavelChip({ nome }) {
  if (!nome) return null
  const initials = nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={nome}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{initials}</span>
      </div>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{nome.split(' ')[0]}</span>
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#dc2626', flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[180, 120, 100, 90, 80, 70].map((w, j) => (
            <div key={j} className="skeleton" style={{ height: 14, width: w, borderRadius: 4, flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Kanban card ───────────────────────────────────────────────

function KanbanCard({ prosp, index, onClick }) {
  const cfg = STATUS_CONFIG[prosp.status] || STATUS_CONFIG['Não ligado']
  return (
    <Draggable draggableId={prosp.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? '#f8fafc' : '#ffffff',
            border: snapshot.isDragging ? '1px solid #9ca3af' : '1px solid #e4e4e7',
            borderRadius: 10,
            padding: '12px 13px',
            marginBottom: 8,
            cursor: 'pointer',
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: snapshot.isDragging ? 'none' : 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { if (!snapshot.isDragging) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.3 }}>{prosp.empresa}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {prosp.nomeDecisor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={10} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>{prosp.nomeDecisor}{prosp.cargoDecisor ? ` · ${prosp.cargoDecisor}` : ''}</span>
              </div>
            )}
            {prosp.cidade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={10} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{prosp.cidade}</span>
              </div>
            )}
            {prosp.telefone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone size={10} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{prosp.telefone}</span>
              </div>
            )}
          </div>
          {prosp.dataProximoContato && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarDays size={10} style={{ color: cfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 500 }}>{fmtDate(prosp.dataProximoContato)}</span>
            </div>
          )}
          {prosp.responsavelNome && (
            <div style={{ marginTop: 6, paddingTop: prosp.dataProximoContato ? 0 : 6 }}>
              <ResponsavelChip nome={prosp.responsavelNome} />
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

function ColumnSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 10, padding: '12px 13px' }}>
          <div className="skeleton" style={{ width: '70%', height: 13, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '50%', height: 11, borderRadius: 3 }} />
        </div>
      ))}
    </div>
  )
}

// ── Modal de formulário ───────────────────────────────────────

function FormModal({ initial, saving, onClose, onSave }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inputStyle = { width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 620, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{isEdit ? 'Editar Prospecção' : 'Nova Prospecção'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Empresa *</label>
              <input required value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Segmento</label>
              <select value={form.segmento} onChange={e => set('segmento', e.target.value)} style={inputStyle}>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 3000-0000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="São Paulo" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nome do Decisor</label>
              <input value={form.nomeDecisor} onChange={e => set('nomeDecisor', e.target.value)} placeholder="João Silva" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cargo do Decisor</label>
              <input value={form.cargoDecisor} onChange={e => set('cargoDecisor', e.target.value)} placeholder="Diretor de RH" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Contato / Secretária</label>
              <input value={form.contatoSecretaria} onChange={e => set('contatoSecretaria', e.target.value)} placeholder="Nome e ramal da secretária" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUSES.map(s => {
                const c = STATUS_CONFIG[s]
                const active = form.status === s
                return (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    style={{ ...(active ? { background: c.bg, border: `1px solid ${c.border}`, color: c.color } : { background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#64748b' }), padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Última Ligação</label>
              <input type="date" value={form.ultimaLigacao} onChange={e => set('ultimaLigacao', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data do Próximo Contato</label>
              <input type="date" value={form.dataProximoContato} onChange={e => set('dataProximoContato', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Próxima Ação</label>
              <input value={form.proximaAcao} onChange={e => set('proximaAcao', e.target.value)} placeholder="Ex: Ligar às 14h para falar com o diretor" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Notas sobre a prospecção..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 26px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={saving}
            style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={() => { if (form.empresa.trim()) onSave(form) }} disabled={saving}
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</> : (isEdit ? 'Salvar Alterações' : 'Adicionar')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Modal de detalhes ─────────────────────────────────────────

function DetailModal({ prosp, onClose, onEdit, onDelete, onUpdated, deleting }) {
  const [atividades, setAtividades]   = useState([])
  const [loadingAtiv, setLoadingAtiv] = useState(true)
  const [showCall, setShowCall]       = useState(false)
  const [callDesc, setCallDesc]       = useState('')
  const [callStatus, setCallStatus]   = useState(prosp.status)
  const [savingCall, setSavingCall]   = useState(false)
  const [convertindo, setConvertindo] = useState(false)

  const cfg = STATUS_CONFIG[prosp.status] || STATUS_CONFIG['Não ligado']

  const loadAtividades = useCallback(async () => {
    setLoadingAtiv(true)
    try { setAtividades(await fetchAtividades(prosp.id)) }
    catch { /* silent */ }
    finally { setLoadingAtiv(false) }
  }, [prosp.id])

  useEffect(() => { loadAtividades() }, [loadAtividades])

  const handleRegistrarChamada = async () => {
    if (!callDesc.trim()) return
    setSavingCall(true)
    try {
      await createAtividade(prosp.id, callDesc.trim(), callStatus)
      const updated = await updateProspeccao(prosp.id, {
        ...prosp,
        status:        callStatus,
        ultimaLigacao: new Date().toISOString().slice(0, 10),
      })
      onUpdated(updated)
      setCallDesc('')
      setShowCall(false)
      loadAtividades()
    } catch (err) {
      alert('Erro ao registrar chamada: ' + err.message)
    } finally {
      setSavingCall(false)
    }
  }

  const handleTransformarLead = async () => {
    if (!confirm(`Transformar "${prosp.empresa}" em Lead?`)) return
    setConvertindo(true)
    try {
      await createLead({
        empresa: prosp.empresa, contato: prosp.nomeDecisor, whatsapp: prosp.telefone,
        email: '', cidade: prosp.cidade, segmento: prosp.segmento,
        status: 'Novo Lead', ultimoContato: prosp.ultimaLigacao,
        observacoes: prosp.observacoes, tags: [],
      })
      const updated = await updateProspeccao(prosp.id, { ...prosp, status: 'Virou lead' })
      onUpdated(updated)
      alert(`"${prosp.empresa}" adicionado como Lead com sucesso!`)
      onClose()
    } catch (err) {
      alert('Erro ao transformar em lead: ' + err.message)
    } finally {
      setConvertindo(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{prosp.empresa}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={prosp.status} />
              {prosp.segmento && <span style={{ fontSize: 12, color: '#64748b' }}>{prosp.segmento}</span>}
              {prosp.cidade && <span style={{ fontSize: 12, color: '#94a3b8' }}>· {prosp.cidade}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={onEdit}
              style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Pencil size={11} /> Editar
            </button>
            <button onClick={onDelete} disabled={deleting}
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444', padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, opacity: deleting ? 0.6 : 1 }}>
              {deleting ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={11} />}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Telefone',           value: prosp.telefone },
              { label: 'Decisor',            value: prosp.nomeDecisor },
              { label: 'Cargo',              value: prosp.cargoDecisor },
              { label: 'Secretária/Contato', value: prosp.contatoSecretaria },
              { label: 'Última Ligação',     value: fmtDate(prosp.ultimaLigacao) },
              { label: 'Próximo Contato',    value: fmtDate(prosp.dataProximoContato) },
              { label: 'Responsável',        value: prosp.responsavelNome },
            ].filter(r => r.value && r.value !== '—').map(({ label, value }) => (
              <div key={label} style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>

          {prosp.proximaAcao && (
            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 8 }}>
              <CalendarDays size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Próxima Ação</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{prosp.proximaAcao}</div>
              </div>
            </div>
          )}

          {prosp.observacoes && (
            <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Observações</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{prosp.observacoes}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCall(v => !v)}
              style={{ flex: 1, background: showCall ? 'rgba(59,130,246,0.08)' : '#f8f9fa', border: `1px solid ${showCall ? 'rgba(59,130,246,0.25)' : '#e4e4e7'}`, color: showCall ? '#3b82f6' : '#475569', padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
              <Phone size={13} /> Registrar Chamada
            </button>
            <button onClick={handleTransformarLead} disabled={convertindo || prosp.status === 'Virou lead'}
              style={{ flex: 1, background: prosp.status === 'Virou lead' ? 'rgba(16,185,129,0.08)' : 'linear-gradient(135deg,#10b981,#059669)', border: prosp.status === 'Virou lead' ? '1px solid rgba(16,185,129,0.25)' : 'none', color: prosp.status === 'Virou lead' ? '#10b981' : '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: (convertindo || prosp.status === 'Virou lead') ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: convertindo ? 0.7 : 1 }}>
              {convertindo ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ArrowUpRight size={13} />}
              {prosp.status === 'Virou lead' ? 'Já é Lead' : 'Transformar em Lead'}
            </button>
          </div>

          <AnimatePresence>
            {showCall && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Registrar Chamada</div>
                  <textarea value={callDesc} onChange={e => setCallDesc(e.target.value)}
                    placeholder="O que aconteceu na ligação?" rows={3}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Atualizar Status</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {STATUSES.map(s => {
                        const c = STATUS_CONFIG[s]
                        const active = callStatus === s
                        return (
                          <button key={s} type="button" onClick={() => setCallStatus(s)}
                            style={{ ...(active ? { background: c.bg, border: `1px solid ${c.border}`, color: c.color } : { background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#64748b' }), padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowCall(false); setCallDesc('') }}
                      style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '7px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      Cancelar
                    </button>
                    <button onClick={handleRegistrarChamada} disabled={savingCall || !callDesc.trim()}
                      style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 7, fontSize: 12, cursor: (savingCall || !callDesc.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, opacity: (savingCall || !callDesc.trim()) ? 0.6 : 1 }}>
                      {savingCall ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Phone size={11} />}
                      Salvar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} /> Histórico de Chamadas
            </div>
            {loadingAtiv ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
              </div>
            ) : atividades.length === 0 ? (
              <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '16px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                Nenhuma chamada registrada ainda
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atividades.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Phone size={11} style={{ color: '#3b82f6' }} />
                    </div>
                    <div style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {new Date(a.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {a.novoStatus && <StatusBadge status={a.novoStatus} />}
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{a.descricao}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Prospeccao() {
  const [itens,        setItens]        = useState([])
  const [columns,      setColumns]      = useState(() => buildColumns([]))
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [selected,     setSelected]     = useState(null)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [view,         setView]         = useState('lista') // 'lista' | 'kanban'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProspeccoes()
      setItens(data)
      setColumns(buildColumns(data))
    } catch (e) {
      setError(e.message || 'Erro ao carregar prospecções')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await updateProspeccao(editTarget.id, data)
        const next = itens.map(p => p.id === updated.id ? updated : p)
        setItens(next)
        setColumns(buildColumns(next))
        if (selected?.id === updated.id) setSelected(updated)
      } else {
        const created = await createProspeccao(data)
        const next = [created, ...itens]
        setItens(next)
        setColumns(buildColumns(next))
      }
      setFormOpen(false)
      setEditTarget(null)
    } catch (e) {
      alert(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta prospecção?')) return
    setDeletingId(id)
    try {
      await deleteProspeccao(id)
      const next = itens.filter(p => p.id !== id)
      setItens(next)
      setColumns(buildColumns(next))
      setSelected(null)
    } catch (e) {
      alert(e.message || 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  const openEdit = (p) => {
    setEditTarget(p)
    setSelected(null)
    setFormOpen(true)
  }

  const handleUpdated = (updated) => {
    const next = itens.map(p => p.id === updated.id ? updated : p)
    setItens(next)
    setColumns(buildColumns(next))
    setSelected(updated)
  }

  // ── Drag and drop (kanban) ────────────────────────────────────

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const srcCol = source.droppableId
    const dstCol = destination.droppableId

    const srcCards = [...columns[srcCol]]
    const dstCards = srcCol === dstCol ? srcCards : [...columns[dstCol]]
    const [moved] = srcCards.splice(source.index, 1)
    const updatedItem = { ...moved, status: dstCol }
    dstCards.splice(destination.index, 0, updatedItem)

    const prevColumns = columns
    const prevItens   = itens

    const nextCols  = { ...columns, [srcCol]: srcCards, [dstCol]: dstCards }
    const nextItens = itens.map(p => p.id === draggableId ? updatedItem : p)
    setColumns(nextCols)
    setItens(nextItens)

    try {
      await updateProspeccao(moved.id, updatedItem)
    } catch (err) {
      setColumns(prevColumns)
      setItens(prevItens)
      setError('Erro ao mover card: ' + (err.message || 'tente novamente'))
    }
  }

  // ── Filtros (lista) ───────────────────────────────────────────

  const filtered = itens
    .filter(p => filterStatus === 'Todos' || p.status === filterStatus)
    .filter(p => !search || [p.empresa, p.segmento, p.cidade, p.nomeDecisor].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  const COLS = ['Empresa', 'Segmento', 'Decisor', 'Telefone', 'Status', 'Próximo Contato', 'Responsável']

  const btnToggle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    background: active ? '#0f172a' : '#f8f9fa',
    border: active ? '1px solid #0f172a' : '1px solid #e4e4e7',
    color: active ? '#ffffff' : '#64748b',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Prospecção</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : `${itens.length} prospecção${itens.length !== 1 ? 'ões' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Toggle lista/kanban */}
          <div style={{ display: 'flex', background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: 3, gap: 2 }}>
            <button onClick={() => setView('lista')} style={btnToggle(view === 'lista')}>
              <LayoutList size={13} /> Lista
            </button>
            <button onClick={() => setView('kanban')} style={btnToggle(view === 'kanban')}>
              <Kanban size={13} /> Kanban
            </button>
          </div>
          <button onClick={load} disabled={loading}
            style={{ width: 34, height: 34, background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
            title="Atualizar">
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button className="btn-primary" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <Plus size={15} /> Nova Prospecção
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && <ErrorBanner message={error} onRetry={load} />}
      </AnimatePresence>

      {/* Filtros — só na lista */}
      {view === 'lista' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input placeholder="Buscar empresa, decisor, cidade..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#ffffff', border: '1px solid #e4e4e7', color: '#0f172a', padding: '8px 12px 8px 34px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#374151', padding: '8px 14px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
            <option>Todos</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* ── LISTA ────────────────────────────────────────────── */}
      {view === 'lista' && (
        loading ? <LoadingSkeleton /> : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8f9fa' }}>
                    {COLS.map(col => (
                      <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((p, i) => {
                      const isDeleting = deletingId === p.id
                      return (
                        <motion.tr key={p.id}
                          initial={{ opacity: 0 }} animate={{ opacity: isDeleting ? 0.4 : 1 }} exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.02 }}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => setSelected(p)}
                          onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.background = '#fafafa' }}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.empresa}</div>
                            {p.cidade && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.cidade}</div>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#f1f5f9', border: '1px solid #e4e4e7', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{p.segmento}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: 13, color: '#374151' }}>{p.nomeDecisor || '—'}</div>
                            {p.cargoDecisor && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.cargoDecisor}</div>}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{p.telefone || '—'}</td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge status={p.status} /></td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8' }}>{fmtDate(p.dataProximoContato)}</td>
                          <td style={{ padding: '14px 16px' }}><ResponsavelChip nome={p.responsavelNome} /></td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => setSelected(p)}
                                style={{ width: 30, height: 30, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#0f172a' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#64748b' }}>
                                <ChevronRight size={12} />
                              </button>
                              <button onClick={() => openEdit(p)} disabled={isDeleting}
                                style={{ width: 30, height: 30, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#0f172a' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#64748b' }}>
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDelete(p.id)} disabled={isDeleting}
                                style={{ width: 30, height: 30, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#64748b' }}>
                                {isDeleting ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {!loading && filtered.length === 0 && (
                <div style={{ padding: 52, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: '#f1f5f9', border: '1px solid #e4e4e7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Phone size={20} style={{ color: '#9ca3af' }} />
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>
                    {itens.length === 0 ? 'Nenhuma prospecção cadastrada ainda.' : 'Nenhum resultado para esses filtros.'}
                  </div>
                  {itens.length === 0 && (
                    <button className="btn-primary" style={{ marginTop: 12, fontSize: 13 }} onClick={() => { setEditTarget(null); setFormOpen(true) }}>
                      <Plus size={14} /> Adicionar primeira prospecção
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )
      )}

      {/* ── KANBAN ───────────────────────────────────────────── */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
            {STATUSES.map(colName => {
              const cfg   = STATUS_CONFIG[colName]
              const cards = columns[colName] ?? []
              return (
                <div key={colName} style={{ flexShrink: 0, width: 240, display: 'flex', flexDirection: 'column' }}>
                  {/* Cabeçalho da coluna */}
                  <div style={{
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: 10, padding: '10px 12px', marginBottom: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, lineHeight: 1.2 }}>{colName}</span>
                    </div>
                    <span style={{ background: 'rgba(0,0,0,0.06)', color: '#64748b', padding: '1px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                      {loading ? '—' : cards.length}
                    </span>
                  </div>

                  {/* Drop zone */}
                  <Droppable droppableId={colName}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1, minHeight: 80,
                          background: snapshot.isDraggingOver ? cfg.bg : 'transparent',
                          borderRadius: 8, transition: 'background 0.15s',
                          padding: 2,
                        }}
                      >
                        {loading ? (
                          <ColumnSkeleton />
                        ) : (
                          <>
                            {cards.map((p, i) => (
                              <KanbanCard key={p.id} prosp={p} index={i} onClick={() => setSelected(p)} />
                            ))}
                            {provided.placeholder}
                            {cards.length === 0 && !loading && (
                              <div style={{ padding: '16px 12px', textAlign: 'center', color: '#cbd5e1', fontSize: 12, border: '1px dashed #e4e4e7', borderRadius: 8 }}>
                                Nenhuma prospecção
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* Modais */}
      <AnimatePresence>
        {selected && (
          <DetailModal key="detail" prosp={selected}
            onClose={() => setSelected(null)}
            onEdit={() => openEdit(selected)}
            onDelete={() => handleDelete(selected.id)}
            onUpdated={handleUpdated}
            deleting={deletingId === selected?.id}
          />
        )}
        {formOpen && (
          <FormModal key="form" initial={editTarget} saving={saving}
            onClose={() => { setFormOpen(false); setEditTarget(null) }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
