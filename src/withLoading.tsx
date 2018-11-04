import * as _ from 'lodash'
import * as React from 'react'
import { ActionProp } from './withActions'
import { getDisplayName } from './utils'

// Based on https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
type FilterProperties<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}

type KeysMatching<Base, Condition> = FilterProperties<
  Base,
  Condition
>[keyof Base]

/**
 * HOC that will render either some kind of loader or wrappedComponent or both.
 * The case for both is to give an indication that some data is refreshing and
 * that at the moment it is showing some but it can be old cached data.
 * TODO: Delay to not flash the spinner too quickly
 *
 * @param actionKeys String keys of props which are of type ActionProp. All of them
 *  need to have data or any of them can be in loading state.
 */
export const withLoading = <
  // Props of the wrapped component
  P extends {},
  // Wrapped components props which are of type ActionProp. With this we can check
  // that the supplied keys are for the right props.
  A extends KeysMatching<P, ActionProp>
>(
  actionKeys: A | A[],
) => (WrappedComponent: React.ComponentType<P>) => {
  return class ComponentSpinner extends React.PureComponent<P> {
    public static displayName = `ComponentLoading(${getDisplayName(
      WrappedComponent,
    )})`

    public render() {
      // actionKeys should be only keys to values of type ActionProp so we should
      // be certain here we can force cast it this way
      const actionProps = (_.castArray(actionKeys).map((actionKey) => {
        return this.props[actionKey]
      }) as unknown) as ActionProp[]

      const isLoading = actionProps.some((action) => !!action.isLoading)
      const hasData = actionProps.every(
        (action: ActionProp) => action.response || action.error,
      )
      const SpinnerEl = withLoading.config.SpinnerEl

      return (
        <React.Fragment>
          <SpinnerEl hasData={hasData} isLoading={isLoading} />
          {hasData && <WrappedComponent {...this.props} />}
        </React.Fragment>
      )
    }
  }
}

interface SpinnerElProps {
  hasData: boolean
  isLoading: boolean
}

withLoading.config = {
  SpinnerEl: ({ hasData, isLoading }: SpinnerElProps) => (
    <span style={{ visibility: isLoading ? 'visible' : 'hidden' }}>
      {hasData ? 'Reloading' : 'Loading...'}
    </span>
  ),
} as {SpinnerEl: React.ComponentType<SpinnerElProps>}
