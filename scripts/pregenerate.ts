#!/usr/bin/env tsx
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { CONTENT_LIBRARY, type Work } from '../src/contentLibrary'

const anthropic = new Anthropic({ apiKey: process.env.VITE_ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// ── Prompts ────────────────────────────────────────────────────────────────────

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

const DEEP_DIVE_PROMPT = `You break books, articles, and talks into their most important parts for a mobile reading app called scrollwell.

Read the work and decide how many cards it actually needs to cover it properly. Cover everything that matters, skip nothing important, and don't pad with filler cards just to hit a number. The count should come from the content, not a rule.

Each card must fully explain its point. Never tease or say "the author explores" or "you'll discover" or "this section reveals". Just explain it directly and completely. The reader should finish each card actually understanding the idea, not feeling like they need to read the original to get the answer. Write like a brilliant friend who read the book and is explaining it to you over dinner — specific, honest, complete.

Return a JSON object — no markdown, no explanation:
{
  "description": "One sentence. What this work is fundamentally about and why it matters.",
  "sections": [
    {
      "title": "2–4 word label for this chapter or idea, in title case",
      "hook": "A punchy, counterintuitive statement in double quotes — the core insight of this part.",
      "gist": "3–4 sentences explaining this idea directly and completely. Concrete, no fluff. Write for someone who hasn't read the work.",
      "howToTalk": "1–2 sentences that start exactly with 'Bring this up when' — a natural way to use this insight in conversation."
    }
  ]
}

Rules:
- title is 2–4 words in title case, naming this idea or chapter
- hook is always wrapped in double-quote characters as part of the string value
- howToTalk must start with the exact words 'Bring this up when'
- gist has no bullet points, no em-dashes, no headers
- No emojis anywhere
- Return only valid JSON`

// ── Helpers ────────────────────────────────────────────────────────────────────

const BATCH = 5

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateCardBatch(works: Work[], category: string) {
  const workList = works
    .map((w, i) => `${i + 1}. "${w.title}" by ${w.author} (${w.type}, ${w.year})`)
    .join('\n')

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: WORKS_PROMPT,
    messages: [{ role: 'user', content: `Category: "${category}"\nGenerate cards for these works:\n${workList}` }],
  })

  const text = (msg.content[0].type === 'text' ? msg.content[0].text : '')
    .replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(text) as Array<{
    hook: string; hookSub: string; gist: string; socialCount: number
    book: { title: string; author: string; year: number; pages: number; isbn: string; category: string }
  }>
}

async function generateDeepDive(work: Work, category: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: DEEP_DIVE_PROMPT,
    messages: [{
      role: 'user',
      content: `Title: "${work.title}"\nCreator: ${work.author}\nType: ${work.type}\nYear: ${work.year}\nCategory: ${category}\n\nBreak this work into the right number of cards based on its length and complexity.`,
    }],
  })

  const text = (msg.content[0].type === 'text' ? msg.content[0].text : '')
    .replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(text) as {
    description: string
    sections: Array<{ title: string; hook: string; gist: string; howToTalk: string }>
  }
}

// ── Pass 1: card summaries ─────────────────────────────────────────────────────

async function runPass1() {
  const categories = Object.entries(CONTENT_LIBRARY)
  let generated = 0, skipped = 0, errors = 0

  console.log('━━━ Pass 1: card summaries ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  for (const [category, works] of categories) {
    console.log(`▸ ${category}`)

    for (let i = 0; i < works.length; i += BATCH) {
      const batch = works.slice(i, i + BATCH)
      const label = `  [${i + 1}–${i + batch.length}]`

      const { data: existing } = await supabase
        .from('cards')
        .select('title, creator')
        .in('title', batch.map(w => w.title))

      const existingSet = new Set((existing ?? []).map((r: any) => `${r.title}::${r.creator}`))
      const toGenerate = batch.filter(w => !existingSet.has(`${w.title}::${w.author}`))
      const skippedCount = batch.length - toGenerate.length
      skipped += skippedCount

      if (toGenerate.length === 0) {
        console.log(`${label} all cached`)
        continue
      }

      console.log(`${label} generating ${toGenerate.length}${skippedCount ? ` (${skippedCount} cached)` : ''}…`)

      try {
        const cards = await generateCardBatch(toGenerate, category)
        const rows = cards.map((c, idx) => ({
          title: c.book.title,
          creator: c.book.author,
          type: toGenerate[idx]?.type ?? 'book',
          category: c.book.category,
          hook: c.hook,
          hook_sub: c.hookSub,
          gist: c.gist,
          conversation_tip: null,
          cover_url: `https://covers.openlibrary.org/b/isbn/${c.book.isbn}-M.jpg`,
          isbn: c.book.isbn,
          year: c.book.year,
          pages: c.book.pages,
          social_count: c.socialCount,
        }))

        const { error } = await supabase.from('cards').upsert(rows, { onConflict: 'title,creator' })
        if (error) { console.error(`${label} DB error: ${error.message}`); errors += toGenerate.length }
        else { console.log(`${label} ✓ saved ${toGenerate.length}`); generated += toGenerate.length }
      } catch (err) {
        console.error(`${label} error:`, err instanceof Error ? err.message : err)
        errors += toGenerate.length
      }

      if (i + BATCH < works.length) await sleep(600)
    }
    console.log()
  }

  console.log(`Pass 1 done — generated=${generated} skipped=${skipped} errors=${errors}\n`)
}

// ── Pass 2: deep dive chapters ─────────────────────────────────────────────────

async function runPass2() {
  const categories = Object.entries(CONTENT_LIBRARY)
  const allWorks: Array<{ work: Work; category: string }> = []
  for (const [category, works] of categories) {
    for (const work of works) allWorks.push({ work, category })
  }

  let generated = 0, skipped = 0, errors = 0
  console.log(`━━━ Pass 2: deep dive chapters (${allWorks.length} works) ━━━━━━━━━━━━━━━\n`)

  for (let i = 0; i < allWorks.length; i++) {
    const { work, category } = allWorks[i]
    const label = `  [${i + 1}/${allWorks.length}] ${work.title}`

    // Check if deep dive already exists for this work
    const { count } = await supabase
      .from('deep_dive_cards')
      .select('id', { count: 'exact', head: true })
      .eq('parent_title', work.title)
      .eq('parent_creator', work.author)

    if (count && count > 0) {
      console.log(`${label} — skipped`)
      skipped++
      continue
    }

    console.log(`${label} — generating…`)

    try {
      const data = await generateDeepDive(work, category)

      const rows = data.sections.map((s, idx) => ({
        parent_title: work.title,
        parent_creator: work.author,
        chapter_number: idx + 1,
        chapter_title: s.title,
        hook: s.hook,
        gist: s.gist,
        conversation_tip: s.howToTalk,
        parent_description: data.description,
      }))

      const { error } = await supabase
        .from('deep_dive_cards')
        .upsert(rows, { onConflict: 'parent_title,parent_creator,chapter_number' })

      if (error) {
        console.error(`${label} — DB error: ${error.message}`)
        errors++
      } else {
        console.log(`${label} — ✓ ${data.sections.length} chapters`)
        generated++
      }
    } catch (err) {
      console.error(`${label} — error: ${err instanceof Error ? err.message : err}`)
      errors++
    }

    await sleep(800)
  }

  console.log(`\nPass 2 done — generated=${generated} skipped=${skipped} errors=${errors}\n`)
}

// ── Run ────────────────────────────────────────────────────────────────────────

async function run() {
  const totalWorks = Object.values(CONTENT_LIBRARY).reduce((n, w) => n + w.length, 0)
  console.log(`\nScrollwell pregenerate — 12 categories, ${totalWorks} works\n`)

  await runPass1()
  await runPass2()

  console.log('✅ All done.\n')
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
