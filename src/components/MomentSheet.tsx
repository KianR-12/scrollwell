import { useState, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'
import type { CardData } from '../useCards'
import { logMoment, type MomentRating } from '../supabase'

interface Props {
  card: CardData
  userId: string
  onClose: () => void
  onLogged?: () => void
}

const RATINGS: { value: MomentRating; label: string }[] = [
  { value: 'tanked',    label: 'Tanked'    },
  { value: 'landed',   label: 'Landed'    },
  { value: 'killed_it', label: 'Killed it' },
]

export function MomentSheet({ card, userId, onClose, onLogged }: Props) {
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)
  const [rating, setRating] = useState<MomentRating | null>(null)
  const [context, setContext] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function close() {
    setClosing(true)
    setTimeout(onClose, 340)
  }

  async function handleSubmit() {
    if (!rating) return
    setSubmitting(true)
    try {
      await logMoment(userId, card, rating, { context, note })
      setDone(true)
      onLogged?.()
      setTimeout(close, 1000)
    } catch {
      setSubmitting(false)
    }
  }

  const slideY = closing || !entered ? 'translateY(100%)' : 'translateY(0)'

  return (
    <>
      {/* Scrim */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 200,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 201,
        background: '#fff',
        borderTop: '2px solid #111',
        padding: '24px 24px calc(28px + env(safe-area-inset-bottom, 0px))',
        transform: slideY,
        transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 18, fontWeight: 700, color: '#111',
          }}>
            {done ? 'Logged.' : 'How did it land?'}
          </div>
          <button
            onClick={close}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid #E0DCD4', background: 'none',
              cursor: 'pointer', color: '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconX size={13} stroke={2} />
          </button>
        </div>

        {done ? (
          <div style={{
            padding: '20px 0',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13, color: '#888', textAlign: 'center',
          }}>
            Added to your Moments.
          </div>
        ) : (
          <>
            {/* Mini card preview */}
            <div style={{
              padding: '10px 12px',
              background: '#F7F4EE',
              borderLeft: '2px solid #111',
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', color: '#aaa',
                fontFamily: 'Inter, sans-serif', marginBottom: 4,
              }}>
                Say This Next Time
              </div>
              <div style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 13.5, fontWeight: 700, color: '#111',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {card.hook}
              </div>
              <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'Inter, sans-serif', marginTop: 3 }}>
                {card.book.title}
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: 18 }}>
              <div style={labelStyle}>How it landed</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {RATINGS.map(r => {
                  const sel = rating === r.value
                  return (
                    <button
                      key={r.value}
                      onClick={() => setRating(r.value)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        background: sel ? '#111' : '#fff',
                        color: sel ? '#fff' : '#111',
                        border: `1.5px solid ${sel ? '#111' : '#D0CCC4'}`,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11, fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Context */}
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Where? With who? <span style={{ fontWeight: 400, color: '#ccc' }}>optional</span></div>
              <input
                type="text"
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. dinner with friends, work meeting…"
                style={inputStyle}
              />
            </div>

            {/* Note */}
            <div style={{ marginBottom: 22 }}>
              <div style={labelStyle}>What happened? <span style={{ fontWeight: 400, color: '#ccc' }}>optional</span></div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Their reaction, what came up, how the conversation went…"
                rows={2}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!rating || submitting}
              style={{
                display: 'block', width: '100%', padding: '14px 0',
                background: !rating || submitting ? '#D0CCC4' : '#111',
                color: '#fff', border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '1.2px', textTransform: 'uppercase',
                cursor: !rating || submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? '…' : 'Log it.'}
            </button>
          </>
        )}
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 8.5, fontWeight: 700, letterSpacing: '1px',
  textTransform: 'uppercase', color: '#bbb',
  fontFamily: 'Inter, sans-serif', marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: 'none', borderBottom: '1.5px solid #E0DCD4',
  padding: '7px 0', fontSize: 13, fontFamily: 'Inter, sans-serif',
  color: '#111', background: 'none', outline: 'none',
  boxSizing: 'border-box',
}
