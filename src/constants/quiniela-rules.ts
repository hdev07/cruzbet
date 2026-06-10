export const ENTRY_FEE_MXN = 10

export const MAX_GOAL_PREDICTIONS_PER_MATCH = 1
export const MAX_SCORE_PREDICTIONS_PER_MATCH = 1

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
    title: 'Predice minuto del primer gol y ganador',
    description:
      'Son obligatorias las dos: marca el minuto (o «No habrá goles») y elige L, E o V antes de que empiece el partido.',
  },
  {
    title: 'Regla de los 30 segundos',
    description:
      'No eliges segundos. Si el gol cae en el segundo 30 o después (ej. 34:45), para puntuar cuenta como el minuto siguiente.',
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

export const GOAL_SECOND_RULE =
  'Si el gol cae en el segundo 30 o después (ej. 34:45), cuenta como el siguiente minuto de la grilla. Tú solo eliges minutos, no segundos.'

/** Aviso visible en la grilla de predicción del minuto del primer gol */
export const GOAL_MINUTE_PREDICTION_NOTICE = {
  title: 'Nota sobre el minuto',
  bullets: [
    'Solo ganas puntos si aciertas el minuto efectivo exacto (50 pts). No hay puntos por “casi acertar”.',
    'Puedes marcar «No habrá goles»: si el partido termina 0-0, ganas 50 pts.',
    'Cada casillero incluye +30 s: del segundo 30 en adelante cuenta como el minuto siguiente (ej. 34:45 → 35).',
    'Si dos jugadores marcaron el mismo minuto y ambos acertaron, los puntos se reparten entre ambos.',
  ],
} as const

/** Cómo está armada la grilla del minuto del primer gol */
export const GOAL_MINUTE_GRID_LOGIC = {
  title: 'Grilla del primer gol',
  summary:
    'Eliges un solo casillero en la grilla. No importa si el gol lo mete el local o el visitante — solo cuenta cuándo cae el primer gol del partido.',
  halves: [
    {
      title: 'Primer tiempo',
      description: 'Minutos del 1 al 45, más 10 casilleros de tiempo extra (45+1, 45+2 … 45+10).',
    },
    {
      title: 'Segundo tiempo',
      description: 'Minutos del 46 al 90, más 10 casilleros de tiempo extra (90+1, 90+2 … 90+10).',
    },
  ],
  notes: [
    'Solo puedes marcar 1 opción por partido: un minuto o «No habrá goles».',
    'Puedes cambiar tu elección hasta que empiece el partido.',
    'Si marcas un minuto y el partido termina 0-0, vale 0 pts. Usa «No habrá goles» para el 0-0.',
  ],
} as const

/** Regla de ±30 segundos al puntuar el minuto del primer gol */
export const GOAL_SECOND_SCORING_LOGIC = {
  title: 'Regla de los 30 segundos',
  summary:
    'Tú eliges minutos en la grilla, no segundos. Al calcular puntos, si el gol cae en el segundo 30 o después de un minuto, se redondea al siguiente casillero.',
  rule:
    'Del segundo 0 al 29 → cuenta como ese minuto. Del segundo 30 al 59 → cuenta como el minuto siguiente.',
  examples: [
    { goal: '34:12', effective: "34'", whoWins: 'Quien marcó el minuto 34' },
    { goal: '34:45', effective: "35'", whoWins: 'Quien marcó el minuto 35 (el 34 no suma)' },
    { goal: '34:30', effective: "35'", whoWins: 'Quien marcó el minuto 35 (justo en el límite)' },
    { goal: '23:00', effective: "23'", whoWins: 'Quien marcó el minuto 23' },
  ],
  notes: [
    'Los segundos los registra el organizador al cargar el gol en vivo.',
    'La diferencia de puntos se calcula con el minuto efectivo, no con el reloj literal si cae después del segundo 30.',
    'Si dos jugadores eligieron el mismo minuto y ambos acertaron, los puntos de esa predicción se reparten entre ambos.',
  ],
} as const

/** Cómo marcar el ganador L / E / V */
export const WINNER_PREDICTION_LOGIC = {
  title: 'Ganador del partido (L / E / V)',
  summary:
    'No adivinas el marcador exacto. Solo marcas quién gana o si hay empate en una tabla de 3 opciones.',
  options: [
    { code: 'L', label: 'Local', description: 'Gana el equipo de casa.' },
    { code: 'E', label: 'Empate', description: 'El partido termina empatado.' },
    { code: 'V', label: 'Visita', description: 'Gana el equipo visitante.' },
  ],
  notes: [
    'Solo 1 elección por partido.',
    'Si aciertas L, E o V = 30 puntos. Si fallas = 0 puntos.',
    'Puedes cambiar tu elección hasta que empiece el partido.',
  ],
} as const

export const SCORING_RULES = [
  { label: 'Aciertas el minuto efectivo exacto del primer gol', points: 50 },
  { label: 'Marcaste «No habrá goles» y el partido terminó 0-0', points: 50 },
  { label: 'Cualquier otro caso (minuto incorrecto o hubo goles al marcar 0-0)', points: 0 },
] as const

export const SCORE_SCORING_RULES = [
  { label: 'Aciertas quién gana (Local, Empate o Visita)', points: 30 },
] as const

/** Tip en la sección de predicciones del partido */
export const PREDICTIONS_REQUIRED_NOTICE =
  'Debes completar las dos apuestas: minuto del primer gol (o «No habrá goles») y ganador L / E / V.'

export const PREDICTION_FILL_TIP = {
  title: 'Obligatorio',
  message: PREDICTIONS_REQUIRED_NOTICE,
  allFilled: '¡Listo! Completaste el minuto del primer gol y el ganador.',
  incomplete: (missingGoal: boolean, missingWinner: boolean) => {
    if (missingGoal && missingWinner) return PREDICTIONS_REQUIRED_NOTICE
    if (missingGoal) return 'Te falta el minuto del primer gol — márcalo en la grilla o «No habrá goles».'
    return 'Te falta el ganador — márcalo en la tabla L / E / V.'
  },
  goalsRemaining: () => 'Te falta el minuto del primer gol — márcalo en la grilla o «No habrá goles».',
  scoresRemaining: () => 'Te falta el ganador — márcalo en la tabla L / E / V.',
} as const

export const PREDICTION_LIMITS = [
  { label: 'Minuto del primer gol por partido', value: MAX_GOAL_PREDICTIONS_PER_MATCH },
  { label: 'Ganador del partido (L/E/V)', value: MAX_SCORE_PREDICTIONS_PER_MATCH },
  { label: 'Requerido por partido', value: 'Ambas apuestas (minuto + L/E/V)' },
] as const

export const GOAL_PREDICTION_EXAMPLES: readonly SimpleRuleExample[] = [
  {
    id: 'gol-exacto',
    emoji: '⚽',
    title: 'Aciertas el minuto del primer gol',
    youSaid: 'El primer gol cae al minuto 23.',
    whatHappened: 'El primer gol del partido fue al minuto 23 (da igual quién anotó).',
    youGet: '50 puntos.',
    extra: 'Tiene que ser el minuto efectivo exacto. No hay puntos por casi acertar.',
  },
  {
    id: 'gol-segundos',
    emoji: '⏱️',
    title: 'Regla de los 30 segundos',
    youSaid: 'Marcaste minuto 35. Tu amigo marcó minuto 34.',
    whatHappened: 'El primer gol fue al 34:45 (segundo 45 del minuto 34).',
    youGet: 'Tú ganas 50 pts (cuenta como min 35). Tu amigo 0 pts (no es exacto).',
    extra: 'Desde el segundo 30, el gol cuenta como el siguiente casillero.',
  },
  {
    id: 'gol-no-goles',
    emoji: '0️⃣',
    title: 'Marcaste «No habrá goles»',
    youSaid: 'No habrá goles en el partido.',
    whatHappened: 'El partido terminó 0-0.',
    youGet: '50 puntos.',
    extra: 'Si hubiera caído al menos un gol, esta opción valdría 0 pts.',
  },
  {
    id: 'gol-falla',
    emoji: '❌',
    title: 'Te falla el minuto',
    youSaid: 'Primer gol al minuto 23.',
    whatHappened: 'El primer gol cayó al minuto 24.',
    youGet: '0 puntos. No hay puntos por estar cerca.',
    extra: 'Solo cuenta el minuto efectivo exacto.',
  },
] as const

export const SCORE_PREDICTION_EXAMPLES: readonly SimpleRuleExample[] = [
  {
    id: 'ganador-local',
    emoji: '🏆',
    title: 'Aciertas que gana el local',
    youSaid: 'Marcaste L (gana el local).',
    whatHappened: 'Al final quedó 2-1 a favor del local.',
    youGet: '30 puntos.',
    extra: 'No necesitas adivinar el marcador exacto, solo quién gana o si hay empate.',
  },
  {
    id: 'ganador-empate',
    emoji: '🤝',
    title: 'Aciertas el empate',
    youSaid: 'Marcaste E (empate).',
    whatHappened: 'Al final quedó 1-1.',
    youGet: '30 puntos.',
  },
  {
    id: 'ganador-mal',
    emoji: '😅',
    title: 'Te equivocas en el ganador',
    youSaid: 'Marcaste V (gana el visitante).',
    whatHappened: 'Ganó el local 2-0.',
    youGet: '0 puntos en el ganador. No te quitan lo del minuto del gol.',
  },
  {
    id: 'total-partido',
    emoji: '🧮',
    title: '¿Cómo se suma todo?',
    youSaid: 'Pusiste minuto del primer gol y ganador en el mismo partido.',
    whatHappened: 'Minuto te dio 50 pts. Ganador te dio 30 pts.',
    youGet: '50 + 30 = 80 puntos en total.',
    extra: 'Al final del partido se suman ambas predicciones.',
  },
] as const

/** Resumen de las dos predicciones por partido */
export const PREDICTIONS_LOGIC = {
  title: 'Cómo funcionan las predicciones',
  summary:
    'Por partido debes completar las 2 apuestas obligatorias: minuto del primer gol (o «No habrá goles») y ganador (L / E / V).',
  steps: [
    {
      title: 'Grilla del primer gol o «No habrá goles»',
      description:
        '1er tiempo: 1–45 + 10 extras. 2do tiempo: 46–90 + 10 extras. O marca «No habrá goles» si crees que termina 0-0. Solo 1 opción.',
    },
    {
      title: 'Regla de los 30 segundos',
      description:
        'No eliges segundos. Si el gol cae en el segundo 30 o después (ej. 34:45), para puntuar cuenta como el minuto siguiente (35).',
    },
    {
      title: 'Tabla L / E / V',
      description:
        'L = gana el local. E = empate. V = gana el visitante. No necesitas adivinar el marcador exacto.',
    },
    {
      title: 'Ambas son obligatorias',
      description:
        'Debes guardar minuto del primer gol y ganador L/E/V. Sin las dos no entras al ranking del partido.',
    },
    {
      title: 'Cada apuesta se califica aparte',
      description:
        'Si fallas el minuto pero aciertas el ganador (o al revés), sumas lo que sí pegaste. Nunca te restan puntos.',
    },
    {
      title: 'Puntos del minuto',
      description:
        'Minuto efectivo exacto = 50 pts. «No habrá goles» y queda 0-0 = 50 pts. Cualquier otro caso = 0 pts.',
    },
    {
      title: 'Puntos del ganador',
      description: 'Aciertas L, E o V = 30 pts. Fallas = 0 pts.',
    },
  ],
  goalExamples: GOAL_PREDICTION_EXAMPLES,
  scoreExamples: SCORE_PREDICTION_EXAMPLES,
} as const

/** @deprecated Usar PREDICTIONS_LOGIC */
export const MULTIPLE_PREDICTIONS_LOGIC = PREDICTIONS_LOGIC

/** Aviso al guardar una predicción nueva (modal de confirmación) */
export const PREDICTION_SAVE_ALERT = {
  goal: {
    title: '¿Guardamos el minuto del primer gol?',
    subtitle: 'Lee esto rapidito antes de confirmar 👇',
    sections: [
      {
        title: 'Lo básico',
        bullets: [
          'Eliges un casillero en la grilla o marcas «No habrá goles».',
          'Solo ganas con minuto efectivo exacto (50 pts) o 0-0 si marcaste sin goles (50 pts).',
          'No hay puntos por casi acertar el minuto.',
          'Solo tienes 1 oportunidad por partido.',
        ],
      },
      {
        title: 'Regla de los 30 segundos',
        bullets: [
          'Del segundo 30 en adelante, el gol cuenta como el minuto siguiente (ej. 34:45 → 35).',
          'Ejemplo: marcaste 35 y cayó al 34:45 → 50 pts. Si marcaste 34 → 0 pts.',
          'Si dos jugadores acertaron el mismo minuto, los puntos se reparten.',
        ],
      },
      {
        title: 'Lo importante',
        bullets: [
          'Puedes cambiar tu elección hasta que empiece el partido.',
          'Para un 0-0 debes marcar «No habrá goles», no un minuto cualquiera.',
        ],
      },
    ],
    examples: [GOAL_PREDICTION_EXAMPLES[0]!, GOAL_PREDICTION_EXAMPLES[2]!, GOAL_PREDICTION_EXAMPLES[3]!],
    confirm: 'Sí, guardar',
  },
  score: {
    title: '¿Guardamos tu ganador?',
    subtitle: 'Lee esto rapidito antes de confirmar 👇',
    sections: [
      {
        title: 'Lo básico',
        bullets: [
          'Marcaste L (local), E (empate) o V (visita).',
          'Si aciertas quién gana = 30 pts.',
          'Solo tienes 1 oportunidad por partido.',
        ],
      },
      {
        title: 'Lo importante',
        bullets: [
          'No necesitas adivinar el marcador exacto.',
          'Puedes cambiar tu elección hasta que empiece el partido.',
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
  'Debes completar minuto del primer gol y ganador (L/E/V) por partido. Puedes cambiar ambas hasta que empiece el partido.',
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
        'Se suman los puntos del minuto del primer gol y del ganador (L/E/V). El total aparece en el Top del partido.',
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
        'Si hay empate en puntos, gana quien acertó el ganador (30 pts). Si persiste, gana quien acertó el minuto efectivo del primer gol (50 pts, con regla de 30 s). Si aún empatan, se reparte la bolsa.',
    },
    {
      title: 'Requisito de pago y predicciones',
      description:
        'Solo participan quienes depositaron la cuota y completaron ambas apuestas (minuto + L/E/V). El organizador verifica los pagos.',
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
        'Si dos o más jugadores terminan con el mismo total, gana quien tenga más partidos con al menos 1 punto. Si persiste el empate, gana quien tenga más aciertos de ganador en total.',
    },
    {
      title: 'Premio global',
      description:
        'El premio del campeón general, si aplica, se define aparte con el grupo. La bolsa de $10 por partido es independiente y se reparte partido a partido.',
    },
  ],
} as const
