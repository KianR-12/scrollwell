import { useState, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { BOOKS, type Book } from './books'
import { fetchCardsFromDb, saveCardToDb } from './supabase'

export interface CardData {
  book: Book
  hook: string
  hookSub: string
  gist: string
  socialCount: number
  howToTalk?: string
  relevance?: string
}

const SYSTEM_PROMPT = `You generate short cards for a mobile reading app. Each card surfaces one sharp, surprising insight from a book — written like something worth dropping at dinner.

For each book, draw on your knowledge of events, policies, research, and cultural trends in 2026 to find a specific connection for the relevance field. Then generate the card.

For each book return exactly this JSON shape (no markdown, no explanation, just the array):
[
  {
    "hook": "A single punchy, counterintuitive sentence in double quotes. It should feel like a provocation or a reveal — not a summary.",
    "hookSub": "A 6–10 word lowercase subtitle that names what the hook is really about.",
    "gist": "3–4 plain sentences that back the hook up. Concrete, no fluff. Write for someone smart who has never opened the book.",
    "howToTalk": "One sentence. Write it like you'd text a friend — 'next time [X] comes up just mention [Y]'. Casual, specific, never instructional.",
    "socialCount": 1234,
    "relevance": "One sentence naming the specific 2026 event, policy, study, or debate you found that makes this book timely right now. Never vague."
  }
]

Rules:
- hook is always in double-quotes as part of the string value
- hookSub is lowercase, no period
- gist has no bullet points, no headers, no em-dashes
- howToTalk is one casual sentence, reads like a text from a friend — specific, never instructional
- socialCount is a plausible integer between 900 and 4800
- relevance names a specific 2026 event or development — never vague
- No emojis anywhere
- Return only valid JSON — nothing before or after the array`

const FALLBACK: Array<Pick<CardData, 'hook' | 'hookSub' | 'gist' | 'socialCount'>> = [
  {
    hook: '"Stop setting goals. Build a system instead."',
    hookSub: 'the thing most people miss about Atomic Habits',
    gist: 'Clear studied why people fail to change for years. His answer: goals are almost useless. Winners and losers set identical goals — what separates them is the daily system underneath. You don\'t rise to your goals. You fall to your systems.',
    socialCount: 2847,
  },
  {
    hook: '"You have two brains, and the fast one is running your life."',
    hookSub: 'why Kahneman thinks you are less rational than you believe',
    gist: 'System 1 thinks fast, automatically, and confidently — and it is wrong far more often than it feels. System 2 is slow, effortful, and lazy. Kahneman spent a career mapping the shortcuts System 1 takes and the predictable errors they cause in judgment, money, and risk.',
    socialCount: 2103,
  },
  {
    hook: '"Civilization runs entirely on shared fictions."',
    hookSub: 'the uncomfortable truth at the centre of Sapiens',
    gist: 'Money, nations, corporations, and human rights have no physical existence. They persist only because millions of people agree to act as if they do. Harari argues this capacity for collective belief — not intelligence or tools — is what made Homo sapiens the dominant species on earth.',
    socialCount: 1924,
  },
  {
    hook: '"Build something, measure whether it works, then decide if it is worth building at all."',
    hookSub: 'why Ries thinks most startups waste their first year',
    gist: 'Most founders spend months building a product before asking if anyone wants it. Ries reframes the startup as a machine for learning, not a machine for building. The core loop: form the cheapest possible hypothesis, run an experiment, and treat the result as data rather than failure.',
    socialCount: 1455,
  },
  {
    hook: '"Everything can be taken from a person except the freedom to choose their response."',
    hookSub: 'Frankl\'s answer to the question of why some people survive',
    gist: 'Frankl developed logotherapy while imprisoned in Nazi concentration camps, including Auschwitz. He observed that survivors were not the physically strongest — they were the ones who found a reason to endure. Meaning, not happiness, is the primary human motivational force.',
    socialCount: 3201,
  },
  {
    hook: '"Getting wealthy and staying wealthy are two completely different skills."',
    hookSub: 'the distinction Housel says almost nobody talks about',
    gist: 'The strategies that build a fortune — concentrated bets, leverage, aggressive risk — are the exact opposite of the ones that preserve it. Housel argues that financial success is less about intelligence than about behaviour over time, and that the biggest risk in investing is forcing yourself out of the game.',
    socialCount: 2610,
  },
]

export function useCards() {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCards() {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
      if (!apiKey) {
        setCards(FALLBACK.map((c, i) => ({ book: BOOKS[i], ...c })))
        setError('No API key — showing static content. Set ANTHROPIC_API_KEY and restart.')
        setLoading(false)
        return
      }

      try {
        // ── Tier 1: Supabase ──────────────────────────────────────────────
        const dbMap = await fetchCardsFromDb(BOOKS.map(b => b.title))
        if (dbMap.size === BOOKS.length) {
          const fromDb = BOOKS.map(b => dbMap.get(`${b.title}::${b.author}`)).filter(Boolean) as CardData[]
          if (fromDb.length === BOOKS.length && fromDb.every(c => !!c.howToTalk)) {
            setCards(fromDb)
            setLoading(false)
            return
          }
        }

        // ── Tier 2: Anthropic API ─────────────────────────────────────────
        const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
        const bookList = BOOKS.map((b, i) => `${i + 1}. "${b.title}" by ${b.author} (${b.year}, ${b.pages} pages)`).join('\n')

        const resp = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Generate cards for these 6 books:\n${bookList}` }],
        })

        const text = (resp.content as any[])
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text as string)
          .join('')
          .replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(text) as Array<{
          hook: string; hookSub: string; gist: string
          howToTalk: string; socialCount: number; relevance: string
        }>
        const cards = parsed.map((c, i) => ({
          book: BOOKS[i],
          hook: c.hook, hookSub: c.hookSub, gist: c.gist,
          socialCount: c.socialCount, howToTalk: c.howToTalk, relevance: c.relevance,
        }))
        setCards(cards)
        cards.forEach(card => saveCardToDb(card, 'book').catch(() => {}))
      } catch (err) {
        console.error('Anthropic error:', err)
        setError('API error — showing static content.')
        setCards(FALLBACK.map((c, i) => ({ book: BOOKS[i], ...c })))
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [])

  return { cards, loading, error }
}
