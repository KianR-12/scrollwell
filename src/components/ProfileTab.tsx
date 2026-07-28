import { useState, useEffect } from 'react'
import type { CardData } from '../useCards'
import { fetchDroppedCount, fetchBestDrops, type MomentWithCard } from '../supabase'
import { setBypassCache, clearCardCaches } from '../api'

interface Props {
  userId: string
  savedCount: number
  history: CardData[]
  email?: string
  isGuest?: boolean
  onSignOut: () => void
}

export function ProfileTab({ userId, savedCount, history, email, isGuest, onSignOut }: Props) {
  const [droppedCount, setDroppedCount] = useState(0)
  const [bestDrops, setBestDrops] = useState<MomentWithCard[]>([])

  useEffect(() => {
    if (isGuest || !userId) return
    fetchDroppedCount(userId).then(setDroppedCount).catch(() => {})
    fetchBestDrops(userId).then(setBestDrops).catch(() => {})
  }, [userId, isGuest])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Header */}
      <div style={{
        padding: '52px 20px 11px',
        borderBottom: '2px solid #111',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
            Profile
          </div>
          {email && (
            <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
              {email}
            </div>
          )}
        </div>
        <button
          onClick={onSignOut}
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
            color: '#aaa', background: 'none', border: '1px solid #E0DCD4',
            padding: '5px 10px', cursor: 'pointer', marginBottom: 2,
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>

        {/* Hero stat — Dropped */}
        <div style={{
          padding: '28px 20px 20px',
          textAlign: 'center',
          borderBottom: '1px solid #E8E4DC',
        }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 56,
            fontWeight: 700,
            color: '#111',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}>
            {isGuest ? '—' : droppedCount}
          </div>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#bbb',
            fontFamily: 'Inter, sans-serif',
            marginTop: 6,
          }}>
            Dropped
          </div>
          <div style={{ fontSize: 11, color: '#ccc', fontFamily: 'Inter, sans-serif', marginTop: 6 }}>
            times you've used a drop in real conversation
          </div>
        </div>

        {/* Supporting stats row */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8E4DC' }}>
          {[
            { label: 'Absorbed', value: String(history.length) },
            { label: 'Loaded',   value: String(savedCount) },
            { label: 'Streak',   value: '3 days' },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: '14px 0',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid #E8E4DC' : 'none',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111', fontFamily: '"Playfair Display", serif', lineHeight: 1, marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Inter, sans-serif' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Best Drops */}
        {!isGuest && (
          <>
            <div style={{ padding: '18px 20px 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
                Best Drops
              </div>
              <div style={{ fontSize: 11, color: '#ccc', fontFamily: 'Inter, sans-serif' }}>
                Your "Killed it" moments
              </div>
            </div>

            {bestDrops.length === 0 ? (
              <div style={{ padding: '16px 20px 4px' }}>
                <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
                  None yet. When you use a drop and it kills, tap "I dropped it." and rate it "Killed it."
                </div>
              </div>
            ) : (
              bestDrops.map(m => (
                <div key={m.id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid #F0EDE8', alignItems: 'flex-start' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2E7D32', marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {m.card.hook}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#bbb', fontFamily: 'Inter, sans-serif' }}>
                      {m.card.book.title}
                      {m.context && <span> · {m.context}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}

            <div style={{ height: 1, background: '#E8E4DC', margin: '16px 0 0' }} />
          </>
        )}

        {/* Absorbed history */}
        <div style={{ padding: '18px 20px 6px' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.1px', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
            Absorbed
          </div>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: 11, color: '#ccc', fontFamily: 'Inter, sans-serif' }}>
              Drops you've read will appear here.
            </span>
          </div>
        ) : (
          history.map((card, i) => (
            <HistoryRow key={`${card.book.title}-${i}`} card={card} />
          ))
        )}

        <div style={{ height: 24 }} />

        {import.meta.env.DEV && <DevTools />}
      </div>
    </div>
  )
}

// ── History row ────────────────────────────────────────────────────────────────

function HistoryRow({ card }: { card: CardData }) {
  const [imgFailed, setImgFailed] = useState(false)
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: '1px solid #F0EDE8' }}>
      <div style={{ flexShrink: 0, width: 32, height: 44, borderRadius: 2, overflow: 'hidden', background: '#E8E4DC', boxShadow: '1px 1px 4px rgba(0,0,0,0.12)', marginTop: 2 }}>
        {!imgFailed && <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgFailed(true)} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.25, marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {card.hook}
        </div>
        <div style={{ fontSize: 11, color: '#999', fontFamily: 'Inter, sans-serif' }}>
          {card.book.title} · {card.book.author}
        </div>
      </div>
    </div>
  )
}

// ── Dev tools ──────────────────────────────────────────────────────────────────

function DevTools() {
  const [bypass, setBypass] = useState(false)
  const [cleared, setCleared] = useState(false)

  function toggleBypass() {
    const next = !bypass
    setBypass(next)
    setBypassCache(next)
    setCleared(false)
  }

  function handleClear() {
    clearCardCaches()
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  return (
    <div style={{ margin: '8px 20px 16px', padding: '14px 16px', border: '1px dashed #D0CCC4', borderRadius: 4 }}>
      <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#C0BDB4', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>
        Dev Tools
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', fontFamily: 'Inter, sans-serif' }}>Bypass Supabase cache</div>
          <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Forces API calls for category cards</div>
        </div>
        <button onClick={toggleBypass} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: bypass ? '#111' : '#D0CCC4', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: bypass ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>
      <button onClick={handleClear} style={{ width: '100%', padding: '9px 0', background: 'none', color: cleared ? '#888' : '#111', border: '1px solid #D0CCC4', borderRadius: 3, fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', cursor: 'pointer' }}>
        {cleared ? 'Cleared ✓' : 'Clear in-memory caches'}
      </button>
    </div>
  )
}
