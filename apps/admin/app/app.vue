<script setup lang="ts">
import { ref } from 'vue'
import '@a/design-tokens'
import './assets/admin.css'
import { apiMessage } from './utils/api-errors'

const { session, message } = useAdminSession()
const {
  data: loadedSession,
  error,
  refresh,
  pending,
} = await useFetch<{
  owner: { email: string } | null
}>('/api/session', { key: 'admin-session-check' })
if (loadedSession.value) session.value = loadedSession.value
const signingOut = ref(false)

function establishSession(owner: { email: string }) {
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
  <main v-if="error && !session?.owner" class="session-error">
    <h1>Portfolio administration</h1>
    <p class="feedback" role="alert">The sign-in service is unavailable.</p>
    <button class="button" type="button" :disabled="pending" @click="refresh()">
      Try again
    </button>
  </main>
  <div v-else class="admin-shell" v-show="session?.owner">
    <header class="topbar">
      <div class="topbar__inner">
        <div class="identity">
          <span class="mark" aria-hidden="true">A/</span>
          <span>Portfolio administration</span>
        </div>
        <div class="account" v-if="session?.owner">
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
      <nav class="topnav" aria-label="Administration">
        <NuxtLink to="/">Overview</NuxtLink>
        <NuxtLink to="/content">Technology stack</NuxtLink>
        <NuxtLink to="/profile">Profile</NuxtLink>
        <NuxtLink to="/preview">Preview</NuxtLink>
      </nav>
    </header>
    <p v-if="message" class="session-error feedback" role="alert">
      {{ message }}
    </p>
    <NuxtPage />
  </div>
  <OwnerSignIn
    v-if="!session?.owner && !error"
    :message="message"
    @signed-in="establishSession"
  />
</template>

<style scoped>
.admin-shell {
  min-block-size: 100svh;
}

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

.topnav {
  display: flex;
  gap: 0.25rem;
  max-inline-size: var(--admin-max);
  margin-inline: auto;
  padding: 0 clamp(1rem, 3vw, 2rem) var(--a-space-2);
  overflow-x: auto;
}

.topnav a {
  display: inline-flex;
  align-items: center;
  min-block-size: 2.5rem;
  padding-inline: 0.75rem;
  border: 1px solid transparent;
  border-radius: var(--admin-radius);
  color: var(--a-color-muted);
  text-decoration: none;
  white-space: nowrap;
}

.topnav a:hover,
.topnav a.router-link-active {
  color: var(--a-color-text);
  background: var(--admin-hover);
}

.topnav a.router-link-exact-active {
  color: var(--a-color-accent);
  border-color: var(--admin-line);
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
  .topnav {
    flex-wrap: wrap;
    overflow-x: visible;
  }

  .account__email {
    display: none;
  }

  .identity {
    font-size: 0.875rem;
  }
}
</style>
