import { useState, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'
import { fetchLibrary, type SavedCard } from '../supabase'
import { CardView } from './CardView'
import type { CardData } from '../useCards'

interface Props {
  userId: string
  onToggleSave: (card: CardData) => void
}

export function LibraryTab({ userId, onToggleSave }: Props) {
  const [entries, setEntries] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SavedCard | null>(null)

  useEffect(() => {
    fetchLibrary(userId)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  function handleUnsave(card: CardData) {
    setEntries(prev =>
      prev.filter(e => !(e.card.book.title === card.book.title && e.card.book.author === card.book.author))
    )
    setSelected(null)
    onToggleSave(card)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          Library
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E8E4DC',
        flexShrink: 0,
      }}>
        {[
          { label: 'Read',    value: '0'  },
          { label: 'Saved',   value: loading ? '—' : String(entries.length) },
          { label: 'Dropped', value: '0'  },
          { label: 'Streak',  value: '1'  },
        ].map(({ label, value }, i, arr) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: '12px 0',
              textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid #E8E4DC' : 'none',
            }}
          >
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#111',
              fontFamily: '"Playfair Display", serif',
              lineHeight: 1,
              marginBottom: 3,
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

      {/* Saved cards list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {loading && <ListSkeleton />}

        {!loading && entries.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
            <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
              Nothing saved yet
            </span>
          </div>
        )}

        {!loading && entries.map(entry => (
          <SavedRow
            key={entry.savedId}
            entry={entry}
            onTap={() => setSelected(entry)}
          />
        ))}
      </div>

      {/* Fullscreen card overlay */}
      {selected && (
        <LibraryCardOverlay
          entry={selected}
          onClose={() => setSelected(null)}
          onUnsave={() => handleUnsave(selected.card)}
        />
      )}
    </div>
  )
}

// ── Saved card row ─────────────────────────────────────────────────────────────

function SavedRow({ entry, onTap }: { entry: SavedCard; onTap: () => void }) {
  const [imgFailed, setImgFailed] = useState(false)
  const { card } = entry
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 20px',
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #F0EDE8',
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Cover */}
      <div style={{
        flexShrink: 0,
        width: 32,
        height: 44,
        borderRadius: 2,
        overflow: 'hidden',
        background: '#E8E4DC',
        boxShadow: '1px 1px 4px rgba(0,0,0,0.14)',
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
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: '#ccc',
          marginBottom: 4,
          fontFamily: 'Inter, sans-serif',
        }}>
          {entry.card_type === 'deep_dive' ? 'Deep Dive' : 'Book'}
        </div>
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 13.5,
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
    </button>
  )
}

// ── Fullscreen overlay ─────────────────────────────────────────────────────────

function LibraryCardOverlay({
  entry,
  onClose,
  onUnsave,
}: {
  entry: SavedCard
  onClose: () => void
  onUnsave: () => void
}) {
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 360)
  }

  const slideY = closing || !entered ? 'translateY(100%)' : 'translateY(0)'

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      transform: slideY,
      transition: 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        padding: '52px 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid #E0DCD4',
            background: 'none',
            cursor: 'pointer',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <IconX size={13} stroke={2} />
        </button>
      </div>

      {/* Card — reuse CardView; onSave = unsave + close */}
      <CardView
        card={entry.card}
        index={0}
        total={1}
        saved={true}
        onSave={onUnsave}
        onGoDeeper={undefined}
      />
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0EDE8' }}>
          <div style={{ width: 32, height: 44, borderRadius: 2, background: '#E8E4DC', flexShrink: 0, marginTop: 2 }} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, width: 36, background: '#F0ECE4', borderRadius: 2, marginBottom: 6 }} className="animate-pulse" />
            <div style={{ height: 13, width: '85%', background: '#E8E4DC', borderRadius: 2, marginBottom: 4 }} className="animate-pulse" />
            <div style={{ height: 13, width: '65%', background: '#F0ECE4', borderRadius: 2, marginBottom: 6 }} className="animate-pulse" />
            <div style={{ height: 10, width: 140, background: '#F5F3EE', borderRadius: 2 }} className="animate-pulse" />
          </div>
        </div>
      ))}
    </>
  )
}
