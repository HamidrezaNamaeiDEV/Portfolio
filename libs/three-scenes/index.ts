import {
  ACESFilmicToneMapping,
  InstancedMesh,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Vector2,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { buildAdditionalStations, stationOffsets } from './stations'
import { buildCorridor } from './corridor'

interface CorridorOptions {
  canvas: HTMLCanvasElement
  context: WebGL2RenderingContext
  modelUrl: string
  signal: AbortSignal
  // eslint-disable-next-line no-unused-vars -- The parameter name describes the callback payload.
  onSelection: (selected: boolean, station: number) => void
  // eslint-disable-next-line no-unused-vars -- The argument identifies the picked station.
  onNavigate: (station: number) => void
}

function disposeGeometry(root: Object3D) {
  const materials = new Set<Material>()
  const geometries = new Set<Mesh['geometry']>()
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    geometries.add(object.geometry)
    const list = Array.isArray(object.material)
      ? object.material
      : [object.material]
    for (const material of list) materials.add(material)
    if (object instanceof InstancedMesh) object.dispose()
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
}

export async function mountCorridor({
  canvas,
  context,
  modelUrl,
  signal,
  onSelection,
  onNavigate,
}: CorridorOptions) {
  const response = await fetch(modelUrl, { signal })
  if (!response.ok) throw new Error('Gallery model unavailable')
  const buffer = await response.arrayBuffer()
  signal.throwIfAborted()
  const { scene: exhibit } = await new GLTFLoader().parseAsync(buffer, '')
  if (signal.aborted) {
    disposeGeometry(exhibit)
    signal.throwIfAborted()
  }

  const { scene, hit, marker } = buildCorridor(exhibit)
  const extension = buildAdditionalStations()
  extension.group.visible = false
  scene.add(extension.group)
  const stops = [{ hit, marker }, ...extension.stops]
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, context })
  } catch (error) {
    disposeGeometry(scene)
    throw error
  }
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const camera = new PerspectiveCamera(51, 1, 0.1, 45)
  const ray = new Raycaster()
  const pointer = new Vector2()

  let frame = 0
  let lastTime = 0
  let inView = true
  let disposed = false
  let focus: boolean | null = null
  let hovered = -1
  let station = 0
  let progress = 0
  let resized = true
  let travel = 0
  let approach = 0

  function requestFrame() {
    if (!frame && !disposed && inView && !document.hidden)
      frame = requestAnimationFrame(draw)
  }

  function stopFrame() {
    cancelAnimationFrame(frame)
    frame = 0
    lastTime = 0
  }

  function draw(now: number) {
    frame = 0
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    if (resized) {
      const ratio = Math.min(
        devicePixelRatio,
        1.25,
        Math.sqrt(1_000_000 / (bounds.width * bounds.height)),
      )
      renderer.setPixelRatio(ratio)
      renderer.setSize(bounds.width, bounds.height, false)
      camera.aspect = bounds.width / bounds.height
      camera.updateProjectionMatrix()
      resized = false
    }
    const targetApproach =
      focus === null
        ? Math.min(1, progress * (stops.length - 1))
        : Number(focus)
    const delta = lastTime ? Math.min(now - lastTime, 50) : 16
    const mix = 1 - Math.exp(-delta / 120)
    travel += (progress - travel) * mix
    approach += (targetApproach - approach) * mix
    if (Math.abs(progress - travel) < 0.0005) travel = progress
    if (Math.abs(targetApproach - approach) < 0.0005) approach = targetApproach

    const position = travel * (stops.length - 1)
    const from = Math.floor(position)
    const start = stationOffsets[from] ?? 0
    const end = stationOffsets[from + 1] ?? start
    const offset = start + (end - start) * (position - from)
    extension.group.visible = travel > 0 || progress > 0
    camera.position.set(
      -0.95 + approach * 0.34,
      1.57,
      6.4 - approach * 2 + offset,
    )
    camera.lookAt(0.68 + approach * 1.42, 1.22, -5 + approach * 3.2 + offset)
    renderer.render(scene, camera)
    canvas.dataset.galleryDrawCalls = String(renderer.info.render.calls)
    canvas.dataset.galleryTriangles = String(renderer.info.render.triangles)
    canvas.dataset.galleryTextures = String(renderer.info.memory.textures)
    canvas.dataset.galleryProgress = travel.toFixed(4)
    lastTime = now
    if (travel !== progress || approach !== targetApproach) requestFrame()
    else {
      lastTime = 0
      canvas.dataset.galleryStop = String(station)
    }
  }

  function pointsAtStation(event: MouseEvent) {
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return -1
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    )
    ray.setFromCamera(pointer, camera)
    const candidates = extension.group.visible ? stops : stops.slice(0, 1)
    const closest = ray.intersectObjects(
      candidates.map(({ hit }) => hit),
      false,
    )[0]
    return closest ? stops.findIndex(({ hit }) => hit === closest.object) : -1
  }

  function isFocused() {
    return focus ?? station !== 0
  }

  function updateMarker() {
    stops.forEach(({ marker }, index) => {
      marker.color.setHex(
        hovered === index || (isFocused() && station === index)
          ? 0xc1ffcf
          : 0x7fbc91,
      )
    })
    canvas.style.cursor = hovered >= 0 ? 'pointer' : ''
    requestFrame()
  }

  function setSelected(value: boolean) {
    focus = value
    updateMarker()
    onSelection(value, station)
  }

  function setProgress(value: number, settle = false) {
    const next = Math.min(1, Math.max(0, value))
    if (progress === next && (!settle || travel === next)) return
    progress = next
    delete canvas.dataset.galleryStop
    const nextStation = Math.round(progress * (stops.length - 1))
    if (nextStation !== station) {
      station = nextStation
      focus = null
      updateMarker()
      onSelection(isFocused(), station)
    }
    if (settle) {
      travel = progress
      approach =
        focus === null
          ? Math.min(1, progress * (stops.length - 1))
          : Number(focus)
    }
    requestFrame()
  }

  function updateHover(event: PointerEvent) {
    const next = pointsAtStation(event)
    if (next === hovered) return
    hovered = next
    updateMarker()
  }

  function clearHover() {
    if (hovered < 0) return
    hovered = -1
    updateMarker()
  }

  function pick(event: MouseEvent) {
    const index = pointsAtStation(event)
    if (index < 0) return
    if (index === station) setSelected(!isFocused())
    else onNavigate(index)
  }

  function updateVisibility() {
    if (document.hidden || !inView) stopFrame()
    else requestFrame()
  }

  const resize = new ResizeObserver(() => {
    resized = true
    requestFrame()
  })
  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? false
    updateVisibility()
  })

  // Draw before the poster is covered and before installing recurring work.
  try {
    draw(performance.now())
  } catch (error) {
    stopFrame()
    disposeGeometry(scene)
    renderer.dispose()
    throw error
  }
  resize.observe(canvas)
  intersection.observe(canvas)
  document.addEventListener('visibilitychange', updateVisibility)
  canvas.addEventListener('pointermove', updateHover)
  canvas.addEventListener('pointerleave', clearHover)
  canvas.addEventListener('click', pick)

  return {
    setSelected,
    setProgress,
    dispose() {
      if (disposed) return
      disposed = true
      stopFrame()
      resize.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
      canvas.removeEventListener('pointermove', updateHover)
      canvas.removeEventListener('pointerleave', clearHover)
      canvas.removeEventListener('click', pick)
      disposeGeometry(scene)
      renderer.dispose()
    },
  }
}
