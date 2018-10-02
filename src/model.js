import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { getDisplayName } from './utils'

const modelUpdateActionType = '@reagent/modelUpdate'

const modelUpdateAction = (modelId, newStateOrFunc, arg) => (
  dispatch,
  getState,
) => {
  let newState = newStateOrFunc
  if (typeof newStateOrFunc === 'function') {
    newState = newStateOrFunc(getState().reagent[modelId], arg)
  }
  console.log('update action', newState)
  dispatch({
    type: modelUpdateActionType,
    payload: {
      modelId,
      newState,
    },
  })
}

export const reducer = (state = {}, action) => {
  switch (action.type) {
    case modelUpdateActionType:
      console.log('reducer', action)
      return {
        ...state,
        [action.payload.modelId]: action.payload.newState,
      }
    default:
      return state
  }
}

/**
 * @param name
 * @param actions
 * @param defaultState
 * @return {function(*=)}
 */
export const model = (name: string, actions: Object, defaultState: any) => {
  const modelId =
    name +
    '__' +
    Math.random()
      .toString(32)
      .substr(2, 8)

  return (WrappedComponent) => {
    class ComponentState extends React.PureComponent {
      static displayName = `ComponentState(${getDisplayName(WrappedComponent)})`

      constructor(props) {
        super(props)
        const actionsMapped = Object.keys(actions).reduce((acc, key) => {
          acc[key] = (arg) => {
            props.modelUpdateAction(modelId, actions[key], arg)
          }
          return acc
        }, {})

        this._modelActions = {
          setState: (funcOrObj) => {
            props.modelUpdateAction(modelId, funcOrObj)
          },
          ...actionsMapped,
        }
      }

      render() {
        return (
          <WrappedComponent
            {...{ [name]: this.props.modelState }}
            {...{ [name + 'Actions']: this._modelActions }}
            {..._.omit(this.props, ['modelState', 'modelUpdateAction'])}
          />
        )
      }
    }

    return connect(
      (state) => {
        if (!state.reagent) {
          throw new Error(
            'There is not a reagent substore, you probably forgot to add it to your redux store',
          )
        }
        console.log('reagent store', state.reagent)
        return {
          modelState:
            state.reagent[modelId] === undefined
              ? defaultState
              : state.reagent[modelId],
        }
      },
      { modelUpdateAction },
    )(ComponentState)
  }
}
