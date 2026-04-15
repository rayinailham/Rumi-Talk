import { createClient } from '@supabase/supabase-js'
import { getEmbedding } from '../utils/embeddings'
import { ai, GEMINI_MODEL, RUMI_SYSTEM_PROMPT, Type } from '../utils/genai'

// ─── Structured Output Schema ───────────────────────────────────────────────
// This schema enforces the LLM to return a structured JSON object
// containing the selected quote and its correlation to the user's concern.
// Uses the @google/genai Type enum for schema definition.
const quoteResponseSchema = {
  type: Type.OBJECT,
  description: 'A Rumi quote selected for the user along with metadata',
  properties: {
    selectedQuoteIndex: {
      type: Type.INTEGER,
      description: 'The 0-based index of the most relevant quote from the candidates list',
    },
    relevanceReason: {
      type: Type.STRING,
      description: 'A brief one-sentence explanation of why this quote was chosen for the user\'s concern (from Rumi\'s perspective)',
    },
  },
  propertyOrdering: ['selectedQuoteIndex', 'relevanceReason'],
  required: ['selectedQuoteIndex', 'relevanceReason'],
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userConcern = body.concern

  if (!userConcern || typeof userConcern !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please provide a "concern" field (string) in the request body',
    })
  }

  // ─── 1. Setup Supabase Client ───────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // ─── 2. Embed the user's concern ───────────────────────────────────────
  // Using the same model (all-mpnet-base-v2) as the stored quote embeddings
  // to ensure vector compatibility for cosine similarity search.
  let queryEmbedding: number[]
  try {
    queryEmbedding = await getEmbedding(userConcern)
  } catch (err: any) {
    console.error('[Chat] Embedding error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate embedding for your concern' })
  }

  // ─── 3. Retrieve top candidate quotes via vector similarity ─────────────
  const { data: candidateQuotes, error: dbError } = await supabase.rpc('match_rumi_quotes', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1,
    match_count: 5,  // Fetch top 5 candidates for the LLM to choose from
  })

  if (dbError) {
    console.error('[Chat] Supabase error:', dbError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve quotes from database' })
  }

  if (!candidateQuotes || candidateQuotes.length === 0) {
    // Fallback: no quotes found
    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Connection', 'keep-alive')

    const fallbackQuote = {
      text: 'The wound is the place where the Light enters you.',
      audioUrl: null,
      category: null,
      source: 'fallback',
    }

    const encoder = new TextEncoder()
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: quote\ndata: ${JSON.stringify(fallbackQuote)}\n\n`))
        controller.enqueue(encoder.encode(`event: stream\ndata: ${JSON.stringify({ text: 'Ah, dear one. Though my library of verses could not find the perfect match for your heart today, know this — ' })}\n\n`))
        controller.enqueue(encoder.encode(`event: stream\ndata: ${JSON.stringify({ text: 'every wound you carry is a doorway. The light is already seeking entry through your cracks.' })}\n\n`))
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`))
        controller.close()
      },
    })
  }

  // ─── 4. Use GenAI Structured Output to select the best quote ────────────
  // We pass all candidates to the LLM and let it intelligently pick
  // the most resonant quote for the user's specific concern.
  const candidateList = candidateQuotes.map((q: any, i: number) => ({
    index: i,
    text: q.quote_text,
    category: q.category,
  }))

  let selectedQuote: any
  let relevanceReason: string = ''

  try {
    const selectionResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `The user is struggling with the following concern:
"${userConcern}"

Here are candidate quotes from Rumi that may help. Choose the ONE quote that is most deeply and specifically relevant to their concern:

${candidateList.map((q: any) => `[${q.index}] "${q.text}" (Category: ${q.category || 'Unknown'})`).join('\n')}

Select the most appropriate quote index and explain briefly why.`,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: quoteResponseSchema,
        systemInstruction: 'You are a wise literary advisor who deeply understands Rumi\'s poetry. Select the single most relevant quote for the user\'s concern.',
      },
    })

    const selectionResult = JSON.parse(selectionResponse.text || '{}')
    const selectedIndex = selectionResult.selectedQuoteIndex ?? 0
    selectedQuote = candidateQuotes[selectedIndex] || candidateQuotes[0]
    relevanceReason = selectionResult.relevanceReason || ''
  } catch (err: any) {
    console.error('[Chat] Quote selection error:', err)
    // Fallback: use the top result from vector search
    selectedQuote = candidateQuotes[0]
    relevanceReason = 'Selected by semantic similarity.'
  }

  // ─── 5. Build the quote payload ─────────────────────────────────────────
  // Audio URL: In a full production app, you would call a TTS service
  // (ElevenLabs, Google Cloud TTS, OpenAI TTS) here to generate audio.
  // For now, we provide a placeholder URL pattern that the frontend
  // can use. When TTS is integrated, replace this with the real URL.
  const quotePayload = {
    text: selectedQuote.quote_text,
    audioUrl: null as string | null,  // TTS integration point
    category: selectedQuote.category || null,
    relevanceReason,
    quoteId: selectedQuote.id,
  }

  // ─── 6. Stream the response via Server-Sent Events ──────────────────────
  // The response is split into two phases:
  //   Phase 1: "quote" event — structured JSON with the selected quote
  //   Phase 2: "stream" events — word-by-word streaming of Rumi's explanation
  //   Final:   "done" event — signals the end of the stream
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no') // Disable nginx buffering

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        // ── Phase 1: Send the quote immediately ───────────────────────────
        controller.enqueue(
          encoder.encode(`event: quote\ndata: ${JSON.stringify(quotePayload)}\n\n`)
        )

        // ── Phase 2: Stream the explanation word by word ──────────────────
        const explanationStream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: `The user came to you with this concern:
"${userConcern}"

You have chosen this quote for them:
"${selectedQuote.quote_text}"

Reason this quote was chosen: ${relevanceReason}

Now, as Rumi himself, speak directly to this person. Explain how this quote illuminates their situation. Be poetic yet clear. Be warm yet profound.`,
          config: {
            systemInstruction: RUMI_SYSTEM_PROMPT,
            temperature: 0.85,
            topP: 0.92,
            maxOutputTokens: 1024,
          },
        })

        // Process each chunk from the stream
        for await (const chunk of explanationStream) {
          const text = chunk.text
          if (text) {
            controller.enqueue(
              encoder.encode(`event: stream\ndata: ${JSON.stringify({ text })}\n\n`)
            )
          }
        }

        // ── Final: Signal completion ──────────────────────────────────────
        controller.enqueue(
          encoder.encode(`event: done\ndata: {}\n\n`)
        )
      } catch (err: any) {
        console.error('[Chat] Streaming error:', err)
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: err.message || 'Streaming failed' })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })
})
