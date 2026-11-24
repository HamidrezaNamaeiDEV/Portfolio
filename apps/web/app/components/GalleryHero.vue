<script setup lang="ts">
import type { mountCorridor } from '@a/three-scenes'

const props = defineProps<{
  stations: { name: string; href: string | null }[]
}>()
const activeStation = ref(0)
const station = computed(() => props.stations[activeStation.value])

const eligible = ref(false)
const phase = ref<'poster' | 'loading' | 'live' | 'failed'>('poster')
const selected = ref(false)
const canvas = useTemplateRef('surface')
const controls = useTemplateRef('controls')
let scene: Awaited<ReturnType<typeof mountCorridor>> | undefined
let pending: AbortController | undefined
let releaseContext: (() => void) | undefined
let desktop: MediaQueryList | undefined

function stop(next: 'poster' | 'failed' = 'poster') {
  pending?.abort()
  pending = undefined
  scene?.dispose()
  scene = undefined
  releaseContext?.()
  releaseContext = undefined
  selected.value = false
  activeStation.value = 0
  phase.value = next
}

function updateEligibility() {
  eligible.value = desktop?.matches ?? false
  if (eligible.value) return

  const shouldMoveFocus = controls.value?.contains(document.activeElement)
  stop()
  if (shouldMoveFocus)
    document
      .querySelector<HTMLElement>('.hero-actions a')
      ?.focus({ preventScroll: true })
}

onMounted(() => {
  desktop = matchMedia(
    '(min-width: 64rem) and (pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)',
  )
  desktop.addEventListener('change', updateEligibility)
  updateEligibility()
})
onBeforeUnmount(() => {
  desktop?.removeEventListener('change', updateEligibility)
  stop()
})

async function activate() {
  if (phase.value === 'loading' || phase.value === 'live') {
    stop()
    return
  }
  if (!eligible.value) return

  const request = new AbortController()
  pending = request
  phase.value = 'loading'
  await nextTick()
  if (request.signal.aborted) return

  const surface = canvas.value
  const contextLost = () => stop('failed')
  try {
    const context = surface?.getContext('webgl2', {
      alpha: false,
      antialias: true,
      powerPreference: 'low-power',
    })
    if (!surface || !context) throw new Error('WebGL 2 unavailable')
    surface.addEventListener('webglcontextlost', contextLost)
    releaseContext = () => {
      surface.removeEventListener('webglcontextlost', contextLost)
      if (!context.isContextLost())
        context.getExtension('WEBGL_lose_context')?.loseContext()
    }

    const { mountCorridor: mount } = await import('@a/three-scenes')
    request.signal.throwIfAborted()
    const corridor = await mount({
      canvas: surface,
      context,
      modelUrl: '/models/frontend-study.glb',
      signal: request.signal,
      onSelection: (value, index) => {
        activeStation.value = index
        selected.value = value
      },
    })
    if (request.signal.aborted) {
      corridor.dispose()
      return
    }

    scene = corridor
    phase.value = 'live'
  } catch {
    if (!request.signal.aborted) stop('failed')
  } finally {
    if (pending === request) pending = undefined
  }
}

function changeStation(event: Event) {
  scene?.goToStation(Number((event.target as HTMLSelectElement).value))
}

function select() {
  scene?.setSelected(!selected.value)
}

function restorePosterFromLink() {
  // Keep the anchor's native navigation and move focus to its destination.
  const target = document.getElementById((station.value?.href ?? '').slice(1))
  target?.focus({ preventScroll: true })
  stop()
}
</script>

<template>
  <GalleryPoster :class="{ 'gallery-poster--covered': phase === 'live' }" />
  <canvas
    v-if="phase === 'loading' || phase === 'live'"
    ref="surface"
    class="gallery-surface"
    :class="{ 'gallery-surface--live': phase === 'live' }"
    aria-hidden="true"
  ></canvas>
  <div
    v-if="eligible"
    ref="controls"
    class="gallery-controls"
    :class="{ 'gallery-controls--live': phase === 'live' }"
    role="group"
    aria-label="Engineering gallery"
  >
    <p v-if="phase === 'failed'" role="status" class="gallery-status">
      3D unavailable. The static gallery is shown.
    </p>
    <div v-if="phase === 'live'" class="gallery-station">
      <select
        aria-label="Engineering station"
        :value="activeStation"
        @change="changeStation"
      >
        <option v-for="(stop, index) in stations" :key="index" :value="index">
          {{ index + 1 }} · {{ stop.name }}
        </option>
      </select>
      <button type="button" :aria-pressed="selected" @click="select">
        Focus exhibit
      </button>
      <a
        v-if="station?.href"
        :href="station.href"
        @click="restorePosterFromLink"
        >{{ station.name }} <span aria-hidden="true">↗</span></a
      >
    </div>
    <button type="button" @click="activate">
      {{
        phase === 'live'
          ? 'Static view'
          : phase === 'loading'
            ? 'Cancel 3D loading'
            : 'Explore in 3D'
      }}
    </button>
  </div>
</template>

<style scoped>
.gallery-poster--covered {
  visibility: hidden;
}

.gallery-surface {
  position: absolute;
  inset: 0 0 0 var(--gallery-start);
  width: calc(100% - var(--gallery-start));
  height: 100%;
  opacity: 0;
  pointer-events: none;
}

.gallery-surface--live {
  opacity: 1;
  pointer-events: auto;
  mask-image:
    linear-gradient(90deg, transparent, black 18%),
    linear-gradient(0deg, transparent, black 23%);
  mask-composite: intersect;
}

.gallery-controls {
  position: absolute;
  inset-inline-end: var(--a-space-4);
  inset-block-end: var(--a-space-4);
  display: grid;
  justify-items: end;
  gap: var(--a-space-2);
}

.gallery-controls--live {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0;
  max-inline-size: calc(100% - var(--gallery-start) - var(--a-space-4));
  background: var(--a-color-surface);
  border-block: 1px solid var(--portfolio-divider);
}

.gallery-station {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: var(--a-space-2);
}

.gallery-controls button,
.gallery-controls a,
.gallery-controls .gallery-status {
  display: inline-flex;
  align-items: center;
  gap: var(--a-space-2);
  min-height: 2.75rem;
  margin: 0;
  padding: 0.45rem 0.8rem;
  border: 1px solid var(--portfolio-divider);
  background: var(--a-color-surface);
  color: var(--a-color-text);
  font: 0.85rem/1.4 var(--a-font-sans);
  text-decoration: none;
}

.gallery-controls--live :is(button, a) {
  border: 0;
  background: transparent;
}

.gallery-controls--live > button {
  border-inline-start: 1px solid var(--portfolio-divider);
  color: var(--a-color-muted);
}

.gallery-controls select {
  min-height: 2.75rem;
  max-width: 100%;
  padding-inline: var(--a-space-2);
  border: 0;
  border-inline-end: 1px solid var(--portfolio-divider);
  background: var(--a-color-surface);
  color: var(--a-color-text);
  font: 0.85rem/1.4 var(--a-font-sans);
}

.gallery-controls select:focus-visible {
  outline: 2px solid var(--a-color-accent);
  outline-offset: -3px;
}

.gallery-controls--live a {
  color: var(--a-color-accent);
}

.gallery-controls--live :is(button, a):focus-visible {
  outline-offset: -3px;
}

.gallery-controls [aria-pressed='true'],
.gallery-controls a:hover,
.gallery-controls button:hover {
  box-shadow: inset 0 -1px var(--a-color-accent);
  color: var(--a-color-accent);
}

@media (max-width: 63.999rem), (prefers-reduced-motion: reduce) {
  .gallery-surface,
  .gallery-controls {
    display: none;
  }
}
</style>
