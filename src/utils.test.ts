import { hasChanged, mapValues } from './utils'

describe('mapValues', () => {
  it('Maps values', () => {
    expect(
      mapValues(
        {
          one: 1,
          tow: 2,
          three: 3,
        },
        (x) => x * x,
      ),
    ).toEqual({
      one: 1,
      tow: 4,
      three: 9,
    })
  })
})

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
