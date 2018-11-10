import * as React from 'react'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import { reducer } from '../../src'
import { TodoApp } from './TodoApp'

const store = createStore(
  combineReducers({ reagent: reducer }),
  applyMiddleware(thunk),
)

render(
  <Provider store={store}>
    <TodoApp />
  </Provider>,
  document.querySelector('#app'),
)
