<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PortfolioPreview as PreviewData } from '@a/contracts'
import { apiMessage, isUnauthorized } from '../utils/api-errors'

const { session, message: sessionMessage } = useAdminSession()
const { data, pending, error, refresh } = await useFetch<PreviewData>(
  '/api/preview',
  { key: 'admin-portfolio-preview', immediate: Boolean(session.value.owner) },
)
const failure = computed(() =>
  error.value
    ? apiMessage(error.value, 'Could not load the portfolio preview.')
    : '',
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
</script>

<template>
  <main class="portfolio-preview" aria-labelledby="preview-title">
    <header class="portfolio-preview__heading">
      <h1 id="preview-title">Portfolio preview</h1>
      <p class="muted">
        Review the public snapshot beside visible draft candidates. Drafts here
        remain private until you publish them.
      </p>
    </header>

    <div v-if="pending" class="empty-state" role="status">
      Loading portfolio preview…
    </div>
    <div v-else-if="failure" class="empty-state">
      <p class="feedback" role="alert">{{ failure }}</p>
      <button class="button" type="button" @click="refresh()">Try again</button>
    </div>
    <div v-else-if="data" class="portfolio-preview__columns">
      <section aria-labelledby="published-title">
        <h2 id="published-title">Published on the public site</h2>
        <p v-if="!data.published.profile" class="muted">
          No published profile is available. The site uses its confirmed static
          profile copy.
        </p>
        <article v-else class="preview-profile">
          <img
            v-if="data.published.profile.profileImage"
            :src="data.published.profile.profileImage"
            alt=""
            width="72"
            height="72"
          />
          <div>
            <h3>
              {{
                data.published.profile.displayName ||
                data.published.profile.headline
              }}
            </h3>
            <p v-if="data.published.profile.displayName" class="muted">
              {{ data.published.profile.headline }}
            </p>
            <p>{{ data.published.profile.biography }}</p>
          </div>
        </article>

        <section class="preview-section" aria-labelledby="published-skills">
          <h3 id="published-skills">Technology stack</h3>
          <p v-if="!data.published.skills.length" class="muted">
            No skills are published yet.
          </p>
          <ul v-else>
            <li v-for="item in data.published.skills" :key="item.id">
              {{ item.name }}
              <span v-if="item.proficiency" class="muted">
                · {{ item.proficiency.name }}
              </span>
            </li>
          </ul>
        </section>

        <section class="preview-section" aria-labelledby="published-experience">
          <h3 id="published-experience">Work experience</h3>
          <p v-if="!data.published.experiences.length" class="muted">
            No experience records are published yet.
          </p>
          <ul v-else>
            <li v-for="item in data.published.experiences" :key="item.id">
              {{ item.company }} · {{ item.position }}
            </li>
          </ul>
        </section>

        <section class="preview-section" aria-labelledby="published-projects">
          <h3 id="published-projects">Selected projects</h3>
          <p v-if="!data.published.projects.length" class="muted">
            No projects are published yet.
          </p>
          <ul v-else>
            <li v-for="item in data.published.projects" :key="item.id">
              {{ item.name }}
            </li>
          </ul>
        </section>
      </section>

      <section aria-labelledby="draft-title">
        <h2 id="draft-title">Visible draft candidates</h2>
        <p class="muted">
          These records are marked visible, but their draft status keeps them
          out of the public website.
        </p>
        <p v-if="data.draftCandidates.profile" class="draft-profile">
          Profile:
          {{
            data.draftCandidates.profile.displayName ||
            data.draftCandidates.profile.headline ||
            'Untitled profile'
          }}
          <span class="publication-status">Draft</span>
        </p>
        <section class="preview-section" aria-labelledby="draft-skills">
          <h3 id="draft-skills">Technology stack</h3>
          <p v-if="!data.draftCandidates.skills.length" class="muted">
            No visible skill drafts.
          </p>
          <ul v-else>
            <li v-for="item in data.draftCandidates.skills" :key="item.id">
              {{ item.name }}
              <span class="publication-status">Draft</span>
            </li>
          </ul>
        </section>
        <section class="preview-section" aria-labelledby="draft-experience">
          <h3 id="draft-experience">Work experience</h3>
          <p v-if="!data.draftCandidates.experiences.length" class="muted">
            No visible experience drafts.
          </p>
          <ul v-else>
            <li v-for="item in data.draftCandidates.experiences" :key="item.id">
              {{ item.company }} · {{ item.position }}
              <span class="publication-status">Draft</span>
            </li>
          </ul>
        </section>
        <section class="preview-section" aria-labelledby="draft-projects">
          <h3 id="draft-projects">Selected projects</h3>
          <p v-if="!data.draftCandidates.projects.length" class="muted">
            No visible project drafts.
          </p>
          <ul v-else>
            <li v-for="item in data.draftCandidates.projects" :key="item.id">
              {{ item.name }}
              <span class="publication-status">Draft</span>
            </li>
          </ul>
        </section>
      </section>
    </div>
  </main>
</template>

<style scoped>
.portfolio-preview {
  max-inline-size: var(--admin-max);
  min-block-size: calc(100svh - 8rem);
  margin-inline: auto;
  padding: var(--a-space-8) clamp(1rem, 4vw, 3rem);
}

.portfolio-preview__heading {
  margin-block-end: var(--a-space-8);
}

.portfolio-preview__heading p {
  max-inline-size: 68ch;
  margin-block-start: 0.5rem;
}

.portfolio-preview__columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

.portfolio-preview__columns > section {
  min-inline-size: 0;
  padding-block-start: var(--a-space-4);
  border-block-start: 1px solid var(--admin-line);
}

.portfolio-preview__columns h2 {
  margin-block-end: var(--a-space-3);
  font-size: 1.25rem;
  letter-spacing: -0.015em;
}

.preview-profile {
  display: flex;
  align-items: flex-start;
  gap: var(--a-space-3);
  margin-block-start: var(--a-space-4);
}

.preview-profile img {
  flex: 0 0 auto;
  inline-size: 4.5rem;
  block-size: 4.5rem;
  border: 1px solid var(--admin-line);
  border-radius: 50%;
  object-fit: cover;
}

.preview-profile h3 {
  margin-block-end: var(--a-space-1);
}

.preview-section {
  margin-block-start: var(--a-space-6);
}

.preview-section h3 {
  margin-block-end: var(--a-space-2);
}

.preview-section ul {
  display: grid;
  gap: 0.375rem;
  margin: 0;
  padding-inline-start: 1.25rem;
}

.draft-profile,
.publication-status {
  color: var(--a-color-accent);
}

.publication-status {
  display: inline-block;
  margin-inline-start: var(--a-space-2);
  font-size: 0.8125rem;
  font-weight: 650;
}

@media (max-width: 48rem) {
  .portfolio-preview {
    padding-block-start: var(--a-space-4);
  }

  .portfolio-preview__columns {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--a-space-8);
  }
}
</style>
