import { useState, useEffect, useRef } from 'react'
import { IconX } from '@tabler/icons-react'
import { generateDeepDive, type DeepDiveSection } from '../api'
import type { CardData } from '../useCards'

interface Props {
  card: CardData
  onBack: () => void
}

export function DeepDiveTab({ card, onBack }: Props) {
  const [sections, setSections] = useState<DeepDiveSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)
  const touchStartX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Slide-up entrance
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Generate content
  useEffect(() => {
    generateDeepDive(card)
      .then(data => setSections(data.sections))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to generate'))
      .finally(() => setLoading(false))
  }, [])

  const total = sections.length

  function handleClose() {
    setClosing(true)
    setTimeout(onBack, 360)
  }

  const goNext = () => { setCardIndex(i => Math.min(i + 1, total - 1)); setDragOffset(0) }
  const goPrev = () => { setCardIndex(i => Math.max(i - 1, 0)); setDragOffset(0) }

  // Non-passive horizontal touch handler (prevents page scroll during swipe)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const delta = e.touches[0].clientX - touchStartX.current
      const atStart = cardIndex === 0 && delta > 0
      const atEnd = cardIndex === total - 1 && delta < 0
      setDragOffset(atStart || atEnd ? delta * 0.15 : delta)
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [isDragging, cardIndex, total])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const onTouchEnd = () => {
    setIsDragging(false)
    if (dragOffset < -80) goNext()
    else if (dragOffset > 80) goPrev()
    else setDragOffset(0)
  }

  const slideY = closing || !entered ? 'translateY(100%)' : 'translateY(0)'
  const progressPct = total > 0 ? ((cardIndex + 1) / total) * 100 : 0

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

      {/* Top bar: progress + X */}
      <div style={{ flexShrink: 0, padding: '52px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Progress track */}
          <div style={{ flex: 1 }}>
            <div style={{ height: 2, background: '#E8E4DC', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: '#111',
                borderRadius: 1,
                width: loading ? '0%' : `${progressPct}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.5px', color: '#bbb', marginTop: 5 }}>
              {loading ? 'Generating…' : `${cardIndex + 1} of ${total}`}
            </div>
          </div>

          {/* X button */}
          <button
            onClick={handleClose}
            style={{
              flexShrink: 0,
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
      </div>

      {/* Card viewport */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}
      >
        {loading && <CardSkeleton card={card} />}

        {error && !loading && (
          <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, textAlign: 'center' }}>{error}</div>
            <button
              onClick={handleClose}
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#111', background: 'none', border: '1px solid #111', borderRadius: 3, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Close
            </button>
          </div>
        )}

        {!loading && !error && sections.map((section, i) => {
          const pct = (i - cardIndex) * 100
          const px = isDragging ? dragOffset : 0
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateX(calc(${pct}% + ${px}px))`,
                transition: isDragging ? 'none' : 'transform 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform',
              }}
            >
              <ChapterCard
                section={section}
                chapterNum={i + 1}
                total={total}
                card={card}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Single chapter card ────────────────────────────────────────────────────────

interface ChapterCardProps {
  section: DeepDiveSection
  chapterNum: number
  total: number
  card: CardData
}

function ChapterCard({ section, chapterNum, card }: ChapterCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 20px 0',
      overflow: 'hidden',
    }}>

      {/* Source row: thumbnail + chapter label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexShrink: 0 }}>
        <div style={{
          flexShrink: 0,
          width: 36,
          height: 50,
          borderRadius: 2,
          overflow: 'hidden',
          background: '#E8E4DC',
          boxShadow: '1px 1px 5px rgba(0,0,0,0.15)',
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

        <div style={{ paddingTop: 5 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#ccc', marginBottom: 4 }}>
            Chapter {chapterNum}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: '#888', lineHeight: 1.3 }}>
            {section.title}
          </div>
        </div>
      </div>

      {/* Hook */}
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: 'clamp(18px, 5vw, 23px)',
        fontWeight: 700,
        lineHeight: 1.2,
        color: '#111',
        letterSpacing: '-0.3px',
        marginBottom: 16,
        flexShrink: 0,
      }}>
        {section.hook}
      </div>

      {/* Rule */}
      <div style={{ height: 1, background: '#111', marginBottom: section.relevance ? 10 : 14, flexShrink: 0 }} />

      {/* Right now */}
      {section.relevance && (
        <div style={{
          fontSize: 10.5,
          color: '#aaa',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
          marginBottom: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', fontSize: 8.5, color: '#C0BDB4' }}>
            Right now{'  '}
          </span>
          {section.relevance}
        </div>
      )}

      {/* Gist */}
      <div style={{
        fontSize: 13.5,
        color: '#555',
        lineHeight: 1.68,
        flex: 1,
        overflow: 'hidden',
      }}>
        {section.gist}
      </div>

      {/* How to talk about this */}
      <div style={{
        flexShrink: 0,
        border: '1px solid #E0DCD4',
        borderRadius: 3,
        padding: '12px 14px',
        marginTop: 16,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#bbb', marginBottom: 6 }}>
          How to talk about this
        </div>
        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.62, fontStyle: 'italic' }}>
          {section.howToTalk}
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function CardSkeleton({ card }: { card: CardData }) {
  const [imgFailed, setImgFailed] = useState(false)
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    <div style={{ padding: '20px 20px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 36, height: 50, borderRadius: 2, overflow: 'hidden', background: '#E8E4DC', flexShrink: 0, boxShadow: '1px 1px 5px rgba(0,0,0,0.15)' }}>
          {!imgFailed && (
            <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgFailed(true)} />
          )}
        </div>
        <div style={{ paddingTop: 5 }}>
          <div style={{ height: 8, width: 55, background: '#F0ECE4', borderRadius: 2, marginBottom: 6 }} className="animate-pulse" />
          <div style={{ height: 9, width: 110, background: '#E8E4DC', borderRadius: 2 }} className="animate-pulse" />
        </div>
      </div>

      <div style={{ height: 22, background: '#E8E4DC', borderRadius: 3, width: '88%', marginBottom: 8 }} className="animate-pulse" />
      <div style={{ height: 22, background: '#F0ECE4', borderRadius: 3, width: '72%', marginBottom: 8 }} className="animate-pulse" />
      <div style={{ height: 22, background: '#F5F3EE', borderRadius: 3, width: '58%', marginBottom: 16 }} className="animate-pulse" />

      <div style={{ height: 1, background: '#E8E4DC', marginBottom: 14 }} />

      {[100, 96, 92, 88, 78].map((w, i) => (
        <div key={i} style={{ height: 13, background: '#F5F3EE', borderRadius: 2, marginBottom: 7, width: `${w}%` }} className="animate-pulse" />
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ height: 78, background: '#F7F4EE', borderRadius: 3, border: '1px solid #E8E4DC', marginBottom: 24 }} className="animate-pulse" />
    </div>
  )
}
