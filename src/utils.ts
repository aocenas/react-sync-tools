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
