import React, { useEffect, useRef, useState } from 'react';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { FILTER, Filter } from './types/Filter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';
import { TodoItem } from './components/TodoItem';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>(FILTER.ALL);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [error, setError] = useState('');
  const errorTimerId = useRef(0);

  const field = useRef<HTMLInputElement>(null);

  const showError = (msg: string) => {
    if (errorTimerId.current) {
      window.clearTimeout(errorTimerId.current);
    }

    setError(msg);
    errorTimerId.current = window.setTimeout(() => setError(''), 3000);
  };

  const hideError = () => {
    if (errorTimerId.current) {
      clearTimeout(errorTimerId.current);
      errorTimerId.current = 0;
    }

    setError('');
  };

  const handleFilterChange = (filterParam: Filter) => {
    setFilter(filterParam);
  };

  useEffect(() => {
    setError('');
    const fetchTodos = async () => {
      try {
        const data = await todoService.getTodos();

        setTodos(data);
      } catch {
        showError('Unable to load todos');
      }
    };

    fetchTodos();
  }, []);

  const addTodo = async (title: string) => {
    hideError();

    const fakeTodo: Todo = {
      id: 0,
      userId: todoService.USER_ID,
      title: title.trim(),
      completed: false,
    };

    setTempTodo(fakeTodo);

    try {
      const newTodo = await todoService.addTodo(title);

      setTodos(currentTodos => [...currentTodos, newTodo]);
      field.current?.focus();

      return true;
    } catch {
      showError('Unable to add a todo');

      return false;
    } finally {
      setTempTodo(null);
    }
  };

  const deleteTodo = async (todoId: number) => {
    setDeletingIds(currentIds => new Set(currentIds).add(todoId));
    try {
      await todoService.deleteTodo(todoId);
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== todoId));
      field.current?.focus();
    } catch {
      showError('Unable to delete a todo');
    } finally {
      setDeletingIds(currentIds => {
        const next = new Set(currentIds);

        next.delete(todoId);

        return next;
      });
    }
  };

  const clearCompleted = () => {
    todos.filter(todo => todo.completed).forEach(todo => deleteTodo(todo.id));
  };

  const filteredTodos = todos.filter(todo => {
    return filter === FILTER.ALL
      ? true
      : (filter === FILTER.COMPLETED) === todo.completed;
  });

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          inputRef={field}
          onSubmit={addTodo}
          onError={showError}
        />

        <TodoList
          todos={filteredTodos}
          onDelete={deleteTodo}
          deletingIds={deletingIds}
        />

        {tempTodo && <TodoItem todo={tempTodo} isTempTodo />}

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <Footer
            todos={todos}
            filter={filter}
            onFilterChange={handleFilterChange}
            onClearCompleted={clearCompleted}
          />
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <ErrorNotification errorMsg={error} onClose={hideError} />
    </div>
  );
};
