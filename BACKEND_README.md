# 🛠️ Backend Developer Guide (Supabase & LLM)

Welcome to the Rumi-Talk backend! Since you are setting up the database and managing the server-side architecture, your role revolves around the logic, data retrieval, and AI integrations.

## 🎯 Your Responsibilities

1. **Supabase & Database Initialization:**
   - Setup a Supabase project.
   - Enable `pgvector` extension for semantic search.
   - Create a table for `quotes` (e.g., `id`, `quote_text`, `embedding`, `translation`, `source`).
   - Populate the table with Rumi quotes and generate embeddings.
2. **RAG Pipeline (Retrieval-Augmented Generation):**
   - In `/server/api/chat.post.ts`, accept the user's concern.
   - Use an LLM (e.g., OpenAI, Gemini, Anthropic) to get an embedding vector of the user's concern.
   - Query Supabase leveraging `pgvector` to find the most contextually relevant quote.
3. **LLM Impersonation & Synthesis:**
   - Feed the chosen quote and user concern into a generative LLM.
   - The system prompt must instruct the LLM to adopt the persona of Jalaluddin Muhammad Rumi. 
   - Tie the wisdom of the quote to the user's concern deeply and poetically.
4. **TTS (Text-to-Speech) Integration:**
   - Generate audio for the `quote_text`.
   - Return the URL (or base64 stream) of the audio so the frontend can play it out loud.

## 📂 Your Workspace
You have total control over:
- `/server/` - Nuxt Nitro API routes, plugins, database clients.
- Database architecture & Edge Functions (if needed in Supabase).
- Scripts for embedding/scraping quotes.

## 🚀 Recommended Tech Stack for the Backend
- **Nuxt Server (Nitro):** Built into your Nuxt project, extremely fast.
- **Supabase JS Client:** `@supabase/supabase-js`.
- **LangChain / AI SDK:** E.g., `ai` (Vercel AI SDK) or official SDKs (OpenAI/Gemini).
- **TTS:** ElevenLabs API for incredibly expressive and poetic voice generation, or OpenAI TTS.

## Backend Output Interface
When the app hits `/api/chat`, your endpoint should ideally return:
```json
{
  "quote": {
    "text": "The wound is the place where the Light enters you.",
    "audioUrl": "https://url-to-tts-audio.mp3"
  },
  "explanationStream": "[Streaming text explaining the quote related to the user...]"
}
```
*(The exact structure is up to you, but keep the frontend dev in the loop!)*
