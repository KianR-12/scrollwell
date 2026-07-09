import { useState, useEffect, useRef } from 'react'
import { IconArrowLeft, IconSearch, IconX, IconRotate } from '@tabler/icons-react'
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

// ── View types ─────────────────────────────────────────────────────────────────

type ExploreView =
  | { kind: 'grid' }
  | { kind: 'category'; cat: Category }
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

  if (view.kind === 'search') {
    return (
      <SearchResultView
        query={view.query}
        card={view.card}
        loading={view.loading}
        error={view.error}
        onBack={() => setView({ kind: 'grid' })}
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
        onBack={() => setView({ kind: 'grid' })}
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
  onGoDeeper?: (card: CardData) => void
  savedKeys?: Set<string>
  onToggleSave?: (card: CardData) => void
  onCardViewed?: (card: CardData) => void
}

function CategoryDetail({ cat, onBack, onGoDeeper, savedKeys, onToggleSave, onCardViewed }: CategoryDetailProps) {
  const allWorks = CONTENT_LIBRARY[cat.title] ?? []
  const [activeTab, setActiveTab] = useState(0)

  const [sections, setSections] = useState<Record<SectionType, SectionState>>(() => {
    const init = {} as Record<SectionType, SectionState>
    for (const type of SECTION_ORDER) {
      const works = allWorks.filter(w => w.type === type)
      init[type] = { works, cards: [], loading: works.length > 0, error: null }
    }
    return init
  })

  // Load all types in parallel
  useEffect(() => {
    loadType('book')
    loadType('talk')
    loadType('podcast')
    loadType('article')
  }, [])

  function loadType(type: SectionType) {
    const works = allWorks.filter(w => w.type === type)
    if (works.length === 0) return
    setSections(prev => ({ ...prev, [type]: { ...prev[type], loading: true, error: null } }))
    generateCardsForWorks(works, cat.title)
      .then(cards => {
        if (cards.length === 0) {
          setSections(prev => ({ ...prev, [type]: { works, cards: [], loading: false, error: 'No cards returned — tap to retry.' } }))
        } else {
          setSections(prev => ({ ...prev, [type]: { works, cards, loading: false, error: null } }))
        }
      })
      .catch(err => {
        console.error(`[CategoryDetail] ${cat.title} / ${type} failed:`, err)
        setSections(prev => ({
          ...prev,
          [type]: { ...prev[type], loading: false, error: err instanceof Error ? err.message : 'Failed to load' },
        }))
      })
  }

  // Swipe left/right on the tab bar to switch tabs
  const tabBarTouchStartX = useRef(0)

  const onTabBarTouchStart = (e: React.TouchEvent) => {
    tabBarTouchStartX.current = e.touches[0].clientX
  }
  const onTabBarTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - tabBarTouchStartX.current
    if (dx < -40) setActiveTab(t => Math.min(t + 1, SECTION_ORDER.length - 1))
    else if (dx > 40) setActiveTab(t => Math.max(t - 1, 0))
  }

  const activeType = SECTION_ORDER[activeTab]
  const activeSection = sections[activeType]

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
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.3px', flex: 1, minWidth: 0 }}>
          {cat.title}
        </div>
      </div>

      {/* Tab bar — tap or swipe left/right to switch */}
      <div
        onTouchStart={onTabBarTouchStart}
        onTouchEnd={onTabBarTouchEnd}
        style={{ display: 'flex', borderBottom: '1px solid #E8E4DC', flexShrink: 0 }}
      >
        {SECTION_ORDER.map((type, i) => {
          const active = activeTab === i
          return (
            <button
              key={type}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #111' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: active ? '#111' : '#bbb',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.2px',
                transition: 'color 0.15s, border-color 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {SECTION_LABELS[type]}
            </button>
          )
        })}
      </div>

      {/* Feed area — full card swipe feed for the active tab */}
      {!activeSection.loading && activeSection.works.length === 0 ? (
        <EmptyTabView type={activeType} />
      ) : activeSection.error && !activeSection.loading ? (
        <ErrorTabView error={activeSection.error} onRetry={() => loadType(activeType)} />
      ) : (
        <CardSwipeFeed
          key={activeType}
          cards={activeSection.cards}
          loading={activeSection.loading}
          onGoDeeper={onGoDeeper}
          savedKeys={savedKeys}
          onToggleSave={onToggleSave}
          onCardViewed={onCardViewed}
        />
      )}
    </div>
  )
}

// ── EmptyTabView ───────────────────────────────────────────────────────────────

function EmptyTabView({ type }: { type: SectionType }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 36px',
      textAlign: 'center',
    }}>
      <div>
        <div style={{ width: 28, height: 1.5, background: '#E0DCD4', margin: '0 auto 20px' }} />
        <div style={{ fontSize: 14, color: '#bbb', fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }}>
          No {SECTION_LABELS[type].toLowerCase()} yet<br />in this category.
        </div>
      </div>
    </div>
  )
}

// ── ErrorTabView ───────────────────────────────────────────────────────────────

function ErrorTabView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 36px',
      textAlign: 'center',
    }}>
      <div>
        <div style={{ width: 28, height: 1.5, background: '#E0DCD4', margin: '0 auto 20px' }} />
        <div style={{ fontSize: 13, color: '#bbb', fontFamily: 'Inter, sans-serif', lineHeight: 1.7, marginBottom: 20 }}>
          {error}
        </div>
        <button
          onClick={onRetry}
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: '#111',
            background: 'none',
            border: '1px solid #111',
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            borderRadius: 3,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
