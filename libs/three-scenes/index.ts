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
  let selected = false
  let hovered = -1
  let station = 0
  let offset = 0
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
    const targetTravel = Math.min(
      1,
      Math.max(0, -bounds.top / (bounds.height * 0.8)),
    )
    const targetApproach = selected ? 1 : 0
    const delta = lastTime ? Math.min(now - lastTime, 50) : 16
    const mix = 1 - Math.exp(-delta / 120)
    travel += (targetTravel - travel) * mix
    approach += (targetApproach - approach) * mix
    const destination = stationOffsets[station] ?? 0
    offset += (destination - offset) * mix
    if (Math.abs(destination - offset) < 0.002) offset = destination
    extension.group.visible = station !== 0 || offset !== 0
    camera.position.set(
      -0.95 + approach * 0.34,
      1.57,
      6.4 - travel * 2.8 - approach * 2 + offset,
    )
    camera.lookAt(0.68 + approach * 1.42, 1.22, -5 + approach * 3.2 + offset)
    renderer.render(scene, camera)
    canvas.dataset.galleryDrawCalls = String(renderer.info.render.calls)
    canvas.dataset.galleryTriangles = String(renderer.info.render.triangles)
    canvas.dataset.galleryTextures = String(renderer.info.memory.textures)
    lastTime = now
    if (
      Math.abs(targetTravel - travel) +
        Math.abs(targetApproach - approach) +
        Math.abs(destination - offset) >
      0.002
    )
      requestFrame()
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

  function updateMarker() {
    stops.forEach(({ marker }, index) => {
      marker.color.setHex(
        hovered === index || (selected && station === index)
          ? 0xc1ffcf
          : 0x7fbc91,
      )
    })
    canvas.style.cursor = hovered >= 0 ? 'pointer' : ''
    requestFrame()
  }

  function setSelected(value: boolean) {
    selected = value
    updateMarker()
    onSelection(value, station)
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
    if (index === station) setSelected(!selected)
    else goToStation(index)
  }

  function goToStation(index: number) {
    if (!stops[index]) return
    delete canvas.dataset.galleryStop
    station = index
    hovered = -1
    setSelected(index !== 0)
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
  window.addEventListener('scroll', requestFrame, { passive: true })
  canvas.addEventListener('pointermove', updateHover)
  canvas.addEventListener('pointerleave', clearHover)
  canvas.addEventListener('click', pick)

  return {
    setSelected,
    goToStation,
    dispose() {
      if (disposed) return
      disposed = true
      stopFrame()
      resize.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('scroll', requestFrame)
      canvas.removeEventListener('pointermove', updateHover)
      canvas.removeEventListener('pointerleave', clearHover)
      canvas.removeEventListener('click', pick)
      disposeGeometry(scene)
      renderer.dispose()
    },
  }
}
