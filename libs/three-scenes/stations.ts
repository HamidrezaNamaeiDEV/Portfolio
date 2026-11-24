import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SpotLight,
} from 'three'

export const stationOffsets = [0, -5, -9.5, -14, -18.5] as const
type Block = [number, number, number, number, number, number, number?]

// Archival strata, a branching vault, a braced service span, and a folded plan.
const sculptures: Block[][] = [
  [
    [0, 0.13, 0, 0.86, 0.24, 0.88],
    [0, 0.39, 0, 0.74, 0.18, 0.75],
    [0, 0.62, 0, 0.62, 0.16, 0.63],
    [0, 0.83, 0, 0.49, 0.14, 0.5],
    [-0.37, 0.5, 0, 0.04, 0.86, 0.06],
  ],
  [
    [0, 0.39, 0, 0.16, 0.78, 0.16],
    [0, 0.69, -0.22, 0.13, 0.53, 0.13, -0.65],
    [0, 0.69, 0.22, 0.13, 0.53, 0.13, 0.65],
    [0, 0.99, -0.39, 0.24, 0.12, 0.25],
    [0, 0.99, 0.39, 0.24, 0.12, 0.25],
  ],
  [
    [0, 0.48, -0.44, 0.24, 0.96, 0.11],
    [0, 0.48, 0.44, 0.24, 0.96, 0.11],
    [0, 0.94, 0, 0.28, 0.12, 1.02],
    [0, 0.45, 0, 0.09, 1.07, 0.08, 0.69],
    [0, 0.45, 0, 0.09, 1.07, 0.08, -0.69],
  ],
  [
    [0, 0.28, -0.31, 0.6, 0.07, 0.56, -0.72],
    [0, 0.59, 0.03, 0.58, 0.07, 0.55, 0.72],
    [0, 0.87, 0.4, 0.42, 0.07, 0.48, -0.72],
    [-0.24, 0.17, -0.36, 0.06, 0.34, 0.08],
    [-0.26, 0.62, 0.08, 0.035, 0.045, 0.46, 0.72],
  ],
]

export function buildAdditionalStations() {
  const group = new Group()
  const cube = new BoxGeometry()
  const concrete = new MeshStandardMaterial({
    color: 0x786a5e,
    roughness: 0.85,
  })
  const charcoal = new MeshStandardMaterial({
    color: 0x454038,
    roughness: 0.89,
  })
  const jade = new MeshStandardMaterial({ color: 0x72957b, roughness: 0.52 })
  const invisible = new MeshBasicMaterial({ visible: false })

  function blocks(
    parent: Group,
    material: MeshStandardMaterial,
    pieces: Block[],
  ) {
    const mesh = new InstancedMesh(cube, material, pieces.length)
    const pose = new Object3D()
    pieces.forEach(([x, y, z, w, h, d, angle = 0], index) => {
      pose.position.set(x, y, z)
      pose.scale.set(w, h, d)
      pose.rotation.x = angle
      pose.updateMatrix()
      mesh.setMatrixAt(index, pose.matrix)
    })
    parent.add(mesh)
  }

  const stops = sculptures.map((pieces, index) => {
    const bay = new Group()
    bay.position.set(2.02, 0, -1.7 + stationOffsets[index + 1]!)
    group.add(bay)
    blocks(bay, charcoal, [
      [0.36, 0.43, 0, 1.25, 0.86, 1.75],
      [0.93, 1.78, 0, 0.12, 3.52, 3.15],
    ])
    blocks(bay, concrete, [[0.26, 0.88, 0, 1.22, 0.07, 1.76]])
    const form = new Group()
    form.position.set(0.19, 0.915, 0)
    bay.add(form)
    blocks(form, concrete, pieces.slice(0, -1))
    blocks(form, jade, pieces.slice(-1))
    const marker = new MeshBasicMaterial({ color: 0x7fbc91 })
    const seam = new Mesh(cube, marker)
    seam.position.set(-0.37, 0.885, 0)
    seam.scale.set(0.022, 0.023, 0.75)
    bay.add(seam)
    const lamp = new SpotLight(0xffc38d, 30, 5, 0.63, 0.8)
    lamp.position.set(0.05, 3.35, 0.38)
    lamp.target.position.set(0.55, 0.58, -0.12)
    bay.add(lamp, lamp.target)
    const hit = new Mesh(cube, invisible)
    hit.position.set(0.25, 1.04, 0)
    hit.scale.set(1.45, 2.08, 1.9)
    bay.add(hit)
    return { hit, marker }
  })
  return { group, stops }
}
