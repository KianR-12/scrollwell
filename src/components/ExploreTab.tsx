import { useState, useEffect, useRef } from 'react'
import { IconArrowLeft, IconSearch, IconX, IconRotate, IconMicrophone, IconFileText } from '@tabler/icons-react'
import { CardSwipeFeed } from './CardSwipeFeed'
import { generateCardsForWorks, generateCard } from '../api'
import { CONTENT_LIBRARY, type Work } from '../contentLibrary'
import type { CardData } from '../useCards'

interface Category {
  title: string
  sub: string
}

const CATEGORIES: Category[] = [
  { title: 'Mind & Body',         sub: 'health, fitness, sleep, mental health'       },
  { title: 'Habits',              sub: 'routines, productivity, self discipline'      },
  { title: 'Money',               sub: 'investing, business, wealth'                 },
  { title: 'Relationships',       sub: 'dating, friendship, social dynamics'         },
  { title: 'Big Ideas',           sub: 'philosophy, consciousness, meaning'          },
  { title: 'How the World Works', sub: 'politics, power, history'                    },
  { title: 'Science',             sub: 'physics, biology, evolution, space'          },
  { title: 'Cooking',             sub: 'food, nutrition, culinary culture'            },
  { title: 'Leisure',             sub: 'travel, film, art, music'                    },
  { title: 'Technology',          sub: 'AI, internet, the future'                    },
  { title: 'Career',              sub: 'work, ambition, leadership'                  },
  { title: 'Psychology',          sub: 'behavior, decisions, the human mind'         },
]

// ── Section types ──────────────────────────────────────────────────────────────

type SectionType = Work['type']

const SECTION_ORDER: SectionType[] = ['book', 'talk', 'podcast', 'article']

const SECTION_LABELS: Record<SectionType, string> = {
  book: 'Books',
  talk: 'Talks',
  podcast: 'Podcasts',
  article: 'Articles',
}

// ── YouTube helper ─────────────────────────────────────────────────────────────

function youTubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

// ── View types ─────────────────────────────────────────────────────────────────

type ExploreView =
  | { kind: 'grid' }
  | { kind: 'category'; cat: Category }
  | { kind: 'feed'; cat: Category; sectionType: SectionType; cards: CardData[]; startIndex: number }
  | { kind: 'search'; query: string; card: CardData | null; loading: boolean; error: string | null }

// ── ExploreTab ─────────────────────────────────────────────────────────────────

interface ExploreProps {
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

export function ExploreTab({ onGoDeeper, savedKeys, onToggleSave, onCardViewed }: ExploreProps) {
  const [view, setView] = useState<ExploreView>({ kind: 'grid' })

  async function handleSearch(query: string) {
    const q = query.trim()
    if (!q) return
    setView({ kind: 'search', query: q, card: null, loading: true, error: null })
    try {
      const card = await generateCard(q)
      setView({ kind: 'search', query: q, card, loading: false, error: null })
    } catch (err) {
      setView({
        kind: 'search', query: q, card: null, loading: false,
        error: err instanceof Error ? err.message : 'Something went wrong',
      })
    }
  }

  function openFeed(cat: Category, sectionType: SectionType, cards: CardData[], startIndex: number) {
    setView({ kind: 'feed', cat, sectionType, cards, startIndex })
  }

  function goBack() {
    if (view.kind === 'feed') setView({ kind: 'category', cat: view.cat })
    else setView({ kind: 'grid' })
  }

  if (view.kind === 'search') {
    return (
      <SearchResultView
        query={view.query}
        card={view.card}
        loading={view.loading}
        error={view.error}
        onBack={goBack}
        onRetry={() => handleSearch(view.query)}
        onGoDeeper={onGoDeeper}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
      />
    )
  }

  if (view.kind === 'category') {
    return (
      <CategoryDetail
        cat={view.cat}
        onBack={goBack}
        onOpenFeed={openFeed}
        onGoDeeper={onGoDeeper}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
      />
    )
  }

  if (view.kind === 'feed') {
    return (
      <FeedView
        cat={view.cat}
        sectionType={view.sectionType}
        cards={view.cards}
        startIndex={view.startIndex}
        onBack={goBack}
        onGoDeeper={onGoDeeper}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
      />
    )
  }

  return (
    <CategoryGrid
      onSelect={cat => setView({ kind: 'category', cat })}
      onSearch={handleSearch}
    />
  )
}

// ── SearchResultView ───────────────────────────────────────────────────────────

interface SearchResultProps {
  query: string
  card: CardData | null
  loading: boolean
  error: string | null
  onBack: () => void
  onRetry: () => void
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function SearchResultView({ query, card, loading, error, onBack, onRetry, onGoDeeper, savedKeys, onToggleSave, onCardViewed }: SearchResultProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <div style={{
        padding: '52px 20px 11px',
        borderBottom: '2px solid #111',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center', flexShrink: 0, marginBottom: 2 }}
        >
          <IconArrowLeft size={18} stroke={1.8} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Inter, sans-serif', marginBottom: 3 }}>
            Search
          </div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {query}
          </div>
        </div>
        <button
          onClick={onRetry}
          disabled={loading}
          title="Regenerate"
          style={{
            background: 'none',
            border: '1px solid #E0DCD4',
            borderRadius: 3,
            padding: '6px 8px',
            cursor: loading ? 'default' : 'pointer',
            color: loading ? '#D0CCC4' : '#888',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            marginBottom: 2,
          }}
        >
          <IconRotate size={14} stroke={1.8} />
        </button>
      </div>

      <div style={{ height: 2, background: '#EBEBEB', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#111', width: loading ? '60%' : '100%', transition: 'width 1.2s ease', opacity: loading ? 1 : 0 }} />
      </div>

      {error && (
        <div style={{ padding: '28px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>{error}</div>
          <button onClick={onBack} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#111', background: 'none', border: '1px solid #111', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Go back
          </button>
        </div>
      )}

      {!error && (
        <CardSwipeFeed
          cards={card ? [card] : []}
          loading={loading}
          onGoDeeper={onGoDeeper}
          savedKeys={savedKeys}
          onToggleSave={onToggleSave}
          onCardViewed={onCardViewed}
        />
      )}
    </div>
  )
}

// ── CategoryGrid ───────────────────────────────────────────────────────────────

function CategoryGrid({ onSelect, onSearch }: {
  onSelect: (cat: Category) => void
  onSearch: (q: string) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function submit() {
    const q = query.trim()
    if (!q) return
    onSearch(q)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          Explore
        </div>
      </div>

      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #E8E4DC',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1.5px solid #D0CCC4',
          borderRadius: 3,
          padding: '9px 12px',
          background: '#FAFAF8',
        }}>
          <IconSearch size={15} stroke={1.8} color="#bbb" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Any book, talk, idea, or person…"
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              outline: 'none',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              color: '#111',
              minWidth: 0,
            }}
          />
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#bbb', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <IconX size={14} stroke={2} />
            </button>
          )}
        </div>
        <button
          onClick={submit}
          disabled={!query.trim()}
          style={{
            padding: '9px 14px',
            background: query.trim() ? '#111' : '#E8E4DC',
            color: query.trim() ? '#fff' : '#bbb',
            border: 'none',
            borderRadius: 3,
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            cursor: query.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Search
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 20px 20px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.title}
              onClick={() => onSelect(cat)}
              style={{
                border: '1px solid #E0DCD4',
                borderRadius: 3,
                padding: '12px 13px',
                cursor: 'pointer',
                background: 'none',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3, lineHeight: 1.25 }}>
                {cat.title}
              </div>
              <div style={{ fontSize: 10, color: '#aaa', lineHeight: 1.4 }}>
                {cat.sub}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── CategoryDetail ─────────────────────────────────────────────────────────────

interface SectionState {
  works: Work[]
  cards: CardData[]
  loading: boolean
  error: string | null
}

interface CategoryDetailProps {
  cat: Category
  onBack: () => void
  onOpenFeed: (cat: Category, sectionType: SectionType, cards: CardData[], startIndex: number) => void
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function CategoryDetail({ cat, onBack, onOpenFeed }: CategoryDetailProps) {
  const allWorks = CONTENT_LIBRARY[cat.title] ?? []

  const [sections, setSections] = useState<Record<SectionType, SectionState>>(() => {
    const init = {} as Record<SectionType, SectionState>
    for (const type of SECTION_ORDER) {
      const works = allWorks.filter(w => w.type === type)
      init[type] = { works, cards: [], loading: works.length > 0, error: null }
    }
    return init
  })

  useEffect(() => {
    SECTION_ORDER.forEach(type => {
      const works = allWorks.filter(w => w.type === type)
      if (works.length === 0) return
      generateCardsForWorks(works, cat.title)
        .then(cards => setSections(prev => ({ ...prev, [type]: { works, cards, loading: false, error: null } })))
        .catch(err => setSections(prev => ({
          ...prev,
          [type]: { ...prev[type], loading: false, error: err instanceof Error ? err.message : 'Failed to load' },
        })))
    })
  }, [])

  const totalWorks = allWorks.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 11px',
        borderBottom: '2px solid #111',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center', flexShrink: 0, marginBottom: 2 }}
        >
          <IconArrowLeft size={18} stroke={1.8} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
            {cat.title}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#ccc', fontWeight: 500, flexShrink: 0, marginBottom: 3 }}>
          {totalWorks} works
        </div>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
        {SECTION_ORDER.map(type => {
          const { works, cards, loading, error } = sections[type]
          if (!loading && works.length === 0) return null
          return (
            <SectionRow
              key={type}
              type={type}
              count={works.length}
              cards={cards}
              loading={loading}
              error={error}
              onCardTap={i => onOpenFeed(cat, type, cards, i)}
            />
          )
        })}
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}

// ── SectionRow ─────────────────────────────────────────────────────────────────

function SectionRow({ type, count, cards, loading, error, onCardTap }: {
  type: SectionType
  count: number
  cards: CardData[]
  loading: boolean
  error: string | null
  onCardTap: (index: number) => void
}) {
  return (
    <div style={{ paddingTop: 22 }}>
      {/* Label + rule */}
      <div style={{ padding: '0 20px', marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.3px', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>
          {SECTION_LABELS[type]} ({count})
        </div>
        <div style={{ height: 1, background: '#E8E4DC' }} />
      </div>

      {/* Horizontal scroll row */}
      <div style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        padding: '0 20px 20px',
        WebkitOverflowScrolling: 'touch' as any,
        scrollbarWidth: 'none' as any,
        msOverflowStyle: 'none' as any,
      }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ThumbSkeleton key={i} type={type} />)
          : error
            ? <div style={{ fontSize: 11, color: '#aaa', padding: '8px 0', fontFamily: 'Inter, sans-serif' }}>Failed to load</div>
            : cards.map((card, i) => (
                <TypeThumb key={i} card={card} onTap={() => onCardTap(i)} />
              ))
        }
      </div>
    </div>
  )
}

// ── TypeThumb ──────────────────────────────────────────────────────────────────

function TypeThumb({ card, onTap }: { card: CardData; onTap: () => void }) {
  const [imgFailed, setImgFailed] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  const workType = card.book.type ?? 'book'

  const videoId = workType === 'talk' ? youTubeId(card.book.url) : null
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
  const coverUrl = `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`

  const isWide = workType === 'talk'
  const thumbW = isWide ? 104 : 64
  const thumbH = isWide ? 59 : workType === 'book' ? 92 : 72

  const bgColor = workType === 'book' ? '#E8E4DC'
    : workType === 'talk' ? '#1a1a1a'
    : workType === 'podcast' ? '#F0EBE0'
    : '#EBF0F5'

  return (
    <button
      onClick={onTap}
      style={{
        flexShrink: 0,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        width: thumbW,
      }}
    >
      <div style={{
        width: thumbW,
        height: thumbH,
        borderRadius: 3,
        overflow: 'hidden',
        background: bgColor,
        boxShadow: '0 1px 4px rgba(0,0,0,0.13)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
      }}>
        {workType === 'book' && !imgFailed && (
          <img
            src={coverUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgFailed(true)}
          />
        )}

        {workType === 'talk' && (
          <>
            {!thumbFailed && thumbUrl && (
              <img
                src={thumbUrl}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setThumbFailed(true)}
              />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: thumbFailed || !thumbUrl ? 'transparent' : 'rgba(0,0,0,0.18)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(255,255,255,0.88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 0, height: 0,
                  borderStyle: 'solid',
                  borderWidth: '4px 0 4px 7px',
                  borderColor: 'transparent transparent transparent #111',
                  marginLeft: 2,
                }} />
              </div>
            </div>
          </>
        )}

        {workType === 'podcast' && (
          <IconMicrophone size={22} stroke={1.5} color="#aaa" />
        )}

        {workType === 'article' && (
          <IconFileText size={20} stroke={1.5} color="#99aab5" />
        )}
      </div>

      {/* Title */}
      <div style={{
        fontSize: 10,
        color: '#444',
        lineHeight: 1.35,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as any,
      }}>
        {card.book.title}
      </div>
    </button>
  )
}

// ── ThumbSkeleton ──────────────────────────────────────────────────────────────

function ThumbSkeleton({ type }: { type: SectionType }) {
  const isWide = type === 'talk'
  const w = isWide ? 104 : 64
  const h = isWide ? 59 : type === 'book' ? 92 : 72

  return (
    <div style={{ flexShrink: 0, width: w }}>
      <div style={{ width: w, height: h, borderRadius: 3, background: '#F0ECE4', marginBottom: 6 }} className="animate-pulse" />
      <div style={{ height: 8, background: '#F5F3EE', borderRadius: 2, marginBottom: 4, width: '88%' }} className="animate-pulse" />
      <div style={{ height: 8, background: '#F5F3EE', borderRadius: 2, width: '60%' }} className="animate-pulse" />
    </div>
  )
}

// ── FeedView ───────────────────────────────────────────────────────────────────

interface FeedViewProps {
  cat: Category
  sectionType: SectionType
  cards: CardData[]
  startIndex: number
  onBack: () => void
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function FeedView({ cat, sectionType, cards, startIndex, onBack, onGoDeeper, savedKeys, onToggleSave, onCardViewed }: FeedViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 11px',
        borderBottom: '2px solid #111',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center', flexShrink: 0, marginBottom: 2 }}
        >
          <IconArrowLeft size={18} stroke={1.8} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#bbb', fontFamily: 'Inter, sans-serif', marginBottom: 3 }}>
            {SECTION_LABELS[sectionType]}
          </div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cat.title}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginBottom: 3 }}>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>
            {cards.length} card{cards.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <CardSwipeFeed
        cards={cards}
        loading={false}
        initialIndex={startIndex}
        onGoDeeper={onGoDeeper}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
      />
    </div>
  )
}

