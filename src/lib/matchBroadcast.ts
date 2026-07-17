export interface BroadcastChannelInfo {
  code: string
  label: string
  bg: string
  color: string
}

const CHANNELS: Record<string, BroadcastChannelInfo> = {
  tudn: { code: 'tudn', label: 'TUDN', bg: '#C8102E', color: '#FFFFFF' },
  canal5: { code: 'canal5', label: 'Canal 5', bg: '#FFC72C', color: '#111111' },
  vix: { code: 'vix', label: 'ViX', bg: '#0A0A0A', color: '#00E6B8' },
  fox: { code: 'fox', label: 'Fox Sports', bg: '#003DA5', color: '#FFFFFF' },
  foxone: { code: 'foxone', label: 'Fox One', bg: '#001A70', color: '#FFFFFF' },
  azteca: { code: 'azteca', label: 'Azteca 7', bg: '#00843D', color: '#FFFFFF' },
  prime: { code: 'prime', label: 'Prime Video', bg: '#0F171E', color: '#00A8E1' },
  claro: { code: 'claro', label: 'Claro Sports', bg: '#DA291C', color: '#FFFFFF' },
  espn: { code: 'espn', label: 'ESPN', bg: '#D00027', color: '#FFFFFF' },
  disney: { code: 'disney', label: 'Disney+', bg: '#113CCF', color: '#FFFFFF' },
}

/** "canal5,tudn,vix" -> [{code:'canal5', label:'Canal 5', ...}, ...] */
export function parseBroadcastChannels(
  raw: string | null | undefined,
): BroadcastChannelInfo[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean)
    .map(
      (code) =>
        CHANNELS[code] ?? { code, label: code.toUpperCase(), bg: '#3F3F46', color: '#FFFFFF' },
    )
}
