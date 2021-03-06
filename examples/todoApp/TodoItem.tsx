import * as React from 'react'
import { Todo } from './todosModel'
import { buttonStyle } from './style'
import { withTodos } from './todosModel'

interface InjectedProps {
  todo: Todo
  deleteTodo: (id: number) => void
  completeTodo: (id: number) => void
  undoTodo: (id: number) => void
  updateTodoText: (id: number, text: string) => void
}
interface OwnProps {
  todoId: number | string
}

// tslint:disable-next-line:variable-name
const _TodoItem = ({
  todo,
  deleteTodo,
  completeTodo,
  undoTodo,
  updateTodoText,
}: InjectedProps & OwnProps) => {
  return (
    <div
      style={{
        border: 'solid 1px lightgray',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        marginBottom: 5,
      }}
    >
      <div
        contentEditable={true}
        suppressContentEditableWarning={true}
        style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
        onBlur={(e) => updateTodoText(todo.id, e.currentTarget.innerHTML)}
      >
        {todo.text}
      </div>
      <div>
        {todo.completed ? (
          <button style={buttonStyle} onClick={() => undoTodo(todo.id)}>
            undo
          </button>
        ) : (
          <button style={buttonStyle} onClick={() => completeTodo(todo.id)}>
            done
          </button>
        )}
        <button
          style={{ ...buttonStyle, background: 'transparent', color: 'gray' }}
          onClick={() => deleteTodo(todo.id)}
        >
          delete
        </button>
      </div>
    </div>
  )
}

export const TodoItem = withTodos((state, actions, props) => {
  return {
    todo: state[props.todoId],
    deleteTodo: actions.deleteTodo,
    completeTodo: actions.completeTodo,
    updateTodoText: actions.updateTodoText,
    undoTodo: actions.undoTodo,
  }
})(_TodoItem) as React.ComponentType<OwnProps>
