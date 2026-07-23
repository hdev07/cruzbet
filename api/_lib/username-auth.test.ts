import { describe, expect, it } from 'vitest'
import { deriveAuthPassword as deriveServer } from './username-auth'
import { deriveAuthPassword as deriveClient } from '../../src/lib/usernameAuth'

// El endpoint de reset de PIN deriva la contraseña en Node; el login la deriva
// en el navegador. Si alguna vez difieren, el PIN restablecido no funcionará.
describe('deriveAuthPassword servidor == cliente', () => {
  const cases: [string, string][] = [
    ['Pedrito', '1234'],
    ['pedrito', '1234'],
    ['  Cruz  ', '87654321'],
    ['José Ñoño', '0000'],
    ['UPPER-lower_09', '9999'],
  ]

  it.each(cases)('coincide para %s / %s', async (username, pin) => {
    const server = deriveServer(username, pin)
    const client = await deriveClient(username, pin)
    expect(server).toBe(client)
  })

  it('normaliza mayúsculas y espacios igual que el cliente', () => {
    expect(deriveServer('Pedrito', '1234')).toBe(deriveServer('  pedrito ', ' 1234 '))
  })
})
