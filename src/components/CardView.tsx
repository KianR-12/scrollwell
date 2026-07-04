import { useState } from 'react'
import { IconShare } from '@tabler/icons-react'
import type { CardData } from '../useCards'

interface Props {
  card: CardData
  index: number
  total: number
  onSave: () => void
  saved: boolean
  onGoDeeper?: () => void
}

export function CardView({ card, index, total, onSave, saved, onGoDeeper }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  return (
    /* .home-card */
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 20px 0',
      overflow: 'hidden',
      minHeight: 0,
    }}>

      {/* Type pill */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 13 }}>
        <div style={{ width: 14, height: 1.5, background: '#C0BDB4' }} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#aaa' }}>
          Book
        </span>
      </div>

      {/* Hook */}
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: 'clamp(17px, 4.8vw, 22px)',
        fontWeight: 700,
        lineHeight: 1.2,
        color: '#111',
        letterSpacing: '-0.3px',
        marginBottom: 4,
      }}>
        {card.hook}
      </div>

      {/* Hook subtitle */}
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 14, fontStyle: 'italic' }}>
        {card.hookSub}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#111', marginBottom: 13, flexShrink: 0 }} />

      {/* Source row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 13 }}>
        {/* Book cover */}
        <div style={{
          flexShrink: 0,
          borderRadius: 2,
          overflow: 'hidden',
          background: '#E8E4DC',
          width: 40,
          height: 56,
          boxShadow: '1px 1px 6px rgba(0,0,0,0.18)',
        }}>
          {!imgFailed && (
            <img
              src={coverUrl}
              alt={card.book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={() => setImgFailed(true)}
            />
          )}
        </div>

        {/* Source info */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#ccc', marginBottom: 2 }}>
            The full book
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 1 }}>
            {card.book.title}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {card.book.author} · {card.book.pages} pages · {card.book.year}
          </div>
        </div>
      </div>

      {/* Thin rule */}
      <div style={{ height: 1, background: '#E8E4DC', marginBottom: 11, flexShrink: 0 }} />

      {/* Gist */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.65 }}>
          {card.gist}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ flexShrink: 0, marginTop: 12 }}>
        {/* Social proof */}
        <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 10 }}>
          {card.socialCount.toLocaleString()} people dropped this today
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button
            onClick={onSave}
            style={{
              flex: 1,
              border: `1px solid ${saved ? '#D0CCC4' : '#111'}`,
              borderRadius: 3,
              padding: '9px 0',
              fontSize: 10,
              letterSpacing: '0.7px',
              textTransform: 'uppercase',
              color: saved ? '#aaa' : '#111',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {saved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={onGoDeeper}
            style={{
              flex: 1,
              border: '1px solid #D0CCC4',
              borderRadius: 3,
              padding: '9px 0',
              fontSize: 10,
              letterSpacing: '0.7px',
              textTransform: 'uppercase',
              color: '#888',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Go deeper
          </button>

          <button style={{
            width: 36,
            border: '1px solid #D0CCC4',
            borderRadius: 3,
            background: 'none',
            cursor: 'pointer',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconShare size={14} stroke={1.5} />
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                width: i === index ? 14 : 4,
                borderRadius: i === index ? 2 : '50%',
                background: i === index ? '#111' : '#D0CCC4',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Swipe hint */}
        <div style={{
          textAlign: 'center',
          fontSize: 9,
          color: '#D0CCC4',
          letterSpacing: '0.4px',
          paddingBottom: 8,
        }}>
          Swipe up for next
        </div>
      </div>
    </div>
  )
}
