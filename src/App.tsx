import { useState, useCallback, Component, type ReactNode } from 'react'
import { IconHome, IconCompass, IconBookmark, IconUsers, IconUser } from '@tabler/icons-react'
import type { User } from '@supabase/supabase-js'
import { HomeTab } from './components/HomeTab'
import { ExploreTab } from './components/ExploreTab'
import { DeepDiveTab } from './components/DeepDiveTab'
import { LibraryTab } from './components/LibraryTab'
import { ProfileTab } from './components/ProfileTab'
import { AuthScreen } from './components/AuthScreen'
import { useCards } from './useCards'
import { useSavedCards } from './useSavedCards'
import { useAuth } from './useAuth'
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

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate />
    </ErrorBoundary>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <AuthScreen />
  return <AppShell user={user} />
}

function AppShell({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('home')
  const [deepDiveCard, setDeepDiveCard] = useState<CardData | null>(null)
  const [history, setHistory] = useState<CardData[]>([])

  const { cards, loading } = useCards()
  const { savedKeys, toggleSave } = useSavedCards(user.id)
  const { signOut } = useAuth()
  const activeIndex = TABS.findIndex(t => t.id === tab)

  const recordViewed = useCallback((card: CardData) => {
    setHistory(prev => {
      const key = `${card.book.title}::${card.book.author}`
      const filtered = prev.filter(c => `${c.book.title}::${c.book.author}` !== key)
      return [card, ...filtered].slice(0, 10)
    })
  }, [])

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
            onCardViewed={recordViewed}
          />
        )}
        {tab === 'explore' && (
          <ExploreTab
            onGoDeeper={setDeepDiveCard}
            savedKeys={savedKeys}
            onToggleSave={toggleSave}
            onCardViewed={recordViewed}
          />
        )}
        {tab === 'library' && (
          <LibraryTab userId={user.id} onToggleSave={toggleSave} />
        )}
        {tab === 'profile' && (
          <ProfileTab
            savedCount={savedKeys.size}
            history={history}
            email={user.email}
            onSignOut={signOut}
          />
        )}
        {tab !== 'home' && tab !== 'explore' && tab !== 'library' && tab !== 'profile' && (
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

      {deepDiveCard && (
        <DeepDiveTab card={deepDiveCard} onBack={() => setDeepDiveCard(null)} />
      )}
    </>
  )
}

function Splash() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 200 }}>
        <div style={{ flex: 1, height: 1.5, background: '#111' }} />
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
          scrollwell
        </div>
        <div style={{ flex: 1, height: 1.5, background: '#111' }} />
      </div>
    </div>
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
