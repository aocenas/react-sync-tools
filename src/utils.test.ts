import { hasChanged } from './utils'

describe('hasChanged', () => {
  it('Detects changes in specified keys', () => {
    expect(hasChanged(['one'], { one: 1 }, { one: 2 })).toBe(true)

    expect(hasChanged(['one'], { one: 1 }, { one: 1 })).toBe(false)
  })

  it('Detects changes in objects with multiple keys', () => {
    expect(hasChanged(['one'], { one: 1, two: 2 }, { one: 2, tow: 2 })).toBe(
      true,
    )

    expect(hasChanged(['one'], { one: 1, two: 2 }, { one: 1, two: 4 })).toBe(
      false,
    )
  })
})
