<script setup lang="ts">
import { ref } from 'vue'
import { apiMessage, isUnauthorized } from '../utils/api-errors'

const props = defineProps<{ message: string }>()
const emit = defineEmits<{ signedIn: [owner: { email: string }] }>()

const email = ref('')
const password = ref('')
const failure = ref('')
const busy = ref(false)

async function signIn() {
  if (busy.value) return
  busy.value = true
  failure.value = ''
  try {
    const { owner } = await $fetch<{ owner: { email: string } }>(
      '/api/session',
      {
        method: 'POST',
        body: { email: email.value.trim(), password: password.value },
      },
    )
    emit('signedIn', owner)
  } catch (error) {
    failure.value = isUnauthorized(error)
      ? 'The email or password is incorrect.'
      : apiMessage(error, 'Could not sign in. Try again.')
  } finally {
    password.value = ''
    busy.value = false
  }
}
</script>

<template>
  <main class="entry">
    <section class="entry__panel" aria-labelledby="signin-title">
      <span class="entry__mark" aria-hidden="true">A/</span>
      <h1 id="signin-title">Portfolio administration</h1>
      <p class="muted">
        Sign in to manage the technology stack, work experience and projects.
      </p>
      <form class="entry__form" @submit.prevent="signIn">
        <label class="label">
          Email
          <input
            v-model="email"
            name="email"
            type="email"
            autocomplete="username"
            required
          />
        </label>
        <label class="label">
          Password
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>
        <p v-if="failure" class="feedback" role="alert">{{ failure }}</p>
        <p v-else-if="props.message" class="muted" role="status">
          {{ props.message }}
        </p>
        <button class="button button--primary" type="submit" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.entry {
  min-block-size: 100svh;
  display: grid;
  align-items: center;
  justify-items: center;
  padding: var(--a-space-8) var(--a-space-4);
}

.entry__panel {
  inline-size: min(100%, 28rem);
  background: var(--admin-panel);
  border: 1px solid var(--admin-line);
  border-radius: 0.875rem;
  padding: clamp(1.25rem, 5vw, 2.25rem);
}

.entry__mark {
  display: block;
  color: var(--a-color-accent);
  font-family: var(--a-font-display);
  font-size: 2.5rem;
  line-height: 1;
  margin-block-end: var(--a-space-8);
}

h1 + p {
  margin-block-start: 0.625rem;
}

.entry__form {
  display: grid;
  gap: var(--a-space-4);
  margin-block-start: var(--a-space-8);
}
</style>
