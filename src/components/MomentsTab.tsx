import { useState, useEffect } from 'react'
import { fetchMoments, type MomentWithCard, type MomentRating } from '../supabase'

interface Props {
  userId: string
}

const RATING_LABEL: Record<MomentRating, string> = {
  tanked:    'Tanked',
  landed:    'Landed',
  killed_it: 'Killed it',
}

const RATING_COLOR: Record<MomentRating, string> = {
  tanked:    '#C0392B',
  landed:    '#888',
  killed_it: '#2E7D32',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MomentsTab({ userId }: Props) {
  const [moments, setMoments] = useState<MomentWithCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchMoments(userId)
      .then(setMoments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          Moments
        </div>
        <div style={{ fontSize: 10.5, color: '#aaa', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
          Every time you used a drop in the real world.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {loading && <MomentsSkeleton />}

        {!loading && moments.length === 0 && (
          <div style={{ padding: '52px 24px', textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 17, fontWeight: 700, color: '#111',
              marginBottom: 10, lineHeight: 1.3,
            }}>
              You haven't dropped anything yet.
            </div>
            <div style={{ fontSize: 12.5, color: '#aaa', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              Head to Home to find your first drop, then tap "I dropped it." after you use it.
            </div>
          </div>
        )}

        {!loading && moments.map(m => (
          <MomentRow key={m.id} moment={m} />
        ))}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

function MomentRow({ moment: m }: { moment: MomentWithCard }) {
  const color = RATING_COLOR[m.rating]
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid #F0EDE8',
    }}>
      {/* Rating + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.9px',
          textTransform: 'uppercase', color,
          fontFamily: 'Inter, sans-serif',
        }}>
          {RATING_LABEL[m.rating]}
        </span>
        <span style={{ fontSize: 10, color: '#ccc', fontFamily: 'Inter, sans-serif' }}>
          {timeAgo(m.dropped_at)}
        </span>
      </div>

      {/* Hook */}
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: 14, fontWeight: 700, color: '#111',
        lineHeight: 1.3, marginBottom: 4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {m.card.hook}
      </div>

      {/* Source */}
      <div style={{ fontSize: 10.5, color: '#bbb', fontFamily: 'Inter, sans-serif', marginBottom: m.context || m.note ? 8 : 0 }}>
        {m.card.book.title} · {m.card.book.author}
      </div>

      {/* Context / note */}
      {(m.context || m.note) && (
        <div style={{
          padding: '8px 10px',
          background: '#F7F4EE',
          borderLeft: '2px solid #E0DCD4',
          fontSize: 12, color: '#666',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
        }}>
          {m.context && <div style={{ marginBottom: m.note ? 4 : 0 }}>{m.context}</div>}
          {m.note && <div style={{ fontStyle: 'italic', color: '#888' }}>{m.note}</div>}
        </div>
      )}
    </div>
  )
}

function MomentsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #F0EDE8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ width: 48, height: 8, background: '#F0ECE4', borderRadius: 2 }} className="animate-pulse" />
            <div style={{ width: 36, height: 8, background: '#F5F3EE', borderRadius: 2 }} className="animate-pulse" />
          </div>
          <div style={{ height: 14, width: '90%', background: '#E8E4DC', borderRadius: 2, marginBottom: 5 }} className="animate-pulse" />
          <div style={{ height: 14, width: '70%', background: '#F0ECE4', borderRadius: 2, marginBottom: 8 }} className="animate-pulse" />
          <div style={{ height: 10, width: 140, background: '#F5F3EE', borderRadius: 2 }} className="animate-pulse" />
        </div>
      ))}
    </>
  )
}
