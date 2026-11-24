<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProfileRecord } from '@a/contracts'
import { apiMessage, isUnauthorized } from '../utils/api-errors'

type ProfileDraft = Omit<ProfileRecord, 'id'>

function blankProfile(): ProfileDraft {
  return {
    displayName: '',
    headline: '',
    biography: '',
    profileImage: '',
    contactEmail: '',
    phone: '',
    location: '',
    websiteUrl: '',
    githubUrl: '',
    gitlabUrl: '',
    linkedinUrl: '',
    xUrl: '',
    status: 'draft',
    visible: true,
  }
}

const { session, message: sessionMessage } = useAdminSession()
const { data, pending, error, refresh } = await useFetch<ProfileRecord | null>(
  '/api/profile',
  { key: 'admin-profile', immediate: Boolean(session.value.owner) },
)
const draft = ref<ProfileDraft>(blankProfile())
const original = ref<ProfileDraft>(blankProfile())
const dirty = computed(
  () => JSON.stringify(draft.value) !== JSON.stringify(original.value),
)
const failure = ref('')
const notice = ref('')
const busy = ref(false)
const readingImage = ref(false)
const loadFailure = computed(() =>
  error.value ? apiMessage(error.value, 'Could not load the profile.') : '',
)
const publicationMessage = computed(() => {
  if (draft.value.status === 'draft') {
    return 'Draft profile details stay private. Visibility takes effect after publishing.'
  }
  return draft.value.visible
    ? 'This profile is visible on the public website.'
    : 'This published profile is hidden from the public website.'
})

function setDraft(profile: ProfileRecord | null) {
  const next: ProfileDraft = profile
    ? {
        displayName: profile.displayName,
        headline: profile.headline,
        biography: profile.biography,
        profileImage: profile.profileImage,
        contactEmail: profile.contactEmail,
        phone: profile.phone,
        location: profile.location,
        websiteUrl: profile.websiteUrl,
        githubUrl: profile.githubUrl,
        gitlabUrl: profile.gitlabUrl,
        linkedinUrl: profile.linkedinUrl,
        xUrl: profile.xUrl,
        status: profile.status,
        visible: profile.visible,
      }
    : blankProfile()
  original.value = next
  draft.value = { ...next }
}

watch(
  data,
  (profile) => {
    if (!dirty.value) setDraft(profile ?? null)
  },
  { immediate: true },
)

watch(
  () => session.value.owner?.email,
  (email) => {
    if (email) void refresh()
  },
)

watch(
  error,
  (value) => {
    if (value && isUnauthorized(value)) {
      session.value = { owner: null }
      sessionMessage.value = 'Your session expired. Sign in again to continue.'
    }
  },
  { immediate: true },
)

async function save() {
  if (busy.value || readingImage.value || !dirty.value) return
  busy.value = true
  failure.value = ''
  notice.value = ''
  try {
    const saved = await $fetch<ProfileRecord>('/api/profile', {
      method: 'PUT',
      body: { data: { ...draft.value } },
    })
    setDraft(saved)
    notice.value = 'Profile saved.'
  } catch (error) {
    if (isUnauthorized(error)) {
      session.value = { owner: null }
      sessionMessage.value = 'Your session expired. Sign in again to continue.'
    } else {
      failure.value = apiMessage(
        error,
        'Could not save this profile. Try again.',
      )
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="profile-editor" aria-labelledby="profile-title">
    <header class="profile-editor__heading">
      <h1 id="profile-title">Professional profile</h1>
      <p class="muted">
        Empty fields stay empty. Only published, visible profile details appear
        on the public site.
      </p>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <div v-if="pending" class="empty-state" role="status">Loading profile…</div>
    <div v-else-if="loadFailure" class="empty-state">
      <p class="feedback" role="alert">{{ loadFailure }}</p>
      <button class="button" type="button" @click="refresh()">Try again</button>
    </div>
    <form v-else class="profile-editor__form" @submit.prevent="save">
      <fieldset class="profile-editor__fields" :disabled="busy">
        <fieldset class="profile-editor__group">
          <legend>Identity</legend>
          <label class="label">
            Display name
            <input v-model="draft.displayName" maxlength="120" />
          </label>
          <label class="label">
            Professional headline
            <input v-model="draft.headline" maxlength="240" />
          </label>
          <label class="label">
            Biography
            <textarea v-model="draft.biography" rows="5" maxlength="8000" />
          </label>
          <EditorImage
            v-model="draft.profileImage"
            label="Profile image"
            @loading="readingImage = $event"
          />
        </fieldset>

        <fieldset class="profile-editor__group">
          <legend>Contact</legend>
          <div class="field-pair">
            <label class="label">
              Contact email
              <input
                v-model="draft.contactEmail"
                type="email"
                maxlength="254"
                autocomplete="email"
              />
            </label>
            <label class="label">
              Phone
              <input v-model="draft.phone" type="tel" maxlength="80" />
            </label>
          </div>
          <label class="label">
            Location
            <input v-model="draft.location" maxlength="160" />
          </label>
          <label class="label">
            Website URL
            <input
              v-model="draft.websiteUrl"
              type="url"
              maxlength="2048"
              placeholder="https://"
              autocomplete="url"
            />
          </label>
        </fieldset>

        <fieldset class="profile-editor__group">
          <legend>Social links</legend>
          <label class="label">
            GitHub URL
            <input v-model="draft.githubUrl" type="url" maxlength="2048" />
          </label>
          <label class="label">
            GitLab URL
            <input v-model="draft.gitlabUrl" type="url" maxlength="2048" />
          </label>
          <label class="label">
            LinkedIn URL
            <input v-model="draft.linkedinUrl" type="url" maxlength="2048" />
          </label>
          <label class="label">
            X URL
            <input v-model="draft.xUrl" type="url" maxlength="2048" />
          </label>
        </fieldset>

        <fieldset class="profile-editor__group">
          <legend>Publication</legend>
          <label class="label">
            Publication status
            <select v-model="draft.status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label class="editor__visibility">
            <input v-model="draft.visible" type="checkbox" />
            Visible after publishing
          </label>
          <p class="muted">{{ publicationMessage }}</p>
        </fieldset>

        <p v-if="failure" class="feedback" role="alert">{{ failure }}</p>
        <div class="profile-editor__actions">
          <p v-if="dirty" class="muted">Unsaved changes</p>
          <button
            class="button button--primary"
            type="submit"
            :disabled="busy || readingImage || !dirty"
          >
            {{ busy ? 'Saving…' : 'Save profile' }}
          </button>
        </div>
      </fieldset>
    </form>
  </main>
</template>

<style scoped>
.profile-editor {
  max-inline-size: 58rem;
  min-block-size: calc(100svh - 8rem);
  margin-inline: auto;
  padding: var(--a-space-8) clamp(1rem, 4vw, 3rem);
}

.profile-editor__heading {
  margin-block-end: var(--a-space-8);
}

.profile-editor__heading p {
  max-inline-size: 68ch;
  margin-block-start: 0.5rem;
}

.profile-editor__form {
  padding: clamp(1rem, 4vw, 1.75rem);
  border: 1px solid var(--admin-line);
  border-radius: var(--a-radius-surface);
  background: var(--admin-panel);
}

.profile-editor__fields {
  display: grid;
  gap: var(--a-space-4);
  min-inline-size: 0;
  border: 0;
  margin: 0;
  padding: 0;
}

.profile-editor__group {
  display: grid;
  gap: var(--a-space-4);
  min-inline-size: 0;
  border: 1px solid var(--admin-line);
  border-radius: var(--a-radius-surface);
  padding: var(--a-space-4);
}

.profile-editor__group legend {
  padding-inline: var(--a-space-2);
  color: var(--a-color-muted);
  font-weight: 650;
}

.editor__visibility {
  display: flex;
  align-items: center;
  gap: var(--a-space-2);
  cursor: pointer;
}

.editor__visibility input {
  inline-size: 1rem;
  block-size: 1rem;
  accent-color: var(--a-color-accent);
}

.profile-editor__actions {
  position: sticky;
  inset-block-end: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--a-space-2);
  margin-inline: calc(clamp(1rem, 4vw, 1.75rem) * -1);
  margin-block-end: calc(clamp(1rem, 4vw, 1.75rem) * -1);
  padding: var(--a-space-3) clamp(1rem, 4vw, 1.75rem);
  border-block-start: 1px solid var(--admin-line);
  background: var(--admin-panel);
}

.profile-editor__actions p {
  margin: 0;
}

.notice {
  margin-block-end: var(--a-space-4);
  color: var(--a-color-accent);
}

@media (max-width: 38rem) {
  .profile-editor {
    padding-block-start: var(--a-space-4);
  }
}
</style>
