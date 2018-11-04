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
export const onChange = <P extends {}>(
  propsList: Array<keyof P>,
  action: (props: P) => void,
) => (WrappedComponent: React.ComponentType<P>) =>
  class OnChange extends React.PureComponent<P> {
    public static displayName = `OnChange(${getDisplayName(WrappedComponent)})`

    public componentDidMount() {
      action(this.props)
    }

    public componentDidUpdate(prevProps: P) {
      if (propsList && hasChanged(propsList, prevProps, this.props)) {
        action(this.props)
      }
    }

    public render() {
      return <WrappedComponent {...this.props} />
    }
  }
