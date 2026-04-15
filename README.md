# Rumi-Talk App Flow & Architecture

Welcome to the **Rumi-Talk** project. This repository contains the full-stack Nuxt application separated logically into frontend and backend tasks.

## 🚀 App Flow

1. **User Input:** User submits a message/concern regarding their life or thoughts via the chat interface.
2. **Intent & RAG (Retrieval-Augmented Generation):** 
   - The backend receives the input.
   - An LLM processes the concern to extract semantic meaning.
   - Using **Supabase pgvector**, the backend queries the database via semantic search to find the most relevant quote from Jalaluddin Muhammad Rumi.
3. **Response Assembly:**
   - **Quote Context:** The selected quote is fetched.
   - **Audio Generation:** The backend (or an external TTS service integration) prepares the audio version of the quote.
   - **LLM Synthesis:** The LLM generates a response that impersonates Rumi, first presenting the quote and then explaining its deep correlation to the user's specific concern.
4. **Delivery to Frontend:**
   - The frontend receives the quote, the audio URL (or streams the audio), and the LLM's explanation.
   - The UI beautifully animates the revelation of the quote.
   - The audio plays.
   - The explanation text streams in smoothly for the user to read.

## 🗂️ Project Structure (Nuxt 4 Standard)

We use Nuxt to handle both frontend and backend in one repository while maintaining a strict boundary.

```
/
├── server/             # 🛠️ BACKEND TERRITORY (Nitro API routes, Supabase RAG logic)
├── app/components/     # 🎨 FRONTEND TERRITORY (Vue components)
├── app/pages/          # 🎨 FRONTEND TERRITORY (App Views/Routes)
├── app/layouts/        # 🎨 FRONTEND TERRITORY
├── app/assets/         # 🎨 FRONTEND TERRITORY (CSS, Fonts, Images)
├── FRONTEND_README.md  # Guide for the UX/UI Frontend Dev
├── BACKEND_README.md   # Guide for the Supabase/Database/AI Backend Dev
└── nuxt.config.ts      # Shared configuration
```

## 🤝 Collaboration Agreement
- **Frontend Developer** focuses strictly on the visual presentation, animations (e.g., using VueUse, GSAP, or Framer Motion), state management for the chat UI, and playing the audio. Use the `app/` directory.
- **Backend Developer (You)** focuses strictly on the `server/` directory, Supabase integrations, LLM prompts, embeddings, RAG pipeline, pgvector, and TTS logic.

Please read the respective guide for your role: `FRONTEND_README.md` or `BACKEND_README.md`.
