import { startsWith } from 'lodash'
const actionPrefix = '@reagent/modelUpdate'
import { Dispatch } from 'redux'

export type ActionFunc<S extends any> = (state: S, arg: any) => S

export type ModelUpdateActionCreatorType = <S extends any>(
  modelId: string,
  newStateOrFunc: ActionFunc<S> | any,
  ...args: any[]
) => (dispatch: Dispatch, getState: () => S) => void

export const modelSetStateActionCreator: ModelUpdateActionCreatorType = <
  S extends any
>(
  modelId: string,
  newStateOrFunc: ((state: S) => S) | any,
) => (dispatch: Dispatch, getState: () => S) => {
  let payload = newStateOrFunc
  if (typeof newStateOrFunc === 'function') {
    payload = newStateOrFunc(getState().reagent[modelId])
  }
  dispatch({
    type: [actionPrefix, modelId, 'setState'].join('/'),
    payload,
  })
}

export const modelUpdateActionCreator: ModelUpdateActionCreatorType = <
  S extends any
>(
  modelId: string,
  actionName: string,
  ...args: any[]
) => (dispatch: Dispatch) => {
  dispatch({
    type: [actionPrefix, modelId, actionName].join('/'),
    payload: args,
  })
}

export const reducer = (state: any = {}, action: { type: string, payload: any } & {}) => {
  if (!startsWith(action.type, actionPrefix)) {
    return state
  }

  const [,,modelId, actionName]= action.type.split('/')

  if (actionName === 'setState') {
    return {
      ...state,
      [modelId]: action.payload
    }
  } else {
    return {
      ...state,
      [modelId]: reducers[modelId][actionName](state[modelId], ...action.payload)
    }
  }
}

interface ReducersMap {
  [modelId: string]: {
    [actionName: string]: Function
  }
}
const reducers: ReducersMap = {}

export const registerReducer = (
  modelId: string,
  actionName: string,
  func: (state: any, ...args: any[]) => any,
) => {
  reducers[modelId] = reducers[modelId] || {}
  reducers[modelId][actionName] = func
}
