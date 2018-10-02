export function mapValues(obj, mapper) {
  const newObj = {}
  Object.keys(obj).forEach((key) => {
    newObj[key] = mapper(obj[key], key)
  })
  return newObj
}

export function getDisplayName(component) {
  return component.displayName || component.name || 'Component'
}

export const hasChanged = (keys, prev, next) => {
  return keys.some((prop) => {
    return prev[prop] !== next[prop]
  })
}

/**
 * Memoize with cache size of 1. Something like reselect but comparing all
 * arguments so makes sense to use to prevent rerenders in React
 * @param fn
 * @return {Function}
 */
export function simpleMemoize(fn) {
  let lastArgs = null
  let lastReturn = null
  return (...args) => {
    if (
      lastArgs &&
      args.every((val, index) => {
        const same = val === lastArgs[index]
        // if (!same) {
        //   console.log(index, val, 'changed')
        // }
        return same
      })
    ) {
      return lastReturn
    } else {
      lastReturn = fn(...args)
      lastArgs = args
      return lastReturn
    }
  }
}
