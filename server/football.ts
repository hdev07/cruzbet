const API_BASE = 'https://v3.football.api-sports.io'

export async function fetchFootballApi(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const key = process.env.FOOTBALL_API_KEY
  if (!key) {
    throw new Error('FOOTBALL_API_KEY no configurada')
  }

  const url = new URL(path, API_BASE)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-apisports-key': key },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API-Football ${response.status}: ${text}`)
  }

  return response.json()
}
