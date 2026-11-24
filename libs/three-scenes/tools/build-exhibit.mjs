// Rebuild the original texture-free exhibit with Node 24.
import { Buffer } from 'node:buffer'
import { URL } from 'node:url'
import { writeFile } from 'node:fs/promises'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

// GLTFExporter uses the browser FileReader API to finish the binary export.
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer()
    this.onloadend()
  }
}

const exhibit = new Group()
exhibit.name = 'Frontend study'
const finishes = [
  new MeshStandardMaterial({
    color: 0x70685a,
    metalness: 0.3,
    roughness: 0.42,
  }),
  new MeshStandardMaterial({ color: 0x526b58, metalness: 0.2, roughness: 0.5 }),
  new MeshStandardMaterial({
    color: 0x9bd5a9,
    emissive: 0x305c3b,
    emissiveIntensity: 0.45,
    roughness: 0.5,
  }),
]
const parts = finishes.map(() => [])
function block(finish, width, height, depth, x, y, z) {
  parts[finish].push(new BoxGeometry(width, height, depth).translate(x, y, z))
}

// Three nested portals express a layout adapting to narrower spaces.
for (const [finish, width, height, x, z] of [
  [0, 1.18, 1.12, -0.07, -0.28],
  [1, 0.86, 0.91, 0.04, 0],
  [2, 0.53, 0.69, 0.13, 0.28],
]) {
  const rail = finish === 2 ? 0.047 : 0.085
  block(finish, width, rail, 0.09, x, height - rail / 2, z)
  for (const side of [-1, 1]) {
    block(
      finish,
      rail,
      height - rail,
      0.09,
      x + (side * (width - rail)) / 2,
      (height - rail) / 2,
      z,
    )
  }
}

for (const [index, material] of finishes.entries()) {
  exhibit.add(new Mesh(mergeGeometries(parts[index]), material))
}
const glb = await new GLTFExporter().parseAsync(exhibit, { binary: true })
await writeFile(
  new URL(
    '../../../apps/web/public/models/frontend-study.glb',
    import.meta.url,
  ),
  Buffer.from(glb),
)
