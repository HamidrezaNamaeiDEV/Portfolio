<script setup lang="ts">
import type { PublicPortfolio } from '@a/contracts'
import '@a/design-tokens'
import './assets/portfolio.css'

const description =
  'Frontend-focused full-stack engineer working at the intersection of software engineering, AI, product development, and system architecture.'

useSeoMeta({
  description,
  ogTitle: 'A/ Engineering Portfolio',
  ogDescription: description,
  ogType: 'website',
})

const {
  data: portfolio,
  error,
  status,
  refresh,
} = await useFetch<PublicPortfolio>('/api/portfolio')
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
        <h1 id="identity">Software Engineer &amp; AI-Native Product Builder</h1>
        <p>{{ description }}</p>
      </div>
      <div class="intro-composition" aria-hidden="true">
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
    <a href="#main">Back to top ↑</a>
  </footer>
</template>
