// Páginas permitidas por role
export const ROLE_PAGES = {
  admin:        new Set(['dashboard','prospeccao','leads','empresas','pipeline','candidatos','agenda','mensagens','relatorios','ia','configuracoes','contratos']),
  comercial:    new Set(['dashboard','prospeccao','leads','empresas','pipeline','mensagens','ia','configuracoes']),
  recrutamento: new Set(['dashboard','candidatos','agenda','mensagens','ia','configuracoes']),
}

export const ROLE_LABELS = {
  admin:        'Administrador',
  comercial:    'Comercial',
  recrutamento: 'Recrutamento',
}

export function canAccess(role, page) {
  const allowed = ROLE_PAGES[role] ?? ROLE_PAGES['comercial']
  return allowed.has(page)
}
