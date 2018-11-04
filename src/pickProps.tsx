import * as React from 'react'

import { getDisplayName } from './utils'

export const pickProps = (picker: (props: object) => object) => {
  return (WrappedComponent: React.ComponentClass) => {
    return class PickPropsComponent extends React.PureComponent {
      public static displayName = `PickProps(${getDisplayName(WrappedComponent)})`

      public render() {
        return <WrappedComponent {...picker(this.props)} />
      }
    }
  }
}
