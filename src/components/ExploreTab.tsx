import { useState, useRef } from 'react'
import { IconArrowLeft, IconSearch, IconX, IconRefresh, IconRotate } from '@tabler/icons-react'
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

const BATCH = 5

// ── Session cursor helpers (survives tab switches since ExploreTab unmounts) ────

const SESSION_KEY = 'scrollwell:explore:cursors'

function readCursors(): Map<string, number> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? new Map(JSON.parse(raw) as [string, number][]) : new Map()
  } catch { return new Map() }
}

function writeCursor(category: string, cursor: number) {
  try {
    const m = readCursors()
    m.set(category, cursor)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...m]))
  } catch {}
}

function resetCursor(category: string) {
  writeCursor(category, 0)
}

// ────────────────────────────────────────────────────────────────────────────────

interface ExploreProps {
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

type ExploreView =
  | { kind: 'grid' }
  | { kind: 'category'; cat: Category }
  | { kind: 'search'; query: string; card: CardData | null; loading: boolean; error: string | null }

export function ExploreTab({ onGoDeeper, savedKeys, onToggleSave, onCardViewed }: ExploreProps) {
  const [view, setView] = useState<ExploreView>({ kind: 'grid' })
  const [cards, setCards] = useState<CardData[]>([])
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exhausted, setExhausted] = useState(false)

  const worksRef = useRef<Work[]>([])
  const nextBatchRef = useRef(0)
  const isLoadingMore = useRef(false)
  // Tracks the last card index seen; detects swipe-past-end (goNext clamps + re-fires same index)
  const prevCardIndexRef = useRef<number>(-1)

  async function openCategory(cat: Category) {
    const works = CONTENT_LIBRARY[cat.title] ?? []
    const startIdx = readCursors().get(cat.title) ?? 0

    setView({ kind: 'category', cat })
    setError(null)
    setCards([])
    setExhausted(false)
    prevCardIndexRef.current = -1
    worksRef.current = works

    // Already seen every work in this category
    if (works.length > 0 && startIdx >= works.length) {
      setExhausted(true)
      return
    }

    setInitialLoading(true)
    nextBatchRef.current = startIdx

    try {
      const end = Math.min(startIdx + BATCH, works.length)
      const batch = works.slice(startIdx, end)
      const result = await generateCardsForWorks(batch, cat.title)
      setCards(result)
      nextBatchRef.current = end
      writeCursor(cat.title, end)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards')
    } finally {
      setInitialLoading(false)
    }
  }

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

  async function loadMore() {
    if (isLoadingMore.current || view.kind !== 'category') return
    const works = worksRef.current
    const start = nextBatchRef.current
    if (start >= works.length) return

    isLoadingMore.current = true
    setLoadingMore(true)
    try {
      const end = Math.min(start + BATCH, works.length)
      const batch = works.slice(start, end)
      const newCards = await generateCardsForWorks(batch, view.cat.title)
      setCards(prev => [...prev, ...newCards])
      nextBatchRef.current = end
      writeCursor(view.cat.title, end)
    } catch {
      // silent
    } finally {
      setLoadingMore(false)
      isLoadingMore.current = false
    }
  }

  function onCardIndexChange(i: number) {
    const loaded = cards.length
    const total = worksRef.current.length

    // Eagerly load next batch when approaching the end
    if (i >= loaded - 2 && nextBatchRef.current < total) loadMore()

    // Detect swipe-past-end: CardSwipeFeed clamps at total-1 and re-fires onIndexChange
    // with the same index — that's the rubber-band moment signaling the user tried to go further
    if (
      i === prevCardIndexRef.current &&
      i === loaded - 1 &&
      loaded > 0 &&
      nextBatchRef.current >= total &&
      !isLoadingMore.current
    ) {
      setExhausted(true)
    }
    prevCardIndexRef.current = i
  }

  function goBack() {
    setView({ kind: 'grid' })
    setCards([])
    setError(null)
    setExhausted(false)
    prevCardIndexRef.current = -1
  }

  function refreshCategory() {
    if (view.kind !== 'category') return
    const cat = view.cat
    resetCursor(cat.title)
    openCategory(cat)
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
      <CategoryFeed
        category={view.cat}
        cards={cards}
        loading={initialLoading}
        loadingMore={loadingMore}
        totalWorks={worksRef.current.length}
        error={error}
        exhausted={exhausted}
        onBack={goBack}
        onRefresh={refreshCategory}
        onGoDeeper={onGoDeeper}
        onCardIndexChange={onCardIndexChange}
        savedKeys={savedKeys}
        onToggleSave={onToggleSave}
        onCardViewed={onCardViewed}
      />
    )
  }

  return <CategoryGrid onSelect={openCategory} onSearch={handleSearch} />
}

// ── Search result view ─────────────────────────────────────────────────────────

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
      {/* Header */}
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
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#bbb',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 3,
          }}>
            Search
          </div>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 18,
            fontWeight: 700,
            color: '#111',
            letterSpacing: '-0.3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {query}
          </div>
        </div>
        {/* Regenerate button — forces a fresh API call */}
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
          <IconRotate size={14} stroke={1.8} style={{ transform: loading ? 'none' : undefined }} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#EBEBEB', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: '#111',
          width: loading ? '60%' : '100%',
          transition: 'width 1.2s ease',
          opacity: loading ? 1 : 0,
        }} />
      </div>

      {error && (
        <div style={{ padding: '28px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
            {error}
          </div>
          <button
            onClick={onBack}
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#111', background: 'none', border: '1px solid #111', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
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

// ── Grid view ──────────────────────────────────────────────────────────────────

function CategoryGrid({ onSelect, onSearch }: { onSelect: (cat: Category) => void; onSearch: (q: string) => void }) {
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

      {/* Title header */}
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 22,
          fontWeight: 700,
          color: '#111',
          letterSpacing: '-0.3px',
        }}>
          Explore
        </div>
      </div>

      {/* Search bar */}
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

      {/* Category grid */}
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

// ── Category feed view ─────────────────────────────────────────────────────────

interface FeedProps {
  category: Category
  cards: CardData[]
  loading: boolean
  loadingMore: boolean
  totalWorks: number
  error: string | null
  exhausted: boolean
  onBack: () => void
  onRefresh: () => void
  onGoDeeper?: (card: CardData) => void
  onCardIndexChange: (i: number) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function CategoryFeed({ category, cards, loading, loadingMore, totalWorks, error, exhausted, onBack, onRefresh, onGoDeeper, onCardIndexChange, savedKeys, onToggleSave, onCardViewed }: FeedProps) {
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
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {category.title}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>
            {loading ? '…' : exhausted ? `${totalWorks} of ${totalWorks}` : cards.length < totalWorks ? `${cards.length} of ${totalWorks}` : `${cards.length} cards`}
          </div>
          <div style={{ fontSize: 9, color: '#ccc', letterSpacing: '0.3px', marginTop: 1 }}>
            {loadingMore ? 'loading more…' : category.sub}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#EBEBEB', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: '#111',
          width: loading ? '30%' : loadingMore ? '60%' : '100%',
          transition: 'width 0.8s ease',
          opacity: (loading || loadingMore) ? 1 : 0,
        }} />
      </div>

      {error && !loading && (
        <div style={{ padding: '20px', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{error}</div>
          <button
            onClick={onBack}
            style={{ marginTop: 12, fontSize: 10, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: '#111', background: 'none', border: '1px solid #111', borderRadius: 3, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Go back
          </button>
        </div>
      )}

      {!error && exhausted && (
        <ExhaustedView
          category={category.title}
          totalWorks={totalWorks}
          onRefresh={onRefresh}
          onBack={onBack}
        />
      )}

      {!error && !exhausted && (
        <CardSwipeFeed
          cards={cards}
          loading={loading}
          onGoDeeper={onGoDeeper}
          onIndexChange={onCardIndexChange}
          savedKeys={savedKeys}
          onToggleSave={onToggleSave}
          onCardViewed={onCardViewed}
        />
      )}
    </div>
  )
}

// ── Exhausted end-of-category view ─────────────────────────────────────────────

function ExhaustedView({ category, totalWorks, onRefresh, onBack }: {
  category: string
  totalWorks: number
  onRefresh: () => void
  onBack: () => void
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 32px 48px',
      textAlign: 'center',
    }}>
      {/* Rule */}
      <div style={{ width: 32, height: 1.5, background: '#D0CCC4', marginBottom: 24 }} />

      {/* Heading */}
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#111',
        lineHeight: 1.3,
        marginBottom: 10,
      }}>
        You've seen everything<br />in {category}.
      </div>

      {/* Body */}
      <div style={{
        fontSize: 13,
        color: '#888',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.65,
        marginBottom: 36,
      }}>
        {totalWorks === 1
          ? 'That was the only work in this category.'
          : `You went through all ${totalWorks} works. Start over to see them again.`}
      </div>

      {/* Start Over */}
      <button
        onClick={onRefresh}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          width: '100%',
          padding: '14px 0',
          background: '#111',
          color: '#fff',
          border: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <IconRefresh size={13} stroke={2} />
        Start Over
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          width: '100%',
          padding: '13px 0',
          background: 'none',
          color: '#111',
          border: '1.5px solid #D0CCC4',
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Back to Explore
      </button>
    </div>
  )
}
