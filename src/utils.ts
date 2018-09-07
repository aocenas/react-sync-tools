import * as React from 'react'

export interface PropsMap {
  [key: string]: any
}

export function mapValues<T, N>(
  obj: { [key: string]: T },
  mapper: (val: T, key: string) => N,
): { [key: string]: N } {
  const newObj: { [key: string]: N } = {}
  Object.keys(obj).forEach((key) => {
    newObj[key] = mapper(obj[key], key)
  })
  return newObj
}

export function getDisplayName(component: React.ComponentType) {
  return component.displayName || component.name || 'Component'
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
