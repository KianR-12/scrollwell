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
  type?: string | null
  url?: string | null
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
      type: row.type ?? 'book',
      url: row.url ?? undefined,
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
  const row: Record<string, unknown> = {
    title: card.book.title,
    creator: card.book.author,
    type,
    category: card.book.category,
    hook: card.hook,
    hook_sub: card.hookSub,
    gist: card.gist,
    conversation_tip: null,
    cover_url: card.book.url ?? `https://covers.openlibrary.org/b/isbn/${card.book.isbn}-M.jpg`,
    isbn: card.book.isbn,
    year: card.book.year,
    pages: card.book.pages,
    social_count: card.socialCount,
  }
  if (card.book.url !== undefined) row.url = card.book.url
  const { data } = await supabase.from('cards').upsert(row, { onConflict: 'title,creator' }).select('id').single()
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

export interface TrendingCard {
  card: CardData
  saveCount: number
}

// ── Moments ────────────────────────────────────────────────────────────────────
// Run this once in the Supabase SQL editor:
//
// create table moments (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid references auth.users not null,
//   card_id uuid references cards(id) not null,
//   dropped_at timestamptz not null default now(),
//   context text,
//   rating text check (rating in ('tanked','landed','killed_it')) not null,
//   note text,
//   created_at timestamptz not null default now()
// );
// alter table moments enable row level security;
// create policy "Users manage own moments" on moments
//   for all using (auth.uid() = user_id);

export type MomentRating = 'tanked' | 'landed' | 'killed_it'

export interface MomentWithCard {
  id: string
  card_id: string
  card: CardData
  dropped_at: string
  context: string | null
  rating: MomentRating
  note: string | null
  created_at: string
}

export async function logMoment(
  userId: string,
  card: CardData,
  rating: MomentRating,
  opts?: { context?: string; note?: string; droppedAt?: Date },
): Promise<void> {
  const cardId = await saveCardToDb(card, card.book.type ?? 'book')
  if (!cardId) return
  await supabase.from('moments').insert({
    user_id: userId,
    card_id: cardId,
    dropped_at: (opts?.droppedAt ?? new Date()).toISOString(),
    context: opts?.context?.trim() || null,
    rating,
    note: opts?.note?.trim() || null,
  })
}

export async function fetchMoments(userId: string): Promise<MomentWithCard[]> {
  const { data } = await supabase
    .from('moments')
    .select(`id, card_id, dropped_at, context, rating, note, created_at,
      cards!moments_card_id_fkey(title,creator,category,hook,hook_sub,gist,isbn,year,pages,social_count,type,url)`)
    .eq('user_id', userId)
    .order('dropped_at', { ascending: false })
  return (data ?? []).flatMap((row: any) => {
    const c = row.cards
    if (!c) return []
    return [{ id: row.id, card_id: row.card_id, card: dbRowToCard(c as DbRow), dropped_at: row.dropped_at, context: row.context, rating: row.rating as MomentRating, note: row.note, created_at: row.created_at }]
  })
}

export async function fetchBestDrops(userId: string): Promise<MomentWithCard[]> {
  const { data } = await supabase
    .from('moments')
    .select(`id, card_id, dropped_at, context, rating, note, created_at,
      cards!moments_card_id_fkey(title,creator,category,hook,hook_sub,gist,isbn,year,pages,social_count,type,url)`)
    .eq('user_id', userId)
    .eq('rating', 'killed_it')
    .order('dropped_at', { ascending: false })
    .limit(5)
  return (data ?? []).flatMap((row: any) => {
    const c = row.cards
    if (!c) return []
    return [{ id: row.id, card_id: row.card_id, card: dbRowToCard(c as DbRow), dropped_at: row.dropped_at, context: row.context, rating: row.rating as MomentRating, note: row.note, created_at: row.created_at }]
  })
}

export async function fetchDroppedCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('moments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function fetchTrending(): Promise<TrendingCard[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: saves } = await supabase
    .from('saved_cards')
    .select('card_id')
    .gte('saved_at', since)

  if (!saves || saves.length === 0) return []

  // Count saves per card in JS
  const counts = new Map<string, number>()
  for (const row of saves as { card_id: string }[]) {
    counts.set(row.card_id, (counts.get(row.card_id) ?? 0) + 1)
  }

  // Top 20 by count
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  if (top.length === 0) return []

  const { data: cardRows } = await supabase
    .from('cards')
    .select('*')
    .in('id', top.map(([id]) => id))

  if (!cardRows) return []

  const cardMap = new Map<string, CardData>()
  for (const row of cardRows as (DbRow & { id: string })[]) {
    cardMap.set(row.id, dbRowToCard(row))
  }

  return top
    .map(([id, saveCount]) => {
      const card = cardMap.get(id)
      if (!card) return null
      return { card, saveCount }
    })
    .filter((t): t is TrendingCard => t !== null)
}
