import axios from 'axios'
import * as React from 'react'
import { getDisplayName, mapValues } from './utils'

type ActionFunc = (token: object, ...args: any[]) => any
type RunHandler = (...args: any[]) => Promise<void>

type ActionOptions = object
export type ActionArg = ActionFunc | [ActionFunc, ActionOptions]

interface Actions {
  [actionName: string]: ActionArg
}

/**
 * Object wrapping the state of the action which is passed to wrapped component.
 * The state changes are:
 *
 * Initial:
 *   { run }
 *   -> ActionProp.run -> Loading
 *
 * Loading:
 *   { run, isLoading: true }
 *   -> Success -> Success
 *   -> Error -> Failed
 *
 * Success:
 *   { run, isLoading: false, response }
 *   -> ActionProps.run -> Loading
 *
 * Failed:
 *   { run, isLoading: false, error }
 *   -> ActionProps.run -> Loading
 *
 */
interface ActionProp {
  run: RunHandler
  isLoading?: boolean
  error?: any
  response?: any
}

interface State {
  [key: string]: ActionProp
}

interface CancelToken {
  cancel: () => void
  token: any
}

// https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>
type Subtract<T, K> = Omit<T, keyof K>

/**
 * Component wrapper that transforms supplied Actions into ActionProp while
 * handling ActionProp lifecycle changes, like error/loading/canceled states.
 * @param actions - You can supply either a function or a tuple of
 *   [function, options]. Options can be any object, it is just passed to
 *   config.errorHandler so you can have action specific error handling.
 */
export const withActions = <K extends Actions>(actions: K) => <T extends {}>(
  WrappedComponent: React.ComponentType<T>,
) => {
  // Private members generate errors so everything is public here :(:
  // https://github.com/Microsoft/TypeScript/issues/17293
  return class ComponentActions extends React.PureComponent<
    Subtract<T, K>,
    State
  > {
    public static displayName = `ComponentActions(${getDisplayName(
      WrappedComponent,
    )})`

    /**
     * Cancel tokens of in progress actions. Used for cancellation on unmount.
     */
    public cancelTokens: {
      [key: string]: CancelToken
    }

    constructor(props: any) {
      super(props)
      this.cancelTokens = {}
      this.state = mapValues(actions, this.actionArgToActionPropMapper)
    }

    public componentWillUnmount() {
      Object.keys(this.cancelTokens).forEach((key) =>
        this.cancelTokens[key].cancel(),
      )
    }

    public render() {
      return <WrappedComponent {...this.props} {...this.state} />
    }

    /**
     * Wraps the action function in handler that handles errors, state changes
     * and creation of cancel tokens.
     * @param func
     * @param key
     * @param options
     */
    public createRunHandler = (
      func: ActionFunc,
      key: string,
      options: ActionOptions,
    ): RunHandler => {
      return async (...args: any[]): Promise<void> => {
        if (this.cancelTokens[key]) {
          this.cancelTokens[key].cancel()
        }
        this.cancelTokens[key] = config.createCancelToken()
        this.setState({
          [key]: { run: this.state[key].run, isLoading: true },
        })

        let response
        try {
          response = await func(this.cancelTokens[key].token, ...args)
        } catch (error) {
          this.handleRunError(key, error, options)
          return
        }

        delete this.cancelTokens[key]
        this.setState({
          [key]: { run: this.state[key].run, isLoading: false, response },
        })
      }
    }

    /**
     * Base error handler. Calls config.handleError if specified for more
     * application specific error handling.
     * @param key
     * @param error
     * @param options
     */
    public handleRunError = (
      key: string,
      error: any,
      options: ActionOptions,
    ): void => {
      delete this.cancelTokens[key]
      if (!config.isCancel(error)) {
        this.setState({
          [key]: {
            run: this.state[key].run,
            isLoading: false,
            error,
          },
        })
        if (config.errorHandler) {
          config.errorHandler(key, error, options, this.state[key].run)
        } else {
          console.error(error)
        }
      }
    }

    public actionArgToActionPropMapper = (
      func: ActionArg,
      key: string,
    ): ActionProp => {
      let options = {}
      let actionFunc
      if (Array.isArray(func)) {
        ;[actionFunc, options] = func as [ActionFunc, ActionOptions]
      } else {
        actionFunc = func
      }
      return {
        run: this.createRunHandler(actionFunc, key, options),
      }
    }
  }
}

export const config: {
  /**
   * Factory function creating cancel tokens. By default it is.
   * axios.CancelToken.source but you can supply you own.
   */
  createCancelToken: () => CancelToken
  /**
   * By default Axios will throw in case the request is canceled and this check
   * if the thrown error is cancellation error.
   * @param error
   */
  isCancel: (error: any) => boolean

  /**
   * In case error is not a cancellation error, it will be handled by this
   * function. If not supplied it will be just console.error logged.
   * @param key - Name of the action.
   * @param error - Error instance.
   * @param options - Any options that were passed with the Action.
   * @param action - Action function that can be called again.
   */
  errorHandler?: (
    key: string,
    error: any,
    options: ActionOptions,
    action: ActionFunc,
  ) => void
} = {
  createCancelToken: axios.CancelToken.source,
  isCancel: axios.isCancel,
}
