import { mapValues } from 'lodash'
import axios, { CancelTokenSource, CancelToken } from 'axios'
import * as React from 'react'
import { getDisplayName, Subtract } from './utils'

type ActionFunc = (
  args: { cancelToken: CancelToken; props: any; params: any },
) => Promise<{ data: any }>

type AfterFunc = (
  response: { data: any },
  props: any,
  params: any,
) => void | Promise<void>

export type RunHandler = (
  params?: any,
  actionOptions?: { clear: boolean },
) => Promise<void>

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

export type State<P extends string | number | symbol> = Record<P, ActionProp>

export type ActionDef =
  | [ActionFunc, object]
  | ActionFunc
  | {
      action: ActionFunc
      after?: AfterFunc
      options?: object
    }

/**
 * Component wrapper that transforms supplied Actions into ActionProp while
 * handling ActionProp lifecycle changes, like error/loading/canceled states.
 * @param actions - You can supply either a function or a tuple of
 *   [function, options]. Options can be any object, it is just passed to
 *   config.errorHandler so you can have action specific error handling.
 */
export const withActions = <A extends { [key: string]: ActionDef }>(
  actions: A,
) => <P extends { [key: string]: any }>(
  WrappedComponent: React.ComponentType<P>,
) => {
  type InnerProps = Subtract<P, A>

  return class ComponentActions extends React.PureComponent<
    InnerProps,
    State<keyof A>
  > {
    public static displayName = `ComponentActions(${getDisplayName(
      WrappedComponent,
    )})`

    /**
     * Cancel tokens of in progress actions. Used for cancellation on unmount.
     */
    private readonly cancelTokens: Partial<
      { [K in keyof A]: CancelTokenSource }
    > = {}

    constructor(props: InnerProps) {
      super(props)
      this.cancelTokens = {}
      this.state = mapValues(
        actions,
        this.actionArgToActionPropMapper,
      ) as State<keyof A>
    }

    public componentWillUnmount() {
      Object.keys(this.cancelTokens).forEach((key) =>
        (this.cancelTokens[key] as CancelTokenSource).cancel(),
      )
    }

    public render() {
      return <WrappedComponent {...this.props} {...this.state} />
    }

    /**
     * Wraps the action function in handler that handles errors, state changes
     * and creation of cancel tokens.
     * @param func
     * @param afterFunc
     * @param key
     * @param options
     */
    private createRunHandler = (
      func: ActionFunc,
      afterFunc: AfterFunc | undefined | null,
      key: keyof A,
      options: object | undefined | null,
    ): RunHandler => {
      return async (params: any, actionOptions?: { clear: boolean }) => {
        const clear = actionOptions && actionOptions.clear
        if (this.cancelTokens[key]) {
          ;(this.cancelTokens[key] as CancelTokenSource).cancel()
        }
        this.cancelTokens[key] = withActions.config.createCancelToken()
        // At this point we do not delete the error or response so you can have
        // response while the request is reloading
        const newActionProp: ActionProp = clear
          ? {
              run: this.state[key].run,
              isLoading: true,
            }
          : {
              ...(this.state[key] as ActionProp),
              isLoading: true,
            }

        this.setState({ [key]: newActionProp } as State<keyof A>)

        let response
        try {
          response = await func({
            cancelToken: (this.cancelTokens[key] as CancelTokenSource).token,
            props: this.props,
            params,
          })
          if (afterFunc) {
            await afterFunc(response, params, this.props)
          }
        } catch (error) {
          this.handleRunError(key, error, options)
          return
        }

        delete this.cancelTokens[key]
        this.setState({
          [key]: {
            run: this.state[key].run,
            isLoading: false,
            response,
          },
        } as State<keyof A>)
      }
    }

    /**
     * Base error handler. Calls config.handleError if specified for more
     * application specific error handling.
     * @param key
     * @param error
     * @param options
     */
    private handleRunError = (
      key: keyof A,
      error: Error,
      options: object | undefined | null,
    ) => {
      const config = withActions.config
      delete this.cancelTokens[key]
      if (!config.isCancel(error)) {
        this.setState({
          [key]: {
            run: this.state[key].run,
            isLoading: false,
            error,
          },
        } as Record<keyof A, ActionProp>)
        if (config.errorHandler) {
          config.errorHandler(
            key as string,
            error,
            options,
            this.state[key].run,
          )
        } else {
          console.error(error)
        }
      }
    }

    private actionArgToActionPropMapper = (
      func: ActionDef,
      key: keyof A,
    ): ActionProp => {
      let options
      let actionFunc
      let afterFunc
      if (Array.isArray(func)) {
        ;[actionFunc, options] = func
      } else if (typeof func === 'function') {
        actionFunc = func
      } else {
        actionFunc = func.action
        afterFunc = func.after
        options = func.options
      }
      return {
        run: this.createRunHandler(actionFunc, afterFunc, key, options),
      }
    }
  }
}

interface Config {
  /**
   * Factory function creating cancel tokens. By default it is.
   * axios.CancelToken.source but you can supply you own.
   */
  createCancelToken: () => CancelTokenSource
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
    options: object | undefined | null,
    action: RunHandler,
  ) => void
}

withActions.config = {
  createCancelToken: axios.CancelToken.source,
  isCancel: axios.isCancel,
} as Config
