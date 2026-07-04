import Anthropic from '@anthropic-ai/sdk'
import type { CardData } from './useCards'
import type { Work } from './contentLibrary'
import { supabase, fetchCardsFromDb, saveCardToDb } from './supabase'

export interface DeepDiveSection {
  title: string
  hook: string
  gist: string
  howToTalk: string
  relevance?: string
}

export interface DeepDiveData {
  description: string
  relevance?: string
  sections: DeepDiveSection[]
}

function getApiKey(): string {
  return import.meta.env.VITE_ANTHROPIC_API_KEY || ''
}

export function getClient(): Anthropic {
  const key = getApiKey()
  if (!key) throw new Error('No API key configured')
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

const CATEGORY_PROMPT = `You generate cards for a mobile reading app. Each card surfaces one sharp, surprising insight from a book — written like something worth dropping at dinner.

Return a JSON array with exactly the requested number of objects:
[
  {
    "hook": "A single punchy, counterintuitive sentence in double quotes. A provocation, not a summary.",
    "hookSub": "A 6–10 word lowercase subtitle naming what the hook is really about.",
    "gist": "3–4 plain sentences backing the hook up. Concrete, no fluff. Write for someone smart who hasn't read the book.",
    "socialCount": 1234,
    "book": {
      "title": "Exact Book Title",
      "author": "First Last",
      "year": 2020,
      "pages": 300,
      "isbn": "9781234567890",
      "category": "category name here"
    }
  }
]

Rules:
- hook is always wrapped in double-quote characters as part of the string value
- hookSub is lowercase, no period at the end
- gist has no bullet points, no headers, no em-dashes
- socialCount is a realistic integer between 900 and 4800
- isbn must be a real valid ISBN-13 for a real published book (it will be used to load a cover image)
- book.category must exactly match the requested category name
- No emojis anywhere
- Return only valid JSON — nothing before or after the array`

const DEEP_DIVE_PROMPT = `You break books, articles, and talks into their most important parts for a mobile reading app called scrollwell.

Read the work and decide how many cards it actually needs to cover it properly. Cover everything that matters, skip nothing important, and don't pad with filler cards just to hit a number. The count should come from the content, not a rule.

Each card must fully explain its point. Never tease or say "the author explores" or "you'll discover" or "this section reveals". Just explain it directly and completely. The reader should finish each card actually understanding the idea, not feeling like they need to read the original to get the answer. Write like a brilliant friend who read the book and is explaining it to you over dinner — specific, honest, complete.

For each section, think carefully about what that specific chapter concept is actually about — then ask whether something specific is happening in 2026 that directly connects to it. If a chapter is about environment design, find a real 2026 story about environment design. If it's about identity, find something about identity. The connection must be real, not forced. If no genuine current event connects to this specific chapter concept, use an empty string for relevance.

Return a JSON object — no markdown, no explanation:
{
  "description": "One sentence. What this work is fundamentally about and why it matters.",
  "sections": [
    {
      "title": "2–4 word label for this chapter or idea, in title case",
      "hook": "A punchy, counterintuitive statement in double quotes — the core insight of this part.",
      "gist": "3–4 sentences explaining this idea directly and completely. Concrete, no fluff. Write for someone who hasn't read the work.",
      "howToTalk": "One sentence written like you'd text a friend — 'next time [X] comes up just mention [Y]'. Casual, specific, never instructional. Reads like insider knowledge, not advice.",
      "relevance": "One sentence under 20 words connecting THIS chapter's specific concept to something real happening in 2026. Must be a genuine, direct connection — not a stretch. Empty string if no real connection exists."
    }
  ]
}

Rules:
- title is 2–4 words in title case, naming this idea or chapter
- hook is always wrapped in double-quote characters as part of the string value
- howToTalk is one casual sentence — reads like a friend texting you, never instructional, never starts with 'Bring this up'
- gist has no bullet points, no em-dashes, no headers
- relevance is per-section, specific to that chapter's concept, under 20 words — or empty string ""
- Never write a vague relevance like "this is more relevant than ever" — name the actual thing or leave it blank
- No emojis anywhere
- Return only valid JSON`

const WORKS_PROMPT = `You generate cards for a mobile reading app. For each specific work listed, write one card surfacing its single sharpest, most surprising insight — written like something worth dropping at dinner.

Return a JSON array with exactly one object per work, in the same order they were listed:
[
  {
    "hook": "A single punchy, counterintuitive sentence in double quotes. A provocation, not a summary.",
    "hookSub": "A 6–10 word lowercase subtitle naming what the hook is really about.",
    "gist": "3–4 plain sentences backing the hook up. Concrete, no fluff. Write for someone smart who hasn't read the work.",
    "socialCount": 1234,
    "book": {
      "title": "Exact title as provided",
      "author": "Exact author as provided",
      "year": 2020,
      "pages": 300,
      "isbn": "9781234567890",
      "category": "category name here"
    }
  }
]

Rules:
- Use the exact title and author from the provided list — do not alter them
- hook is always wrapped in double-quote characters as part of the string value
- hookSub is lowercase, no period at the end
- gist has no bullet points, no headers, no em-dashes
- socialCount is a realistic integer between 900 and 4800
- isbn must be a real valid ISBN-13 for this specific work (used to load a cover image); for talks or articles use "0000000000000"
- book.category must exactly match the provided category name
- No emojis anywhere
- Return only valid JSON — nothing before or after the array`

const SEARCH_CARD_PROMPT = `You generate a single card for a mobile reading app called scrollwell.

The user has searched for something — it might be a book title, an author, a TED talk, a podcast, an article, or a vague idea. Figure out the single best work to surface for their query and generate one card for it.

Return a single JSON object (not an array):
{
  "hook": "A single punchy, counterintuitive sentence in double quotes. A provocation, not a summary.",
  "hookSub": "A 6–10 word lowercase subtitle naming what the hook is really about.",
  "gist": "3–4 plain sentences backing the hook up. Concrete, no fluff. Write for someone smart who hasn't read the work.",
  "socialCount": 1234,
  "book": {
    "title": "Exact title of the work",
    "author": "First Last",
    "year": 2020,
    "pages": 300,
    "isbn": "9781234567890",
    "category": "the most fitting category"
  }
}

Rules:
- hook is always wrapped in double-quote characters as part of the string value
- hookSub is lowercase, no period at the end
- gist has no bullet points, no headers, no em-dashes
- socialCount is a realistic integer between 900 and 4800
- isbn must be a real valid ISBN-13 for this specific published work; for TED talks, podcasts, or articles use "0000000000000"
- No emojis anywhere
- Return only valid JSON — nothing before or after`

const deepDiveCache = new Map<string, DeepDiveData>()
const categoryCache = new Map<string, CardData[]>()
const workCardCache = new Map<string, CardData>()

let _bypassCache = false

export function setBypassCache(on: boolean) {
  _bypassCache = on
  if (on) {
    workCardCache.clear()
    categoryCache.clear()
    deepDiveCache.clear()
  }
}

export function clearCardCaches() {
  workCardCache.clear()
  categoryCache.clear()
  deepDiveCache.clear()
}

function extractText(content: any[]): string {
  return content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text as string)
    .join('')
    .replace(/```json/g, '').replace(/```/g, '').trim()
}

async function fetchDeepDiveFromDb(title: string, creator: string): Promise<DeepDiveData | null> {
  const { data } = await supabase
    .from('deep_dive_cards')
    .select('*')
    .eq('parent_title', title)
    .eq('parent_creator', creator)
    .order('chapter_number')
  if (!data || data.length === 0) return null
  return {
    description: (data[0] as any).parent_description ?? '',
    sections: (data as any[]).map(row => ({
      title: row.chapter_title,
      hook: row.hook,
      gist: row.gist,
      howToTalk: row.conversation_tip,
      relevance: row.chapter_relevance || undefined,
    })),
  }
}

async function saveDeepDiveToDb(title: string, creator: string, data: DeepDiveData): Promise<void> {
  const rows = data.sections.map((s, i) => ({
    parent_title: title,
    parent_creator: creator,
    chapter_number: i + 1,
    chapter_title: s.title,
    hook: s.hook,
    gist: s.gist,
    conversation_tip: s.howToTalk,
    parent_description: data.description,
  }))
  await supabase
    .from('deep_dive_cards')
    .upsert(rows, { onConflict: 'parent_title,parent_creator,chapter_number' })
}

export async function generateDeepDive(card: CardData): Promise<DeepDiveData> {
  const { title, author, year, category } = card.book
  const cacheKey = `${title}::${author}`

  // Tier 1: in-memory
  const cached = deepDiveCache.get(cacheKey)
  if (cached) return cached

  // Tier 2: Supabase — reject if any section uses the old "Bring this up when" format
  const fromDb = await fetchDeepDiveFromDb(title, author)
  const isFresh = fromDb &&
    fromDb.sections.every(s => !!s.howToTalk && !s.howToTalk.startsWith('Bring this up'))
  if (isFresh) {
    deepDiveCache.set(cacheKey, fromDb!)
    return fromDb!
  }

  // Tier 3: Anthropic API
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: DEEP_DIVE_PROMPT,
    messages: [{
      role: 'user',
      content: `Title: "${title}"\nCreator: ${author}\nType: Book\nYear: ${year}\nCategory: ${category}\n\nBreak this work into the right number of cards based on its length and complexity.`,
    }],
  })

  const result = JSON.parse(extractText(msg.content as any[])) as DeepDiveData
  deepDiveCache.set(cacheKey, result)
  saveDeepDiveToDb(title, author, result).catch(() => {})
  return result
}

export async function generateCards(categoryName: string, count = 3): Promise<CardData[]> {
  const cached = categoryCache.get(categoryName)
  if (cached) return cached

  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: CATEGORY_PROMPT,
    messages: [{
      role: 'user',
      content: `Category: "${categoryName}"\nGenerate ${count} cards, one per book.`,
    }],
  })

  const parsed = JSON.parse(extractText(msg.content as any[])) as Array<{
    hook: string; hookSub: string; gist: string; socialCount: number
    book: { title: string; author: string; year: number; pages: number; isbn: string; category: string }
  }>

  const result = parsed.map(c => ({
    hook: c.hook, hookSub: c.hookSub, gist: c.gist,
    socialCount: c.socialCount, book: c.book,
  }))
  categoryCache.set(categoryName, result)
  return result
}

export async function generateCardsForWorks(works: Work[], categoryName: string): Promise<CardData[]> {
  const result: (CardData | null)[] = new Array(works.length).fill(null)

  // ── Tier 1: in-memory cache ──────────────────────────────────────────────
  const afterMemory: Work[] = []
  const afterMemoryIdx: number[] = []
  if (!_bypassCache) {
    for (let i = 0; i < works.length; i++) {
      const hit = workCardCache.get(`${works[i].title}::${works[i].author}`)
      if (hit) result[i] = hit
      else { afterMemory.push(works[i]); afterMemoryIdx.push(i) }
    }
    if (afterMemory.length === 0) return result as CardData[]
  } else {
    works.forEach((w, i) => { afterMemory.push(w); afterMemoryIdx.push(i) })
  }

  // ── Tier 2: Supabase ─────────────────────────────────────────────────────
  const afterDb: Work[] = []
  const afterDbIdx: number[] = []
  if (!_bypassCache) {
    const dbMap = await fetchCardsFromDb(afterMemory.map(w => w.title))
    for (let i = 0; i < afterMemory.length; i++) {
      const work = afterMemory[i]
      const fromDb = dbMap.get(`${work.title}::${work.author}`)
      if (fromDb) {
        workCardCache.set(`${work.title}::${work.author}`, fromDb)
        result[afterMemoryIdx[i]] = fromDb
      } else {
        afterDb.push(work)
        afterDbIdx.push(afterMemoryIdx[i])
      }
    }
    if (afterDb.length === 0) return result as CardData[]
  } else {
    afterMemory.forEach((w, i) => { afterDb.push(w); afterDbIdx.push(afterMemoryIdx[i]) })
  }

  // ── Tier 3: Anthropic API ────────────────────────────────────────────────
  const client = getClient()
  const workList = afterDb
    .map((w, i) => `${i + 1}. "${w.title}" by ${w.author} (${w.type}, ${w.year})`)
    .join('\n')

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: WORKS_PROMPT,
    messages: [{
      role: 'user',
      content: `Category: "${categoryName}"\nGenerate cards for these works:\n${workList}`,
    }],
  })

  const parsed = JSON.parse(extractText(resp.content as any[])) as Array<{
    hook: string; hookSub: string; gist: string; socialCount: number
    book: { title: string; author: string; year: number; pages: number; isbn: string; category: string }
  }>

  parsed.forEach((c, i) => {
    const work = afterDb[i]
    if (!work) return
    const card: CardData = {
      hook: c.hook, hookSub: c.hookSub, gist: c.gist,
      socialCount: c.socialCount, book: c.book,
    }
    workCardCache.set(`${work.title}::${work.author}`, card)
    result[afterDbIdx[i]] = card
    saveCardToDb(card, work.type).catch(() => {})
  })

  return result.filter((c): c is CardData => !!c)
}

export async function generateCard(query: string): Promise<CardData> {
  const client = getClient()

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SEARCH_CARD_PROMPT,
    messages: [{ role: 'user', content: `Search query: "${query}"` }],
  })

  const text = extractText(resp.content as any[])

  const c = JSON.parse(text) as {
    hook: string; hookSub: string; gist: string; socialCount: number
    book: { title: string; author: string; year: number; pages: number; isbn: string; category: string }
  }
  return {
    hook: c.hook, hookSub: c.hookSub, gist: c.gist,
    socialCount: c.socialCount, book: c.book,
  }
}
