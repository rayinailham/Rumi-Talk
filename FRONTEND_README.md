# 🎨 Frontend Developer Guide

Welcome to the Rumi-Talk frontend! Your primary goal is to make the application look incredibly aesthetically pleasing, smooth, and engaging, fitting a philosophical, poetic theme.

## 🎯 Your Responsibilities

1. **Clean & Premium UI/UX:**
   - Avoid generic designs. Use a cohesive, harmonious color palette suitable for Rumi's poetry (e.g., deep night sky colors, gold accents, elegant glassmorphism, or soft desert tones).
   - Use beautiful modern fonts (e.g., Google Fonts like 'Outfit', 'Cinzel', or 'Inter' for readability mixed with elegance).
   - *Requirement:* Do NOT use standard basic aesthetics. It must feel premium and "wow" the user.
2. **Animations & Interactions:**
   - The primary interaction is a chat interface. We need subtle micro-animations for sending/receiving messages.
   - **The Reveal:** When the Rumi quote arrives, it should have a dedicated, beautiful reveal animation to emphasize its importance before the audio plays and the explanation streams in.
3. **Audio Playback:**
   - The backend will provide an audio stream or URL. Your code must seamlessly play this audio while the user reads the quote.
4. **State Management:**
   - Manage the sequence of events over the Chat Component: `Loading State` -> `Reveal Quote` -> `Play Audio` -> `Stream Rumi's Explanation`.

## 📂 Your Workspace
You have total control over:
- `/components/` - Vue UI components (e.g., `ChatBox.vue`, `QuoteReveal.vue`).
- `/pages/` - Pages and routes.
- `/layouts/` - Structure around the app.
- `/assets/` - Tailwind CSS, vanilla CSS, fonts, and images.

*Note: The API endpoints will be built in `/server/api/`. You just need to make requests to `/api/chat` using `$fetch` hooks.*

## 🚀 Getting Started

1. Install dependencies: `npm install` (or `pnpm install` / `yarn install`)
2. Run the dev server: `npm run dev`
3. Enjoy building the most beautiful Poetic App!
