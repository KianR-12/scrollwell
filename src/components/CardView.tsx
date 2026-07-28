import { useState } from 'react'
import { IconShare, IconMicrophone, IconFileText } from '@tabler/icons-react'
import type { CardData } from '../useCards'

interface Props {
  card: CardData
  index: number
  total: number
  onLoad: () => void
  loaded: boolean
  onGoDeeper?: () => void
  onDropped?: () => void
}

function youTubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function CardView({ card, index, total, onLoad, loaded, onGoDeeper, onDropped }: Props) {
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
      padding: '16px 20px 0',
      overflow: 'hidden',
      minHeight: 0,
    }}>

      {/* ── SAY THIS NEXT TIME (lead) ──────────────────────────────────── */}
      <div style={{
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '1.3px',
        textTransform: 'uppercase',
        color: '#bbb',
        fontFamily: 'Inter, sans-serif',
        marginBottom: 8,
      }}>
        Say This Next Time
      </div>

      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: 'clamp(18px, 5vw, 23px)',
        fontWeight: 700,
        lineHeight: 1.18,
        color: '#111',
        letterSpacing: '-0.3px',
        marginBottom: 5,
      }}>
        {card.hook}
      </div>

      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, fontStyle: 'italic' }}>
        {card.hookSub}
      </div>

      {/* ── Thin rule ─────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: '#E8E4DC', marginBottom: 10, flexShrink: 0 }} />

      {/* ── Gist (supporting context) ────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ fontSize: 12.5, color: '#666', lineHeight: 1.6 }}>
          {card.gist}
        </div>
      </div>

      {/* ── Thin rule ─────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: '#E8E4DC', marginBottom: 10, flexShrink: 0 }} />

      {/* ── Source row (now secondary) ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>

        {workType === 'talk' && (
          <div
            onClick={() => url && openUrl(url)}
            style={{
              flexShrink: 0, borderRadius: 2, overflow: 'hidden',
              background: '#111', width: 72, height: 41,
              boxShadow: '1px 1px 5px rgba(0,0,0,0.2)',
              cursor: url ? 'pointer' : 'default', position: 'relative',
            }}
          >
            {!thumbFailed && thumbUrl && (
              <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setThumbFailed(true)} />
            )}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '3.5px 0 3.5px 6px', borderColor: 'transparent transparent transparent #fff', marginLeft: 1.5 }} />
              </div>
            </div>
          </div>
        )}

        {workType === 'podcast' && (
          <div onClick={() => url && openUrl(url)} style={{ flexShrink: 0, borderRadius: 2, background: '#F0EBE0', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: url ? 'pointer' : 'default' }}>
            <IconMicrophone size={16} stroke={1.5} color="#888" />
          </div>
        )}

        {workType === 'article' && (
          <div onClick={() => url && openUrl(url)} style={{ flexShrink: 0, borderRadius: 2, background: '#EBF0F5', width: 32, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: url ? 'pointer' : 'default' }}>
            <IconFileText size={15} stroke={1.5} color="#888" />
          </div>
        )}

        {workType === 'book' && (
          <div style={{ flexShrink: 0, borderRadius: 2, overflow: 'hidden', background: '#E8E4DC', width: 32, height: 44, boxShadow: '1px 1px 5px rgba(0,0,0,0.15)' }}>
            {!imgFailed && <img src={coverUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgFailed(true)} />}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase', color: '#ccc', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>
            {typeLabel} · {sourceLabel}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#333', marginBottom: 1, lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'Inter, sans-serif' }}>
            {metaLine}
          </div>
          {url && workType !== 'book' && (
            <button onClick={() => openUrl(url)} style={{ marginTop: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#aaa', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {workType === 'talk' ? 'Watch ↗' : workType === 'podcast' ? 'Listen ↗' : 'Read ↗'}
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom actions ─────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, marginTop: 4 }}>

        {/* Social proof */}
        <div style={{ fontSize: 10.5, color: '#aaa', fontWeight: 500, marginBottom: 9, fontFamily: 'Inter, sans-serif' }}>
          {card.socialCount.toLocaleString()} people dropped this
        </div>

        {/* Primary CTA */}
        <button
          onClick={onDropped}
          style={{
            display: 'block',
            width: '100%',
            padding: '13px 0',
            background: '#111',
            color: '#fff',
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginBottom: 7,
          }}
        >
          I dropped it.
        </button>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button
            onClick={onLoad}
            style={{
              flex: 1,
              border: `1px solid ${loaded ? '#D0CCC4' : '#111'}`,
              borderRadius: 3,
              padding: '8px 0',
              fontSize: 9.5,
              letterSpacing: '0.7px',
              textTransform: 'uppercase',
              color: loaded ? '#aaa' : '#111',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {loaded ? 'Loaded' : 'Load'}
          </button>

          <button
            onClick={onGoDeeper}
            style={{
              flex: 1,
              border: '1px solid #D0CCC4',
              borderRadius: 3,
              padding: '8px 0',
              fontSize: 9.5,
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

          <button style={{ width: 34, border: '1px solid #D0CCC4', borderRadius: 3, background: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconShare size={13} stroke={1.5} />
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 5 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              height: 4,
              width: i === index ? 14 : 4,
              borderRadius: i === index ? 2 : '50%',
              background: i === index ? '#111' : '#D0CCC4',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }} />
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, color: '#D0CCC4', letterSpacing: '0.4px', paddingBottom: 8 }}>
          Swipe up for next
        </div>
      </div>
    </div>
  )
}
