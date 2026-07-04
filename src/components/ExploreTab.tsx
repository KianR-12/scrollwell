import { useState, useRef } from 'react'
import { IconArrowLeft, IconSearch, IconX } from '@tabler/icons-react'
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

  const worksRef = useRef<Work[]>([])
  const nextBatchRef = useRef(0)
  const isLoadingMore = useRef(false)

  async function openCategory(cat: Category) {
    setView({ kind: 'category', cat })
    setError(null)
    setCards([])
    setInitialLoading(true)

    const works = CONTENT_LIBRARY[cat.title] ?? []
    worksRef.current = works
    nextBatchRef.current = 0

    try {
      const batch = works.slice(0, BATCH)
      const result = await generateCardsForWorks(batch, cat.title)
      setCards(result)
      nextBatchRef.current = BATCH
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
      const batch = works.slice(start, start + BATCH)
      const newCards = await generateCardsForWorks(batch, view.kind === 'category' ? view.cat.title : '')
      setCards(prev => [...prev, ...newCards])
      nextBatchRef.current = start + batch.length
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
    if (i >= loaded - 2 && nextBatchRef.current < total) loadMore()
  }

  function goBack() {
    setView({ kind: 'grid' })
    setCards([])
    setError(null)
  }

  if (view.kind === 'search') {
    return (
      <SearchResultView
        query={view.query}
        card={view.card}
        loading={view.loading}
        error={view.error}
        onBack={goBack}
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
        onBack={goBack}
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
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function SearchResultView({ query, card, loading, error, onBack, onGoDeeper, savedKeys, onToggleSave, onCardViewed }: SearchResultProps) {
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
  onBack: () => void
  onGoDeeper?: (card: CardData) => void
  onCardIndexChange: (i: number) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function CategoryFeed({ category, cards, loading, loadingMore, totalWorks, error, onBack, onGoDeeper, onCardIndexChange, savedKeys, onToggleSave, onCardViewed }: FeedProps) {
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
            {loading ? '…' : cards.length < totalWorks ? `${cards.length} of ${totalWorks}` : `${cards.length} cards`}
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

      {!error && (
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
