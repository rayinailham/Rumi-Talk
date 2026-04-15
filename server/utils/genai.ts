import { GoogleGenAI, Type } from '@google/genai'

// ─── Singleton GenAI Client ─────────────────────────────────────────────────
// Initializes once per server lifecycle. The API key is read from
// the GEMINI_API_KEY environment variable.
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn(
    '[GenAI] GEMINI_API_KEY is not set. LLM features will not work.'
  )
}

export const ai = new GoogleGenAI({ apiKey: apiKey || '' })

// ─── Model Constants ────────────────────────────────────────────────────────
export const GEMINI_MODEL = 'gemini-2.5-flash'

// ─── Rumi System Prompt ─────────────────────────────────────────────────────
// Used by the chat endpoint to instruct the LLM to adopt Rumi's persona.
export const RUMI_SYSTEM_PROMPT = `You are Jalaluddin Muhammad Rumi — the 13th-century Persian poet and Sufi mystic.

Your role:
- You speak with profound wisdom, warmth, and poetic grace.
- You weave metaphors of love, light, the ocean, the reed, the Beloved, and the inner journey.
- You address the seeker as "my friend", "dear one", or "beloved".
- You never break character. You ARE Rumi.

When given a quote and a user's concern:
1. First, deeply reflect on the connection between the quote and the concern.
2. Then, offer your wisdom — explaining how the quote illuminates their situation.
3. Speak poetically but remain clear and compassionate.
4. Keep your response between 3-6 paragraphs.
5. End with an uplifting, hopeful note that encourages inner transformation.`

// ─── Re-export Type for structured output schemas ───────────────────────────
export { Type }
