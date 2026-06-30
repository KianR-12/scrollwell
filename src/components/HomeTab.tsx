import { useState, useCallback } from 'react'
import { CardSwipeFeed } from './CardSwipeFeed'
import type { CardData } from '../useCards'

interface Props {
  cards: CardData[]
  loading: boolean
  onGoDeeper?: (card: CardData) => void
}

export function HomeTab({ cards, loading, onGoDeeper }: Props) {
  const [index, setIndex] = useState(0)

  const onIndexChange = useCallback((i: number) => setIndex(i), [])

  const total = cards.length
  const progressPct = total > 1 ? ((index + 1) / total) * 100 : 100
  const current = cards[index]

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '52px 20px 11px',
        borderBottom: '2px solid #111',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          scrollwell
        </div>
        {current && !loading && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, letterSpacing: '0.2px' }}>
              {index + 1} of {total}
            </div>
            <div style={{ fontSize: 9, color: '#ccc', letterSpacing: '0.3px', marginTop: 1 }}>
              {current.book.category}
            </div>
          </div>
        )}
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

      <CardSwipeFeed cards={cards} loading={loading} onIndexChange={onIndexChange} onGoDeeper={onGoDeeper} />
    </>
  )
}
