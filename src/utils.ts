import * as React from 'react'

// https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>
export type Subtract<T, K> = Omit<T, keyof K>

export function getDisplayName(component: React.ComponentType) {
  return component.displayName || 'Component'
}

export const hasChanged = <T extends {}>(
  keys: Array<keyof T>,
  prev: T,
  next: T,
): boolean => {
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
export function simpleMemoize(fn: (...args: any[]) => any) {
  let lastArgs: any[] | null = null
  let lastReturn: any[] | null = null
  return (...args: any[]) => {
    if (
      lastArgs &&
      args.every((val, index) => {
        const same = val === (lastArgs as any[])[index]
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
