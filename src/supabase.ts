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

// Returns a map keyed by "title::creator" for the given titles
export async function fetchCardsFromDb(titles: string[]): Promise<Map<string, CardData>> {
  if (titles.length === 0) return new Map()
  const { data } = await supabase.from('cards').select('*').in('title', titles)
  const map = new Map<string, CardData>()
  for (const row of (data ?? []) as DbRow[]) {
    map.set(`${row.title}::${row.creator}`, dbRowToCard(row))
  }
  return map
}

export async function saveCardToDb(card: CardData, type: string): Promise<void> {
  await supabase.from('cards').upsert(
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
  )
}
