import * as React from 'react'

import { ActionProp } from '../../src'
import { Todos, withTodos } from './todosModel'
import { TodoItem } from './TodoItem'
import { buttonStyle } from './style'

interface Props {
  todos: Todos
  getTodos: ActionProp
  addTodo: ActionProp
}

// tslint:disable-next-line:class-name
class _TodoApp extends React.PureComponent<Props> {
  public state = {
    text: '',
  }

  public componentDidMount() {
    this.props.getTodos.run()
  }

  public componentDidUpdate(prevProps: Props) {
    if (!prevProps.addTodo.response && this.props.addTodo.response) {
      // Clear text only on success response
      this.setState({ text: '' })
    }
  }

  public render() {
    const { todos, addTodo } = this.props
    return (
      <div style={{ fontFamily: 'sans-serif'}}>
        <div>
          <input
            style={{
              marginRight: 10,
              padding: 10,
              borderRadius: 4,
              borderStyle: 'solid',
              borderWidth: 1,
              borderColor: 'lightgray',
            }}
            type={'text'}
            placeholder={'What do you need to do'}
            value={this.state.text}
            onChange={(e) => this.setState({ text: e.currentTarget.value })}
            disabled={addTodo.isLoading}
          />
          <button
            disabled={!this.state.text || addTodo.isLoading}
            style={buttonStyle}
            onClick={() => {
              addTodo.run(this.state.text, { clear: true })
            }}
          >
            {addTodo.isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
        {addTodo.error && (
          <div
            style={{
              backgroundColor: 'orangered',
              color: 'white',
              padding: 5,
              margin: '10px 0',
            }}
          >
            {addTodo.error.message}
          </div>
        )}
        <div
          style={{
            color: 'gray',
            fontSize: 12,
            textTransform: 'uppercase',
            margin: '10px 0'
          }}
        >
          {Object.keys(todos).length} todos
        </div>
        {Object.keys(todos).map((key: string) => (
          <TodoItem todoId={key} />
        ))}
      </div>
    )
  }
}

export const TodoApp = withTodos((state, actions) => ({
  todos: state,
  addTodo: actions.addTodo,
}))(_TodoApp)
