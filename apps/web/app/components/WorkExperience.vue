<script setup lang="ts">
import { formatPersianMonth, type PublicPortfolio } from '@a/contracts'

const props = defineProps<{
  experiences: PublicPortfolio['experiences']
  ready: boolean
}>()

function dateRange(experience: PublicPortfolio['experiences'][number]) {
  const start = formatPersianMonth(experience.startYear, experience.startMonth)
  const { endYear, endMonth } = experience
  return endYear !== null && endMonth !== null
    ? `${start} – ${formatPersianMonth(endYear, endMonth)}`
    : `Started ${start}`
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

const timeline = computed(() =>
  props.experiences.map((experience) => ({
    ...experience,
    dateLabel: dateRange(experience),
    responsibilities: lines(experience.responsibilities),
    achievements: lines(experience.achievements),
  })),
)
</script>

<template>
  <section
    id="experience"
    class="portfolio-section experience"
    aria-labelledby="experience-heading"
  >
    <h2 id="experience-heading">Work Experience</h2>
    <p v-if="ready && !experiences.length" class="empty-state">
      No work experience has been published yet.
    </p>
    <ol v-if="timeline.length" class="timeline" role="list">
      <li v-for="entry in timeline" :key="entry.id">
        <article class="timeline-entry">
          <p class="timeline-date">
            {{ entry.dateLabel }}
            <span v-if="entry.employmentStatus === 'active'">Current role</span>
            <span v-else-if="entry.employmentStatus === 'ended'"
              >Previous role</span
            >
          </p>
          <div>
            <h3>{{ entry.company }}</h3>
            <p class="position">{{ entry.position }}</p>
            <p v-if="entry.description" class="item-copy">
              {{ entry.description }}
            </p>
            <div
              v-if="entry.responsibilities.length || entry.achievements.length"
              class="role-details"
            >
              <div v-if="entry.responsibilities.length">
                <h4>Responsibilities</h4>
                <ul>
                  <li
                    v-for="(line, index) in entry.responsibilities"
                    :key="index"
                  >
                    {{ line }}
                  </li>
                </ul>
              </div>
              <div v-if="entry.achievements.length">
                <h4>Achievements</h4>
                <ul>
                  <li v-for="(line, index) in entry.achievements" :key="index">
                    {{ line }}
                  </li>
                </ul>
              </div>
            </div>
            <ul
              v-if="entry.skills.length"
              class="related-technologies"
              aria-label="Related technologies"
              role="list"
            >
              <li v-for="skill in entry.skills" :key="skill.id">
                {{ skill.name }}
              </li>
            </ul>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>
