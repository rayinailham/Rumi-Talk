# 🛠️ Backend Developer Guide (Supabase & LLM)

Welcome to the Rumi-Talk backend! Since you are setting up the database and managing the server-side architecture, your role revolves around the logic, data retrieval, and AI integrations.

## 🎯 Architecture Overview

The backend uses a **RAG (Retrieval-Augmented Generation)** pipeline powered by:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Supabase + pgvector | Store Rumi quotes with 768-dim vector embeddings |
| **Embeddings** | `@xenova/transformers` (all-mpnet-base-v2) | Generate query embeddings for semantic search |
| **LLM** | `@google/genai` (Gemini 2.5 Flash) | Quote selection (structured output) + explanation (streaming) |
| **Server** | Nuxt Nitro | API routes with Server-Sent Events |

## 📂 File Structure

```
server/
├── api/
│   ├── chat.post.ts      ← Main chat endpoint (SSE + structured output + streaming)
│   └── retrieve.get.ts   ← Direct quote retrieval endpoint
└── utils/
    ├── embeddings.ts      ← Xenova/transformers embedding utility
    └── genai.ts           ← Google GenAI client, prompts, and Type exports
```

## 🔑 Environment Variables

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
GEMINI_API_KEY="your-gemini-api-key"
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

## 🚀 How the Chat API Works

### `POST /api/chat`

This is the main endpoint. It returns a **Server-Sent Events (SSE)** stream with three event types.

#### Request
```json
{
  "concern": "I feel lost and don't know my purpose in life"
}
```

#### Response (SSE Stream)

The response is delivered as an SSE stream with the following event types, in order:

**Event 1: `quote`** — Structured JSON with the selected quote
```
event: quote
data: {"text":"The wound is the place where the Light enters you.","audioUrl":null,"category":"Spirituality","relevanceReason":"This quote speaks directly to finding meaning through struggle.","quoteId":"abc-123"}
```

**Events 2-N: `stream`** — Word-by-word streaming of Rumi's explanation
```
event: stream
data: {"text":"Ah, dear one. "}

event: stream
data: {"text":"You speak of being lost, "}

event: stream
data: {"text":"but know that the one who seeks is already found..."}
```

**Final Event: `done`** — Signals end of stream
```
event: done
data: {}
```

**Error Event: `error`** — If something goes wrong during streaming
```
event: error
data: {"message":"Streaming failed"}
```

### Processing Pipeline (Step by Step)

```
User's Concern
      │
      ▼
┌─────────────────────────┐
│ 1. Embed the concern    │  ← @xenova/transformers (all-mpnet-base-v2, 768-dim)
│    via getEmbedding()   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Vector similarity    │  ← Supabase RPC: match_rumi_quotes()
│    search (top 5)       │     cosine similarity with pgvector
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. LLM selects best     │  ← @google/genai: generateContent()
│    quote (structured     │     with responseJsonSchema
│    output)               │     Returns: { selectedQuoteIndex, relevanceReason }
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 4. Send quote event      │  ← SSE event: "quote"
│    to client immediately │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 5. Stream explanation    │  ← @google/genai: generateContentStream()
│    word by word          │     Gemini impersonates Rumi
│    via SSE               │     SSE events: "stream" (multiple)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 6. Send done event       │  ← SSE event: "done"
└─────────────────────────┘
```

## 🔧 Key Implementation Details

### Structured Output (Quote Selection)

Uses `@google/genai`'s `responseJsonSchema` feature to guarantee the LLM returns valid JSON matching our schema:

```typescript
import { GoogleGenAI, Type } from '@google/genai'

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Select the best quote...',
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: {
      type: Type.OBJECT,
      properties: {
        selectedQuoteIndex: { type: Type.INTEGER },
        relevanceReason: { type: Type.STRING },
      },
      required: ['selectedQuoteIndex', 'relevanceReason'],
    },
  },
})

const result = JSON.parse(response.text)
// result is guaranteed to match the schema
```

### Streaming (Explanation)

Uses `generateContentStream` for real-time word-by-word delivery:

```typescript
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Explain this quote as Rumi...',
  config: {
    systemInstruction: RUMI_SYSTEM_PROMPT,
    temperature: 0.85,
  },
})

for await (const chunk of stream) {
  // Each chunk.text contains a small piece of text
  sendSSE('stream', { text: chunk.text })
}
```

## 🎤 TTS Integration (TODO)

The `audioUrl` field in the quote response is currently `null`. To integrate TTS:

1. **ElevenLabs** (recommended for poetic voice):
   ```typescript
   const audioResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', {
     method: 'POST',
     headers: { 'xi-api-key': process.env.ELEVENLABS_KEY },
     body: JSON.stringify({ text: selectedQuote.quote_text })
   })
   // Upload to Supabase Storage and return public URL
   ```

2. **Google Cloud TTS** or **OpenAI TTS** as alternatives.

The frontend is already designed to handle `audioUrl` — just fill in the real URL when TTS is integrated.

## 📊 Database Schema

### `public.rumi_quotes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` (PK) | Auto-generated unique ID |
| `quote_text` | `text` | The Rumi quote |
| `meaning` | `text` (nullable) | Optional meaning/translation |
| `embedding` | `vector(768)` | 768-dim embedding from all-mpnet-base-v2 |
| `category` | `text` (nullable) | Category (Love, Spirituality, Self, etc.) |
| `created_at` | `timestamptz` | Creation timestamp |

### `match_rumi_quotes` RPC Function

```sql
CREATE OR REPLACE FUNCTION match_rumi_quotes(
  query_embedding vector(768),
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  quote_text text,
  meaning text,
  category text,
  similarity float
) AS $$
  SELECT id, quote_text, meaning, category,
         1 - (embedding <=> query_embedding) AS similarity
  FROM public.rumi_quotes
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$ LANGUAGE sql;
```
