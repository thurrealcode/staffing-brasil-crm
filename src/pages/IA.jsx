import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageSquare, Mail, User, Building2, Copy, RefreshCw, Zap, Brain, Wand2 } from 'lucide-react'

const AI_TOOLS = [
  {
    id: 'whatsapp',
    icon: MessageSquare,
    label: 'Mensagem WhatsApp',
    description: 'Gera abordagem comercial personalizada para WhatsApp',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.15)',
    placeholder: 'Ex: Lead: TechCorp Brasil, segmento tecnologia, interesse em 3 vagas de dev sênior...',
    generate: (ctx) => `Olá, ${ctx.split(',')[0].replace('Lead:', '').trim() || 'tudo bem'}! 👋

Sou da **Staffing Brasil**, especialistas em recrutamento executivo e tecnologia.

Identifiquei que sua empresa está em uma fase de expansão e acredito que podemos ajudar a encontrar os talentos certos de forma mais rápida e assertiva.

Nossa metodologia combina triagem técnica + análise comportamental, o que resulta em uma taxa de retenção 40% acima da média do mercado.

Posso agendar **15 minutos** para apresentar como atendemos empresas do seu setor?

📅 Tenho disponibilidade na próxima semana — quando seria melhor para você?

Att,
_Equipe Staffing Brasil_`,
  },
  {
    id: 'email',
    icon: Mail,
    label: 'Email Comercial',
    description: 'Cria email corporativo para prospecção ou follow-up',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.15)',
    placeholder: 'Ex: Follow-up após reunião com Banco Meridional, proposta de R$ 55k/mês, decisão pendente...',
    generate: (ctx) => `Assunto: [Staffing Brasil] Proposta de Parceria — Próximos Passos

Prezado(a),

Conforme alinhado em nossa reunião, encaminho o resumo das oportunidades identificadas para sua empresa.

**Por que escolher a Staffing Brasil:**
• Base de mais de 15.000 profissionais qualificados
• Tempo médio de preenchimento: 12 dias úteis
• Taxa de sucesso: 94% nas contratações realizadas
• Suporte pós-contratação por 90 dias

**Nossa proposta contempla:**
→ Mapeamento completo do perfil buscado
→ Triagem técnica e comportamental
→ Apresentação de 3 a 5 candidatos semifinalistas
→ Garantia de reposição em caso de desligamento

Ficamos à disposição para esclarecer dúvidas e avançar nessa parceria.

Aguardamos seu retorno.

Atenciosamente,
**Equipe Comercial — Staffing Brasil**
📞 (11) 3456-7890 | comercial@staffingbrasil.com.br`,
  },
  {
    id: 'candidato',
    icon: User,
    label: 'Parecer de Candidato',
    description: 'Análise inteligente de fit e compatibilidade do candidato',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.15)',
    placeholder: 'Ex: Candidato: Lucas Ferreira, 7 anos de experiência, React/Node.js, vaga Dev Sênior TechCorp...',
    generate: (ctx) => `## Parecer Técnico — Avaliação de Candidato

**Compatibilidade com a vaga:** ██████████ 92%

**Pontos de Destaque:**
✅ Experiência técnica sólida e comprovada nas tecnologias requisitadas
✅ Histórico em empresas de médio e grande porte
✅ Comunicação clara e postura profissional elevada
✅ Referências verificadas com avaliação excelente
✅ Disponibilidade imediata para início

**Competências Observadas:**
• Liderança técnica e mentoria de equipes
• Foco em performance e boas práticas (Clean Code, SOLID)
• Experiência com metodologias ágeis (Scrum/Kanban)
• Capacidade de aprendizado rápido em novos contextos

**Recomendação:** ⭐ APROVADO para fase final

Candidato altamente aderente ao perfil solicitado. Recomendamos avançar para entrevista com o gestor técnico e apresentar proposta competitiva — há interesse de outras empresas neste profissional.`,
  },
  {
    id: 'empresa',
    icon: Building2,
    label: 'Resumo de Empresa',
    description: 'Gera análise estratégica e pontos de abordagem para a empresa',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.15)',
    placeholder: 'Ex: TechCorp Brasil, tecnologia, 500 funcionários, expansão São Paulo, 3 vagas dev...',
    generate: (ctx) => `## Análise Estratégica — Empresa

**Perfil da Organização:**
Empresa de médio-grande porte no setor de tecnologia, com histórico de crescimento acelerado e cultura orientada a inovação. Presença consolidada no mercado nacional.

**Oportunidades Identificadas:**
🎯 Alta demanda por profissionais técnicos especializados
🎯 Expansão de times indica crescimento sustentado
🎯 Abertura para parceria de recrutamento contínuo

**Abordagem Recomendada:**
1. Destacar velocidade de entrega (média 12 dias)
2. Apresentar cases de sucesso no mesmo segmento
3. Propor modelo de parceria exclusiva com pricing por sucesso
4. Oferecer período de teste com 1 vaga sem custo

**Decisores-chave:**
• C-Level: Diretoria de Pessoas / CEO
• Influenciador: Gerência de TI / CTO
• Usuário final: Líderes de Squad

**Proposta de Valor:**
Foco em redução de time-to-hire e custo por contratação vs. processo interno.

**Score de Potencial:** ████████░░ 82/100`,
  },
]

export default function IA() {
  const [activeTool, setActiveTool] = useState(null)
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!activeTool) return
    setLoading(true)
    setOutput('')
    await new Promise(r => setTimeout(r, 2000))
    setOutput(activeTool.generate(context))
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(168,85,247,0.15)' }}>
          <Sparkles size={20} style={{ color: '#a855f7' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>IA Integrada</h2>
          <p style={{ fontSize: 13, color: '#52525b' }}>Assistente inteligente para comunicação e análise comercial</p>
        </div>
      </div>

      {/* Tool selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {AI_TOOLS.map(tool => {
          const Icon = tool.icon
          const isActive = activeTool?.id === tool.id
          return (
            <motion.div key={tool.id}
              onClick={() => { setActiveTool(tool); setOutput('') }}
              whileHover={{ y: -2 }}
              style={{
                background: isActive ? tool.bg : '#111113',
                border: `1px solid ${isActive ? tool.border : '#1c1c20'}`,
                borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, background: isActive ? tool.bg : '#18181b', border: `1px solid ${isActive ? tool.border : '#27272a'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: tool.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>{tool.label}</div>
                  <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.4 }}>{tool.description}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Generator */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Context input */}
            <div style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Contexto para {activeTool.label}
              </div>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder={activeTool.placeholder}
                rows={4}
                style={{
                  width: '100%', background: '#18181b', border: '1px solid #27272a', color: '#fafafa',
                  padding: '12px 14px', borderRadius: 8, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5,
                }}
                onFocus={e => { e.target.style.borderColor = activeTool.color; e.target.style.boxShadow = `0 0 0 3px ${activeTool.bg}` }}
                onBlur={e => { e.target.style.borderColor = '#27272a'; e.target.style.boxShadow = 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    background: loading ? '#27272a' : activeTool.color === '#22c55e' ? '#ef4444' : activeTool.color === '#3b82f6' ? '#ef4444' : activeTool.color === '#a855f7' ? '#ef4444' : '#ef4444',
                    color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? (
                    <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                  ) : (
                    <><Wand2 size={14} /> Gerar com IA</>
                  )}
                </button>
              </div>
            </div>

            {/* Loading animation */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 32, textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.div key={i}
                        animate={{ scaleY: [1, 2, 1] }}
                        transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
                        style={{ width: 4, height: 20, background: '#a855f7', borderRadius: 2, transformOrigin: 'center' }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: '#71717a' }}>IA processando seu contexto...</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Output */}
            <AnimatePresence>
              {output && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, overflow: 'hidden' }}
                >
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #1c1c20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Brain size={14} style={{ color: '#a855f7' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Resultado gerado</span>
                      <span style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>IA</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleGenerate}
                        style={{ background: '#18181b', border: '1px solid #27272a', color: '#71717a', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={12} /> Regenerar
                      </button>
                      <button onClick={handleCopy}
                        style={{ background: '#18181b', border: '1px solid #27272a', color: '#71717a', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Copy size={12} /> Copiar
                      </button>
                    </div>
                  </div>
                  <pre style={{ padding: '20px 22px', fontSize: 13, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                    {output}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeTool && (
        <div style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <Sparkles size={36} style={{ color: '#27272a', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, color: '#52525b' }}>Selecione uma ferramenta acima para começar</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
