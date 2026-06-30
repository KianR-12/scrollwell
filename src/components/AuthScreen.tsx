import { useState } from 'react'
import { supabase, createProfile } from '../supabase'

type Mode = 'signin' | 'signup'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setAwaitingConfirm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setError(error.message)
        } else if (data.user && !data.session) {
          // Email confirmation required
          setAwaitingConfirm(true)
        } else if (data.user && data.session) {
          // Auto-confirmed — create profile immediately
          await createProfile(data.user.id, email, name)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      overflow: 'hidden',
    }}>
      {/* Masthead */}
      <div style={{
        padding: '64px 28px 0',
        flexShrink: 0,
      }}>
        {/* Rules + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1.5, background: '#111' }} />
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#111',
            letterSpacing: '-0.5px',
            whiteSpace: 'nowrap',
          }}>
            scrollwell
          </div>
          <div style={{ flex: 1, height: 1.5, background: '#111' }} />
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 13,
          fontStyle: 'italic',
          color: '#888',
          textAlign: 'center',
          marginBottom: 28,
          lineHeight: 1.5,
        }}>
          The shortcut to knowing more than you read.
        </div>

        {/* Full-width rule */}
        <div style={{ height: 2, background: '#111', marginBottom: 28 }} />

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '9px 0',
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                border: 'none',
                borderBottom: `2px solid ${mode === m ? '#111' : '#E0DCD4'}`,
                background: 'none',
                color: mode === m ? '#111' : '#bbb',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 40px' }}>
        {awaitingConfirm ? (
          <ConfirmPrompt email={email} onBack={() => setAwaitingConfirm(false)} />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {mode === 'signup' && (
              <Field
                label="Name"
                type="text"
                value={name}
                placeholder="Your name"
                onChange={setName}
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
              onChange={setPassword}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />

            {error && (
              <div style={{
                fontSize: 11,
                color: '#c0392b',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.5,
                padding: '8px 12px',
                background: '#fdf2f0',
                border: '1px solid #f5c6c1',
                borderRadius: 2,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              style={{
                marginTop: 4,
                padding: '14px 0',
                background: submitting || !email || !password ? '#D0CCC4' : '#111',
                color: '#fff',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                cursor: submitting || !email || !password ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting
                ? '…'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Field ──────────────────────────────────────────────────────────────────────

function Field({
  label, type, value, placeholder, onChange, autoComplete,
}: {
  label: string
  type: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  return (
    <div>
      <div style={{
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#bbb',
        fontFamily: 'Inter, sans-serif',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          border: 'none',
          borderBottom: '1.5px solid #111',
          padding: '8px 0',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          color: '#111',
          background: 'none',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ── Confirm prompt ─────────────────────────────────────────────────────────────

function ConfirmPrompt({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: 17,
        fontWeight: 700,
        color: '#111',
        marginBottom: 12,
        lineHeight: 1.3,
      }}>
        Check your inbox.
      </div>
      <div style={{
        fontSize: 13,
        color: '#666',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.65,
        marginBottom: 28,
      }}>
        We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to sign in.
      </div>
      <button
        onClick={onBack}
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif',
          color: '#111',
          background: 'none',
          border: '1px solid #111',
          padding: '10px 18px',
          cursor: 'pointer',
        }}
      >
        Back to Sign In
      </button>
    </div>
  )
}
