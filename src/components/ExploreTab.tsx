import { useState, useRef } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { CardSwipeFeed } from './CardSwipeFeed'
import { generateCardsForWorks } from '../api'
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
}

export function ExploreTab({ onGoDeeper }: ExploreProps) {
  const [active, setActive] = useState<Category | null>(null)
  const [cards, setCards] = useState<CardData[]>([])
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const worksRef = useRef<Work[]>([])
  const nextBatchRef = useRef(0)
  const isLoadingMore = useRef(false)

  async function openCategory(cat: Category) {
    setActive(cat)
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

  async function loadMore() {
    if (isLoadingMore.current) return
    const works = worksRef.current
    const start = nextBatchRef.current
    if (start >= works.length || !active) return

    isLoadingMore.current = true
    setLoadingMore(true)
    try {
      const batch = works.slice(start, start + BATCH)
      const newCards = await generateCardsForWorks(batch, active.title)
      setCards(prev => [...prev, ...newCards])
      nextBatchRef.current = start + batch.length
    } catch {
      // silent — user keeps the cards already loaded
    } finally {
      setLoadingMore(false)
      isLoadingMore.current = false
    }
  }

  function onCardIndexChange(i: number) {
    const loaded = cards.length
    const total = worksRef.current.length
    if (i >= loaded - 2 && nextBatchRef.current < total) {
      loadMore()
    }
  }

  function goBack() {
    setActive(null)
    setCards([])
    setError(null)
  }

  if (active) {
    return (
      <CategoryFeed
        category={active}
        cards={cards}
        loading={initialLoading}
        loadingMore={loadingMore}
        totalWorks={worksRef.current.length}
        error={error}
        onBack={goBack}
        onGoDeeper={onGoDeeper}
        onCardIndexChange={onCardIndexChange}
      />
    )
  }

  return <CategoryGrid onSelect={openCategory} />
}

// ── Grid view ──────────────────────────────────────────────────────────────────

function CategoryGrid({ onSelect }: { onSelect: (cat: Category) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          Explore
        </div>
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
}

function CategoryFeed({ category, cards, loading, loadingMore, totalWorks, error, onBack, onGoDeeper, onCardIndexChange }: FeedProps) {
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
        />
      )}
    </div>
  )
}
