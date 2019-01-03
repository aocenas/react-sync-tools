import { shallow } from 'enzyme'
import * as React from 'react'

import { withActions, ActionDef } from './withActions'

const setupComponent = (mockActionImpl?: (token: any, arg: any) => void) => {
  const Component = jest.fn(() => null)
  const mockAction = jest.fn(mockActionImpl)
  const actions = { mock: [mockAction, { someOption: true }] as ActionDef<any> }
  const WrappedComponent = withActions(actions)(Component)

  const wrapper = shallow(<WrappedComponent id={1} />)
  wrapper.render()

  return { wrapper, Component, mockAction, mockProps: Component.mock.calls }
}

const setupWithResolveAndReject = () => {
  let resolveCallback: (arg?: any) => void
  let rejectCallback: (error?: Error) => void
  const promise = new Promise((resolve, reject) => {
    resolveCallback = resolve
    rejectCallback = reject
  })
  return {
    ...setupComponent(() => promise),

    // TS cannot know it is already assigned
    // @ts-ignore
    resolve: resolveCallback,
    // @ts-ignore
    reject: rejectCallback,
  }
}

// As withActions resolve the callbacks as promises it is not immediate
// we can hook into componentDidUpdate of our mock or just wait for next loop.
const wait = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 0)
  })
}

describe('withActions', () => {
  it('Supplies component with correct ActionProp', () => {
    const { mockProps } = setupComponent()
    expect(mockProps[0][0].id).toBe(1)
    expect(Object.keys(mockProps[0][0].mock)).toEqual(['run'])
    expect(typeof mockProps[0][0].mock.run).toBe('function')
  })

  it('It calls supplied action callback after calling run()', async () => {
    const { mockAction, mockProps } = setupComponent()
    mockProps[0][0].mock.run(1)
    // This should be a cancelToken
    // TODO better check
    expect(typeof mockAction.mock.calls[0][0].cancelToken).toBe('object')
    expect(mockAction.mock.calls[0][0].params).toBe(1)
  })

  it('Updates isLoading state after calling run()', async () => {
    expect.assertions(2)
    const { wrapper, mockProps, resolve } = setupWithResolveAndReject()
    mockProps[0][0].mock.run(1)
    wrapper.render()

    // We run the action which is not resolved yet, we expect to have
    // rendered with isLoading == true
    expect(mockProps[1][0].mock.isLoading).toBe(true)

    resolve()
    await wait()
    wrapper.render()

    // After resolving the promise we should no longer be loading
    expect(mockProps[2][0].mock.isLoading).toBe(false)
  })

  it('Updates result of ActionProp after resolving callback ', async () => {
    expect.assertions(1)

    const { wrapper, mockProps, resolve } = setupWithResolveAndReject()
    mockProps[0][0].mock.run(1)
    wrapper.render()

    resolve(2)
    await wait()
    wrapper.render()
    expect(mockProps[2][0].mock.response).toBe(2)
  })

  it('Updates ActionProp with error, when action callback throws, ', async () => {
    expect.assertions(2)

    const { wrapper, mockProps, reject } = setupWithResolveAndReject()
    mockProps[0][0].mock.run(1)
    wrapper.render()

    reject(new Error('reject test'))
    await wait()
    wrapper.render()
    expect(mockProps[2][0].mock.error instanceof Error).toBe(true)
    expect(mockProps[2][0].mock.error.message).toBe('reject test')
  })

  it('Calls custom errorHandler when action callback throws', async () => {
    expect.assertions(4)

    const { wrapper, mockProps, reject } = setupWithResolveAndReject()
    const errorHandler = jest.fn()
    withActions.config.errorHandler = errorHandler

    mockProps[0][0].mock.run(1)
    wrapper.render()

    reject(new Error('reject test'))
    await wait()
    expect(errorHandler.mock.calls[0][0]).toBe('mock')
    expect(errorHandler.mock.calls[0][1].message).toBe('reject test')
    expect(errorHandler.mock.calls[0][2]).toEqual({ someOption: true })
    expect(typeof errorHandler.mock.calls[0][3]).toBe('function')
  })

  it('Cancels token on unmount', async () => {
    expect.assertions(2)
    const errorHandler = jest.fn()
    withActions.config.errorHandler = errorHandler

    const { wrapper, Component } = setupComponent(async ({ cancelToken }) => {
      await wait()
      expect(cancelToken.reason).toBeTruthy()
      cancelToken.throwIfRequested()
    })
    Component.mock.calls[0][0].mock.run(1)
    wrapper.unmount()

    await wait()
    expect(errorHandler.mock.calls.length).toBe(0)
  })
})
