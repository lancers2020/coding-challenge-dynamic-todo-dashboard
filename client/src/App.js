import React, { useEffect, useState, useRef } from 'react';
import getTodos from './api/getTodo';
import postTodo from './api/postTodo';
import deleteTodo from './api/deleteTodo';
import updateTodo from './api/updateTodo';
import './App.css';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All'); // All | Active | Completed
  const titleRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const data = await getTodos({ signal: controller.signal });
        // normalize items so each has an `id` (use server `key` when available)
        const normalized = Array.isArray(data)
          ? data.map((t, i) => ({
              id: t.key || t.id || `${Date.now()}-${i}`,
              key: t.key || t.id,
              title: t.title || '',
              description: t.description || '',
              completed: !!t.completed,
            }))
          : [];
        setTodos(normalized);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      titleRef.current?.focus();
      return;
    }
    const newTodo = { title: title.trim(), description: description.trim(), completed: false };
    setSubmitting(true);
    try {
      const created = await postTodo({ todo: newTodo });
      // server returns the stored todo and the generated `key`
      const toAppend = created
        ? {
            id: created.key || created.id || `${Date.now()}`,
            key: created.key || created.id,
            title: created.title || newTodo.title,
            description: created.description || newTodo.description,
            completed: !!created.completed,
          }
        : { ...newTodo, id: Date.now() };
      setTodos((prev) => [toAppend, ...prev]);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleComplete(id) {
    setError(null);
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.completed;

    // Optimistic UI update
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));

    if (todo.key) {
      try {
        await updateTodo({ key: todo.key, updates: { completed: newCompleted } });
      } catch (err) {
        // rollback on error
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: todo.completed } : t)));
        setError(err.message || String(err));
      }
    }
  }

  async function handleDelete(id) {
    const todo = todos.find((t) => t.id === id);
    console.log(':::handleDelete todo', todo);
    if (!todo) return;
    setError(null);
    try {
      // If todo has a server key, call backend to delete; otherwise just remove locally
      if (todo.key) {
        await deleteTodo({ key: todo.key });
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  // filtering
  const filteredTodos = todos.filter((t) => {
    if (filter === 'Active') return !t.completed;
    if (filter === 'Completed') return !!t.completed;
    return true;
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Todo Dashboard</h1>
        <p className="subtitle">Track. Focus. Achieve.</p>
      </header>

      <section className="form-section">
        <form onSubmit={handleAdd} className="todo-form">
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="input title-input"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add description (optional)"
            className="input desc-input"
            rows={2}
          />
          <button type="submit" disabled={submitting} className="btn primary">
            {submitting ? 'Adding...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
            }}
            className="btn ghost"
          >
            Clear
          </button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </section>

      <main className="todo-list-section">
        <div className="list-header">
          <h2>My Todos</h2>
          <div className="list-controls pos-rel">
            <div className="filters">
              {['All', 'Active', 'Completed'].map((f) => (
                <button
                  key={f}
                  className={`btn filter ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="count">{loading ? 'Loading…' : `${todos.length} total`}</span>
          </div>
        </div>

        {todos.length === 0 && !loading && (
          <div className="empty-state">
            <p>No tasks yet.</p>
            <small>Start by adding one above ✨</small>
          </div>
        )}

        <ul className="todo-list">
          {filteredTodos.map(todo => (
            <li key={todo.id} className={`todo-card pos-rel ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo.id)}
                className="checkbox"
              />
              <div className="todo-content">
                <h3>{todo.title}</h3>
                {todo.description && <p>{todo.description}</p>}
              </div>
              
              <div className="archive">
                delete
                <button onClick={() => handleDelete(todo.id)} className="btn delete">
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
