import { createClient } from '@supabase/supabase-js'
import { getEmbedding } from '../utils/embeddings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userConcern = body.concern

  if (!userConcern) {
    throw createError({ statusCode: 400, statusMessage: 'Please provide a concern' })
  }

  // 1. Setup Supabase Client (using environment variables)
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. Get real embedding for userConcern
  const queryEmbedding = await getEmbedding(userConcern)

  // 3. Search for the best Rumi quote
  const { data: quotes, error } = await supabase.rpc('match_rumi_quotes', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1, // Set lower for testing, adjust as needed
    match_count: 1
  })

  if (error) {
    console.error('Supabase error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve quote' })
  }

  const selectedQuote = quotes?.[0]
  if (!selectedQuote) {
    return {
      quote: { text: "The silence of the universe holds the answers.", audioUrl: null },
      text: "I could not find a specific quote for this, but know that love prevails."
    }
  }

  // 4. TBD: Generate the LLM Explanation
  // Take selectedQuote.quote_text and userConcern, pass them into an LLM context.
  // "Impersonate Rumi. Here is a quote I just gave: ... Explain how it relates to: [userConcern]"
  const llmExplanation = `Ah, my friend. You speak of your struggles. Remember: "${selectedQuote.quote_text}". This means that your current situation is exactly where the light enters...`

  // 5. TBD: Generate TTS Audio for the quote
  // Call ElevenLabs or OpenAI TTS here.
  const audioUrl = "https://example.com/audio/mock-quote.mp3"

  // 6. Return response to Frontend
  // The frontend dev will expect this format
  return {
    quote: {
      text: selectedQuote.quote_text,
      audioUrl: audioUrl
    },
    text: llmExplanation
  }
})
