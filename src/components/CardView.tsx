import { useState } from 'react'
import { IconShare, IconMicrophone, IconFileText } from '@tabler/icons-react'
import type { CardData } from '../useCards'

interface Props {
  card: CardData
  index: number
  total: number
  onSave: () => void
  saved: boolean
  onGoDeeper?: () => void
}

function youTubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function CardView({ card, index, total, onSave, saved, onGoDeeper }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  const workType = card.book.type ?? 'book'
  const { title, author, year, pages, isbn, url } = card.book

  const videoId = workType === 'talk' ? youTubeId(url) : null
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`

  const typeLabel = workType === 'talk' ? 'Talk' : workType === 'podcast' ? 'Podcast' : workType === 'article' ? 'Article' : 'Book'
  const sourceLabel = workType === 'talk' ? 'The talk' : workType === 'podcast' ? 'The podcast' : workType === 'article' ? 'The article' : 'The full book'

  const metaParts: string[] = [author]
  if (workType === 'book' && pages > 0) metaParts.push(`${pages} pages`)
  else if (workType === 'talk' && pages > 0) metaParts.push(`${pages} min`)
  else if (workType === 'article' && pages > 0) metaParts.push(`${pages} min read`)
  metaParts.push(String(year))
  const metaLine = metaParts.join(' · ')

  return (
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
          {typeLabel}
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

        {/* Thumbnail / cover */}
        {workType === 'talk' && (
          <div
            onClick={() => url && openUrl(url)}
            style={{
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              background: '#111',
              width: 88,
              height: 50,
              boxShadow: '1px 1px 6px rgba(0,0,0,0.22)',
              cursor: url ? 'pointer' : 'default',
              position: 'relative',
            }}
          >
            {!thumbFailed && thumbUrl && (
              <img
                src={thumbUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setThumbFailed(true)}
              />
            )}
            {/* Play overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.18)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(0,0,0,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 0, height: 0,
                  borderStyle: 'solid',
                  borderWidth: '4.5px 0 4.5px 8px',
                  borderColor: 'transparent transparent transparent #fff',
                  marginLeft: 2,
                }} />
              </div>
            </div>
          </div>
        )}

        {workType === 'podcast' && (
          <div
            onClick={() => url && openUrl(url)}
            style={{
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              background: '#F0EBE0',
              width: 48,
              height: 48,
              boxShadow: '1px 1px 6px rgba(0,0,0,0.12)',
              cursor: url ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconMicrophone size={20} stroke={1.5} color="#888" />
          </div>
        )}

        {workType === 'article' && (
          <div
            onClick={() => url && openUrl(url)}
            style={{
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              background: '#EBF0F5',
              width: 40,
              height: 56,
              boxShadow: '1px 1px 6px rgba(0,0,0,0.12)',
              cursor: url ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconFileText size={18} stroke={1.5} color="#888" />
          </div>
        )}

        {workType === 'book' && (
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
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setImgFailed(true)}
              />
            )}
          </div>
        )}

        {/* Source info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#ccc', marginBottom: 2 }}>
            {sourceLabel}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111', marginBottom: 1, lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {metaLine}
          </div>
          {url && workType !== 'book' && (
            <button
              onClick={() => openUrl(url)}
              style={{
                marginTop: 5,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: '#aaa',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {workType === 'talk' ? 'Watch on YouTube ↗' : workType === 'podcast' ? 'Listen on Spotify ↗' : 'Read article ↗'}
            </button>
          )}
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
