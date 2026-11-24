import {
  AdditiveBlending,
  BoxGeometry,
  DirectionalLight,
  Color,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SpotLight,
} from 'three'

type Block = [
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
]

export function buildCorridor(exhibit: Group) {
  const scene = new Scene()
  scene.background = new Color(0x141412)
  scene.fog = new Fog(0x141412, 12, 32)

  const structure = new Group()
  structure.name = 'Concrete corridor'
  scene.add(structure)
  const station = new Group()
  station.name = 'Frontend alcove'
  station.position.set(2.02, 0, -1.7)
  scene.add(station)

  const cube = new BoxGeometry()
  const concrete = new MeshStandardMaterial({
    color: 0x786a5e,
    roughness: 0.85,
  })
  const ribs = new MeshStandardMaterial({ color: 0x454038, roughness: 0.89 })
  const floor = new MeshStandardMaterial({ color: 0x524a40, roughness: 0.39 })
  const warm = new MeshBasicMaterial({ color: 0xffc991, toneMapped: false })
  const marker = new MeshBasicMaterial({ color: 0x7fbc91 })

  function blocks(
    parent: Group,
    material: MeshBasicMaterial | MeshStandardMaterial,
    pieces: Block[],
  ) {
    const instances = new InstancedMesh(cube, material, pieces.length)
    const block = new Object3D()
    for (const [index, [x, y, z, w, h, d]] of pieces.entries()) {
      block.position.set(x, y, z)
      block.scale.set(w, h, d)
      block.updateMatrix()
      instances.setMatrixAt(index, block.matrix)
    }
    parent.add(instances)
  }

  blocks(structure, concrete, [
    [-3, 1.8, -8, 0.28, 3.6, 38],
    [3.2, 1.8, -8, 0.38, 3.6, 38],
    [0, 1.8, -26, 6.4, 3.6, 0.32],
  ])
  blocks(structure, floor, [[0, -0.11, -8, 6.5, 0.22, 38]])
  const bays = [5.2, 1.1, -4.5, -9, -13.5, -18, -22.5]
  blocks(structure, ribs, [
    [0, 3.65, -8, 6.5, 0.35, 38],
    ...bays.flatMap((z): Block[] => [
      [2.82, 1.72, z, 0.42, 3.44, 0.37],
      [-2.75, 1.72, z, 0.42, 3.44, 0.37],
      [0, 3.35, z, 6.02, 0.22, 0.4],
    ]),
  ])
  blocks(structure, warm, [
    [2.98, 0.075, -8, 0.025, 0.024, 34],
    ...bays.map((z): Block => [0, 3.23, z, 1.75, 0.018, 0.04]),
  ])
  blocks(station, ribs, [
    [0.36, 0.43, 0, 1.25, 0.86, 1.75],
    [0.93, 1.78, 0, 0.12, 3.52, 3.15],
  ])
  blocks(station, concrete, [[0.26, 0.88, 0, 1.22, 0.07, 1.76]])
  blocks(station, marker, [[-0.37, 0.885, 0, 0.022, 0.023, 0.75]])
  blocks(station, warm, [[0.25, 3.43, 0, 0.16, 0.035, 0.35]])
  exhibit.position.set(0.2, 0.915, 0)
  exhibit.rotation.y = -0.82
  station.add(exhibit)

  scene.add(new HemisphereLight(0xe3d7c3, 0x67615b, 2.05))
  const doorway = new DirectionalLight(0xe4dfd2, 1.3)
  doorway.position.set(-3, 4, 9)
  scene.add(doorway)

  const lamp = new SpotLight(0xffc38d, 38, 8, 0.59, 0.8)
  lamp.position.set(1.9, 3.35, -1.25)
  lamp.target.position.set(2.6, 0.55, -1.85)
  scene.add(lamp, lamp.target)
  const farLamp = new SpotLight(0xffdab5, 65, 18, 0.6, 0.85)
  farLamp.position.set(-0.8, 3.28, -18)
  farLamp.target.position.set(0, 0, -23)
  scene.add(farLamp, farLamp.target)

  // Soft, tapered reflected light on the floor. Zero texture or render targets.
  const glow = new Mesh(
    new PlaneGeometry(2.8, 12),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `
        varying vec2 surface;
        void main() {
          surface = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
      fragmentShader: `
        varying vec2 surface;
        void main() {
          vec2 p = (surface - 0.5) * 2.;
          float pool = pow(max(0., 1. - length(p)), 2.);
          float line = exp(-9. * abs(p.x)) * max(0., 1. - abs(p.y));
          gl_FragColor = vec4(0.96, 0.61, 0.34, 0.09 * line + 0.19 * pool);
        }`,
    }),
  )
  glow.position.set(1.75, 0.005, -0.7)
  glow.rotation.x = -Math.PI / 2
  scene.add(glow)

  const hit = new Mesh(cube, new MeshBasicMaterial({ visible: false }))
  hit.position.set(0.25, 1.04, 0)
  hit.scale.set(1.45, 2.08, 1.9)
  station.add(hit)

  return { scene, hit, marker }
}
