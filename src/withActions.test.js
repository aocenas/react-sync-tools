import { shallow } from 'enzyme'
import * as React from 'react'

import { config, withActions } from './withActions'

const setupComponent = (mockCallbackImpl) => {
  const Component = jest.fn(() => null)
  const mockCallback = jest.fn(mockCallbackImpl)
  const actions = { mock: [mockCallback, { someOption: true }] }
  const WrappedComponent = withActions(actions)(Component)

  const wrapper = shallow(<WrappedComponent id={1} />)
  wrapper.render()

  return { wrapper, Component, mockCallback }
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
    const { Component } = setupComponent()
    expect(Component.mock.calls[0][0].id).toBe(1)
    expect(Object.keys(Component.mock.calls[0][0].mock)).toEqual(['run'])
    expect(typeof Component.mock.calls[0][0].mock.run).toBe('function')
  })

  it('It calls supplied action callback after calling run()', async () => {
    const { Component, mockCallback } = setupComponent()
    Component.mock.calls[0][0].mock.run(1)
    expect(typeof mockCallback.mock.calls[0][0]).toBe('object')
    expect(mockCallback.mock.calls[0][1]).toBe(1)
  })

  it('Updates isLoading state after calling run()', async () => {
    expect.assertions(2)
    let resolveCallback
    const { wrapper, Component } = setupComponent(
      () =>
        new Promise((resolve) => {
          resolveCallback = resolve
        }),
    )
    Component.mock.calls[0][0].mock.run(1)
    wrapper.render()
    expect(Component.mock.calls[1][0].mock.isLoading).toBe(true)

    if (resolveCallback) {
      resolveCallback()
      await wait()
      wrapper.render()
      expect(Component.mock.calls[2][0].mock.isLoading).toBe(false)
    } else {
      throw new Error('resolveCallback should be assigned')
    }
  })

  it('Updates result of ActionProp after resolving callback ', async () => {
    expect.assertions(1)
    let resolveCallback
    const { wrapper, Component } = setupComponent(
      () =>
        new Promise((resolve) => {
          resolveCallback = resolve
        }),
    )
    Component.mock.calls[0][0].mock.run(1)
    wrapper.render()

    if (resolveCallback) {
      resolveCallback(2)
      await wait()
      wrapper.render()
      expect(Component.mock.calls[2][0].mock.response).toBe(2)
    } else {
      throw new Error('resolveCallback should be assigned')
    }
  })

  it('Updates ActionProp with error, when action callback throws, ', async () => {
    expect.assertions(2)
    let rejectCallback
    const { wrapper, Component } = setupComponent(
      () =>
        new Promise((_resolve, reject) => {
          rejectCallback = reject
        }),
    )
    Component.mock.calls[0][0].mock.run(1)
    wrapper.render()

    if (rejectCallback) {
      rejectCallback(new Error('reject test'))
      await wait()
      wrapper.render()
      expect(Component.mock.calls[2][0].mock.error instanceof Error).toBe(true)
      expect(Component.mock.calls[2][0].mock.error.message).toBe('reject test')
    } else {
      throw new Error('rejectCallback should be assigned')
    }
  })

  it('Calls custom errorHandler when action callback throws', async () => {
    expect.assertions(4)
    const errorHandler = jest.fn()
    config.errorHandler = errorHandler

    let rejectCallback
    const { wrapper, Component } = setupComponent(
      () =>
        new Promise((_resolve, reject) => {
          rejectCallback = reject
        }),
    )
    Component.mock.calls[0][0].mock.run(1)
    wrapper.render()

    if (rejectCallback) {
      rejectCallback(new Error('reject test'))
      await wait()
      expect(errorHandler.mock.calls[0][0]).toBe('mock')
      expect(errorHandler.mock.calls[0][1].message).toBe('reject test')
      expect(errorHandler.mock.calls[0][2]).toEqual({ someOption: true })
      expect(typeof errorHandler.mock.calls[0][3]).toBe('function')
    } else {
      throw new Error('rejectCallback should be assigned')
    }
  })

  it('Cancels token on unmount', async () => {
    expect.assertions(2)
    const errorHandler = jest.fn()
    config.errorHandler = errorHandler

    const { wrapper, Component } = setupComponent(async (token) => {
      await wait()
      expect(token.result).toBeTruthy()
      token.throwIfRequested()
    })
    Component.mock.calls[0][0].mock.run(1)
    wrapper.unmount()

    await wait()
    expect(errorHandler.mock.calls.length).toBe(0)
  })
})
