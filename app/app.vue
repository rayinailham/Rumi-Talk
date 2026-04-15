<template>
  <div class="app-wrapper">
    <header class="app-header">
      <h1 class="logo">Rumi Talk</h1>
      <p class="subtitle">Seek wisdom from the heart of the universe.</p>
    </header>
    
    <main class="main-content">
      <ChatBox />
    </main>
  </div>
</template>

<style>
/* Base layout styles. Let the frontend dev improve this! */
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Outfit', 'Inter', sans-serif;
}

.app-header {
  text-align: center;
  padding: 3rem 1rem;
}

.logo {
  font-family: 'Cinzel', serif;
  font-size: 3rem;
  font-weight: 400;
  color: var(--color-accent);
  margin: 0;
  letter-spacing: 2px;
}

.subtitle {
  font-weight: 300;
  opacity: 0.8;
  margin-top: 0.5rem;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 1rem 3rem 1rem;
}
</style>
