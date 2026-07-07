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

const DEEP_DIVE_PROMPT = `You break books, articles, talks, and podcasts into their most important parts for a mobile reading app called scrollwell.

Read the work and decide how many cards it actually needs to cover it properly. Cover everything that matters, skip nothing important, and don't pad with filler cards just to hit a number. The count should come from the content, not a rule.

For a book: sections are chapters or major ideas.
For a talk: sections are the key arguments or moments in the talk — typically 4–8. Think of it as the talk's architecture: opening claim, evidence, complication, resolution.
For a podcast show: sections are the show's central recurring themes or ideas — what it returns to across episodes.
For an article or essay: sections are the key claims or turns in the argument — follow the essay's own logic.

Each card must fully explain its point. Never tease or say "the author explores" or "you'll discover" or "this section reveals". Just explain it directly and completely. The reader should finish each card actually understanding the idea. Write like a brilliant friend who just watched the talk or read the essay explaining it to you over dinner — specific, honest, complete.

For each section, think carefully about what that specific concept is actually about — then ask whether something specific is happening in 2026 that directly connects to it. The connection must be real, not forced. If no genuine current event connects, use an empty string for relevance.

Return a JSON object — no markdown, no explanation:
{
  "description": "One sentence. What this work is fundamentally about and why it matters.",
  "sections": [
    {
      "title": "2–4 word label for this part, in title case",
      "hook": "A punchy, counterintuitive statement in double quotes — the core insight of this part.",
      "gist": "3–4 sentences explaining this idea directly and completely. Concrete, no fluff. Write for someone who hasn't seen or read the work.",
      "howToTalk": "One sentence written like you'd text a friend — 'next time [X] comes up just mention [Y]'. Casual, specific, never instructional. Reads like insider knowledge, not advice.",
      "relevance": "One sentence under 20 words connecting THIS section's specific concept to something real happening in 2026. Must be a genuine, direct connection — not a stretch. Empty string if no real connection exists."
    }
  ]
}

Rules:
- title is 2–4 words in title case, naming this idea or part
- hook is always wrapped in double-quote characters as part of the string value
- howToTalk is one casual sentence — reads like a friend texting you, never instructional, never starts with 'Bring this up'
- gist has no bullet points, no em-dashes, no headers
- relevance is per-section, under 20 words — or empty string ""
- Never write a vague relevance like "this is more relevant than ever" — name the actual thing or leave it blank
- No emojis anywhere
- Return only valid JSON`

const TYPE_FRAMING: Record<string, string> = {
  talk: 'TED talk',
  podcast: 'podcast show',
  article: 'essay or article',
  book: 'book',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractText(content: any[]): string {
  return content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text as string)
    .join('')
    .replace(/```json/g, '').replace(/```/g, '').trim()
}

async function generateDeepDive(work: Work, category: string) {
  const typeLabel = TYPE_FRAMING[work.type] ?? 'book'
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: DEEP_DIVE_PROMPT,
    messages: [{
      role: 'user',
      content: `Title: "${work.title}"\nCreator: ${work.author}\nType: ${typeLabel}\nYear: ${work.year}\nCategory: ${category}\n\nBreak this ${typeLabel} into the right number of sections based on its content.`,
    }],
  })

  const text = extractText(msg.content as any[])
  return JSON.parse(text) as {
    description: string
    sections: Array<{ title: string; hook: string; gist: string; howToTalk: string; relevance?: string }>
  }
}

// ── Deduplication ──────────────────────────────────────────────────────────────

function deduplicateWorks(): Array<{ work: Work; category: string }> {
  const seen = new Set<string>()
  const result: Array<{ work: Work; category: string }> = []
  for (const [category, works] of Object.entries(CONTENT_LIBRARY)) {
    for (const work of works) {
      const key = `${work.title}::${work.author}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ work, category })
      }
    }
  }
  return result
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  const allWorks = deduplicateWorks()
  const total = allWorks.length
  console.log(`\nScrollwell pregenerate — ${total} unique works across 12 categories\n`)

  let generated = 0, skipped = 0, errors = 0

  for (let i = 0; i < allWorks.length; i++) {
    const { work, category } = allWorks[i]
    const label = `[${i + 1}/${total}] ${work.title}`

    // Check existing entries and whether they're stale (old "Bring this up" format)
    const { data: existing } = await supabase
      .from('deep_dive_cards')
      .select('conversation_tip')
      .eq('parent_title', work.title)
      .eq('parent_creator', work.author)

    const hasRows = existing && existing.length > 0
    const isStale = hasRows && (existing as any[]).some(
      (r: any) => r.conversation_tip && (r.conversation_tip as string).startsWith('Bring this up')
    )

    if (hasRows && !isStale) {
      console.log(`${label} — ⏭ skip`)
      skipped++
      continue
    }

    if (isStale) {
      console.log(`${label} — stale format, regenerating…`)
    } else {
      console.log(`${label} — generating…`)
    }

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
        chapter_relevance: s.relevance ?? null,
        parent_description: data.description,
      }))

      const { error } = await supabase
        .from('deep_dive_cards')
        .upsert(rows, { onConflict: 'parent_title,parent_creator,chapter_number' })

      if (error) {
        console.error(`${label} — DB error: ${error.message}`)
        errors++
      } else {
        console.log(`${label} — ✓ ${data.sections.length} sections saved`)
        generated++
      }
    } catch (err) {
      console.error(`${label} — error: ${err instanceof Error ? err.message : err}`)
      errors++
    }

    await sleep(900)
  }

  console.log(`\n✅ Done — generated=${generated} skipped=${skipped} errors=${errors}\n`)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
