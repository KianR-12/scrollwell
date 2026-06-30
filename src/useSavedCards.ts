import { useState, useEffect, useCallback, useRef } from 'react'
import type { CardData } from './useCards'
import { getSavedKeys, saveToLibrary, unsaveFromLibrary } from './supabase'

export function useSavedCards(userId: string | undefined) {
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const pendingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) { setSavedKeys(new Set()); return }
    getSavedKeys(userId).then(setSavedKeys).catch(() => {})
  }, [userId])

  const toggleSave = useCallback(async (card: CardData, type = 'regular') => {
    if (!userId) return
    const key = `${card.book.title}::${card.book.author}`
    if (pendingRef.current.has(key)) return
    pendingRef.current.add(key)

    const saving = !savedKeys.has(key)
    setSavedKeys(prev => {
      const next = new Set(prev)
      saving ? next.add(key) : next.delete(key)
      return next
    })

    try {
      if (saving) await saveToLibrary(card, type, userId)
      else await unsaveFromLibrary(card, userId)
    } catch {
      setSavedKeys(prev => {
        const next = new Set(prev)
        saving ? next.delete(key) : next.add(key)
        return next
      })
    } finally {
      pendingRef.current.delete(key)
    }
  }, [savedKeys, userId])

  return { savedKeys, toggleSave }
}
