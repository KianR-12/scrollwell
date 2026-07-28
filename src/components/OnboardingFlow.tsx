import { useState } from 'react'
import { supabase, createProfile } from '../supabase'

const N = 6

const ALL_INTERESTS = [
  'Philosophy', 'Psychology', 'Business', 'History',
  'Science', 'Technology', 'Economics', 'Leadership',
  'Creativity', 'Health', 'Society', 'Culture',
]

const FORMATS = [
  { id: 'books',    label: 'Books',    desc: 'Key ideas from nonfiction' },
  { id: 'talks',    label: 'Talks',    desc: 'TED talks & keynotes' },
  { id: 'podcasts', label: 'Podcasts', desc: 'Long-form conversations' },
  { id: 'articles', label: 'Articles', desc: 'Essays & deep reads' },
]

interface Props {
  onGuest: () => void
  onGoToAuth: () => void
}

const BTN_PRIMARY: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '14px 0',
  background: '#111',
  color: '#fff',
  border: 'none',
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

const BTN_DIM: React.CSSProperties = {
  ...BTN_PRIMARY,
  background: '#D0CCC4',
  cursor: 'default',
}

const HEADLINE: React.CSSProperties = {
  fontFamily: '"Playfair Display", serif',
  fontSize: 26,
  fontWeight: 700,
  color: '#111',
  lineHeight: 1.2,
  letterSpacing: '-0.3px',
  marginTop: 0,
  marginBottom: 0,
}

const BODY: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 13.5,
  color: '#555',
  lineHeight: 1.65,
  margin: 0,
}

export function OnboardingFlow({ onGuest, onGoToAuth }: Props) {
  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [formats, setFormats] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)

  const prev = () => setStep(s => Math.max(0, s - 1))
  const next = () => setStep(s => s + 1)

  function toggleInterest(t: string) {
    setInterests(prev => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
  }

  function toggleFormat(id: string) {
    setFormats(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function savePrefs() {
    localStorage.setItem('sw_interests', JSON.stringify([...interests]))
    localStorage.setItem('sw_formats', JSON.stringify([...formats]))
    localStorage.setItem('sw_onboarded', 'true')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setAuthError(null)
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setAuthError(error.message)
      } else {
        savePrefs()
        if (data.user && data.session) {
          await createProfile(data.user.id, email, name)
          // useAuth fires → AuthGate re-renders with user automatically
        } else {
          setAwaitingConfirm(true)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleGuest() {
    savePrefs()
    onGuest()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#fff' }}>
      <div style={{
        display: 'flex',
        width: `${N * 100}%`,
        height: '100%',
        transform: `translateX(-${(step / N) * 100}%)`,
        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}>

        {/* ── Screen 0 — Welcome ─────────────────────────────────────────── */}
        <Scr>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}>
            <div style={{ paddingTop: 80, marginBottom: 44 }}>
              <Wordmark size={26} />
            </div>

            <h1 style={{ ...HEADLINE, fontSize: 34, lineHeight: 1.1 }}>
              Ideas worth dropping in conversation.
            </h1>

            <div style={{
              margin: '28px -28px',
              padding: '15px 28px',
              background: '#F7F4EE',
              borderTop: '1px solid #E8E3D8',
              borderBottom: '1px solid #E8E3D8',
            }}>
              <p style={{
                ...BODY,
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic',
                color: '#888',
                margin: 0,
              }}>
                The only reading app built around forgetting less.
              </p>
            </div>
          </div>

          <div style={{
            padding: '0 28px',
            paddingBottom: 'calc(44px + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <button onClick={next} style={BTN_PRIMARY}>
              Get Started
            </button>
            <button onClick={onGoToAuth} style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              color: '#888',
              cursor: 'pointer',
              padding: '6px 0',
              textAlign: 'center',
            }}>
              I already have an account →
            </button>
          </div>
        </Scr>

        {/* ── Screen 1 — What is scrollwell ──────────────────────────────── */}
        <Scr>
          <Hdr step={1} onBack={prev} />
          <div style={{ flex: 1, padding: '24px 28px 0', overflowY: 'auto' }}>
            <h1 style={HEADLINE}>Not just another reading app.</h1>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 28px' }}>
              <BookIllust />
            </div>

            <p style={BODY}>
              Most apps want you to read more. scrollwell wants you to retain more.
            </p>
            <p style={{ ...BODY, marginTop: 16 }}>
              Every card distills one insight from a book, talk, podcast, or article — delivered in 60 seconds and designed to stick.
            </p>
          </div>
          <Ftr>
            <button onClick={next} style={BTN_PRIMARY}>Continue →</button>
          </Ftr>
        </Scr>

        {/* ── Screen 2 — How it works ────────────────────────────────────── */}
        <Scr>
          <Hdr step={2} onBack={prev} />
          <div style={{ flex: 1, padding: '24px 28px 0', overflowY: 'auto' }}>
            <h1 style={HEADLINE}>Made for the moment.</h1>
            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 30 }}>
              <FeatRow
                num="①"
                title="One insight, one card"
                body="Designed to be consumed in 60 seconds."
              />
              <FeatRow
                num="②"
                title="Picked for your interests"
                body="The feed adapts to the topics you care about."
              />
              <FeatRow
                num="③"
                title="Built to be remembered"
                body="Quotes, stats, and frameworks — the kind of thing you actually tell someone later."
              />
            </div>
          </div>
          <Ftr>
            <button onClick={next} style={BTN_PRIMARY}>Got it →</button>
          </Ftr>
        </Scr>

        {/* ── Screen 3 — Pick interests ──────────────────────────────────── */}
        <Scr>
          <Hdr step={3} onBack={prev} />
          <div style={{ flex: 1, padding: '24px 28px 0', overflowY: 'auto' }}>
            <h1 style={HEADLINE}>What are you into?</h1>
            <p style={{ ...BODY, marginTop: 10, marginBottom: 24, color: '#888' }}>
              Pick at least 3 to shape your feed.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}>
              {ALL_INTERESTS.map(t => {
                const on = interests.has(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleInterest(t)}
                    style={{
                      padding: '11px 6px',
                      background: on ? '#111' : '#fff',
                      color: on ? '#fff' : '#111',
                      border: `1.5px solid ${on ? '#111' : '#D0CCC4'}`,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
          <Ftr>
            <button
              onClick={() => { if (interests.size >= 3) next() }}
              style={interests.size >= 3 ? BTN_PRIMARY : BTN_DIM}
            >
              {interests.size > 0 && interests.size < 3
                ? `Pick ${3 - interests.size} more`
                : 'Continue →'}
            </button>
          </Ftr>
        </Scr>

        {/* ── Screen 4 — Pick formats ────────────────────────────────────── */}
        <Scr>
          <Hdr step={4} onBack={prev} />
          <div style={{ flex: 1, padding: '24px 28px 0', overflowY: 'auto' }}>
            <h1 style={HEADLINE}>How do you like to consume?</h1>
            <div style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              {FORMATS.map(fmt => {
                const on = formats.has(fmt.id)
                return (
                  <button
                    key={fmt.id}
                    onClick={() => toggleFormat(fmt.id)}
                    style={{
                      padding: '18px 16px',
                      background: on ? '#111' : '#fff',
                      color: on ? '#fff' : '#111',
                      border: `1.5px solid ${on ? '#111' : '#D0CCC4'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 12,
                      textAlign: 'left',
                    }}
                  >
                    <FmtIcon id={fmt.id} sel={on} />
                    <div>
                      <div style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: 15,
                        fontWeight: 700,
                        marginBottom: 4,
                        color: 'inherit',
                      }}>
                        {fmt.label}
                      </div>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 10.5,
                        color: on ? '#bbb' : '#888',
                        lineHeight: 1.4,
                      }}>
                        {fmt.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          <Ftr>
            <button
              onClick={() => { if (formats.size >= 1) next() }}
              style={formats.size >= 1 ? BTN_PRIMARY : BTN_DIM}
            >
              Continue →
            </button>
          </Ftr>
        </Scr>

        {/* ── Screen 5 — Sign up ─────────────────────────────────────────── */}
        <Scr>
          {awaitingConfirm ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '64px 28px 0' }}>
              <Wordmark size={20} />
              <h1 style={{ ...HEADLINE, marginTop: 32 }}>Check your inbox.</h1>
              <p style={{ ...BODY, marginTop: 16, color: '#666' }}>
                We sent a link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in.
              </p>
              <button
                onClick={() => setAwaitingConfirm(false)}
                style={{
                  marginTop: 28,
                  background: 'none',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  color: '#111',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                ← Back
              </button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, padding: '48px 28px 0', overflowY: 'auto' }}>
                <Wordmark size={20} />
                <h1 style={{ ...HEADLINE, marginTop: 24 }}>Save your ideas.</h1>
                <p style={{ ...BODY, marginTop: 10, marginBottom: 28, color: '#777' }}>
                  Create an account to keep your library, picks, and history across devices.
                </p>

                {/* Social — placeholder, coming soon */}
                <button style={{
                  display: 'block', width: '100%', padding: '13px 0',
                  background: '#111', color: '#fff', border: 'none',
                  fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: 'not-allowed', opacity: 0.4,
                  pointerEvents: 'none',
                }}>
                  Continue with Apple
                </button>
                <button style={{
                  display: 'block', width: '100%', padding: '13px 0', marginTop: 10,
                  background: '#fff', color: '#111', border: '1.5px solid #D0CCC4',
                  fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: 'not-allowed', opacity: 0.4,
                  pointerEvents: 'none',
                }}>
                  Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#E0DCD4' }} />
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 9,
                    color: '#bbb', letterSpacing: '1px', textTransform: 'uppercase',
                  }}>
                    or
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#E0DCD4' }} />
                </div>

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <OFld
                    label="Name" type="text" value={name}
                    placeholder="Your name" onChange={setName} autoComplete="name"
                  />
                  <OFld
                    label="Email" type="email" value={email}
                    placeholder="you@example.com" onChange={setEmail} autoComplete="email"
                  />
                  <OFld
                    label="Password" type="password" value={password}
                    placeholder="At least 6 characters" onChange={setPassword} autoComplete="new-password"
                  />

                  {authError && (
                    <div style={{
                      fontSize: 11, color: '#c0392b', fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.5, padding: '8px 12px',
                      background: '#fdf2f0', border: '1px solid #f5c6c1',
                    }}>
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      ...BTN_PRIMARY,
                      background: submitting || !email || !password ? '#D0CCC4' : '#111',
                      cursor: submitting || !email || !password ? 'default' : 'pointer',
                      marginTop: 4,
                    }}
                  >
                    {submitting ? '…' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div style={{
                padding: '16px 28px',
                paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                <button onClick={handleGuest} style={{
                  background: 'none', border: 'none',
                  fontFamily: 'Inter, sans-serif', fontSize: 12,
                  color: '#999', cursor: 'pointer',
                }}>
                  Continue as guest →
                </button>
              </div>
            </>
          )}
        </Scr>
      </div>
    </div>
  )
}

// ── Layout primitives ──────────────────────────────────────────────────────────

function Scr({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: `${100 / N}%`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      background: '#fff',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function Hdr({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '54px 20px 0',
      gap: 10,
      flexShrink: 0,
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#111', padding: '0 8px 0 0',
          fontSize: 24, lineHeight: 1, fontFamily: 'Inter, sans-serif',
        }}
      >
        ‹
      </button>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{
            flex: 1,
            height: 2,
            background: i + 1 <= step ? '#111' : '#E0DCD4',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
    </div>
  )
}

function Ftr({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '20px 28px',
      paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
      flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1.5, background: '#111' }} />
      <span style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: size, fontWeight: 700,
        color: '#111', whiteSpace: 'nowrap', letterSpacing: '-0.5px',
      }}>
        scrollwell
      </span>
      <div style={{ flex: 1, height: 1.5, background: '#111' }} />
    </div>
  )
}

function FeatRow({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
      <div style={{
        width: 38, height: 38, flexShrink: 0,
        background: '#F7F4EE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Playfair Display", serif',
        fontSize: 15, fontWeight: 700, color: '#111',
      }}>
        {num}
      </div>
      <div>
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 5,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12.5, color: '#666', lineHeight: 1.55,
        }}>
          {body}
        </div>
      </div>
    </div>
  )
}

function OFld({
  label, type, value, placeholder, onChange, autoComplete,
}: {
  label: string; type: string; value: string; placeholder: string
  onChange: (v: string) => void; autoComplete?: string
}) {
  return (
    <div>
      <div style={{
        fontSize: 8.5, fontWeight: 700, letterSpacing: '1px',
        textTransform: 'uppercase', color: '#bbb',
        fontFamily: 'Inter, sans-serif', marginBottom: 6,
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
          width: '100%', border: 'none', borderBottom: '1.5px solid #111',
          padding: '8px 0', fontSize: 14, fontFamily: 'Inter, sans-serif',
          color: '#111', background: 'none', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ── Illustrations & Icons ──────────────────────────────────────────────────────

function BookIllust() {
  return (
    <svg width="110" height="88" viewBox="0 0 110 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="42" height="60" rx="2" fill="#F7F4EE" stroke="#111" strokeWidth="1.5"/>
      <rect x="60" y="8" width="42" height="60" rx="2" fill="#F7F4EE" stroke="#111" strokeWidth="1.5"/>
      <path d="M50 8 L60 8 L60 68 L50 68 Z" fill="#E8E3D8"/>
      <line x1="18" y1="25" x2="42" y2="25" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="18" y1="32" x2="42" y2="32" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="18" y1="39" x2="42" y2="39" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="18" y1="46" x2="34" y2="46" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="68" y1="25" x2="92" y2="25" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="68" y1="32" x2="92" y2="32" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="68" y1="39" x2="92" y2="39" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="68" y1="46" x2="82" y2="46" stroke="#D0CCC4" strokeWidth="1.2"/>
      <line x1="8" y1="72" x2="102" y2="72" stroke="#E8E3D8" strokeWidth="1.5" strokeDasharray="4 3"/>
    </svg>
  )
}

function FmtIcon({ id, sel }: { id: string; sel: boolean }) {
  const c = sel ? '#fff' : '#111'
  if (id === 'books') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  )
  if (id === 'talks') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  )
  if (id === 'podcasts') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>
    </svg>
  )
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}
