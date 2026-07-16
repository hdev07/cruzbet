export const LIGA_MX_CLUBS = [
  { code: 'AME', name: 'América', crest: '/teams/ame.png' },
  { code: 'ATN', name: 'Atlante', crest: '/teams/atn.png' },
  { code: 'ATS', name: 'Atlas', crest: '/teams/ats.png' },
  { code: 'ASL', name: 'Atlético de San Luis', crest: '/teams/asl.png' },
  { code: 'TIJ', name: 'Tijuana', crest: '/teams/tij.png' },
  { code: 'CAZ', name: 'Cruz Azul', crest: '/teams/caz.png' },
  { code: 'JUA', name: 'FC Juárez', crest: '/teams/jua.png' },
  { code: 'QRO', name: 'Querétaro', crest: '/teams/qro.png' },
  { code: 'GDL', name: 'Guadalajara', crest: '/teams/gdl.png' },
  { code: 'LEO', name: 'León', crest: '/teams/leo.png' },
  { code: 'NEC', name: 'Necaxa', crest: '/teams/nec.png' },
  { code: 'PAC', name: 'Pachuca', crest: '/teams/pac.png' },
  { code: 'PUE', name: 'Puebla', crest: '/teams/pue.png' },
  { code: 'MTY', name: 'Monterrey', crest: '/teams/mty.png' },
  { code: 'SAN', name: 'Santos Laguna', crest: '/teams/san.png' },
  { code: 'TIG', name: 'Tigres', crest: '/teams/tig.png' },
  { code: 'TOL', name: 'Toluca', crest: '/teams/tol.png' },
  { code: 'PUM', name: 'Pumas', crest: '/teams/pum.png' },
] as const

export const TOTAL_JORNADAS = 17

export const CARD_MINUTE_BUCKETS = [
  '1-15',
  '16-30',
  '31-45',
  '46-60',
  '61-75',
  '76-90',
  '>90',
] as const

export type TablasSection =
  | 'general'
  | 'goleo'
  | 'menores'
  | 'fair-play'

export const TABLAS_SECTIONS: { id: TablasSection; label: string }[] = [
  { id: 'general', label: 'Tabla General' },
  { id: 'goleo', label: 'Goleo' },
  { id: 'menores', label: 'Tabla de menores' },
  { id: 'fair-play', label: 'Fair Play' },
]
