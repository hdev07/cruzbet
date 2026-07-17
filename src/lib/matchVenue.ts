const LIGA_MX_VENUE_LOCATIONS: Record<string, string> = {
  AKRON: 'Estadio Akron, Zapopan, Jalisco',
  BANORTE: 'Estadio Banorte, Ciudad de México',
  BBVA: 'Estadio BBVA, Guadalupe, Nuevo León',
  CALIENTE: 'Estadio Caliente, Tijuana, Baja California',
  'CD. DE LOS DEPORTES': 'Estadio Ciudad de los Deportes, Ciudad de México',
  CUAUHTEMOC: 'Estadio Cuauhtémoc, Puebla, Puebla',
  CUAUHTÉMOC: 'Estadio Cuauhtémoc, Puebla, Puebla',
  HIDALGO: 'Estadio Hidalgo, Pachuca, Hidalgo',
  JALISCO: 'Estadio Jalisco, Guadalajara, Jalisco',
  'LA CORREGIDORA': 'Estadio La Corregidora, Querétaro, Querétaro',
  'LIBERTAD FINANCIERA': 'Estadio Alfonso Lastras, San Luis Potosí, San Luis Potosí',
  'NEMESIO DIEZ': 'Estadio Nemesio Diez, Toluca, Estado de México',
  'NOU CAMP': 'Estadio León, León, Guanajuato',
  'OLIMPICO BENITO JUAREZ': 'Estadio Olímpico Benito Juárez, Ciudad Juárez, Chihuahua',
  'OLÍMPICO BENITO JUÁREZ': 'Estadio Olímpico Benito Juárez, Ciudad Juárez, Chihuahua',
  'OLIMPICO UNIVERSITARIO': 'Estadio Olímpico Universitario, Ciudad de México',
  'OLÍMPICO UNIVERSITARIO': 'Estadio Olímpico Universitario, Ciudad de México',
  'TSM CORONA': 'Estadio TSM Corona, Torreón, Coahuila',
  UNIVERSITARIO: 'Estadio Universitario, San Nicolás de los Garza, Nuevo León',
  VICTORIA: 'Estadio Victoria, Aguascalientes, Aguascalientes',
}

function normalizeVenueKey(venue: string): string {
  return venue.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function formatMatchVenue(venue: string | null | undefined): string {
  if (!venue) return ''
  const trimmed = venue.trim()
  if (!trimmed) return ''
  if (trimmed.includes(',')) return trimmed
  return LIGA_MX_VENUE_LOCATIONS[normalizeVenueKey(trimmed)] ?? trimmed
}
