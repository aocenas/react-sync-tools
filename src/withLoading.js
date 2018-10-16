import _ from 'lodash'
import React from 'react'

export const withLoading = (actions) => (WrappedComponent) => {
  return class ComponentSpinner extends React.PureComponent {
    // static displayName = `ComponentActions(${getDisplayName(WrappedComponent)})`
    render() {
      const actionProps = _.castArray(actions).map((a) => {
        return this.props[a]
      })
      const isLoading = actionProps.some((a) => a.isLoading)
      const hasData = actionProps.every((a) => a.response || a.error)
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

withLoading.config = {
  SpinnerEl: ({ hasData, isLoading }) => (
    <span style={{ visibility: isLoading ? 'visible' : 'hidden' }}>
      {hasData ? 'Reloading' : 'Loading...'}
    </span>
  ),
}
