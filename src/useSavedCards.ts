import { useState, useEffect, useCallback, useRef } from 'react'
import type { CardData } from './useCards'
import { getSavedKeys, saveToLibrary, unsaveFromLibrary } from './supabase'

export function useSavedCards() {
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const pendingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    getSavedKeys().then(setSavedKeys).catch(() => {})
  }, [])

  const toggleSave = useCallback(async (card: CardData, type = 'regular') => {
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
      if (saving) await saveToLibrary(card, type)
      else await unsaveFromLibrary(card)
    } catch {
      setSavedKeys(prev => {
        const next = new Set(prev)
        saving ? next.delete(key) : next.add(key)
        return next
      })
    } finally {
      pendingRef.current.delete(key)
    }
  }, [savedKeys])

  return { savedKeys, toggleSave }
}
