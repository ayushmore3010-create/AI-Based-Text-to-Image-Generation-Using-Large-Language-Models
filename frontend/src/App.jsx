import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const emptyForm = { name: '', email: '', password: '' }

function App() {
  const [token, setToken] = useState(localStorage.getItem('ai_token') || '')
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyForm)
  const [prompt, setPrompt] = useState('A futuristic city skyline at dusk with neon reflections, cinematic lighting, ultra-detailed architecture')
  const [enhanced, setEnhanced] = useState('')
  const [image, setImage] = useState('')
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [stats, setStats] = useState({ users: 0, generations: 0, favorites: 0 })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const apiHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...apiHeaders, ...(options.headers || {}) },
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(payload.detail || 'Request failed')
    }
    return res.json()
  }

  const loadProfile = async () => {
    if (!token) return
    try {
      const me = await fetchJson('/api/auth/me')
      setUser(me)
      const generations = await fetchJson('/api/generations')
      setHistory(generations)
      setFavorites(generations.filter((item) => item.is_favorite))
      if (me.is_admin) {
        const adminStats = await fetchJson('/api/admin/stats')
        setStats(adminStats)
      }
    } catch (error) {
      setMessage(error.message)
      setToken('')
      localStorage.removeItem('ai_token')
      setUser(null)
    }
  }

  useEffect(() => {
    if (token) {
      loadProfile()
    }
  }, [token])

  const handleAuth = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const payload = await fetchJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(authMode === 'login' ? { email: authForm.email, password: authForm.password } : { ...authForm }),
      })
      setToken(payload.access_token)
      localStorage.setItem('ai_token', payload.access_token)
      setUser(payload.user)
      setMessage(authMode === 'login' ? 'Welcome back!' : 'Account created successfully.')
      setAuthForm(emptyForm)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePromptEnhance = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const data = await fetchJson('/api/ai/enhance', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      })
      setEnhanced(data.enhanced_prompt)
      setMessage('Prompt enhanced successfully.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const data = await fetchJson('/api/generations', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      })
      setImage(data.image_url)
      setEnhanced(data.enhanced_prompt)
      setHistory((prev) => [data, ...prev])
      setFavorites((prev) => data.is_favorite ? [data, ...prev] : prev)
      setMessage('Image generated successfully.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (id) => {
    try {
      const updated = await fetchJson(`/api/generations/${id}/favorite`, { method: 'PATCH' })
      setHistory((prev) => prev.map((item) => item.id === id ? updated : item))
      setFavorites((prev) => prev.some((item) => item.id === id) ? prev.filter((item) => item.id !== id) : [updated, ...prev])
    } catch (error) {
      setMessage(error.message)
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    setHistory([])
    setFavorites([])
    localStorage.removeItem('ai_token')
    setMessage('Logged out successfully.')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">AI Canvas</div>
        <div className="nav-actions">
          {user ? (
            <>
              <span>{user.name}</span>
              {user.is_admin && <button className="ghost-btn" type="button">Admin</button>}
              <button className="secondary-btn" type="button" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="primary-btn" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'Create account' : 'Login'}
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="panel">
          <h1 className="title">AI-Based Text-to-Image Generation</h1>
          <p className="subtitle">
            Transform rough ideas into cinematic visuals with AI-driven prompt optimization and one-click image generation.
          </p>

          <textarea
            className="prompt-box"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the visual you want to generate..."
          />

          <div className="controls">
            <button className="primary-btn" type="button" disabled={loading || !token} onClick={handlePromptEnhance}>
              {loading ? 'Working...' : 'Enhance Prompt'}
            </button>
            <button className="secondary-btn" type="button" disabled={loading || !token} onClick={handleGenerate}>
              Generate Image
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-card"><strong>{stats.users}</strong> users</div>
            <div className="stat-card"><strong>{stats.generations}</strong> generations</div>
            <div className="stat-card"><strong>{stats.favorites}</strong> favorites</div>
          </div>

          {message && <div className="toast">{message}</div>}
        </div>

        <div className="panel output-card">
          <img
            className="preview"
            src={image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAiIHgyPSIxIiB5MT0iMCIgeTI9IjEiPjxzdG9wIHN0b3AtY29sb3I9IiMxM1F0ZmEiIHN0b3Atb2Zmc2V0PSIwIi8+PHN0b3Agc3RvcC1jb2xvci0iIzE1OTJjYSIgc3RvcC1vZmZzZXQ9IjAuNTUiLz48c3RvcCBzdG9wLWNvbG9yPSIjMzA1YjlkIiBzdG9wLW9mZnNldD0iMSIvPjwvZ3JhZGllbnQ+PC9kZWZzPjx0ZXh0IHg9IjYwIiB5PSI0ODIiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIHRyYW5zZm9ybT0icm90YXRlKDEwKSI+QmF0Y2ggU2V0dGluZzwvdGV4dD48L3N2Zz4='}
            alt="Generated preview"
          />
          <div className="meta">
            <strong>Enhanced prompt:</strong>
            <div>{enhanced || 'Your optimized prompt will appear here.'}</div>
          </div>
        </div>
      </section>

      <section className="card-grid">
        {!user ? (
          <div className="panel">
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <form onSubmit={handleAuth}>
              <div className="form-grid">
                {authMode === 'signup' && (
                  <div className="field">
                    <label>Name</label>
                    <input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />
                  </div>
                )}
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
                </div>
              </div>
              <div className="controls" style={{ marginTop: 20 }}>
                <button className="primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Sign up'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="panel">
            <h2>Profile</h2>
            <div className="field">
              <label>Name</label>
              <input value={user.name} readOnly />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Email</label>
              <input value={user.email} readOnly />
            </div>
            {user.is_admin && (
              <div className="meta" style={{ marginTop: 16 }}>
                Admin dashboard active — {stats.users} users, {stats.generations} generations
              </div>
            )}
          </div>
        )}

        <div className="panel">
          <h2>Generation history</h2>
          <div className="history-list">
            {history.length ? history.map((item) => (
              <div key={item.id} className="history-item">
                <img src={item.image_url} alt={item.prompt} />
                <div>
                  <div>{item.prompt}</div>
                  <div className="meta">{item.enhanced_prompt}</div>
                </div>
                <div className="inline-actions">
                  <button className="ghost-btn" type="button" onClick={() => window.open(item.image_url, '_blank')}>Open</button>
                  <button className="ghost-btn" type="button" onClick={() => toggleFavorite(item.id)}>{item.is_favorite ? '★' : '☆'}</button>
                </div>
              </div>
            )) : <div className="meta">No history yet.</div>}
          </div>
        </div>

        <div className="panel">
          <h2>Favorites</h2>
          <div className="favorites-list">
            {favorites.length ? favorites.map((item) => (
              <div key={`fav-${item.id}`} className="favorite-item">
                <img src={item.image_url} alt={item.prompt} />
                <div>
                  <div>{item.prompt}</div>
                  <div className="meta">{item.enhanced_prompt}</div>
                </div>
                <button className="ghost-btn" type="button" onClick={() => window.open(item.image_url, '_blank')}>Download</button>
              </div>
            )) : <div className="meta">No favorites yet.</div>}
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
