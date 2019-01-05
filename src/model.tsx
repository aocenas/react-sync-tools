import omit = require('lodash/omit')
import * as React from 'react'
import { connect } from 'react-redux'

import { getDisplayName, Matching, Subtract, GetProps, Omit } from './utils'
import {
  modelUpdateActionCreator,
  modelSetStateActionCreator,
  registerReducer,
  storeKey,
} from './model-redux'

/**
 * Type of function expected to be provided for the model. It is basically a
 * reducer of the state with additional args.
 */
type ActionFunc<S> = (state: S, ...args: any[]) => S

/**
 * Helper type that represents set of actions that is given to component when
 * using withModel HOC. Basically the same as ActionFunc but without state
 * which is injected automatically.
 */
type MappedActions<A> = { [P in keyof A]: (arg: any) => void }

interface ActionObject<S> {
  [name: string]: ActionFunc<S>
}

export interface Model<S, A extends ActionObject<S>> {
  /**
   * Id is a name of the model plus some random string for uniqueness.
   */
  id: string
  actions: A
  defaultState: S
}

/**
 * These 3 types are here just to make it more readable (I hope). Reason
 * is that setState which is injected into the set of model actions can take
 * either a new state or a reducer function.
 */
type SetStateFuncFuncArg<S> = (state: S) => S
type SetStateFuncArg<S> = S | SetStateFuncFuncArg<S>
type SetStateFunc<S> = (arg: SetStateFuncArg<S>) => void

type ActionsWithSetState<A, S> = A & { setState: SetStateFunc<S> }
export type MapPropsActionsArg<A, S> = ActionsWithSetState<MappedActions<A>, S>

interface PropsInjectedByConnect<S> {
  modelUpdateAction: typeof modelUpdateActionCreator
  modelSetStateAction: typeof modelSetStateActionCreator
  modelState: S
}

/**
 * Create a model instance that can be later used by withModel. The model
 * represents a single instance of state in the redux store so if you use
 * single model instance on multiple places, you will get the same actions and
 * the same data.
 * @param name - Just a string identifier, mainly to be able to see the part of
 * redux store where the data is stored and discern the redux actions when
 * debuggind.
 * @param actions - A set of reducers tied to this model.
 * @param defaultState - Default state of the model before any modification.
 */
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

  // Generate a semi random identifier.
  // TODO this is not ideal when doing hot reload as the ID will be recreated
  // and the data practically lost.
  const id =
    name +
    '__' +
    Math.random()
      .toString(32)
      .substr(2, 8)

  // Add the reducers to a map so that real redux reducer can find it.
  Object.keys(actions).forEach((key) => {
    registerReducer(id, key, actions[key])
  })

  return {
    id,
    actions,
    defaultState,
  }
}

/**
 * HOC that will inject model state and model actions into the component.
 * @param model - Model instance, created by makeModel factory from which to get
 * the state and actions. To reuse state use the same model instance on multiple
 * places.
 * @param mapProps - Function where you can map state and actions before they are
 * injected, either to select some smaller part of the state or give some specific
 * name to the injected props. Actions will in addition include an setState
 * function.
 */
export const withModel = <
  A extends ActionObject<S>,
  S,
  MappedProps,
  ActionProps
>(
  model: Model<S, A>,
  mapProps: (
    state: S,
    actions: MapPropsActionsArg<A, S>,
    props: Readonly<ActionProps>,
  ) => MappedProps,
) => <C extends React.ComponentType<Matching<MappedProps, GetProps<C>>>>(
  WrappedComponent: C,
) => {
  class ComponentState extends React.PureComponent<
    JSX.LibraryManagedAttributes<C, Omit<GetProps<C>, keyof MappedProps>> &
      ActionProps &
      PropsInjectedByConnect<S>
  > {
    public static displayName = `ComponentModel(${getDisplayName(
      WrappedComponent,
    )})`

    // Keep the mapped actions cached here so we do not recreate them on each
    // render.
    private readonly modelActions: ActionsWithSetState<MappedActions<A>, S>

    constructor(props: any) {
      super(props)
      this.modelActions = this.createMappedActions(props)
    }

    public render() {
      // Remove props which are here from the Redux
      const outerProps = omit(this.props, [
        'modelState',
        'modelUpdateAction',
        'children',
      ])

      // Use the mapProps function to map props provided by this HOC. This way
      // client can decide what he needs
      const mappedProps = mapProps(
        this.props.modelState,
        this.modelActions,
        outerProps,
      )

      const newProps = {
        ...outerProps,
        ...mappedProps,
      } as any
      return <WrappedComponent {...newProps} />
    }

    private createMappedActions(
      props: PropsInjectedByConnect<S>,
    ): ActionsWithSetState<MappedActions<A>, S> {
      const actionsMapped = Object.keys(model.actions).reduce<{
        [key: string]: (arg: any) => void
      }>((acc, key) => {
        acc[key] = (...args: any[]) => {
          props.modelUpdateAction(model.id, key, ...args)
        }
        return acc
      }, {}) as MappedActions<A>

      actionsMapped.setState = (funcOrObj: SetStateFuncArg<S>) => {
        props.modelSetStateAction(model.id, funcOrObj)
      }

      // TS does not get that we actually added the setState to the action
      return actionsMapped as any
    }
  }

  return connect(
    (state: any) => {
      if (!state[storeKey]) {
        throw new Error(
          `There is not a "${storeKey}" substore, you probably forgot to add it to your redux store`,
        )
      }
      return {
        modelState:
          state[storeKey][model.id] === undefined
            ? model.defaultState
            : state[storeKey][model.id],
      } as { modelState: S }
    },
    {
      modelUpdateAction: modelUpdateActionCreator,
      modelSetStateAction: modelSetStateActionCreator,
    },
  )(ComponentState as any /* TODO */)
}
