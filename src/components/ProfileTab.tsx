import { useState } from 'react'
import type { CardData } from '../useCards'

const ALL_INTERESTS = [
  'Mind & Body',
  'Habits',
  'Money',
  'Relationships',
  'Big Ideas',
  'How the World Works',
  'Science',
  'Cooking',
  'Leisure',
  'Technology',
  'Career',
  'Psychology',
]

const INTERESTS_KEY = 'scrollwell_interests'

function loadInterests(): Set<string> {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function persistInterests(set: Set<string>) {
  localStorage.setItem(INTERESTS_KEY, JSON.stringify([...set]))
}

interface Props {
  savedCount: number
  history: CardData[]
}

export function ProfileTab({ savedCount, history }: Props) {
  const [interests, setInterests] = useState<Set<string>>(loadInterests)

  function toggleInterest(name: string) {
    setInterests(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      persistInterests(next)
      return next
    })
  }

  const stats = [
    { label: 'Read',   value: String(history.length) },
    { label: 'Saved',  value: String(savedCount)      },
    { label: 'Streak', value: '3 days'                },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          Profile
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>

        {/* Stats row */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8E4DC' }}>
          {stats.map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: '14px 0',
                textAlign: 'center',
                borderRight: i < stats.length - 1 ? '1px solid #E8E4DC' : 'none',
              }}
            >
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#111',
                fontFamily: '"Playfair Display", serif',
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#bbb',
                fontFamily: 'Inter, sans-serif',
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Interests */}
        <div style={{ padding: '18px 20px 4px' }}>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1.1px',
            textTransform: 'uppercase',
            color: '#bbb',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 12,
          }}>
            Interests
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {ALL_INTERESTS.map(name => {
              const active = interests.has(name)
              return (
                <button
                  key={name}
                  onClick={() => toggleInterest(name)}
                  style={{
                    padding: '6px 11px',
                    borderRadius: 20,
                    border: `1px solid ${active ? '#111' : '#D0CCC4'}`,
                    background: active ? '#111' : 'none',
                    color: active ? '#fff' : '#888',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#E8E4DC', margin: '18px 0 0' }} />

        {/* Reading history */}
        <div style={{ padding: '18px 20px 6px' }}>
          <div style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1.1px',
            textTransform: 'uppercase',
            color: '#bbb',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 2,
          }}>
            Reading History
          </div>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '24px 20px' }}>
            <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>
              Cards you read will appear here.
            </span>
          </div>
        ) : (
          history.map((card, i) => (
            <HistoryRow key={`${card.book.title}-${i}`} card={card} />
          ))
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

// ── History row ────────────────────────────────────────────────────────────────

function HistoryRow({ card }: { card: CardData }) {
  const [imgFailed, setImgFailed] = useState(false)
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 20px',
      borderBottom: '1px solid #F0EDE8',
    }}>
      {/* Cover */}
      <div style={{
        flexShrink: 0,
        width: 32,
        height: 44,
        borderRadius: 2,
        overflow: 'hidden',
        background: '#E8E4DC',
        boxShadow: '1px 1px 4px rgba(0,0,0,0.12)',
        marginTop: 2,
      }}>
        {!imgFailed && (
          <img
            src={coverUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 13,
          fontWeight: 700,
          color: '#111',
          lineHeight: 1.25,
          marginBottom: 5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {card.hook}
        </div>
        <div style={{ fontSize: 11, color: '#999', fontFamily: 'Inter, sans-serif' }}>
          {card.book.title} · {card.book.author}
        </div>
      </div>
    </div>
  )
}
