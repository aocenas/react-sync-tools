import { omit } from 'lodash'
import * as React from 'react'

import { keyBy } from 'lodash'
import { withModel, withActions, makeModel } from '../../src'
import * as TodosClient from './todosClient'

export interface Todo {
  id: number
  text: string
  completed: boolean
}

export interface Todos {
  [id: string]: Todo
}

const todosModel = makeModel(
  'todos',
  {
    addTodo: (state, id, text) => {
      return {
        ...state,
        [id]: {
          id,
          text,
          completed: false,
        },
      }
    },

    completeTodo: (state, id) => {
      return {
        ...state,
        [id]: {
          ...state[id],
          completed: true,
        },
      }
    },

    undoTodo: (state, id) => {
      return {
        ...state,
        [id]: {
          ...state[id],
          completed: false,
        },
      }
    },

    updateTodoText: (state, id, text) => {
      return {
        ...state,
        [id]: {
          ...state[id],
          text,
        },
      }
    },

    deleteTodo: (state, id) => omit(state, id),
  },
  {} as Todos,
)

const actions = {
  getTodos: {
    action: () => TodosClient.getTodos(),
    after: (
      response: { data: Todo[] },
      params: any,
      { setTodos }: { setTodos: (state: Todos) => void },
    ) => setTodos(keyBy(response.data, 'id')),
  },

  addTodo: {
    action: ({ params: todoText }: { params: string }) =>
      TodosClient.addTodo(todoText),
    after: (
      response: { data: { id: number; text: string } },
      params: any,
      { addTodo }: { addTodo: (id: number, text: string) => void },
    ) => {
      addTodo(response.data.id, response.data.text)
    },
  },
}

export const withTodos = <P extends {}, Selected extends {}>(
  selector: (state: Todos, actions: any, props: any) => Selected,
) => (component: React.ComponentType<P>) =>
  withModel(todosModel, (state, modelActions, props) =>
    Object.assign(
      {
        // model actions needed by the actions
        addTodo: modelActions.addTodo,
        setTodos: modelActions.setState,
      },
      selector(state, modelActions, props),
    ),
  )(withActions(actions)(component))
