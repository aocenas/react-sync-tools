import { mount } from 'enzyme'
import * as React from 'react'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'

import { model, reducer } from './model'

const createSimpleApp = () => {
  const store = createStore(combineReducers({ reagent: reducer }))

  class TestComponent extends React.PureComponent {
    componentDidMount() {
      this.props.user.setState({ name: 'test user', authenticated: false })
    }
    render() {
      const user = this.props.user.getValue()
      return (
        <div>
          <span id={'user-name'}>{user.name}</span>
          <span id={'user-auth'}>{user.authenticated ? 'true' : 'false'}</span>
          <TestSubComponentWithModel />
        </div>
      )
    }
  }

  class TestSubComponent extends React.PureComponent {
    render() {
      return (
        <div>
          <span id={'user-name-2'}>{this.props.user.getValue().name}</span>
          <button id={'auth'} onClick={() => this.props.user.authenticate()}>
            Auth
          </button>
          <button
            id={'name'}
            onClick={() =>
              this.props.user.setState((state) => ({
                ...state,
                name: 'Changed',
              }))
            }
          >
            Rename
          </button>
        </div>
      )
    }
  }

  const userModel = model(
    'user',
    {
      authenticate: (state) => ({ ...state, authenticated: true }),
    },
    {},
  )

  const TestComponentWithModel = userModel(TestComponent)
  const TestSubComponentWithModel = userModel(TestSubComponent)
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
