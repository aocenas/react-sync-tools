import * as _ from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'

import { getDisplayName, Subtract } from './utils'
import {
  ModelUpdateActionCreatorType,
  modelUpdateActionCreator,
} from './model-redux'

interface PropsFromConnect<S> {
  modelUpdateAction: ModelUpdateActionCreatorType
  modelState: S
}

type ActionFunc<S> = (state: S, args: any) => S
type MappedActions<A> = { [P in keyof A]: (arg: any) => void }

interface ActionObject<S> {
  [name: string]: ActionFunc<S>
}

interface Model<S, A extends ActionObject<S>> {
  id: string
  actions: A
  defaultState: S
}

type SetStateFuncFuncArg<S> = (state: S) => S
type SetStateFuncArg<S> = S | SetStateFuncFuncArg<S>
type SetStateFunc<S> = (arg: SetStateFuncArg<S>) => void

type ActionsWithSetState<A, S> = A & { setState: SetStateFunc<S> }

export const makeModel = <S, A extends ActionObject<S>>(
  name: string,
  actions: A,
  defaultState: S,
): Model<S, A> => {
  if (actions.setState) {
    throw new Error(
      'setState is provided automatically, you do not need to specify it.',
    )
  }

  const id =
    name +
    '__' +
    Math.random()
      .toString(32)
      .substr(2, 8)

  return {
    id,
    actions,
    defaultState,
  }
}

export const withModel = <A extends ActionObject<S>, S, MP>(
  model: Model<S, A>,
  mapProps: (state: S, actions: ActionsWithSetState<MappedActions<A>, S>) => MP,
) => {
  return <P extends {[key: string]: any}>(WrappedComponent: React.ComponentType<P>) => {
    type InnerProps = PropsFromConnect<S> & Subtract<P, MP>

    class ComponentState extends React.PureComponent<InnerProps> {
      public static displayName = `ComponentModel(${getDisplayName(
        WrappedComponent,
      )})`

      private readonly modelActions: ActionsWithSetState<MappedActions<A>, S>

      constructor(props: InnerProps) {
        super(props)
        const actionsMapped = Object.keys(model.actions).reduce<{
          [key: string]: (arg: any) => void
        }>((acc, key) => {
          acc[key] = (arg: any) => {
            props.modelUpdateAction(model.id, model.actions[key], arg)
          }
          return acc
        }, {}) as MappedActions<A>

        actionsMapped.setState = (funcOrObj: SetStateFuncArg<S>) => {
          props.modelUpdateAction(model.id, funcOrObj)
        }

        this.modelActions = actionsMapped as ActionsWithSetState<
          MappedActions<A>,
          S
        >
      }

      public render() {
        return (
          <WrappedComponent
            {...mapProps(this.props.modelState, this.modelActions)}
            {..._.omit(this.props, ['modelState', 'modelUpdateAction'])}
          />
        )
      }
    }

    return connect(
      (state: { reagent?: { [modelId: string]: any } }) => {
        if (!state.reagent) {
          throw new Error(
            'There is not a reagent substore, you probably forgot to add it to your redux store',
          )
        }
        return {
          modelState:
            state.reagent[model.id] === undefined
              ? model.defaultState
              : state.reagent[model.id],
        } as { modelState: S }
      },
      { modelUpdateAction: modelUpdateActionCreator },
    )(ComponentState)
  }
}
