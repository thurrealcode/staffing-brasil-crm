import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, User, Calendar, X, RefreshCw, AlertCircle, Pencil, Tag, Building2 } from 'lucide-react'
import { fetchLeads, createLead, updateLead } from '../lib/leadsService'

// ── Configuração das colunas ──────────────────────────────────

const PIPELINE_COLS = ['Novo Lead', 'Contato Feito', 'Interessado', 'Reunião', 'Proposta', 'Fechado', 'Perdido']

const COLUMN_CONFIG = {
  'Novo Lead':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)' },
  'Contato Feito': { color: '#a855f7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.15)' },
  'Interessado':   { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.15)' },
  'Reunião':       { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)' },
  'Proposta':      { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.15)' },
  'Fechado':       { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.15)' },
  'Perdido':       { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.15)' },
}

// Tag badge: "Hot" vira vermelho, resto neutro
function tagStyle(tag) {
  if (!tag) return null
  const t = tag.toLowerCase()
  if (t === 'hot')       return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)' }
  if (t === 'enterprise') return { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' }
  if (t === 'indicação')  return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.25)' }
  return { color: '#71717a', bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.2)' }
}

// Monta columns a partir do array de leads
function buildColumns(leads) {
  return PIPELINE_COLS.reduce((acc, col) => ({
    ...acc,
    [col]: leads.filter(l => l.status === col),
  }), {})
}

const SEGMENTOS = [
  'Contabilidade', 'Escritório Contábil', 'Advocacia', 'Tecnologia',
  'Logística', 'Indústria', 'Comércio', 'Varejo', 'Saúde',
  'Construção Civil', 'Financeiro', 'Recursos Humanos',
  'Terceirização', 'Consultoria', 'Agência', 'E-commerce',
]

// ── Componentes auxiliares ────────────────────────────────────

function ErrorBanner({ message, onRetry, onClose }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
      <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Tentar novamente</button>}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
    </div>
  )
}

// ── Card Kanban ───────────────────────────────────────────────

function KanbanCard({ lead, index, onEdit }) {
  const firstTag  = lead.tags?.[0]
  const tStyle    = tagStyle(firstTag)
  const dateLabel = lead.ultimoContato
    ? new Date(lead.ultimoContato + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? '#f1f5f9' : '#ffffff',
            border: snapshot.isDragging ? '1px solid #9ca3af' : '1px solid #e4e4e7',
            borderRadius: 10,
            padding: '13px 13px',
            marginBottom: 8,
            cursor: 'grab',
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: snapshot.isDragging ? 'none' : 'border-color 0.15s, background 0.15s',
          }}
        >
          {/* Header: empresa + tag badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, lineHeight: 1.3 }}>{lead.empresa}</div>
            {firstTag && tStyle && (
              <span style={{ background: tStyle.bg, color: tStyle.color, border: `1px solid ${tStyle.border}`, padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>
                {firstTag}
              </span>
            )}
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lead.contato && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{lead.contato}</span>
              </div>
            )}
            {lead.segmento && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{lead.segmento}</span>
              </div>
            )}
            {dateLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{dateLabel}</span>
              </div>
            )}
          </div>

          {/* Footer: edit button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 9 }}
            onMouseDown={e => e.stopPropagation()}  // prevent drag trigger on button area
          >
            <button
              onClick={e => { e.stopPropagation(); onEdit(lead) }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#374151'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              <Pencil size={10} /> Editar
            </button>
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ── Modal de edição de lead ───────────────────────────────────

function LeadEditModal({ lead, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    empresa:       lead.empresa       ?? '',
    contato:       lead.contato       ?? '',
    whatsapp:      lead.whatsapp      ?? '',
    email:         lead.email         ?? '',
    cidade:        lead.cidade        ?? '',
    segmento:      lead.segmento      ?? '',
    status:        lead.status        ?? 'Novo Lead',
    ultimoContato: lead.ultimoContato ?? '',
    observacoes:   lead.observacoes   ?? '',
    tags:          (lead.tags ?? []).join(', '),
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.empresa.trim()) return
    onSave({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  const inp = { width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '8px 11px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Editar Lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Empresa *</label>
              <input required value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" style={inp} />
            </div>
            <div>
              <label style={lbl}>Contato</label>
              <input value={form.contato} onChange={e => set('contato', e.target.value)} placeholder="Nome" style={inp} />
            </div>
            <div>
              <label style={lbl}>WhatsApp</label>
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" style={inp} />
            </div>
            <div>
              <label style={lbl}>E-mail</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Cidade</label>
              <input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Cidade" style={inp} />
            </div>
            <div>
              <label style={lbl}>Segmento</label>
              <select value={form.segmento} onChange={e => set('segmento', e.target.value)} style={inp}>
                <option value="">Selecionar...</option>
                {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>
                {PIPELINE_COLS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Último Contato</label>
              <input type="date" value={form.ultimoContato} onChange={e => set('ultimoContato', e.target.value)} style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Tags (separadas por vírgula)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Hot, Enterprise, Indicação" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} placeholder="Notas sobre o lead..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 2 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '9px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', padding: '9px 14px', borderRadius: 8, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
              {saving ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Salvando...</> : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Skeleton de coluna ────────────────────────────────────────

function ColumnSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 10, padding: '13px 13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
            <div className="skeleton" style={{ width: '65%', height: 13, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 32, height: 13, borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="skeleton" style={{ width: '80%', height: 11, borderRadius: 3 }} />
            <div className="skeleton" style={{ width: '55%', height: 11, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Pipeline() {
  const [columns,    setColumns]    = useState(() => buildColumns([]))
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [editLead,   setEditLead]   = useState(null)
  const [addingTo,   setAddingTo]   = useState(null)
  const [newCard,    setNewCard]    = useState({ empresa: '', contato: '', segmento: '' })

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const leads = await fetchLeads()
      setColumns(buildColumns(leads))
    } catch (err) {
      setError(err.message || 'Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  // ── Drag and drop ──────────────────────────────────────────

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const srcCol = source.droppableId
    const dstCol = destination.droppableId

    // Optimistic update
    const srcCards = [...columns[srcCol]]
    const dstCards = srcCol === dstCol ? srcCards : [...columns[dstCol]]
    const [movedLead] = srcCards.splice(source.index, 1)
    const updatedLead = { ...movedLead, status: dstCol }
    dstCards.splice(destination.index, 0, updatedLead)

    const prevColumns = columns
    setColumns(prev => ({ ...prev, [srcCol]: srcCards, [dstCol]: dstCards }))

    try {
      await updateLead(movedLead.id, { ...movedLead, status: dstCol })
    } catch (err) {
      setColumns(prevColumns)
      setError('Erro ao mover card: ' + (err.message || 'tente novamente'))
    }
  }

  // ── Editar lead ────────────────────────────────────────────

  const handleSaveEdit = async (data) => {
    setSaving(true)
    try {
      const updated = await updateLead(editLead.id, data)
      setColumns(prev => {
        const next = { ...prev }
        // Remove from old column
        PIPELINE_COLS.forEach(col => {
          next[col] = next[col].filter(l => l.id !== editLead.id)
        })
        // Add to correct column
        const targetCol = updated.status
        if (next[targetCol]) {
          next[targetCol] = [updated, ...next[targetCol]]
        }
        return next
      })
      setEditLead(null)
    } catch (err) {
      alert(err.message || 'Erro ao salvar lead')
    } finally {
      setSaving(false)
    }
  }

  // ── Adicionar lead inline ──────────────────────────────────

  const handleAddCard = async (colName) => {
    if (!newCard.empresa.trim()) return
    try {
      const created = await createLead({ ...newCard, status: colName })
      setColumns(prev => ({ ...prev, [colName]: [...prev[colName], created] }))
      setNewCard({ empresa: '', contato: '', segmento: '' })
      setAddingTo(null)
    } catch (err) {
      alert(err.message || 'Erro ao criar lead')
    }
  }

  // ── Stats ──────────────────────────────────────────────────

  const totalLeads    = PIPELINE_COLS.reduce((s, c) => s + columns[c].length, 0)
  const fechadosCount = columns['Fechado']?.length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Pipeline Comercial</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : (
              <>
                {totalLeads} oportunidade{totalLeads !== 1 ? 's' : ''} ·{' '}
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{fechadosCount} fechado{fechadosCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </p>
        </div>
        <button onClick={loadLeads} title="Atualizar"
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#64748b', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadLeads} onClose={() => setError(null)} />}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, flex: 1 }}>
          {PIPELINE_COLS.map(colName => {
            const cfg   = COLUMN_CONFIG[colName]
            const cards = columns[colName] ?? []
            return (
              <div key={colName} style={{ flexShrink: 0, width: 270, display: 'flex', flexDirection: 'column' }}>
                {/* Column header */}
                <div style={{
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: 10, padding: '10px 13px', marginBottom: 10,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{colName}</span>
                    <span style={{ background: 'rgba(255,255,255,0.08)', color: '#a1a1aa', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {cards.length}
                    </span>
                  </div>
                  <button onClick={() => setAddingTo(addingTo === colName ? null : colName)}
                    style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#71717a' }}>
                    <Plus size={12} />
                  </button>
                </div>

                {/* Inline add form */}
                <AnimatePresence>
                  {addingTo === colName && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ marginBottom: 8, overflow: 'hidden' }}>
                      <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, padding: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {[
                          { key: 'empresa',   placeholder: 'Empresa *' },
                          { key: 'contato',   placeholder: 'Contato' },
                          { key: 'segmento',  placeholder: 'Segmento' },
                        ].map(f => (
                          <input key={f.key} value={newCard[f.key]} onChange={e => setNewCard(n => ({ ...n, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            style={{ background: '#111113', border: '1px solid #27272a', color: '#fafafa', padding: '7px 9px', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                        ))}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleAddCard(colName)} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px', flex: 1, justifyContent: 'center' }}>Adicionar</button>
                          <button onClick={() => setAddingTo(null)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }}><X size={12} /></button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cards */}
                <Droppable droppableId={colName}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        minHeight: 120,
                        background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderRadius: 8,
                        transition: 'background 0.15s',
                        padding: 4,
                      }}
                    >
                      {loading ? (
                        <ColumnSkeleton />
                      ) : (
                        <>
                          {cards.map((lead, i) => (
                            <KanbanCard key={lead.id} lead={lead} index={i} onEdit={setEditLead} />
                          ))}
                          {provided.placeholder}
                          {cards.length === 0 && !loading && (
                            <div style={{ padding: 20, textAlign: 'center', color: '#3f3f46', fontSize: 12, border: '1px dashed #1c1c20', borderRadius: 8 }}>
                              Arraste um card aqui
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

      {/* Modal de edição */}
      <AnimatePresence>
        {editLead && (
          <LeadEditModal
            key="edit"
            lead={editLead}
            onClose={() => setEditLead(null)}
            onSave={handleSaveEdit}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
