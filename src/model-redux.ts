import startsWith = require('lodash/startsWith')
import { Dispatch } from 'redux'

const actionPrefix = '@react-sync-tools/modelUpdate'
export const storeKey = 'react-sync-tools-models'

/**
 * Action creator that allows to either completely replace the model state or
 * allows you to pass a function acting as a reducer.
 * @param modelId
 * @param newStateOrFunc
 */
export const modelSetStateActionCreator = <S extends any>(
  modelId: string,
  newStateOrFunc: ((state: S) => S) | any,
) => (dispatch: Dispatch, getState: () => S) => {
  let payload = newStateOrFunc
  if (typeof newStateOrFunc === 'function') {
    payload = newStateOrFunc(getState()[storeKey][modelId])
  }
  dispatch({
    type: [actionPrefix, modelId, 'setState'].join('/'),
    payload,
  })
}

/**
 * Action creator used for model actions. Type of the action is a path to reducer
 * and payload will be args meant to be passed to that reducer.
 * @param modelId
 * @param actionName
 * @param args
 */
export const modelUpdateActionCreator = <S extends any>(
  modelId: string,
  actionName: string,
  ...args: any[]
) => {
  return {
    type: [actionPrefix, modelId, actionName].join('/'),
    payload: args,
  }
}

/**
 * Single reducer for all models. Actual reducers are dynamically dispatched
 * based on the type from reducers object.
 * @param state
 * @param action
 */
export const reducer = (
  state: any = {},
  action: { type: string; payload: any } & {},
) => {
  if (!startsWith(action.type, actionPrefix)) {
    return state
  }

  const [, , modelId, actionName] = action.type.split('/')

  // Base action that is allways provided for each model.
  if (actionName === 'setState') {
    return {
      ...state,
      [modelId]: action.payload,
    }
  } else {
    return {
      ...state,
      // Invoking the specific reducer
      [modelId]: reducers[modelId][actionName](
        state[modelId],
        ...action.payload,
      ),
    }
  }
}

type ReducerFunc<S> = (state: S, ...args: any[]) => S

interface ReducersMap {
  [modelId: string]: {
    [actionName: string]: ReducerFunc<any>
  }
}

/**
 * Model action functions are registered here and called from the reducer.
 */
const reducers: ReducersMap = {}

export const registerReducer = (
  modelId: string,
  actionName: string,
  func: (state: any, ...args: any[]) => any,
) => {
  reducers[modelId] = reducers[modelId] || {}
  reducers[modelId][actionName] = func
}
