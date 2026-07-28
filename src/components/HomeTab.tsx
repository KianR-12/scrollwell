import { useState, useCallback, useEffect } from 'react'
import { CardSwipeFeed } from './CardSwipeFeed'
import type { CardData } from '../useCards'

interface Props {
  cards: CardData[]
  loading: boolean
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
  onDropped?: (card: CardData) => void
}

function useCountdown(): string {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(`${h}h ${m}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [])
  return label
}

export function HomeTab({ cards, loading, onGoDeeper, savedKeys, onToggleSave, onCardViewed, onDropped }: Props) {
  const [index, setIndex] = useState(0)
  const countdown = useCountdown()

  const onIndexChange = useCallback((i: number) => setIndex(i), [])

  const total = cards.length
  const progressPct = total > 1 ? ((index + 1) / total) * 100 : 100

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '52px 20px 11px',
        borderBottom: '2px solid #111',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
              scrollwell
            </div>
            <div style={{ fontSize: 10.5, color: '#aaa', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
              Your drops for today.
            </div>
          </div>
          {countdown && !loading && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#D0CCC4', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Refreshes in
              </div>
              <div style={{ fontSize: 11, color: '#bbb', fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '0.3px' }}>
                {countdown}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#EBEBEB', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: '#111',
          width: loading ? '0%' : `${progressPct}%`,
          transition: 'width 0.35s ease',
        }} />
      </div>

      <CardSwipeFeed
        cards={cards}
        loading={loading}
        onIndexChange={onIndexChange}
        onGoDeeper={onGoDeeper}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
        onDropped={onDropped}
      />
    </>
  )
}
