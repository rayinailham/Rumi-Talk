<template>
  <div class="chat-container glass-panel animate-fade-in">
    <div class="chat-history" ref="historyContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <p>What burdens your heart today?</p>
      </div>
      
      <div 
        v-for="(msg, idx) in messages" 
        :key="idx" 
        :class="['message-wrapper', msg.role]"
      >
        <div class="message-bubble">
          <!-- Rumi's Quote Section -->
          <div v-if="msg.role === 'rumi' && msg.quote" class="quote-section">
            <p class="quote-text">"{{ msg.quote.text }}"</p>
            <button v-if="msg.quote.audioUrl" @click="playAudio(msg.quote.audioUrl)" class="audio-btn" title="Play Quote Audio">
              ▶ Play Audio
            </button>
          </div>
          
          <!-- LLM Explanation or User Text -->
          <p class="message-text">{{ msg.text }}</p>
        </div>
      </div>

      <div v-if="isLoading" class="loading-indicator">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>

    <form @submit.prevent="sendMessage" class="chat-input-area">
      <input 
        v-model="input" 
        type="text" 
        placeholder="Speak your mind..." 
        :disabled="isLoading"
        class="chat-input"
      />
      <button type="submit" :disabled="isLoading || !input.trim()" class="send-btn">
        Ask
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const input = ref('')
const messages = ref([])
const isLoading = ref(false)
const historyContainer = ref(null)

const scrollToBottom = () => {
  setTimeout(() => {
    if (historyContainer.value) {
      historyContainer.value.scrollTop = historyContainer.value.scrollHeight
    }
  }, 100)
}

const sendMessage = async () => {
  if (!input.value.trim()) return
  
  const userText = input.value
  messages.value.push({ role: 'user', text: userText })
  input.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const response = await $fetch('/api/chat', {
      method: 'POST',
      body: { concern: userText }
    })

    messages.value.push({
      role: 'rumi',
      quote: response.quote,
      text: response.text
    })
  } catch (error) {
    messages.value.push({ role: 'rumi', text: "There was a silence in the cosmos... (Error reaching backend)" })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const playAudio = (url) => {
  // Simple audio playback, frontend dev can improve this (e.g., custom player UI)
  const audio = new Audio(url)
  audio.play()
}
</script>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 700px;
  height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.5rem;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Custom Scrollbar for the chat */
.chat-history::-webkit-scrollbar {
  width: 6px;
}
.chat-history::-webkit-scrollbar-thumb {
  background-color: var(--color-surface-hover);
  border-radius: var(--radius-sm);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-style: italic;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.rumi {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 1rem 1.2rem;
  border-radius: var(--radius-md);
  animation: fadeIn 0.4s ease-out;
}

.user .message-bubble {
  background-color: var(--color-surface-hover);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.rumi .message-bubble {
  background-color: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-bottom-left-radius: 2px;
}

.quote-section {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.quote-text {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: var(--color-accent);
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

.audio-btn {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.audio-btn:hover {
  background: var(--color-accent);
  color: var(--color-background);
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
}

.chat-input-area {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.chat-input {
  flex: 1;
  background-color: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 1rem 1.2rem;
  border-radius: var(--radius-md);
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  transition: var(--transition-smooth);
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.send-btn {
  background-color: var(--color-accent);
  color: var(--color-background);
  border: none;
  padding: 0 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.send-btn:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 1rem;
}

.loading-indicator .dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-accent);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
.loading-indicator .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
