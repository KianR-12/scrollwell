import { useState, Component, type ReactNode } from 'react'
import { IconHome, IconCompass, IconBookmark, IconUsers, IconUser } from '@tabler/icons-react'
import { HomeTab } from './components/HomeTab'
import { ExploreTab } from './components/ExploreTab'
import { DeepDiveTab } from './components/DeepDiveTab'
import { LibraryTab } from './components/LibraryTab'
import { useCards } from './useCards'
import { useSavedCards } from './useSavedCards'
import type { CardData } from './useCards'

type Tab = 'home' | 'explore' | 'library' | 'friends' | 'profile'

const TABS: { id: Tab; label: string; Icon: typeof IconHome }[] = [
  { id: 'home',    label: 'Home',    Icon: IconHome     },
  { id: 'explore', label: 'Explore', Icon: IconCompass  },
  { id: 'library', label: 'Library', Icon: IconBookmark },
  { id: 'friends', label: 'Friends', Icon: IconUsers    },
  { id: 'profile', label: 'Profile', Icon: IconUser     },
]

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Something went wrong</div>
        <div style={{ fontSize: 11, color: '#888' }}>{this.state.error}</div>
      </div>
    )
    return this.props.children
  }
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('home')
  const [deepDiveCard, setDeepDiveCard] = useState<CardData | null>(null)
  const { cards, loading } = useCards()
  const { savedKeys, toggleSave } = useSavedCards()
  const activeIndex = TABS.findIndex(t => t.id === tab)

  return (
    <>
      {/* Active screen */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {tab === 'home' && (
          <HomeTab
            cards={cards}
            loading={loading}
            onGoDeeper={setDeepDiveCard}
            savedKeys={savedKeys}
            onToggleSave={toggleSave}
          />
        )}
        {tab === 'explore' && (
          <ExploreTab
            onGoDeeper={setDeepDiveCard}
            savedKeys={savedKeys}
            onToggleSave={toggleSave}
          />
        )}
        {tab === 'library' && (
          <LibraryTab
            onToggleSave={toggleSave}
          />
        )}
        {tab !== 'home' && tab !== 'explore' && tab !== 'library' && (
          <ComingSoon label={TABS.find(t => t.id === tab)!.label} />
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        height: 66,
        background: '#fff',
        borderTop: '2px solid #111',
        display: 'flex',
        flexShrink: 0,
        position: 'relative',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}>
        {/* Sliding indicator */}
        <div style={{
          position: 'absolute',
          top: -2,
          width: '20%',
          height: 2,
          background: '#111',
          left: `${activeIndex * 20}%`,
          transition: 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }} />

        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingTop: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? '#111' : '#D0CCC4',
                transition: 'color 0.15s',
              }}
            >
              <Icon size={18} stroke={active ? 2 : 1.5} />
              <span style={{
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Deep Dive overlay */}
      {deepDiveCard && (
        <DeepDiveTab card={deepDiveCard} onBack={() => setDeepDiveCard(null)} />
      )}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '52px 20px 11px', borderBottom: '2px solid #111', flexShrink: 0 }}>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          {label}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
          Coming soon
        </span>
      </div>
    </div>
  )
}
