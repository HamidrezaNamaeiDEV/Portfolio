<script setup lang="ts">
import type { PublicPortfolio } from '@a/contracts'

const props = defineProps<{
  categories: PublicPortfolio['categories']
  skills: PublicPortfolio['skills']
  ready: boolean
}>()

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
const domainDescriptions: Record<string, string> = {
  'Frontend Engineering':
    'Interfaces, application architecture, and web performance.',
  'Backend & Data Engineering': 'APIs, persistence, and data modeling.',
  'AI & Intelligent Development':
    'AI tools and workflows for software development.',
  'Infrastructure & DevOps':
    'Deployment, automation, and runtime infrastructure.',
  'Product & Design': 'Product thinking, interface design, and prototyping.',
}
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
    <nav
      v-if="groups.length"
      class="domain-index"
      aria-label="Engineering domains"
    >
      <a v-for="group in groups" :key="group.id" :href="`#stack-${group.id}`">
        <strong>{{ group.name }}</strong>
        <span>{{ group.description || domainDescriptions[group.name] }}</span>
      </a>
    </nav>

    <div v-if="groups.length" class="stack-groups">
      <section
        v-for="group in groups"
        :id="`stack-${group.id}`"
        tabindex="-1"
        :key="group.id"
        class="stack-group"
      >
        <header>
          <h3>{{ group.name }}</h3>
          <p v-if="group.description">{{ group.description }}</p>
        </header>
        <ul class="skill-list" role="list">
          <li v-for="skill in group.skills" :key="skill.id" class="skill">
            <details v-if="skill.description || skill.projects.length">
              <summary class="skill-label">
                <img
                  v-if="skill.logo"
                  :src="skill.logo"
                  width="24"
                  height="24"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <strong>{{ skill.name }}</strong>
                <span v-if="skill.proficiency" class="skill-level">{{
                  skill.proficiency.name
                }}</span>
              </summary>
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
            </details>
            <div v-else class="skill-label">
              <img
                v-if="skill.logo"
                :src="skill.logo"
                width="24"
                height="24"
                alt=""
                loading="lazy"
              />
              <h4>{{ skill.name }}</h4>
              <span v-if="skill.proficiency" class="skill-level">{{
                skill.proficiency.name
              }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
