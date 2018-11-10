const modelUpdateActionType = '@reagent/modelUpdate'
import { Dispatch } from 'redux'

export type ActionFunc<S extends any> = (state: S, arg: any) => S

export type ModelUpdateActionCreatorType = <S extends any>(
  modelId: string,
  newStateOrFunc: ActionFunc<S> | any,
  ...args: any[]
) => (dispatch: Dispatch, getState: () => S) => void

export const modelUpdateActionCreator: ModelUpdateActionCreatorType = <S extends any>(
  modelId: string,
  newStateOrFunc: ((state: S) => S) | any,
  ...args: any[]
) => (dispatch: Dispatch, getState: () => S) => {
  let newState = newStateOrFunc
  if (typeof newStateOrFunc === 'function') {
    newState = newStateOrFunc(getState().reagent[modelId], ...args)
  }
  dispatch({
    type: modelUpdateActionType,
    payload: {
      modelId,
      newState,
    },
  })
}

export const reducer = (state = {}, action: { type: string } & {}) => {
  switch (action.type) {
    case modelUpdateActionType:
      const modelUpdateAction = action as {
        type: string
        payload: { modelId: string; newState: any }
      }
      return {
        ...state,
        [modelUpdateAction.payload.modelId]: modelUpdateAction.payload.newState,
      }
    default:
      return state
  }
}
