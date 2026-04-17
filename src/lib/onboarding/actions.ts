'use server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { ScreenerState } from './types'

export async function synthesiseInvestigation(state: ScreenerState): Promise<{ title: string }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')

  // 1. Generate investigation title via Claude
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: buildSynthesisPrompt(state),
    }],
  })
  const title = (message.content[0] as { type: 'text'; text: string }).text.trim()

  // 2. Upsert profile (idempotent — safe to retry)
  // Set onboarding_complete=true so the profile guard allows the user into the app after synthesis
  await supabase.from('profiles').upsert({
    id: user.id,
    name: state.name,
    age_range: state.ageRange,
    conditions: state.conditions ?? [],
    suspected_conditions: state.suspectedConditions ?? [],
    onboarding_selections: state.bringsYouHere ?? [],
    investigation_question: state.hypothesis ?? null,
    onboarding_complete: true,
  })

  // 3. Insert investigation
  const { data: inv, error: invError } = await supabase
    .from('investigations')
    .insert({
      user_id: user.id,
      title,
      conditions: state.conditions ?? [],
      status: 'active',
    })
    .select('id')
    .single()
  if (invError) throw new Error(`Investigation insert failed: ${invError.message}`)

  // 4. Insert first timeline entry (milestone)
  await supabase.from('journal_entries').insert({
    investigation_id: inv.id,
    user_id: user.id,
    entry_type: 'milestone',
    raw_text: 'Investigation started',
    day_number: 1,
  })

  return { title }
}

function buildSynthesisPrompt(state: ScreenerState): string {
  const conditions = (state.conditions ?? []).join(', ') || 'none diagnosed'
  const suspected = (state.suspectedConditions ?? []).join(', ') || 'none'
  const interests = (state.bringsYouHere ?? []).join(', ')
  const hypothesis = state.hypothesis ?? ''
  return `You are Agatha, a women's health investigation assistant. Based on this user's onboarding:
- Name: ${state.name}
- Conditions: ${conditions}
- Suspected: ${suspected}
- Areas of interest: ${interests}
- In their own words, what they want to investigate: "${hypothesis}"

The user's own words are the most important signal. Use them as the foundation.
Write a single investigation title (6–12 words, no punctuation) in first person that captures their investigation.
Example: "Understanding my endometriosis and how to reduce flares"
Respond with ONLY the title, nothing else.`
}
