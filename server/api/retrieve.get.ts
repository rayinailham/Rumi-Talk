import { createClient } from '@supabase/supabase-js'
import { getEmbedding } from '../utils/embeddings'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const text = query.text as string
  const limit = parseInt(query.limit as string || '3')
  const threshold = parseFloat(query.threshold as string || '0.5')

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Query text is required' })
  }

  // 1. Setup Supabase Client
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 2. Get embedding for the query
    const queryEmbedding = await getEmbedding(text)

    // 3. Search for matching Rumi quotes
    const { data: quotes, error } = await supabase.rpc('match_rumi_quotes', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) {
      console.error('Supabase error:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve quotes' })
    }

    return {
      query: text,
      results: quotes || []
    }
  } catch (err: any) {
    console.error('Retrieval error:', err)
    throw createError({ statusCode: 500, statusMessage: err.message || 'Internal Server Error' })
  }
})
