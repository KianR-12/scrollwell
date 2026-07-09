import { useState, useCallback, Component, type ReactNode } from 'react'
import { IconHome, IconCompass, IconBookmark, /* IconTrendingUp, */ IconUser } from '@tabler/icons-react'
import { HomeTab } from './components/HomeTab'
import { ExploreTab } from './components/ExploreTab'
import { DeepDiveTab } from './components/DeepDiveTab'
import { LibraryTab } from './components/LibraryTab'
// import { TrendingTab } from './components/TrendingTab'
import { ProfileTab } from './components/ProfileTab'
import { AuthScreen, GUEST_USER_ID } from './components/AuthScreen'
import { useCards } from './useCards'
import { useSavedCards } from './useSavedCards'
import { useAuth } from './useAuth'
import type { CardData } from './useCards'

type Tab = 'home' | 'explore' | 'library' | 'profile' // | 'trending'

const TABS: { id: Tab; label: string; Icon: typeof IconHome }[] = [
  { id: 'home',    label: 'Home',    Icon: IconHome     },
  { id: 'explore', label: 'Explore', Icon: IconCompass  },
  { id: 'library', label: 'Library', Icon: IconBookmark },
  // { id: 'trending', label: 'Trending', Icon: IconTrendingUp },
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
  const { user, loading, signOut } = useAuth()
  const [guest, setGuest] = useState(false)

  if (loading) return <Splash />
  if (guest) return <AppShell userId={GUEST_USER_ID} isGuest onSignOut={() => setGuest(false)} />
  if (!user) return <AuthScreen onSkip={() => setGuest(true)} />
  return <AppShell userId={user.id} email={user.email} onSignOut={signOut} />
}

function AppShell({ userId, email, isGuest = false, onSignOut }: { userId: string; email?: string; isGuest?: boolean; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('home')
  const [deepDiveCard, setDeepDiveCard] = useState<CardData | null>(null)
  const [history, setHistory] = useState<CardData[]>([])
  const [showGuestGate, setShowGuestGate] = useState(false)

  const { cards, loading } = useCards()
  const { savedKeys, toggleSave: _toggleSave } = useSavedCards(userId)
  const activeIndex = TABS.findIndex(t => t.id === tab)

  // For guests: block save and show the gate instead of actually saving
  const toggleSave = useCallback((card: CardData, type?: string) => {
    if (isGuest) { setShowGuestGate(true); return }
    _toggleSave(card, type)
  }, [isGuest, _toggleSave])

  // For guests: block Library tab
  function handleTabPress(id: Tab) {
    if (isGuest && id === 'library') { setShowGuestGate(true); return }
    setTab(id)
  }

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
          <LibraryTab userId={userId} onToggleSave={toggleSave} />
        )}
        {/* {tab === 'trending' && (
          <TrendingTab
            onGoDeeper={setDeepDiveCard}
            savedKeys={savedKeys}
            onToggleSave={toggleSave}
            onCardViewed={recordViewed}
          />
        )} */}
        {tab === 'profile' && (
          <ProfileTab
            savedCount={savedKeys.size}
            history={history}
            email={email}
            onSignOut={onSignOut}
          />
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
              onClick={() => handleTabPress(id)}
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

      {showGuestGate && (
        <GuestGateModal
          onDismiss={() => setShowGuestGate(false)}
          onSignUp={() => { setShowGuestGate(false); onSignOut() }}
        />
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

// ── Guest gate modal ───────────────────────────────────────────────────────────

function GuestGateModal({ onDismiss, onSignUp }: { onDismiss: () => void; onSignUp: () => void }) {
  return (
    <>
      {/* Scrim */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.32)',
          zIndex: 100,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 101,
        background: '#fff',
        padding: '32px 28px calc(32px + env(safe-area-inset-bottom, 0px))',
        borderTop: '2px solid #111',
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1.5, background: '#111' }} />
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 18,
            fontWeight: 700,
            color: '#111',
            whiteSpace: 'nowrap',
          }}>
            scrollwell
          </div>
          <div style={{ flex: 1, height: 1.5, background: '#111' }} />
        </div>

        {/* Heading */}
        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 20,
          fontWeight: 700,
          color: '#111',
          marginBottom: 8,
          lineHeight: 1.25,
        }}>
          Create an account to save this.
        </div>

        {/* Body */}
        <div style={{
          fontSize: 13,
          color: '#888',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Your library, reading history, and saved cards are all free — just takes a moment to set up.
        </div>

        {/* Sign up CTA */}
        <button
          onClick={onSignUp}
          style={{
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
            marginBottom: 14,
          }}
        >
          Create Free Account
        </button>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
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
          Keep Browsing
        </button>
      </div>
    </>
  )
}
