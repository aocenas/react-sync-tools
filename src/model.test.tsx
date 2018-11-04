import { mount } from 'enzyme'
import * as React from 'react'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'

import { makeModel, withModel } from './model'
import { reducer } from './model-redux'

type UserModel = {
  name: string
  authenticated: boolean
} | null

const createSimpleApp = () => {
  const store = createStore(combineReducers({ reagent: reducer }), applyMiddleware(thunk))

  class TestComponent extends React.PureComponent<{
    user: UserModel
    setUser: (user: UserModel) => void
  }> {
    public componentDidMount() {
      this.props.setUser({ name: 'test user', authenticated: false })
    }
    public render() {
      const { user } = this.props
      return (
        <>
          {user ? (
            <>
              <span id={'user-name'}>{user.name}</span>
              <span id={'user-auth'}>
                {user.authenticated ? 'true' : 'false'}
              </span>
            </>
          ) : (
            <span>No user</span>
          )}
          <TestSubComponentWithModel />
        </>
      )
    }
  }

  class TestSubComponent extends React.PureComponent<{
    user: UserModel
    authenticate: () => void
    setUser: (fn: (state: UserModel) => UserModel) => void
  }> {
    public render() {
      return (
        <>
          <span id={'user-name-2'}>
            {this.props.user ? this.props.user.name : null}
          </span>
          <button id={'auth'} onClick={() => this.props.authenticate()}>
            Auth
          </button>
          <button
            id={'name'}
            onClick={() =>
              this.props.setUser((state: UserModel) => {
                if (!state) {
                  throw new Error('Not loaded yet')
                }
                return {
                  ...state,
                  name: 'Changed',
                }
              })
            }
          >
            Rename
          </button>
        </>
      )
    }
  }

  const userModel = makeModel(
    'user',
    {
      authenticate: (state) => {
        if (state) {
          return { ...state, authenticated: true }
        } else {
          throw new Error('No user loaded yet')
        }
      },
    },
    null as UserModel,
  )

  const TestComponentWithModel = withModel(userModel, (state, actions) => ({
    setUser: actions.setState,
    user: state,
  }))(TestComponent)
  const TestSubComponentWithModel = withModel(userModel, (state, actions) => ({
    setUser: actions.setState,
    authenticate: actions.authenticate,
    user: state,
  }))(TestSubComponent)

  const App = () => (
    <Provider store={store}>
      <TestComponentWithModel />
    </Provider>
  )
  return App
}

describe('model', () => {
  it('can set model state directly', async () => {
    const App = createSimpleApp()
    const wrapper = mount(<App />)
    // wrapper.render()
    expect(wrapper.find('#user-name').text()).toBe('test user')
  })

  it('sideways load the data for subcomponent', async () => {
    const App = createSimpleApp()
    const wrapper = mount(<App />)
    // wrapper.render()
    expect(wrapper.find('#user-name-2').text()).toBe('test user')
  })

  it('updates model from subcomponent', async () => {
    const App = createSimpleApp()
    const wrapper = mount(<App />)
    expect(wrapper.find('#user-auth').text()).toBe('false')
    expect(wrapper.find('#user-name').text()).toBe('test user')

    wrapper.find('button#auth').simulate('click')

    wrapper.update()
    expect(wrapper.find('#user-auth').text()).toBe('true')

    wrapper.find('button#name').simulate('click')
    wrapper.update()

    expect(wrapper.find('#user-name').text()).toBe('Changed')
    expect(wrapper.find('#user-name-2').text()).toBe('Changed')
  })
})
