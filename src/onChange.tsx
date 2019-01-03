import * as React from 'react'
import { getDisplayName, hasChanged, GetProps, Matching } from './utils'
import { Props } from 'react'

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
export const onChange = <ActionProps, CheckProps extends {}>(
  propsList: Array<keyof CheckProps>,
  action: (props: ActionProps) => void,
) => <C extends React.ComponentType<Matching<ActionProps, GetProps<C>>>>(WrappedComponent: C) =>
  class OnChange extends React.PureComponent<
    JSX.LibraryManagedAttributes<C, GetProps<C>> & ActionProps & CheckProps
  > {
    public static displayName = `OnChange(${getDisplayName(WrappedComponent)})`

    public componentDidMount() {
      action(this.props)
    }

    public componentDidUpdate(prevProps: CheckProps) {
      if (propsList && hasChanged(propsList, prevProps, this.props)) {
        action(this.props)
      }
    }

    public render() {
      return <WrappedComponent {...(this.props as any)} />
    }
  }

class A extends React.Component<{ test: string }> {
  public render() {
    return ''
  }
}
const Comp = onChange(['test'], (props: { test: string }) => {
  console.log()
})(A)
const c = <Comp test={1} />
