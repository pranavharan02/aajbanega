// Run this script later to add Hindi/Marathi translations for new dishes
// Usage: ANTHROPIC_API_KEY=sk-xxx node translate-dishes.js
//
// This translates description_en → description_hi/mr and
// recipe step instruction_en → instruction_hi/mr for dishes missing translations.
// Ingredients are skipped (too many, and the cook view falls back to English).

const path = require('path')
const fs = require('fs')
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8')
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function translate(texts, targetLang) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const langName = targetLang === 'hi' ? 'Hindi' : 'Marathi'

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Translate each line to ${langName} (Devanagari script). Keep it natural and concise — these are cooking instructions for an Indian household cook. Return only the translations, one per line, in the same order.\n\n${texts.join('\n')}`
    }]
  })

  const result = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
  return result.split('\n').filter(l => l.trim())
}

async function run() {
  // Get dishes without Hindi descriptions
  const { data: dishes } = await supabase
    .from('dishes')
    .select('id, slug, description_en')
    .is('description_hi', null)
    .not('description_en', 'is', null)
    .limit(50)

  if (dishes?.length) {
    console.log(`Translating ${dishes.length} dish descriptions...`)
    const texts = dishes.map(d => d.description_en)

    const hiTranslations = await translate(texts, 'hi')
    const mrTranslations = await translate(texts, 'mr')

    for (let i = 0; i < dishes.length; i++) {
      await supabase.from('dishes').update({
        description_hi: hiTranslations[i] || null,
        description_mr: mrTranslations[i] || null,
      }).eq('id', dishes[i].id)
    }
    console.log(`✓ ${dishes.length} descriptions translated`)
  }

  // Get recipe steps without Hindi instructions
  const { data: steps } = await supabase
    .from('recipe_steps')
    .select('id, instruction_en')
    .is('instruction_hi', null)
    .not('instruction_en', 'is', null)
    .limit(100)

  if (steps?.length) {
    console.log(`Translating ${steps.length} recipe steps...`)
    const texts = steps.map(s => s.instruction_en)

    const hiTranslations = await translate(texts, 'hi')
    const mrTranslations = await translate(texts, 'mr')

    for (let i = 0; i < steps.length; i++) {
      await supabase.from('recipe_steps').update({
        instruction_hi: hiTranslations[i] || null,
        instruction_mr: mrTranslations[i] || null,
      }).eq('id', steps[i].id)
    }
    console.log(`✓ ${steps.length} steps translated`)
  }

  if (!dishes?.length && !steps?.length) {
    console.log('All translations complete!')
  } else {
    console.log('Run again — there may be more batches.')
  }
}

run().catch(console.error)
