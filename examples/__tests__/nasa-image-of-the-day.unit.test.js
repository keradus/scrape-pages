import nasaIotdConfig from '../nasa-image-of-the-day.config'
import { assertConfigType } from '../../src/configuration'

describe('nasa iotd config', () => {
  test('is properly typed', () => {
    assertConfigType(nasaIotdConfig)
  })

  // TODO
  // test('returns expected example output', () => {})
})
