<script setup lang="ts">
import type { PublicPortfolio } from '@a/contracts'

defineProps<{
  projects: PublicPortfolio['projects']
  ready: boolean
}>()
</script>

<template>
  <section
    id="projects"
    class="portfolio-section projects"
    aria-labelledby="projects-heading"
  >
    <h2 id="projects-heading">Selected Projects</h2>
    <p v-if="ready && !projects.length" class="empty-state">
      No projects have been published yet.
    </p>
    <ul v-if="projects.length" class="project-list" role="list">
      <li
        v-for="project in projects"
        :id="`project-${project.slug}`"
        :key="project.id"
      >
        <article class="project-entry">
          <div>
            <h3>
              <a
                v-if="project.url"
                :href="project.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ project.name }}
              </a>
              <template v-else>{{ project.name }}</template>
            </h3>
            <p v-if="project.description" class="item-copy">
              {{ project.description }}
            </p>
            <ul
              v-if="project.skills.length"
              class="related-technologies"
              aria-label="Related technologies"
              role="list"
            >
              <li v-for="skill in project.skills" :key="skill.id">
                {{ skill.name }}
              </li>
            </ul>
          </div>
          <img
            v-if="project.cover"
            :src="project.cover"
            width="240"
            height="150"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </article>
      </li>
    </ul>
  </section>
</template>
