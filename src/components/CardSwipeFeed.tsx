import { useState, useRef, useEffect, useCallback } from 'react'
import { CardView } from './CardView'
import type { CardData } from '../useCards'

interface Props {
  cards: CardData[]
  loading: boolean
  initialIndex?: number
  onIndexChange?: (index: number) => void
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

export function CardSwipeFeed({ cards, loading, initialIndex, onIndexChange, onGoDeeper, savedKeys, onToggleSave, onCardViewed }: Props) {
  const [index, setIndex] = useState(initialIndex ?? 0)
  // Keep a ref so the reset effect always sees the latest initialIndex value
  const initialIndexRef = useRef(initialIndex ?? 0)
  initialIndexRef.current = initialIndex ?? 0
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const savedInitialized = useRef(false)
  const onCardViewedRef = useRef(onCardViewed)
  useEffect(() => { onCardViewedRef.current = onCardViewed })

  const firstKey = cards.length > 0 ? `${cards[0].book.title}::${cards[0].book.author}` : '__empty__'

  // Reset on new card set, starting at initialIndex
  useEffect(() => {
    const start = initialIndexRef.current
    setIndex(start)
    setSaved(new Set())
    savedInitialized.current = false
    onIndexChange?.(start)
  }, [firstKey])

  // Fire onCardViewed whenever the visible card changes
  useEffect(() => {
    if (cards.length === 0 || loading) return
    onCardViewedRef.current?.(cards[index])
  }, [index, firstKey, loading])

  // Initialize saved state once when savedKeys first arrives (or cards first load)
  useEffect(() => {
    if (savedInitialized.current || !savedKeys || cards.length === 0) return
    savedInitialized.current = true
    const set = new Set<number>()
    cards.forEach((card, i) => {
      if (savedKeys.has(`${card.book.title}::${card.book.author}`)) set.add(i)
    })
    setSaved(set)
  }, [savedKeys, cards.length])

  const total = cards.length

  const goNext = useCallback(() => {
    setIndex(i => {
      const next = Math.min(i + 1, total - 1)
      onIndexChange?.(next)
      return next
    })
    setDragOffset(0)
  }, [total, onIndexChange])

  const goPrev = useCallback(() => {
    setIndex(i => {
      const next = Math.max(i - 1, 0)
      onIndexChange?.(next)
      return next
    })
    setDragOffset(0)
  }, [onIndexChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') goNext()
      if (e.key === 'ArrowDown') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: TouchEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const delta = e.touches[0].clientY - touchStartY.current
      if ((index === 0 && delta > 0) || (index === total - 1 && delta < 0)) {
        setDragOffset(delta * 0.18)
      } else {
        setDragOffset(delta)
      }
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [isDragging, index, total])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const onTouchEnd = () => {
    setIsDragging(false)
    if (dragOffset < -80) goNext()
    else if (dragOffset > 80) goPrev()
    else setDragOffset(0)
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}
    >
      {loading ? (
        <FeedSkeleton />
      ) : (
        cards.map((card, i) => {
          const pct = (i - index) * 100
          const px = isDragging ? dragOffset : 0
          return (
            <div
              key={`${card.book.isbn}-${i}`}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                transform: `translateY(calc(${pct}% + ${px}px))`,
                transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform',
                background: '#fff',
              }}
            >
              <CardView
                card={card}
                index={i}
                total={total}
                saved={saved.has(i)}
                onSave={() => {
                  setSaved(prev => {
                    const next = new Set(prev)
                    next.has(i) ? next.delete(i) : next.add(i)
                    return next
                  })
                  onToggleSave?.(card)
                }}
                onGoDeeper={() => onGoDeeper?.(card)}
              />
            </div>
          )
        })
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 13 }}>
        <div style={{ width: 14, height: 1.5, background: '#E8E4DC' }} />
        <div style={{ width: 28, height: 9, background: '#E8E4DC', borderRadius: 2 }} className="animate-pulse" />
      </div>
      <div style={{ height: 22, background: '#F0ECE4', borderRadius: 3, marginBottom: 8, width: '90%' }} className="animate-pulse" />
      <div style={{ height: 22, background: '#F0ECE4', borderRadius: 3, marginBottom: 4, width: '70%' }} className="animate-pulse" />
      <div style={{ height: 11, background: '#F5F3EE', borderRadius: 2, marginBottom: 14, width: '55%' }} className="animate-pulse" />
      <div style={{ height: 1, background: '#E8E4DC', marginBottom: 13 }} />
      <div style={{ display: 'flex', gap: 11, marginBottom: 13, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 56, background: '#E8E4DC', borderRadius: 2, flexShrink: 0 }} className="animate-pulse" />
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: '#F0ECE4', borderRadius: 2, marginBottom: 6, width: 60 }} className="animate-pulse" />
          <div style={{ height: 12, background: '#E8E4DC', borderRadius: 2, marginBottom: 4, width: 130 }} className="animate-pulse" />
          <div style={{ height: 10, background: '#F5F3EE', borderRadius: 2, width: 160 }} className="animate-pulse" />
        </div>
      </div>
      <div style={{ height: 1, background: '#E8E4DC', marginBottom: 11 }} />
      {[100, 95, 90, 80].map((w, i) => (
        <div key={i} style={{ height: 13, background: '#F5F3EE', borderRadius: 2, marginBottom: 6, width: `${w}%` }} className="animate-pulse" />
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ flexShrink: 0, marginTop: 12 }}>
        <div style={{ height: 11, background: '#F5F3EE', borderRadius: 2, marginBottom: 10, width: 180 }} className="animate-pulse" />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 36, background: '#F0ECE4', borderRadius: 3 }} className="animate-pulse" />
          <div style={{ flex: 1, height: 36, background: '#F5F3EE', borderRadius: 3 }} className="animate-pulse" />
          <div style={{ width: 36, height: 36, background: '#F5F3EE', borderRadius: 3 }} className="animate-pulse" />
        </div>
        <div style={{ height: 4, background: '#F0ECE4', borderRadius: 2, width: 80, margin: '0 auto 6px' }} className="animate-pulse" />
        <div style={{ height: 8, background: '#F5F3EE', borderRadius: 2, width: 90, margin: '0 auto 8px' }} className="animate-pulse" />
      </div>
    </div>
  )
}
