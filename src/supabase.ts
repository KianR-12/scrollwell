import { createClient } from '@supabase/supabase-js'
import type { CardData } from './useCards'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

interface DbRow {
  title: string
  creator: string
  category: string
  hook: string
  hook_sub: string
  gist: string
  isbn: string | null
  year: number | null
  pages: number | null
  social_count: number
  conversation_tip?: string | null
}

export interface SavedCard {
  savedId: string
  card_type: string
  saved_at: string
  card: CardData
}

export function dbRowToCard(row: DbRow): CardData {
  return {
    hook: row.hook,
    hookSub: row.hook_sub,
    gist: row.gist,
    socialCount: row.social_count,
    book: {
      title: row.title,
      author: row.creator,
      year: row.year ?? 0,
      pages: row.pages ?? 0,
      isbn: row.isbn ?? '0000000000000',
      category: row.category,
    },
  }
}

export async function fetchCardsFromDb(titles: string[]): Promise<Map<string, CardData>> {
  if (titles.length === 0) return new Map()
  const { data } = await supabase.from('cards').select('*').in('title', titles)
  const map = new Map<string, CardData>()
  for (const row of (data ?? []) as DbRow[]) {
    map.set(`${row.title}::${row.creator}`, dbRowToCard(row))
  }
  return map
}

export async function saveCardToDb(card: CardData, type: string): Promise<string | null> {
  const { data } = await supabase.from('cards').upsert(
    {
      title: card.book.title,
      creator: card.book.author,
      type,
      category: card.book.category,
      hook: card.hook,
      hook_sub: card.hookSub,
      gist: card.gist,
      conversation_tip: null,
      cover_url: `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`,
      isbn: card.book.isbn,
      year: card.book.year,
      pages: card.book.pages,
      social_count: card.socialCount,
    },
    { onConflict: 'title,creator' }
  ).select('id').single()
  return (data as { id: string } | null)?.id ?? null
}

export async function saveToLibrary(card: CardData, type: string, userId: string): Promise<void> {
  const cardId = await saveCardToDb(card, type)
  if (!cardId) return
  await supabase.from('saved_cards').upsert(
    { user_id: userId, card_id: cardId, card_type: type },
    { onConflict: 'user_id,card_id' }
  )
}

export async function unsaveFromLibrary(card: CardData, userId: string): Promise<void> {
  const { data } = await supabase
    .from('cards')
    .select('id')
    .eq('title', card.book.title)
    .eq('creator', card.book.author)
    .single()
  if (!data) return
  await supabase
    .from('saved_cards')
    .delete()
    .eq('user_id', userId)
    .eq('card_id', (data as { id: string }).id)
}

export async function getSavedKeys(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('saved_cards')
    .select('cards!saved_cards_card_id_fkey(title, creator)')
    .eq('user_id', userId)
  const keys = new Set<string>()
  for (const row of (data ?? []) as any[]) {
    const c = row.cards
    if (c) keys.add(`${c.title}::${c.creator}`)
  }
  return keys
}

export async function fetchLibrary(userId: string): Promise<SavedCard[]> {
  const { data } = await supabase
    .from('saved_cards')
    .select(`
      id, card_type, saved_at,
      cards!saved_cards_card_id_fkey(title, creator, category, hook, hook_sub, gist, isbn, year, pages, social_count)
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })

  return (data ?? []).flatMap((row: any) => {
    const c = row.cards
    if (!c) return []
    return [{
      savedId: row.id,
      card_type: row.card_type,
      saved_at: row.saved_at,
      card: dbRowToCard(c as DbRow),
    }]
  })
}

export async function createProfile(userId: string, email: string, name: string): Promise<void> {
  await supabase.from('profiles').upsert(
    { id: userId, email, name: name || null },
    { onConflict: 'id' }
  )
}
