<script setup lang="ts">
import type { PublicPortfolio } from '@a/contracts'

defineOptions({ name: 'PublicPortfolioPage' })

const fallbackHeadline = 'Software Engineer & AI-Native Product Builder'
const fallbackBiography =
  'Frontend-focused Full-stack Engineer working at the intersection of software engineering, AI, product development, and system architecture.'

const {
  data: portfolio,
  error,
  status,
  refresh,
} = await useFetch<PublicPortfolio>('/api/portfolio')

const links = [
  ['home', 'Home'],
  ['technology-stack', 'Stack'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  ['about', 'About'],
  ['contact', 'Contact'],
] as const
const activeSection = ref('home')
function syncSection() {
  activeSection.value =
    links.find(([id]) => location.hash === '#' + id)?.[0] ??
    (location.hash.startsWith('#stack-')
      ? 'technology-stack'
      : location.hash.startsWith('#project-')
        ? 'projects'
        : 'home')
}
onMounted(() => {
  syncSection()
  window.addEventListener('hashchange', syncSection)
})
onUnmounted(() => window.removeEventListener('hashchange', syncSection))
const {
  public: { adminUrl, siteUrl },
} = useRuntimeConfig()
if (siteUrl) {
  useHead({ link: [{ rel: 'canonical', href: new URL('/', siteUrl).href }] })
  useSeoMeta({
    ogImage: new URL('/images/gallery-corridor.webp', siteUrl).href,
  })
}

const galleryLive = ref(false)
const galleryStations = computed(() =>
  [
    ['frontend', 'Frontend Engineering'],
    ['backend', 'Backend & Data Engineering'],
    ['ai', 'AI & Intelligent Development'],
    ['infrastructure', 'Infrastructure & DevOps'],
    ['product', 'Product & Design'],
  ].map(([key, label]) => {
    const category = portfolio.value?.categories.find(
      ({ id }) => id === `seed-category-${key}`,
    )
    const published =
      category &&
      portfolio.value?.skills.some(
        (skill) => skill.category?.id === category.id,
      )
    return {
      name: category?.name ?? label!,
      href: published ? `#stack-${category.id}` : null,
    }
  }),
)

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
      <a
        v-for="[id, label] in links"
        :key="id"
        :href="`#${id}`"
        :aria-current="activeSection === id ? 'location' : undefined"
        >{{ label }}</a
      >
    </nav>
    <a v-if="adminUrl" class="admin-link" :href="adminUrl">Admin</a>
  </header>

  <main id="main" class="frame" tabindex="-1">
    <div
      id="home"
      class="gallery-scroll"
      :class="{ 'gallery-scroll--live': galleryLive }"
    >
      <section class="intro" aria-labelledby="identity">
        <div class="hero-copy">
          <h1 id="identity">{{ identity }}</h1>
          <p v-if="profile?.displayName">{{ headline }}</p>
          <p>
            A frontend-focused full-stack software engineer working across
            modern web technologies, backend systems, AI-powered development,
            and product engineering.
          </p>
          <div class="hero-actions">
            <a href="#technology-stack"
              >Explore My Stack <span aria-hidden="true">↘</span></a
            >
            <a href="#experience">View Experience</a>
          </div>
        </div>
        <GalleryHero :stations="galleryStations" @live="galleryLive = $event" />
      </section>
    </div>

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
    <section
      id="about"
      class="portfolio-section about"
      aria-labelledby="about-heading"
    >
      <h2 id="about-heading">About</h2>
      <div>
        <p>{{ biography }}</p>
        <img
          v-if="profile?.profileImage"
          :src="profile.profileImage"
          :alt="
            profile.displayName
              ? `${profile.displayName} portrait`
              : 'Profile portrait'
          "
          width="176"
          height="176"
          loading="lazy"
        />
      </div>
    </section>

    <section
      id="contact"
      class="portfolio-section contact"
      aria-labelledby="contact-heading"
    >
      <h2 id="contact-heading">Contact</h2>
      <div class="site-footer__contact">
        <span v-if="profile?.location">{{ profile.location }}</span>
        <a
          v-if="profile?.contactEmail"
          :href="`mailto:${profile.contactEmail}`"
        >
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
        <p
          v-if="
            !profile?.location &&
            !profile?.contactEmail &&
            !phoneHref &&
            !socialLinks.length
          "
        >
          Contact details are currently unavailable.
        </p>
      </div>
    </section>
  </main>
  <footer class="site-footer frame">
    <span>A/ Engineering Portfolio</span>
    <a href="#home">Back to top ↑</a>
  </footer>
</template>
