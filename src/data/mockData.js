export const mockLeads = [
  { id: 1, empresa: 'TechCorp Brasil', contato: 'Ricardo Oliveira', whatsapp: '(11) 99876-5432', email: 'ricardo@techcorp.com.br', cidade: 'São Paulo', segmento: 'Tecnologia', status: 'Reunião', ultimoContato: '2026-05-05', observacoes: 'Interesse em 3 vagas de dev senior', tags: ['Hot', 'Enterprise'] },
  { id: 2, empresa: 'Grupo Logística MAX', contato: 'Fernanda Costa', whatsapp: '(21) 98765-4321', email: 'fernanda@logmax.com.br', cidade: 'Rio de Janeiro', segmento: 'Logística', status: 'Proposta', ultimoContato: '2026-05-04', observacoes: 'Aguardando aprovação da diretoria', tags: ['Proposta Enviada'] },
  { id: 3, empresa: 'Banco Meridional', contato: 'Carlos Drummond', whatsapp: '(31) 97654-3210', email: 'carlos@meridional.com.br', cidade: 'Belo Horizonte', segmento: 'Financeiro', status: 'Interessado', ultimoContato: '2026-05-03', observacoes: 'Precisam de analistas de compliance', tags: ['Financeiro'] },
  { id: 4, empresa: 'Varejo Express', contato: 'Ana Lima', whatsapp: '(41) 96543-2109', email: 'ana@varejoexpress.com.br', cidade: 'Curitiba', segmento: 'Varejo', status: 'Contato Feito', ultimoContato: '2026-05-02', observacoes: 'Expansão para novas lojas', tags: ['Expansão'] },
  { id: 5, empresa: 'Saúde Mais', contato: 'Paulo Mendes', whatsapp: '(51) 95432-1098', email: 'paulo@saudemais.com.br', cidade: 'Porto Alegre', segmento: 'Saúde', status: 'Novo Lead', ultimoContato: '2026-05-01', observacoes: 'Indicação do cliente TechCorp', tags: ['Indicação'] },
  { id: 6, empresa: 'Construtora Horizonte', contato: 'Marina Santos', whatsapp: '(61) 94321-0987', email: 'marina@horizonte.com.br', cidade: 'Brasília', segmento: 'Construção Civil', status: 'Fechado', ultimoContato: '2026-04-28', observacoes: 'Contrato assinado - 5 vagas', tags: ['Cliente', 'Ativo'] },
  { id: 7, empresa: 'AgriTech Solutions', contato: 'João Carvalho', whatsapp: '(67) 93210-9876', email: 'joao@agritech.com.br', cidade: 'Campo Grande', segmento: 'Agronegócio', status: 'Perdido', ultimoContato: '2026-04-20', observacoes: 'Optou por recrutamento interno', tags: ['Perdido'] },
  { id: 8, empresa: 'Indústria Metalúrgica BR', contato: 'Roberto Faria', whatsapp: '(11) 92109-8765', email: 'roberto@metalurgicabr.com.br', cidade: 'São Bernardo do Campo', segmento: 'Indústria', status: 'Reunião', ultimoContato: '2026-05-06', observacoes: 'Reunião marcada para próxima semana', tags: ['Hot'] },
]

export const mockEmpresas = [
  { id: 1, nome: 'TechCorp Brasil', cnpj: '12.345.678/0001-90', setor: 'Tecnologia', cidade: 'São Paulo', estado: 'SP', contato: 'Ricardo Oliveira', email: 'ricardo@techcorp.com.br', telefone: '(11) 3456-7890', status: 'Cliente Ativo', vagasAbertas: 3, totalContratacoes: 8, valorContrato: 'R$ 45.000/mês', ultimaInteracao: '2026-05-05', observacoes: 'Parceiro estratégico. Alto volume de contratações tech.', vagas: ['Dev Sênior React', 'DevOps Engineer', 'Product Manager'] },
  { id: 2, nome: 'Banco Meridional', cnpj: '98.765.432/0001-10', setor: 'Financeiro', cidade: 'Belo Horizonte', estado: 'MG', contato: 'Carlos Drummond', email: 'carlos@meridional.com.br', telefone: '(31) 2345-6789', status: 'Em Negociação', vagasAbertas: 5, totalContratacoes: 2, valorContrato: 'Em proposta', ultimaInteracao: '2026-05-03', observacoes: 'Banco regional em expansão. Foco em compliance e auditoria.', vagas: ['Analista de Compliance', 'Auditor Interno', 'Analista de Risco', 'Controller', 'Gerente de TI'] },
  { id: 3, empresa: 'Construtora Horizonte', cnpj: '11.222.333/0001-44', setor: 'Construção Civil', cidade: 'Brasília', estado: 'DF', contato: 'Marina Santos', email: 'marina@horizonte.com.br', telefone: '(61) 3456-7890', status: 'Cliente Ativo', vagasAbertas: 2, totalContratacoes: 5, valorContrato: 'R$ 28.000/mês', ultimaInteracao: '2026-04-28', observacoes: 'Construtora de grande porte. Obras em todo o DF.', vagas: ['Engenheiro Civil', 'Mestre de Obras'] },
  { id: 4, nome: 'Grupo Logística MAX', cnpj: '33.444.555/0001-66', setor: 'Logística', cidade: 'Rio de Janeiro', estado: 'RJ', contato: 'Fernanda Costa', email: 'fernanda@logmax.com.br', telefone: '(21) 2456-7890', status: 'Proposta Enviada', vagasAbertas: 4, totalContratacoes: 0, valorContrato: 'R$ 32.000/mês', ultimaInteracao: '2026-05-04', observacoes: 'Grande grupo logístico. Decisão pendente.', vagas: ['Gestor de Frota', 'Analista de Logística', 'Motorista', 'Supervisor de CD'] },
]

export const mockCandidatos = [
  { id: 1, nome: 'Lucas Ferreira', vaga: 'Dev Sênior React', experiencia: '7 anos', cidade: 'São Paulo', status: 'Entrevista', nivel: 'Sênior', data: '2026-05-05', score: 92, observacoes: 'Excelente perfil técnico. Referências verificadas.', habilidades: ['React', 'TypeScript', 'Node.js', 'AWS'], curriculo: 'lucas_ferreira_cv.pdf', empresa: 'TechCorp Brasil' },
  { id: 2, nome: 'Camila Rodrigues', vaga: 'Analista de Compliance', experiencia: '5 anos', cidade: 'Belo Horizonte', status: 'Triagem', nivel: 'Pleno', data: '2026-05-04', score: 78, observacoes: 'Formação jurídica + MBA em finanças.', habilidades: ['Compliance', 'Auditoria', 'LGPD', 'Excel'], curriculo: 'camila_rodrigues_cv.pdf', empresa: 'Banco Meridional' },
  { id: 3, nome: 'Rafael Mendes', vaga: 'DevOps Engineer', experiencia: '4 anos', cidade: 'São Paulo', status: 'Aprovado', nivel: 'Pleno', data: '2026-05-03', score: 88, observacoes: 'Certificado AWS. Excelente em CI/CD.', habilidades: ['Docker', 'Kubernetes', 'AWS', 'Terraform'], curriculo: 'rafael_mendes_cv.pdf', empresa: 'TechCorp Brasil' },
  { id: 4, nome: 'Isabela Nunes', vaga: 'Product Manager', experiencia: '6 anos', cidade: 'Rio de Janeiro', status: 'Enviado ao Cliente', nivel: 'Sênior', data: '2026-05-02', score: 85, observacoes: 'Ex-Google. Background em produto digital.', habilidades: ['Product Strategy', 'Agile', 'Data Analysis', 'OKR'], curriculo: 'isabela_nunes_cv.pdf', empresa: 'TechCorp Brasil' },
  { id: 5, nome: 'Thiago Lima', vaga: 'Engenheiro Civil', experiencia: '10 anos', cidade: 'Brasília', status: 'Contratado', nivel: 'Sênior', data: '2026-04-28', score: 94, observacoes: 'CREA ativo. Especializado em estruturas.', habilidades: ['AutoCAD', 'Revit', 'MS Project', 'Gestão de Obras'], curriculo: 'thiago_lima_cv.pdf', empresa: 'Construtora Horizonte' },
  { id: 6, nome: 'Amanda Souza', vaga: 'Gestor de Frota', experiencia: '8 anos', cidade: 'Rio de Janeiro', status: 'Triagem', nivel: 'Sênior', data: '2026-05-01', score: 71, observacoes: 'Experiência em grandes frotas.', habilidades: ['Gestão de Frota', 'TMS', 'Excel', 'Liderança'], curriculo: 'amanda_souza_cv.pdf', empresa: 'Grupo Logística MAX' },
  { id: 7, nome: 'Diego Alves', vaga: 'Analista de Risco', experiencia: '3 anos', cidade: 'São Paulo', status: 'Reprovado', nivel: 'Junior', data: '2026-04-25', score: 52, observacoes: 'Perfil júnior. Não atende requisitos.', habilidades: ['Excel', 'VBA', 'SQL'], curriculo: 'diego_alves_cv.pdf', empresa: 'Banco Meridional' },
]

export const mockPipeline = {
  'Novo Lead': [
    { id: 'p1', empresa: 'Saúde Mais', contato: 'Paulo Mendes', valor: 'R$ 15.000/mês', data: '2026-05-01', prioridade: 'Média' },
    { id: 'p2', empresa: 'EdTech Futuro', contato: 'Lucia Prado', valor: 'R$ 20.000/mês', data: '2026-05-05', prioridade: 'Alta' },
  ],
  'Contato': [
    { id: 'p3', empresa: 'Varejo Express', contato: 'Ana Lima', valor: 'R$ 25.000/mês', data: '2026-05-02', prioridade: 'Alta' },
    { id: 'p4', empresa: 'AgriTech GO', contato: 'Pedro Castro', valor: 'R$ 12.000/mês', data: '2026-05-04', prioridade: 'Baixa' },
  ],
  'Reunião': [
    { id: 'p5', empresa: 'TechCorp Brasil', contato: 'Ricardo Oliveira', valor: 'R$ 45.000/mês', data: '2026-05-05', prioridade: 'Alta' },
    { id: 'p6', empresa: 'Indústria Metal BR', contato: 'Roberto Faria', valor: 'R$ 30.000/mês', data: '2026-05-06', prioridade: 'Alta' },
  ],
  'Proposta': [
    { id: 'p7', empresa: 'Grupo Logística MAX', contato: 'Fernanda Costa', valor: 'R$ 32.000/mês', data: '2026-05-04', prioridade: 'Alta' },
    { id: 'p8', empresa: 'Banco Meridional', contato: 'Carlos Drummond', valor: 'R$ 55.000/mês', data: '2026-05-03', prioridade: 'Alta' },
  ],
  'Fechado': [
    { id: 'p9', empresa: 'Construtora Horizonte', contato: 'Marina Santos', valor: 'R$ 28.000/mês', data: '2026-04-28', prioridade: 'Alta' },
    { id: 'p10', empresa: 'Farmácia Popular', contato: 'Silvio Borges', valor: 'R$ 18.000/mês', data: '2026-04-15', prioridade: 'Média' },
  ],
}

export const mockAgenda = [
  { id: 1, titulo: 'Reunião TechCorp Brasil', tipo: 'Reunião', data: '2026-05-07', hora: '10:00', empresa: 'TechCorp Brasil', contato: 'Ricardo Oliveira', local: 'Google Meet', descricao: 'Apresentação de candidatos para vagas de dev' },
  { id: 2, titulo: 'Entrevista Lucas Ferreira', tipo: 'Entrevista', data: '2026-05-07', hora: '14:00', empresa: 'TechCorp Brasil', contato: 'Lucas Ferreira', local: 'Zoom', descricao: 'Entrevista técnica - Dev Sênior React' },
  { id: 3, titulo: 'Follow-up Banco Meridional', tipo: 'Follow-up', data: '2026-05-08', hora: '09:00', empresa: 'Banco Meridional', contato: 'Carlos Drummond', local: 'Telefone', descricao: 'Verificar status da proposta' },
  { id: 4, titulo: 'Apresentação Proposta MAX', tipo: 'Reunião', data: '2026-05-09', hora: '15:00', empresa: 'Grupo Logística MAX', contato: 'Fernanda Costa', local: 'Presencial - RJ', descricao: 'Apresentar proposta comercial atualizada' },
  { id: 5, titulo: 'Entrevista Rafael Mendes', tipo: 'Entrevista', data: '2026-05-10', hora: '11:00', empresa: 'TechCorp Brasil', contato: 'Rafael Mendes', local: 'Teams', descricao: 'Entrevista final DevOps' },
  { id: 6, titulo: 'Prospecção Metal BR', tipo: 'Reunião', data: '2026-05-12', hora: '10:30', empresa: 'Indústria Metalúrgica BR', contato: 'Roberto Faria', local: 'Presencial - SP', descricao: 'Primeira reunião de apresentação' },
]

export const mockKpis = {
  leadsAtivos: 24,
  empresasNegociacao: 8,
  vagasAbertas: 31,
  candidatosAtivos: 47,
  reunioesAgendadas: 6,
  contratacoesFechadas: 18,
}

export const mockChartPipeline = [
  { name: 'Jan', value: 12 },
  { name: 'Fev', value: 19 },
  { name: 'Mar', value: 15 },
  { name: 'Abr', value: 28 },
  { name: 'Mai', value: 24 },
]

export const mockChartRecrutamento = [
  { name: 'Jan', candidatos: 45, contratados: 8 },
  { name: 'Fev', candidatos: 62, contratados: 12 },
  { name: 'Mar', candidatos: 38, contratados: 7 },
  { name: 'Abr', candidatos: 71, contratados: 15 },
  { name: 'Mai', candidatos: 47, contratados: 9 },
]

export const mockAtividades = [
  { id: 1, tipo: 'lead', texto: 'Novo lead: Saúde Mais adicionado', tempo: '5 min atrás', icon: 'user-plus' },
  { id: 2, tipo: 'reuniao', texto: 'Reunião agendada com TechCorp Brasil', tempo: '1h atrás', icon: 'calendar' },
  { id: 3, tipo: 'candidato', texto: 'Lucas Ferreira aprovado para entrevista', tempo: '2h atrás', icon: 'check-circle' },
  { id: 4, tipo: 'contrato', texto: 'Construtora Horizonte: Contrato renovado', tempo: '3h atrás', icon: 'file-text' },
  { id: 5, tipo: 'proposta', texto: 'Proposta enviada: Banco Meridional', tempo: '5h atrás', icon: 'send' },
]
