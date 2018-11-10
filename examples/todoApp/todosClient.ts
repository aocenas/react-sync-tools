const delay = 100

export const getTodos = (): Promise<{ data: object[] }> =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          data: [
            { id: 1, text: 'Do the laundry', completed: true },
            { id: 2, text: 'Call mom', completed: false },
          ],
        }),
      delay,
    ),
  )

export const addTodo = (todoText: string): Promise<{ data: object }> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (todoText === 'error') {
        reject(new Error('Error adding the todo'))
      } else {
        resolve({
          data: { text: todoText, id: Math.ceil(Math.random() * 10000) },
        })
      }
    }, delay),
  )
