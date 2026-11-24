<script setup lang="ts">
import { ref } from 'vue'
import '@a/design-tokens'
import './assets/admin.css'
import { apiMessage } from './utils/api-errors'

interface Session {
  owner: { email: string } | null
}

const {
  data: session,
  error,
  refresh,
  pending,
} = await useFetch<Session>('/api/session', { key: 'admin-session' })
const message = ref('')
const signingOut = ref(false)

function expire() {
  session.value = { owner: null }
  message.value = 'Your session expired. Sign in again to continue.'
}

function establishSession(owner: NonNullable<Session['owner']>) {
  session.value = { owner }
  message.value = ''
}

async function signOut() {
  signingOut.value = true
  message.value = ''
  try {
    await $fetch('/api/session', { method: 'DELETE' })
    session.value = { owner: null }
    message.value = 'Signed out.'
  } catch (failure) {
    message.value = apiMessage(failure, 'Could not sign out. Try again.')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div v-if="session?.owner">
    <header class="topbar">
      <div class="topbar__inner">
        <div class="identity">
          <span class="mark" aria-hidden="true">A/</span>
          <span>Portfolio administration</span>
        </div>
        <div class="account">
          <span class="account__email">{{ session.owner.email }}</span>
          <button
            class="button"
            type="button"
            :disabled="signingOut"
            @click="signOut"
          >
            {{ signingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
      </div>
    </header>
    <p v-if="message" class="session-error feedback" role="alert">
      {{ message }}
    </p>
    <ContentWorkspace @expired="expire" />
  </div>
  <main v-else-if="error" class="session-error">
    <h1>Portfolio administration</h1>
    <p class="feedback" role="alert">The sign-in service is unavailable.</p>
    <button class="button" type="button" :disabled="pending" @click="refresh()">
      Try again
    </button>
  </main>
  <OwnerSignIn v-else :message="message" @signed-in="establishSession" />
</template>

<style scoped>
.topbar {
  background: var(--admin-panel);
  border-block-end: 1px solid var(--admin-line);
}

.topbar__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--a-space-4);
  max-inline-size: var(--admin-max);
  min-block-size: 4.25rem;
  margin-inline: auto;
  padding: var(--a-space-2) clamp(1rem, 3vw, 2rem);
}

.identity,
.account {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.identity {
  font-weight: 680;
  line-height: 1.2;
}

.mark {
  min-inline-size: 2rem;
  color: var(--a-color-accent);
  font-family: var(--a-font-display);
  font-size: 1.5rem;
  line-height: 1;
}

.account {
  flex: 0 0 auto;
}

.account__email {
  color: var(--a-color-muted);
  font-size: 0.875rem;
}

.session-error {
  display: grid;
  justify-items: start;
  gap: 0.875rem;
  max-inline-size: 35rem;
  margin: var(--a-space-16) auto;
  padding-inline: var(--a-space-4);
}

@media (max-width: 38rem) {
  .account__email {
    display: none;
  }
}
</style>
