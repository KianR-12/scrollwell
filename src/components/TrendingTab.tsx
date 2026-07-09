import { useState, useEffect } from 'react'
import { IconX, IconMicrophone, IconFileText } from '@tabler/icons-react'
import { fetchTrending, type TrendingCard } from '../supabase'
import { CardSwipeFeed } from './CardSwipeFeed'
import type { CardData } from '../useCards'

interface Props {
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function youTubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

export function TrendingTab({ onGoDeeper, savedKeys, onToggleSave, onCardViewed }: Props) {
  const [items, setItems] = useState<TrendingCard[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchTrending()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = items.map(i => i.card)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          Trending
        </div>
        <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'Inter, sans-serif', marginTop: 3 }}>
          Most saved in the last 7 days
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {loading && <TrendingSkeleton />}

        {!loading && items.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 1.5, background: '#E0DCD4', margin: '0 auto 20px' }} />
              <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                Nothing trending yet
              </span>
            </div>
          </div>
        )}

        {!loading && items.map((item, i) => (
          <TrendingRow
            key={`${item.card.book.title}::${item.card.book.author}`}
            item={item}
            rank={i + 1}
            onTap={() => setOpenIndex(i)}
          />
        ))}
      </div>

      {/* Full-screen swipe feed overlay */}
      {openIndex !== null && (
        <TrendingFeedOverlay
          cards={cards}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          onGoDeeper={onGoDeeper}
          savedKeys={savedKeys}
          onToggleSave={onToggleSave}
          onCardViewed={onCardViewed}
        />
      )}
    </div>
  )
}

// ── Trending row ───────────────────────────────────────────────────────────────

function TrendingRow({ item, rank, onTap }: { item: TrendingCard; rank: number; onTap: () => void }) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const { card, saveCount } = item
  const workType = card.book.type ?? 'book'
  const videoId = workType === 'talk' ? youTubeId(card.book.url) : null
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '13px 20px',
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #F0EDE8',
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Rank */}
      <div style={{
        width: 20,
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 700,
        color: rank <= 3 ? '#111' : '#D0CCC4',
        fontFamily: '"Playfair Display", serif',
        textAlign: 'right',
      }}>
        {rank}
      </div>

      {/* Thumbnail */}
      {workType === 'talk' && (
        <div style={{
          flexShrink: 0, width: 56, height: 32, borderRadius: 2,
          overflow: 'hidden', background: '#111',
          boxShadow: '1px 1px 4px rgba(0,0,0,0.18)', position: 'relative',
        }}>
          {!thumbFailed && thumbUrl && (
            <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setThumbFailed(true)} />
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '3.5px 0 3.5px 6px', borderColor: 'transparent transparent transparent #fff', marginLeft: 1 }} />
          </div>
        </div>
      )}

      {workType === 'podcast' && (
        <div style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 2,
          background: '#F0EBE0', boxShadow: '1px 1px 4px rgba(0,0,0,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconMicrophone size={16} stroke={1.5} color="#888" />
        </div>
      )}

      {workType === 'article' && (
        <div style={{
          flexShrink: 0, width: 30, height: 40, borderRadius: 2,
          background: '#EBF0F5', boxShadow: '1px 1px 4px rgba(0,0,0,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconFileText size={14} stroke={1.5} color="#888" />
        </div>
      )}

      {workType === 'book' && (
        <div style={{
          flexShrink: 0, width: 30, height: 42, borderRadius: 2,
          overflow: 'hidden', background: '#E8E4DC',
          boxShadow: '1px 1px 4px rgba(0,0,0,0.16)',
        }}>
          {!imgFailed && (
            <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgFailed(true)} />
          )}
        </div>
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 13.5,
          fontWeight: 700,
          color: '#111',
          lineHeight: 1.3,
          marginBottom: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {card.hook}
        </div>
        <div style={{ fontSize: 10.5, color: '#999', fontFamily: 'Inter, sans-serif' }}>
          {card.book.title} · {card.book.author}
        </div>
      </div>

      {/* Save count */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', fontFamily: '"Playfair Display", serif', lineHeight: 1.1 }}>
          {saveCount.toLocaleString()}
        </div>
        <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
          saves
        </div>
      </div>
    </button>
  )
}

// ── Full-screen feed overlay ───────────────────────────────────────────────────

interface OverlayProps {
  cards: CardData[]
  initialIndex: number
  onClose: () => void
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function TrendingFeedOverlay({ cards, initialIndex, onClose, onGoDeeper, savedKeys, onToggleSave, onCardViewed }: OverlayProps) {
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
      {/* Close button */}
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

      <CardSwipeFeed
        cards={cards}
        loading={false}
        initialIndex={initialIndex}
        onGoDeeper={onGoDeeper}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
      />
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function TrendingSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid #F0EDE8' }}>
          <div style={{ width: 20, height: 14, background: '#F0ECE4', borderRadius: 2, flexShrink: 0 }} className="animate-pulse" />
          <div style={{ width: 30, height: 42, background: '#E8E4DC', borderRadius: 2, flexShrink: 0 }} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 13, background: '#E8E4DC', borderRadius: 2, marginBottom: 5, width: '85%' }} className="animate-pulse" />
            <div style={{ height: 13, background: '#F0ECE4', borderRadius: 2, marginBottom: 6, width: '65%' }} className="animate-pulse" />
            <div style={{ height: 10, background: '#F5F3EE', borderRadius: 2, width: '50%' }} className="animate-pulse" />
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ height: 14, width: 28, background: '#E8E4DC', borderRadius: 2, marginBottom: 4 }} className="animate-pulse" />
            <div style={{ height: 8, width: 28, background: '#F5F3EE', borderRadius: 2 }} className="animate-pulse" />
          </div>
        </div>
      ))}
    </>
  )
}
