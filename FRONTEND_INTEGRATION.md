# 🎨 Frontend Integration Guide

> **For the Frontend Developer**: This document explains exactly what the backend `POST /api/chat` endpoint does and how to consume it from the frontend.

---

## 📡 API Endpoint

### `POST /api/chat`

**Content-Type**: `text/event-stream` (Server-Sent Events)

#### Request

```http
POST /api/chat
Content-Type: application/json

{
  "concern": "I feel lost and don't know my purpose in life"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `concern` | `string` | ✅ | The user's concern, question, or struggle |

#### Response Format

The response is **NOT** a regular JSON response. It is a **Server-Sent Events (SSE) stream**. You must use `EventSource` or `fetch` with stream reading to consume it.

---

## 📦 Three Event Types

The backend sends events in this exact order:

### 1. `quote` — The Selected Rumi Quote

Sent **once**, immediately after the backend selects the best quote. This is your signal to display the quote card and start playing audio.

```typescript
// Event shape
interface QuoteEvent {
  text: string           // The Rumi quote text
  audioUrl: string|null  // URL to the TTS audio file (null if not yet integrated)
  category: string|null  // Quote category (e.g. "Love", "Spirituality", "Self")
  relevanceReason: string // Brief explanation of why this quote was chosen
  quoteId: string        // UUID of the quote in the database
}
```

**Example SSE payload:**
```
event: quote
data: {"text":"The wound is the place where the Light enters you.","audioUrl":null,"category":"Spirituality","relevanceReason":"This quote speaks to finding meaning through pain and struggle.","quoteId":"a6f1f102-b0da-4ef6-b66a-9f2f2e5669bd"}
```

### 2. `stream` — Streaming Explanation Text

Sent **multiple times**, containing small chunks of text from Rumi's explanation. Append each chunk to your display as it arrives for a word-by-word typing effect.

```typescript
// Event shape
interface StreamEvent {
  text: string  // A small chunk of text (could be a word, partial sentence, etc.)
}
```

**Example SSE payload (multiple events):**
```
event: stream
data: {"text":"Ah, dear one. "}

event: stream
data: {"text":"You speak of feeling lost, "}

event: stream
data: {"text":"of wandering without purpose. "}

event: stream
data: {"text":"But consider — the reed was torn from its bed, "}

event: stream
data: {"text":"and yet it is through that very tearing that it learned to sing..."}
```

### 3. `done` — Stream Complete

Sent **once** at the very end. This is your signal to finalize the UI (hide loading spinners, enable input, etc.).

```
event: done
data: {}
```

### 4. `error` — Error During Streaming (Optional)

If something goes wrong during the explanation streaming, this event is sent instead of `done`.

```typescript
interface ErrorEvent {
  message: string  // Error description
}
```

---

## 🔧 Frontend Implementation Examples

### Option A: Using `fetch` with ReadableStream (Recommended)

This is the most reliable approach for POST requests with SSE:

```typescript
async function askRumi(concern: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concern }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Process complete SSE events (split by double newline)
    const events = buffer.split('\n\n')
    buffer = events.pop()! // Keep incomplete event in buffer

    for (const eventBlock of events) {
      if (!eventBlock.trim()) continue

      const lines = eventBlock.split('\n')
      let eventType = ''
      let eventData = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7)
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6)
        }
      }

      if (!eventType || !eventData) continue

      const data = JSON.parse(eventData)

      switch (eventType) {
        case 'quote':
          // ✅ Display the quote card
          displayQuote(data)
          // ✅ Play audio if audioUrl is available
          if (data.audioUrl) {
            playAudio(data.audioUrl)
          }
          break

        case 'stream':
          // ✅ Append text to the explanation display
          appendExplanationText(data.text)
          break

        case 'done':
          // ✅ Finalize UI
          onStreamComplete()
          break

        case 'error':
          // ❌ Handle error
          onStreamError(data.message)
          break
      }
    }
  }
}
```

### Option B: Vue 3 Composable (for Nuxt/Vue projects)

```typescript
// composables/useRumiChat.ts
import { ref, reactive } from 'vue'

interface QuoteData {
  text: string
  audioUrl: string | null
  category: string | null
  relevanceReason: string
  quoteId: string
}

export function useRumiChat() {
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const quote = ref<QuoteData | null>(null)
  const explanation = ref('')
  const error = ref<string | null>(null)

  async function ask(concern: string) {
    // Reset state
    isLoading.value = true
    isStreaming.value = false
    quote.value = null
    explanation.value = ''
    error.value = null

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concern }),
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop()!

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue

          const lines = eventBlock.split('\n')
          let eventType = ''
          let eventData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7)
            else if (line.startsWith('data: ')) eventData = line.slice(6)
          }

          if (!eventType || !eventData) continue
          const data = JSON.parse(eventData)

          switch (eventType) {
            case 'quote':
              quote.value = data
              isLoading.value = false
              isStreaming.value = true
              break
            case 'stream':
              explanation.value += data.text
              break
            case 'done':
              isStreaming.value = false
              break
            case 'error':
              error.value = data.message
              isStreaming.value = false
              break
          }
        }
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
      isStreaming.value = false
    }
  }

  return {
    ask,
    isLoading,
    isStreaming,
    quote,
    explanation,
    error,
  }
}
```

**Usage in a Vue component:**

```vue
<script setup lang="ts">
const { ask, isLoading, isStreaming, quote, explanation, error } = useRumiChat()
const userConcern = ref('')

async function handleSubmit() {
  if (!userConcern.value.trim()) return
  await ask(userConcern.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <textarea v-model="userConcern" placeholder="Share what troubles your heart..." />
    <button :disabled="isLoading || isStreaming">Ask Rumi</button>
  </form>

  <!-- Loading State -->
  <div v-if="isLoading" class="loading">
    Rumi is reflecting on your words...
  </div>

  <!-- Quote Card -->
  <div v-if="quote" class="quote-card">
    <blockquote>"{{ quote.text }}"</blockquote>
    <span class="category">{{ quote.category }}</span>

    <!-- Audio Player -->
    <audio v-if="quote.audioUrl" :src="quote.audioUrl" autoplay controls />
  </div>

  <!-- Streaming Explanation -->
  <div v-if="explanation" class="explanation">
    <p>{{ explanation }}</p>
    <span v-if="isStreaming" class="cursor-blink">▌</span>
  </div>

  <!-- Error -->
  <div v-if="error" class="error">{{ error }}</div>
</template>
```

---

## 🎵 Audio Playback

When the `quote` event arrives with a non-null `audioUrl`:

```typescript
function playAudio(url: string) {
  const audio = new Audio(url)
  audio.play().catch(err => {
    // Browsers may block autoplay — handle gracefully
    console.warn('Autoplay blocked, showing play button instead')
  })
}
```

> **Note:** The `audioUrl` is currently `null` until TTS is integrated on the backend. Design your UI to handle both cases:
> - `audioUrl` is `null` → Don't show audio player
> - `audioUrl` is a URL → Show audio player and optionally autoplay

---

## ⏱️ Expected Timeline

| Phase | Event | Typical Time |
|-------|-------|-------------|
| Phase 1 | `quote` event arrives | 2-5 seconds (embedding + vector search + structured LLM call) |
| Phase 2 | First `stream` event | ~0.5s after quote |
| Phase 2 | Stream continues | 5-15 seconds total |
| Phase 3 | `done` event | Immediately after last stream chunk |

---

## 🧪 Testing with cURL

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"concern": "I am going through a difficult breakup"}' \
  --no-buffer
```

This will show the raw SSE events in your terminal.

---

## 🎨 UI/UX Recommendations

1. **Quote Reveal Animation**: When the `quote` event arrives, animate the quote card sliding in or fading in with a glow effect.

2. **Typing Effect**: As `stream` events arrive, display text with a subtle typing cursor (`▌`) at the end.

3. **Audio Integration**: When `audioUrl` is available, show a small play button on the quote card. Consider auto-playing with a gentle fade-in.

4. **Loading State**: While waiting for the first event, show a poetic loading message like "Rumi is reflecting on your words..." with a subtle animation.

5. **Error Handling**: If the `error` event arrives, show a graceful error message. Offer a "Try Again" button.

---

## 📋 TypeScript Types (Copy-Paste Ready)

```typescript
// Types for the SSE events from /api/chat

interface QuoteEventData {
  text: string
  audioUrl: string | null
  category: string | null
  relevanceReason: string
  quoteId: string
}

interface StreamEventData {
  text: string
}

interface DoneEventData {}

interface ErrorEventData {
  message: string
}

type ChatEventType = 'quote' | 'stream' | 'done' | 'error'

interface ChatEvent {
  type: ChatEventType
  data: QuoteEventData | StreamEventData | DoneEventData | ErrorEventData
}
```

---

## ❓ FAQ

**Q: Why SSE instead of a regular JSON response?**
A: The explanation from Rumi is generated word-by-word by the LLM. SSE allows us to stream each word to the frontend immediately, giving users a much faster perceived response time instead of waiting for the entire response to generate.

**Q: Can I use `EventSource` instead of `fetch`?**
A: `EventSource` only supports GET requests. Since our endpoint is POST, you need to use `fetch` with `ReadableStream` as shown above.

**Q: What if `audioUrl` is always null?**
A: TTS integration is planned but not yet implemented. Design your UI to gracefully handle `null` audio URLs. When TTS is integrated, the URL will be a direct link to an MP3/WAV file.

**Q: How do I handle network disconnection during streaming?**
A: If the `fetch` stream breaks, the `reader.read()` will throw an error. Wrap the reading loop in try/catch and show an appropriate error message with a retry option.
