import * as React from 'react'
import { getDisplayName, hasChanged } from './utils'

/**
 * Simple helper that runs supplied function on each change of the specified
 * prop. Props are checked shallowly for identity. For example:
 *
 * @withActions({ getUserData })
 * @onChange(['userId'], props => props.getUserDate.run(props.userId))
 * class UserComponent extends React.Component { ... }
 *
 * Will run the action onMount and then every time the userId prop changes.
 *
 * @param propsList - Name of props to check
 * @param action - Simple function with side effect that will get props as
 *   argument.
 */
export const onChange = <T extends {}>(
  propsList: Array<keyof T>,
  action: (props: T) => void,
) => (WrappedComponent: React.ComponentType<T>) =>
  class OnChange extends React.PureComponent<T> {
    public static displayName = `OnChange(${getDisplayName(WrappedComponent)})`

    public componentDidMount() {
      action(this.props)
    }

    public componentDidUpdate(prevProps: T) {
      if (hasChanged(propsList, prevProps, this.props)) {
        action(this.props)
      }
    }

    public render() {
      return <WrappedComponent {...this.props} />
    }
  }
