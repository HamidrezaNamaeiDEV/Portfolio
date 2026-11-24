<script setup lang="ts">
import type { PublicPortfolio } from '@a/contracts'
import '@a/design-tokens'
import './assets/portfolio.css'

const fallbackHeadline = 'Software Engineer & AI-Native Product Builder'
const fallbackBiography =
  'Frontend-focused Full-stack Engineer working at the intersection of software engineering, AI, product development, and system architecture.'

const {
  data: portfolio,
  error,
  status,
  refresh,
} = await useFetch<PublicPortfolio>('/api/portfolio')

const profile = computed(() => portfolio.value?.profile ?? null)
const headline = computed(() => profile.value?.headline || fallbackHeadline)
const biography = computed(() => profile.value?.biography || fallbackBiography)
const identity = computed(() => profile.value?.displayName || headline.value)
const phoneHref = computed(() => {
  const phone = profile.value?.phone.replace(/[^\d+(). -]/g, '').trim()
  return phone ? `tel:${phone}` : ''
})
const socialLinks = computed(() => {
  const current = profile.value
  if (!current) return []
  return [
    { label: 'Website', href: current.websiteUrl },
    { label: 'GitHub', href: current.githubUrl },
    { label: 'GitLab', href: current.gitlabUrl },
    { label: 'LinkedIn', href: current.linkedinUrl },
    { label: 'X', href: current.xUrl },
  ].filter((link) => link.href)
})

useSeoMeta({
  description: () => biography.value,
  ogTitle: 'A/ Engineering Portfolio',
  ogDescription: () => biography.value,
  ogType: 'website',
})
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header frame">
    <a class="wordmark" href="#main" aria-label="A/ Engineering Portfolio"
      >/A</a
    >
    <nav aria-label="Portfolio">
      <a href="#technology-stack">Technologies</a>
      <a href="#experience">Experience</a>
      <a href="#projects">Projects</a>
    </nav>
  </header>

  <main id="main" class="frame" tabindex="-1">
    <section class="intro" aria-labelledby="identity">
      <div>
        <h1 id="identity">{{ identity }}</h1>
        <p v-if="profile?.displayName">{{ headline }}</p>
        <p>{{ biography }}</p>
      </div>
      <div v-if="profile?.profileImage" class="intro-portrait">
        <img
          :src="profile.profileImage"
          :alt="
            profile.displayName
              ? `${profile.displayName} portrait`
              : 'Profile portrait'
          "
          width="352"
          height="352"
          fetchpriority="high"
        />
      </div>
      <div v-else class="intro-composition" aria-hidden="true">
        <div class="intro-structure">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    </section>

    <div v-if="error" class="load-error" role="status">
      <p>Portfolio content is temporarily unavailable.</p>
      <button type="button" :disabled="status === 'pending'" @click="refresh()">
        Retry loading portfolio
      </button>
    </div>
    <p v-else-if="status === 'pending'" class="load-error" role="status">
      Loading portfolio…
    </p>

    <TechnologyStack
      :categories="portfolio?.categories ?? []"
      :skills="portfolio?.skills ?? []"
      :ready="!!portfolio"
    />
    <WorkExperience
      :experiences="portfolio?.experiences ?? []"
      :ready="!!portfolio"
    />
    <SelectedProjects
      :projects="portfolio?.projects ?? []"
      :ready="!!portfolio"
    />
  </main>

  <footer class="site-footer frame">
    <span>A/ Engineering Portfolio</span>
    <div class="site-footer__contact">
      <span v-if="profile?.location">{{ profile.location }}</span>
      <a v-if="profile?.contactEmail" :href="`mailto:${profile.contactEmail}`">
        Email
      </a>
      <a v-if="phoneHref" :href="phoneHref">Phone</a>
      <a
        v-for="link in socialLinks"
        :key="link.label"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ link.label }}
      </a>
      <a href="#main">Back to top ↑</a>
    </div>
  </footer>
</template>
