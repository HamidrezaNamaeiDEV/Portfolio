<script setup lang="ts">
import type { AdminContent } from '@a/contracts'

const props = defineProps<{
  content?: AdminContent
  pending: boolean
  failure: string
}>()
const emit = defineEmits<{ retry: [] }>()

const draftCount = computed(() =>
  props.content
    ? Object.values(props.content)
        .flat()
        .filter((record) => record.status === 'draft').length
    : 0,
)

const stats = computed(() => [
  { label: 'Total skills', value: props.content?.skills.length ?? 0 },
  {
    label: 'Published skills',
    value:
      props.content?.skills.filter((item) => item.status === 'published')
        .length ?? 0,
  },
  { label: 'Skill categories', value: props.content?.categories.length ?? 0 },
  { label: 'Work experience', value: props.content?.experiences.length ?? 0 },
  { label: 'Selected projects', value: props.content?.projects.length ?? 0 },
  { label: 'Draft content', value: draftCount.value },
])
</script>

<template>
  <main class="overview" aria-labelledby="overview-title">
    <header class="overview__intro">
      <div>
        <h1 id="overview-title">Portfolio overview</h1>
        <p class="muted">
          Content counts reflect records currently loaded from the CMS.
        </p>
      </div>
    </header>

    <div v-if="props.pending" class="empty-state" role="status">
      Loading portfolio counts…
    </div>
    <div v-else-if="props.failure" class="empty-state">
      <p class="feedback" role="alert">{{ props.failure }}</p>
      <button class="button" type="button" @click="emit('retry')">
        Try again
      </button>
    </div>
    <template v-else-if="props.content">
      <dl class="overview__stats" aria-label="Portfolio content counts">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="overview__stat"
          role="group"
          :aria-label="stat.label"
        >
          <dt>{{ stat.label }}</dt>
          <dd>{{ stat.value }}</dd>
        </div>
      </dl>

      <section class="overview__actions" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title">Quick actions</h2>
        <nav aria-label="Quick actions">
          <NuxtLink class="button button--primary" to="/content">
            Manage technology stack
          </NuxtLink>
          <NuxtLink class="button" to="/content?create=skill">
            Add a skill
          </NuxtLink>
          <NuxtLink class="button" to="/content?section=experiences">
            Manage work experience
          </NuxtLink>
          <NuxtLink class="button" to="/content?section=projects">
            Manage projects
          </NuxtLink>
          <NuxtLink class="button" to="/profile">Edit profile</NuxtLink>
          <NuxtLink class="button" to="/preview">Open preview</NuxtLink>
        </nav>
      </section>
    </template>
  </main>
</template>

<style scoped>
.overview {
  max-inline-size: var(--admin-max);
  min-block-size: calc(100svh - 8rem);
  margin-inline: auto;
  padding: var(--a-space-8) clamp(1rem, 4vw, 3rem);
}

.overview__intro {
  margin-block-end: var(--a-space-8);
}

.overview__intro p {
  max-inline-size: 68ch;
  margin-block-start: 0.5rem;
}

.overview__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-block: 1px solid var(--admin-line);
}

.overview__stat {
  display: grid;
  align-content: space-between;
  min-block-size: 7.5rem;
  padding: var(--a-space-4);
  border-inline-end: 1px solid var(--admin-line);
  border-block-end: 1px solid var(--admin-line);
}

.overview__stat:nth-child(3n) {
  border-inline-end: 0;
}

.overview__stat:nth-last-child(-n + 3) {
  border-block-end: 0;
}

.overview__stat dt {
  color: var(--a-color-muted);
  font-size: 0.875rem;
}

.overview__stat dd {
  margin: var(--a-space-2) 0 0;
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1;
}

.overview__actions {
  margin-block-start: var(--a-space-8);
}

.overview__actions h2 {
  margin-block-end: var(--a-space-4);
}

.overview__actions nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--a-space-2);
}

@media (max-width: 42rem) {
  .overview__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview__stat:nth-child(3n) {
    border-inline-end: 1px solid var(--admin-line);
  }

  .overview__stat:nth-child(2n) {
    border-inline-end: 0;
  }

  .overview__stat:nth-last-child(-n + 3) {
    border-block-end: 1px solid var(--admin-line);
  }

  .overview__stat:nth-last-child(-n + 2) {
    border-block-end: 0;
  }
}
</style>
