import { supabase } from '@/lib/supabase'

/** Avanza ganadores en la BD (penales incluidos) y devuelve si hubo cambios. */
export async function refreshKnockoutBracket(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('refresh_knockout_bracket')
  if (error) {
    if (error.message.includes('refresh_knockout_bracket')) {
      return { ok: false, error: 'Falta ejecutar knockout_bracket_refresh_migration.sql en Supabase' }
    }
    return { ok: false, error: error.message }
  }
  const result = data as { ok?: boolean; slots_updated?: number } | null
  if (result?.ok === false) {
    return { ok: false, error: 'No se pudo actualizar el cuadro' }
  }
  return { ok: true }
}
