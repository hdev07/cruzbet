export const ENTRY_FEE_MXN = 10

export const MAX_GOAL_PREDICTIONS_PER_MATCH = 5
export const MAX_SCORE_PREDICTIONS_PER_MATCH = 2

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
    description: 'Hasta 5 predicciones de gol (minuto + equipo) y hasta 2 marcadores finales por partido. Solo antes de que empiece.',
  },
  {
    title: 'Suma puntos',
    description: 'Al finalizar el partido se calculan los puntos de cada predicción por separado.',
  },
  {
    title: 'Compite en el ranking',
    description: 'Acumula puntos en todos los partidos en los que participes.',
  },
] as const

export const SCORING_RULES = [
  { label: 'Minuto exacto + equipo correcto (por gol predicho)', points: 50 },
  { label: '±1 minuto + equipo correcto', points: 25 },
  { label: '±3 minutos + equipo correcto', points: 10 },
  { label: 'Solo equipo correcto', points: 5 },
] as const

export const SCORE_SCORING_RULES = [
  { label: 'Marcador exacto (por predicción)', points: 30 },
  { label: 'Resultado correcto (ganador o empate)', points: 10 },
] as const

export const PREDICTION_LIMITS = [
  { label: 'Predicciones de gol por partido', value: MAX_GOAL_PREDICTIONS_PER_MATCH },
  { label: 'Predicciones de marcador por partido', value: MAX_SCORE_PREDICTIONS_PER_MATCH },
] as const

export const PAYMENT_NOTES = [
  'La cuota es de $10 MXN por cada partido en el que quieras participar.',
  'Realiza el depósito o transferencia antes de guardar tu predicción.',
  'En el concepto o referencia escribe tu nombre de usuario para identificar el pago.',
  'Hasta 5 predicciones de gol y 2 de marcador por partido; puedes agregar, editar o eliminar hasta que empiece.',
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
