# React Sync Tools

A set of HOCs to help with state management and data fetching. Main goals are ease of use and incremental composability
while building on top of Redux.

## Installation

```bash
yarn install react-sync-tools
# install peer dependencies if you do not have the already
yarn install axios prop-types react react-redux redux redux-thunk
```

### Setup redux store
```javascript
import { reducer, storeKey } from 'react-sync-tools'
import { Provider } from 'react-redux'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

const store = createStore(
  combineReducers({
      // You need to specify our reducer here. 
      [storeKey]: reducer,
      // You can also add your own reducer here so that state for models
      // and your own state will coexist. 
      someOtherState: someReducer
  }),
  applyMiddleware(thunk)
)

render(
  <Provider store={store}>
    <YourApp />
  </Provider>,
  document.querySelector('#app'),
)

```


## HOCs:

### withActions
Allows you to wrap an async action (usually some network fetch) and handling state changes, errors and cancellations.
```typescript

/**
 * HOC that transforms supplied async action functions into properties with
 * state, and trigger function (type ActionProp). It handles state changes,
 * cancellation and errorHandling.
 * @param actions - You can supply object of ActionDefs depending on whether you
 * want to specify also after function or options or both. Options can be any
 * object, it is just passed to config.errorHandler so you can use it to have
 * action specific error handling.
 */
export const withActions = <A extends { [key: string]: ActionDef }>(
  actions: A,
) => (WrappedComponent: React.ComponentType<P>): ComponentWithActions

type ActionDef =
  // Just an action function
  | ActionFunc

  // Array with action function as a first element and options as a second. Options are passed into custom errorHandler
  // function so that you can change error handling for some particular action. For example you can have some default
  // handling for all actions, but you do not want that for you form submit actions where you want to show 400 responses
  // inline.
  | [ActionFunc, object]

  // An object with in addition can define after function.
  | {
      action: ActionFunc
      // Function that will be invoked with the response of the action. Mainly for convenient way to chain code
      // after response, for example to store data in some model state.
      after?: AfterFunc

      // Options object that will be passed to your custom errorHandler.
      options?: any
    }

/**
 * Definition of the code run by the action. You can use cancelToken to
 * implement cancellation (see config to configure cancelToken creation)
 */
type ActionFunc = (
  args: { cancelToken: CancelToken; props: any; params: any },
) => Promise<{ data: any }>

/**
 * After function will get the response from the action function, your component
 * props and params that were supplied to the action function. It is not called
 * if your action function throws.
 */
type AfterFunc = (
  response: { data: any },
  props: any,
  params: any,
) => void | Promise<void>

/**
 * Object wrapping the state of the action which is passed to wrapped component.
 * The state changes are:
 *
 * Initial:
 *   { run }
 *   ActionProp.run -> Loading
 *
 * Loading:
 *   { run, isLoading: true }
 *   finish -> Success
 *          -> Failed
 *
 * Success:
 *   { run, isLoading: false, response }
 *   ActionProps.run -> Loading
 *
 * Failed:
 *   { run, isLoading: false, error }
 *   ActionProps.run -> Loading
 *
 */
export interface ActionProp<R = any> {
  run: RunHandler
  isLoading?: boolean
  error?: any
  response?: R
}

/**
 * Function you call from the component what you want to fire the action is
 * bound to ActionProp.
 */
export type RunHandler = (
  params?: any,
  actionOptions?: {
    // If true the last response will be deleted on invocation.
    clear: boolean
  },
) => Promise<void>

```

### withModel
A way to create a reusable state with reducers, that can either be reused. The state itself is stored in Redux
but is accessible only to components that explicitly use the model. Each model is stored in its own part of the Redux
so they do not clash.

```typescript
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
): Model<S, A>


interface ActionObject<S> {
  [name: string]: ActionFunc<S>
}

/**
 * Type of function expected to be provided for the model. It is basically a
 * reducer of the state with additional args.
 */
type ActionFunc<S> = (state: S, ...args: any[]) => S


/**
 * HOC that will inject model state and model actions into the component.
 * @param model - Model instance, created by makeModel factory from which to get
 * the state and actions. To reuse state use the same model instance on multiple
 * places.
 * @param mapProps - Function where you can map state and actions before they are
 * injected, either to select some smaller part of the state or give some specific
 * name to the injected props.
 */
export const withModel = <
  A extends ActionObject<S>,
  S,
  MappedProps,
  P extends { [key: string]: any },
  InnerProps extends PropsInjectedByConnect<S> & Subtract<P, MappedProps>
>(
  model: Model<S, A>,
  mapProps: (
    state: S,
    actions: ActionsWithSetState<MappedActions<A>, S>,
    props: InnerProps,
  ) => MappedProps,
) => (WrappedComponent: React.ComponentType<P>): ComponentWithModel 
```


### onChange
```typescript
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
export const onChange = <P extends {}>(
  propsList: Array<keyof P>,
  action: (props: P) => void,
) => (WrappedComponent: React.ComponentType<P>) => ComponentWithOnChange
```

