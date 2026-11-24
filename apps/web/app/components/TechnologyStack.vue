<script setup lang="ts">
import type { PublicPortfolio } from '@a/contracts'

const props = defineProps<{
  categories: PublicPortfolio['categories']
  skills: PublicPortfolio['skills']
  ready: boolean
}>()

const activeCategory = ref<string | null>(null)
const groups = computed(() => {
  const byCategory = new Map<string | null, PublicPortfolio['skills']>()

  for (const skill of props.skills) {
    const id = skill.category?.id ?? null
    const existing = byCategory.get(id)
    if (existing) existing.push(skill)
    else byCategory.set(id, [skill])
  }

  const categorized = props.categories.flatMap((category) => {
    const skills = byCategory.get(category.id)
    return skills ? [{ ...category, skills }] : []
  })
  const uncategorized = byCategory.get(null)
  return uncategorized
    ? [
        ...categorized,
        {
          id: 'uncategorized',
          name: 'Other technologies',
          description: '',
          skills: uncategorized,
        },
      ]
    : categorized
})
const selectedGroup = computed(() =>
  groups.value.find((group) => group.id === activeCategory.value),
)
const visibleGroups = computed(() =>
  selectedGroup.value ? [selectedGroup.value] : groups.value,
)
</script>

<template>
  <section
    id="technology-stack"
    class="portfolio-section stack"
    aria-labelledby="stack-heading"
  >
    <h2 id="stack-heading">Technology Stack</h2>
    <p v-if="ready && !skills.length" class="empty-state">
      No technologies have been published yet.
    </p>
    <div
      v-if="groups.length"
      class="stack-filters"
      role="group"
      aria-label="Filter technologies"
    >
      <button
        type="button"
        :aria-pressed="!selectedGroup"
        @click="activeCategory = null"
      >
        All technologies
      </button>
      <button
        v-for="group in groups"
        :key="group.id"
        type="button"
        :aria-pressed="selectedGroup?.id === group.id"
        @click="activeCategory = group.id"
      >
        {{ group.name }}
      </button>
    </div>

    <div v-if="visibleGroups.length" class="stack-groups">
      <section
        v-for="group in visibleGroups"
        :key="group.id"
        class="stack-group"
      >
        <header>
          <h3>{{ group.name }}</h3>
          <p v-if="group.description">{{ group.description }}</p>
        </header>
        <ul class="skill-list" role="list">
          <li v-for="skill in group.skills" :key="skill.id" class="skill">
            <div class="skill-label">
              <img
                v-if="skill.logo"
                :src="skill.logo"
                width="24"
                height="24"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <h4>{{ skill.name }}</h4>
              <span v-if="skill.proficiency" class="skill-level">{{
                skill.proficiency.name
              }}</span>
            </div>
            <p v-if="skill.description" class="item-copy">
              {{ skill.description }}
            </p>
            <ul
              v-if="skill.projects.length"
              class="skill-projects"
              aria-label="Related projects"
            >
              <li v-for="project in skill.projects" :key="project.id">
                <a :href="`#project-${project.slug}`">{{ project.name }}</a>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
