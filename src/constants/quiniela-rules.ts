export const ENTRY_FEE_MXN = 10

export const MAX_GOAL_PREDICTIONS_PER_MATCH = 3
export const MAX_SCORE_PREDICTIONS_PER_MATCH = 2

export type SimpleRuleExample = {
  id: string
  title: string
  emoji?: string
  youSaid: string
  whatHappened: string
  youGet: string
  extra?: string
}

export type RuleAlertSection = {
  title: string
  bullets: readonly string[]
}

export const PAYMENT_INFO = {
  beneficiary: 'Hector Alejandro Cruz Solis',
  bank: 'Banco Azteca',
  accountNumber: '95461681853442',
  accountNumberDisplay: '9546 1681 8534 42',
  clabe: '127180016818534429',
  clabeDisplay: '1271 8001 6818 534429',
} as const

export const HOW_IT_WORKS = [
  {
    title: 'Regístrate',
    description: 'Entra con Google y elige el partido que quieres jugar.',
  },
  {
    title: 'Deposita $10 MXN',
    description: 'Transfiere la cuota por partido a la cuenta indicada abajo antes de predecir.',
  },
  {
    title: 'Predice goles y marcadores',
    description:
      'Puedes poner hasta 3 goles (minuto + quién mete el gol) y hasta 2 marcadores finales. Si quieres solo pones 1. Nadie te obliga a llenar todo.',
  },
  {
    title: 'Suma puntos',
    description:
      'Cuando acaba el partido se revisa cada cosa que pusiste. Lo que aciertas suma. Lo que fallas vale 0 — no te quitan puntos.',
  },
  {
    title: 'Compite en el ranking',
    description: 'Acumula puntos en todos los partidos en los que participes.',
  },
] as const

export const SCORING_RULES = [
  { label: 'Aciertas minuto exacto y quién metió el gol', points: 50 },
  { label: 'Te falla el minuto por 1, pero el equipo sí', points: 25 },
  { label: 'Te falla el minuto por 2 o 3, pero el equipo sí', points: 10 },
  { label: 'Solo aciertas el equipo (el minuto muy lejos)', points: 5 },
] as const

export const SCORE_SCORING_RULES = [
  { label: 'Aciertas el marcador tal cual (ej. 2-1 y queda 2-1)', points: 30 },
  { label: 'No aciertas marcador, pero sí quién gana o empate', points: 10 },
] as const

export const PREDICTION_LIMITS = [
  { label: 'Predicciones de gol por partido (máximo)', value: MAX_GOAL_PREDICTIONS_PER_MATCH },
  { label: 'Predicciones de marcador por partido (máximo)', value: MAX_SCORE_PREDICTIONS_PER_MATCH },
  { label: 'Mínimo requerido por partido', value: '1 gol o 1 marcador' },
] as const

export const GOAL_PREDICTION_EXAMPLES: readonly SimpleRuleExample[] = [
  {
    id: 'gol-uno',
    emoji: '⚽',
    title: 'Solo puse UN gol y ya',
    youSaid: 'El local mete gol al minuto 23.',
    whatHappened: 'Sí cayó un gol del local al minuto 23.',
    youGet: '50 puntos. Listo.',
    extra: 'No necesitas llenar los 3 goles. Con uno solo ya juegas normal.',
  },
  {
    id: 'gol-tres',
    emoji: '🎯',
    title: 'Puse 3 goles distintos',
    youSaid: 'Gol 1: local min 10. Gol 2: local min 23. Gol 3: visitante min 67.',
    whatHappened:
      'En el partido hubo goles al 12, 23 y 68. El del 10 no pasó. El del 23 sí. El del 67 casi (cayó al 68).',
    youGet: 'Gol 1 = 5 pts. Gol 2 = 50 pts. Gol 3 = 25 pts. Total = 80 puntos.',
    extra: 'Cada gol que pusiste se revisa por su cuenta. Uno no le quita puntos al otro.',
  },
  {
    id: 'gol-equipo-mal',
    emoji: '❌',
    title: 'Aciertas el minuto pero fallas el equipo',
    youSaid: 'El local mete gol al minuto 23.',
    whatHappened: 'Al minuto 23 metió gol el visitante, no el local.',
    youGet: '0 puntos en ESE gol. Pero tus otros goles o marcadores no se afectan.',
    extra: 'Tiene que ser el equipo correcto. Si fallas el equipo, ese gol vale 0.',
  },
  {
    id: 'gol-comparacion',
    emoji: '🤝',
    title: '¿Estoy en desventaja si solo pongo 1 gol?',
    youSaid: 'Pedro pone 1 gol. Juan pone 3 goles.',
    whatHappened: 'Los dos aciertan el gol del minuto 23.',
    youGet: 'Pedro gana 50 pts por ese gol. Juan también gana 50 pts por ese mismo gol.',
    extra: 'Pedro no pierde nada por no llenar todo. Juan puede ganar más si acierta sus otros goles.',
  },
] as const

export const SCORE_PREDICTION_EXAMPLES: readonly SimpleRuleExample[] = [
  {
    id: 'marcador-exacto',
    emoji: '🏆',
    title: 'Aciertas el marcador exacto',
    youSaid: 'Queda 2-1 (gana el local).',
    whatHappened: 'Al final del partido quedó 2-1.',
    youGet: '30 puntos.',
    extra: 'Tiene que ser igualito: mismos goles del local y del visitante.',
  },
  {
    id: 'marcador-casi',
    emoji: '👍',
    title: 'No aciertas marcador, pero sí quién gana',
    youSaid: 'Queda 2-1 (gana el local).',
    whatHappened: 'Al final quedó 3-1. No es el marcador exacto, pero el local sí ganó.',
    youGet: '10 puntos (no 30, porque el marcador no fue exacto).',
    extra: 'Con 10 pts ya sumaste algo. No te regañamos por no acertar el marcador exacto.',
  },
  {
    id: 'marcador-dos',
    emoji: '📋',
    title: 'Puse 2 marcadores',
    youSaid: 'Marcador 1: 2-1. Marcador 2: 3-1.',
    whatHappened: 'Al final quedó 2-1.',
    youGet: 'Marcador 1 = 30 pts (exacto). Marcador 2 = 10 pts (local ganó en ambos). Total = 40 pts.',
    extra: 'Podías haber puesto solo uno y estar bien. El segundo es extra por si quieres más chances.',
  },
  {
    id: 'marcador-mal',
    emoji: '😅',
    title: 'Te equivocas feo en el marcador',
    youSaid: 'Queda 1-1 (empate).',
    whatHappened: 'Al final quedó 2-1 (ganó el local). Ni empate ni marcador correcto.',
    youGet: '0 puntos en ESE marcador. No te quitan lo que ganaste en otra cosa.',
    extra: 'Fallar vale 0. Nunca restamos puntos.',
  },
  {
    id: 'total-partido',
    emoji: '🧮',
    title: '¿Cómo se suma todo?',
    youSaid: 'Pusiste 2 goles y 1 marcador en el mismo partido.',
    whatHappened: 'Gol 1 te dio 50 pts. Gol 2 te dio 0 pts. Marcador te dio 30 pts.',
    youGet: '50 + 0 + 30 = 80 puntos en total. Eso es lo que cuenta en el ranking.',
    extra: 'Al final del partido se suman TODAS las cosas que pusiste. Más puntos = más arriba.',
  },
] as const

/** Cómo se contabilizan las oportunidades extra de gol y marcador */
export const MULTIPLE_PREDICTIONS_LOGIC = {
  title: 'Las oportunidades extra (explicado fácil)',
  summary:
    'Puedes poner hasta 3 goles y 2 marcadores por partido. Si quieres pones 1 y ya. Nadie te obliga a llenar todo. Cada cosa que pones se revisa sola y los puntos se van sumando.',
  steps: [
    {
      title: 'No tienes que llenar todo',
      description:
        'Con poner 1 gol o 1 marcador ya participas. Los demás son extras por si quieres más oportunidades de ganar puntos.',
    },
    {
      title: 'Cada predicción va por separado',
      description:
        'Si pusiste 3 goles, al final revisamos gol 1, luego gol 2, luego gol 3. Lo que ganes en cada uno se suma.',
    },
    {
      title: 'Si fallas, vale 0 (no te restan)',
      description:
        '¿Te equivocaste en un gol? Ese vale 0. ¿Pero acertaste otro? Ese sí suma. Nunca te quitamos puntos.',
    },
    {
      title: 'Goles: tiene que ser el equipo correcto',
      description:
        'Si fallas quién metió el gol, ese vale 0 aunque el minuto esté cerca. Si aciertas equipo y minuto exacto = 50 pts.',
    },
    {
      title: 'Marcador: exacto o casi',
      description:
        'Si aciertas el marcador tal cual (2-1 y queda 2-1) = 30 pts. Si no, pero sí aciertas quién gana o empate = 10 pts.',
    },
    {
      title: '¿Conviene poner más predicciones?',
      description:
        'Más predicciones = más chances de sumar. Pero si solo pones una y la clavas, ganas lo mismo en esa que alguien que también la clavó.',
    },
  ],
  goalExamples: GOAL_PREDICTION_EXAMPLES,
  scoreExamples: SCORE_PREDICTION_EXAMPLES,
} as const

/** Aviso al guardar una predicción nueva (modal de confirmación) */
export const PREDICTION_SAVE_ALERT = {
  goal: {
    title: '¿Guardamos este gol?',
    subtitle: 'Lee esto rapidito antes de confirmar 👇',
    sections: [
      {
        title: 'Lo básico',
        bullets: [
          'Cuando termine el partido revisamos este gol contra todos los goles reales.',
          'Si aciertas minuto y equipo = 50 pts. Si te falla por 1 minuto = 25 pts.',
          'Si fallas el equipo = 0 pts en este gol.',
          'Puedes poner hasta 3 goles y 2 marcadores, pero NO es obligatorio.',
        ],
      },
      {
        title: 'Lo importante',
        bullets: [
          'Cada gol que pones se revisa por separado.',
          'Si este falla, vale 0. No te quitan lo que ganes en otro.',
          'Al final se suman todos tus puntos de ese partido.',
        ],
      },
    ],
    examples: [GOAL_PREDICTION_EXAMPLES[0]!, GOAL_PREDICTION_EXAMPLES[1]!],
    confirm: 'Sí, guardar',
  },
  score: {
    title: '¿Guardamos este marcador?',
    subtitle: 'Lee esto rapidito antes de confirmar 👇',
    sections: [
      {
        title: 'Lo básico',
        bullets: [
          'Cuando termine el partido comparamos con el marcador final.',
          'Si aciertas tal cual (ej. 2-1 y queda 2-1) = 30 pts.',
          'Si no aciertas marcador pero sí quién gana o empate = 10 pts.',
          'Puedes poner hasta 2 marcadores, pero con 1 ya juegas.',
        ],
      },
      {
        title: 'Lo importante',
        bullets: [
          'Cada marcador se revisa por separado.',
          'Si este falla, vale 0. No afecta a tus goles ni a tu otro marcador.',
          'Al final se suman todos tus puntos de ese partido.',
        ],
      },
    ],
    examples: [SCORE_PREDICTION_EXAMPLES[0]!, SCORE_PREDICTION_EXAMPLES[1]!],
    confirm: 'Sí, guardar',
  },
} as const

export const PAYMENT_NOTES = [
  'La cuota es de $10 MXN por cada partido en el que quieras participar.',
  'Realiza el depósito o transferencia antes de guardar tu predicción.',
  'En el concepto o referencia escribe tu nombre de usuario para identificar el pago.',
  'Puedes poner hasta 3 goles y 2 marcadores por partido. Si quieres solo pones 1. Puedes cambiar todo hasta que empiece el partido.',
] as const

/** Cómo se determina quién gana la quiniela de cada partido */
export const MATCH_WINNER_LOGIC = {
  title: 'Quiniela por partido',
  summary:
    'Cada partido tiene su propia bolsa. Gana quien acumule más puntos en ese partido al finalizarlo.',
  steps: [
    {
      title: 'Bolsa del partido',
      description: `Se forma con la cuota de $${ENTRY_FEE_MXN} MXN de cada participante que depositó para ese partido.`,
    },
    {
      title: 'Puntos que cuentan',
      description:
        'Se suman todos los puntos de tus predicciones de gol y de marcador de ese partido. El total aparece en el Top del partido.',
    },
    {
      title: 'Ganador',
      description:
        'Al finalizar el partido, quien tenga el mayor total de puntos se lleva la bolsa completa de ese partido.',
    },
    {
      title: 'Empate en primer lugar',
      description:
        'Si dos o más jugadores empatan en puntos, la bolsa se reparte en partes iguales entre los empatados en el primer lugar.',
    },
    {
      title: 'Desempate',
      description:
        'Si hay empate, gana quien tenga más predicciones de marcador exacto (30 pts). Si persiste el empate, gana quien tenga más predicciones de gol con minuto exacto (50 pts). Si aún empatan, se reparte la bolsa.',
    },
    {
      title: 'Requisito de pago',
      description:
        'Solo pueden cobrar quienes hayan depositado la cuota de ese partido. El organizador verifica los pagos por transferencia.',
    },
  ],
} as const

/** Ranking general del torneo (todos los partidos) */
export const GLOBAL_WINNER_LOGIC = {
  title: 'Ranking global',
  summary:
    'Además de la quiniela por partido, se lleva un ranking acumulado con los puntos de todos los partidos en los que participes.',
  steps: [
    {
      title: 'Puntos acumulados',
      description:
        'Cada vez que un partido termina, tus puntos de ese partido se suman a tu total en el ranking global.',
    },
    {
      title: 'Campeón general',
      description:
        'Al cierre del torneo (o de la fase acordada), el jugador con más puntos acumulados en el ranking global es el campeón general.',
    },
    {
      title: 'Empate en el ranking global',
      description:
        'Si dos o más jugadores terminan con el mismo total, gana quien tenga más partidos con al menos 1 punto. Si persiste el empate, gana quien tenga más predicciones de marcador exacto en total.',
    },
    {
      title: 'Premio global',
      description:
        'El premio del campeón general, si aplica, se define aparte con el grupo. La bolsa de $10 por partido es independiente y se reparte partido a partido.',
    },
  ],
} as const
