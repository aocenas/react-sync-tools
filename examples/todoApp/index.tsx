import * as React from 'react'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import { reducer } from '../../src'
import { TodoApp } from './TodoApp'

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(
  combineReducers({ reagent: reducer }),
  composeEnhancers(applyMiddleware(thunk))
)

render(
  <Provider store={store}>
    <TodoApp />
  </Provider>,
  document.querySelector('#app'),
)
