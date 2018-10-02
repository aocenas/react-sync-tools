import React from 'react'

import { getDisplayName } from './utils'

export const pickProps = (picker: (props: Object) => Object) => {
  return (WrappedComponent) => {
    return class PickPropsComponent extends React.PureComponent {
      static displayName = `PickProps(${getDisplayName(WrappedComponent)})`

      render() {
        return <WrappedComponent {...picker(this.props)} />
      }
    }
  }
}
