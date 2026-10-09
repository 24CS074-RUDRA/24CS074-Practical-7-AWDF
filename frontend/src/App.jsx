import { useCallback, useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'practical7_token'

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || 'Request failed.')
    error.status = response.status
    throw error
  }
  return data
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const clearSession = useCallback((message = '') => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setTasks([])
    setError(message)
  }, [])

  const handleError = useCallback((reason) => {
    if (reason.status === 401) {
      clearSession('Your session expired or is invalid. Please log in again.')
      return
    }
    setError(reason.message || 'Something went wrong.')
  }, [clearSession])

  const loadTasks = useCallback(async (activeToken) => {
    const result = await request('/tasks', { token: activeToken })
    setTasks(result.tasks)
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function loadSession() {
      try {
        const result = await request('/auth/me', { token })
        if (cancelled) return
        setUser(result.user)
        await loadTasks(token)
      } catch (reason) {
        if (!cancelled) handleError(reason)
      }
    }

    loadSession()
    return () => { cancelled = true }
  }, [token, loadTasks, handleError])

  async function submitAuth(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData(event.currentTarget)
    const payload = {
      email: form.get('email'),
      password: form.get('password'),
    }
    if (isRegistering) payload.name = form.get('name')

    try {
      if (isRegistering) {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setNotice('Account created. You can now log in.')
        setIsRegistering(false)
      } else {
        const result = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        localStorage.setItem(TOKEN_KEY, result.token)
        setToken(result.token)
        setUser(result.user)
      }
    } catch (reason) {
      handleError(reason)
    } finally {
      setBusy(false)
    }
  }

  async function addTask(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError('')
    setNotice('')
    const form = new FormData(formElement)

    try {
      const result = await request('/tasks', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description'),
        }),
      })
      setTasks((current) => [result.task, ...current])
      formElement.reset()
      setNotice('Task created.')
    } catch (reason) {
      handleError(reason)
    } finally {
      setBusy(false)
    }
  }

  async function toggleTask(task) {
    setError('')
    try {
      const result = await request(`/tasks/${task._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ completed: !task.completed }),
      })
      setTasks((current) => current.map((item) => item._id === task._id ? result.task : item))
    } catch (reason) {
      handleError(reason)
    }
  }

  async function deleteTask(id) {
    setError('')
    try {
      await request(`/tasks/${id}`, { method: 'DELETE', token })
      setTasks((current) => current.filter((task) => task._id !== id))
      setNotice('Task deleted.')
    } catch (reason) {
      handleError(reason)
    }
  }

  function logout() {
    clearSession('')
    setNotice('You are logged out.')
  }

  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="eyebrow">PRACTICAL 7 · JWT AUTHENTICATION</p>
          <h1>{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted">
            {isRegistering ? 'Register to start managing your tasks.' : 'Log in to view your protected tasks.'}
          </p>
          {error && <p className="alert error" role="alert">{error}</p>}
          {notice && <p className="alert success" role="status">{notice}</p>}

          <form className="auth-form" onSubmit={submitAuth}>
            {isRegistering && (
              <label>
                Name
                <input name="name" type="text" minLength="2" maxLength="50" autoComplete="name" required />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" minLength="8" maxLength="72" autoComplete={isRegistering ? 'new-password' : 'current-password'} required />
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="switch-auth">
            {isRegistering ? 'Already have an account?' : 'New here?'}{' '}
            <button className="text-button" onClick={() => { setError(''); setNotice(''); setIsRegistering(!isRegistering) }}>
              {isRegistering ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="/">Task<span>flow</span></a>
        <div className="account">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="account-copy"><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="secondary-button" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="content">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Tasks, made manageable.</h1>
        <p className="muted">Your tasks are private to your account and protected by JWT authentication.</p>
        {error && <p className="alert error" role="alert">{error}</p>}
        {notice && <p className="alert success" role="status">{notice}</p>}

        <form className="task-form" onSubmit={addTask}>
          <input name="title" placeholder="What needs to get done?" maxLength="120" required />
          <input name="description" placeholder="Add a short description (optional)" maxLength="1000" />
          <button className="primary-button" disabled={busy}>Add task</button>
        </form>

        <div className="list-heading">
          <h2>Your tasks</h2>
          <span className="count">{tasks.length}</span>
        </div>
        {tasks.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">✓</span><h3>Nothing on your list yet</h3><p>Add a task above to get started.</p></div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li className={`task-item ${task.completed ? 'is-complete' : ''}`} key={task._id}>
                <button className="check-button" aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'} onClick={() => toggleTask(task)}>
                  {task.completed ? '✓' : ''}
                </button>
                <div className="task-copy">
                  <strong>{task.title}</strong>
                  {task.description && <p>{task.description}</p>}
                </div>
                <span className={`priority ${task.priority}`}>{task.priority}</span>
                <button className="delete-button" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task._id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
