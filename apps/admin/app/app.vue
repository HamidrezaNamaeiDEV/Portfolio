<script setup lang="ts">
import { ref } from 'vue'
import '@a/design-tokens'

const detailsVisible = ref(false)
</script>

<template>
  <main>
    <h1>Portfolio administration</h1>
    <p>Editorial workspace for portfolio content.</p>
    <button
      type="button"
      aria-controls="foundation-details"
      :aria-expanded="detailsVisible"
      @click="detailsVisible = !detailsVisible"
    >
      {{
        detailsVisible ? 'Hide foundation details' : 'Show foundation details'
      }}
    </button>
    <p v-show="detailsVisible" id="foundation-details">
      Admin rendering and client interaction are available.
    </p>
  </main>
</template>

<style>
body {
  background: var(--a-color-surface);
  color: var(--a-color-text);
  font-family: var(--a-font-sans);
}

main {
  max-inline-size: 42rem;
  margin: var(--a-space-16) auto;
  padding-inline: var(--a-space-4);
}

h1 {
  font-family: var(--a-font-display);
}

p {
  color: var(--a-color-muted);
}

button:focus-visible {
  outline: 2px solid var(--a-color-accent);
  outline-offset: 3px;
}
</style>
