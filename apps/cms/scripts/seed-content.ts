import { getContext } from '@keystone-6/core/context'
import * as prismaModule from '../generated/prisma/client.ts'
import config from '../keystone.ts'

const categories = {
  frontend: 'Frontend Engineering',
  backend: 'Backend & Data Engineering',
  ai: 'AI & Intelligent Development',
  infrastructure: 'Infrastructure & DevOps',
  product: 'Product & Design',
} as const
type Category = keyof typeof categories

const inventory: Record<string, readonly (readonly [string, Category])[]> = {
  Advanced: [
    ['JavaScript', 'frontend'],
    ['Vue.js', 'frontend'],
    ['HTML / CSS', 'frontend'],
    ['Pinia', 'frontend'],
    ['Vue Router', 'frontend'],
    ['Vite', 'frontend'],
    ['Nx', 'infrastructure'],
    ['Node.js', 'backend'],
    ['Express.js', 'backend'],
    ['PostgreSQL', 'backend'],
    ['Prisma', 'backend'],
    ['KeystoneJS', 'backend'],
    ['Codex', 'ai'],
    ['Claude Code', 'ai'],
    ['AI Agents', 'ai'],
    ['MCP', 'ai'],
    ['Prompt Engineering', 'ai'],
    ['Figma', 'product'],
  ],
  Intermediate: [
    ['Nuxt.js', 'frontend'],
    ['TypeScript', 'frontend'],
    ['React', 'frontend'],
    ['Linux / Ubuntu', 'infrastructure'],
    ['Docker', 'infrastructure'],
    ['Nginx', 'infrastructure'],
    ['Git / GitLab', 'infrastructure'],
    ['CI/CD', 'infrastructure'],
    ['UX/UI Design', 'product'],
    ['GSAP', 'frontend'],
    ['Three.js / TresJS', 'frontend'],
    ['Software Architecture', 'backend'],
    ['System Design', 'backend'],
    ['Database Design', 'backend'],
    ['Product Management', 'product'],
    ['Testing', 'frontend'],
    ['Performance Optimization', 'frontend'],
  ],
  Beginner: [
    ['Blender', 'product'],
    ['Spline', 'product'],
  ],
  Unverified: [
    ['REST API', 'backend'],
    ['VPS Management', 'infrastructure'],
    ['NestJS', 'backend'],
  ],
}

const experiences = [
  {
    id: 'part',
    company: 'Part Software Company',
    startYear: 1404,
    startMonth: 11,
  },
  {
    id: 'sabzcoder',
    company: 'SabzCoder Team',
    startYear: 1404,
    startMonth: 3,
  },
]
const projects = [
  { slug: 'qeshm-portal', name: 'Qeshm Portal' },
  { slug: 'luxury-auction-platform', name: 'Luxury Auction Platform' },
  { slug: 'kartamoon', name: 'Kartamoon — app.kartamoon.ir' },
]

const key = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '')
const seeded = { status: 'draft', visible: true }
const prisma: prismaModule.PrismaClient = getContext(
  config,
  prismaModule,
).prisma

try {
  await prisma.$transaction(async (transaction) => {
    for (const [sortOrder, [category, name]] of Object.entries(
      categories,
    ).entries()) {
      const id = `seed-category-${category}`
      await transaction.skillCategory.upsert({
        where: { id },
        create: { id, name, sortOrder, ...seeded },
        update: {},
      })
    }
    let sortOrder = 0
    for (const [levelOrder, [level, skills]] of Object.entries(
      inventory,
    ).entries()) {
      const proficiencyId = `seed-proficiency-${key(level)}`
      await transaction.proficiency.upsert({
        where: { id: proficiencyId },
        create: {
          id: proficiencyId,
          name: level,
          sortOrder: levelOrder,
          ...seeded,
        },
        update: {},
      })

      for (const [name, category] of skills) {
        const id = `seed-skill-${key(name)}`
        await transaction.skill.upsert({
          where: { id },
          create: {
            id,
            name,
            categoryId: `seed-category-${category}`,
            proficiencyId,
            sortOrder,
            ...seeded,
          },
          update: {},
        })
        sortOrder += 1
      }
    }

    for (const [
      sortOrder,
      { id: key, ...experience },
    ] of experiences.entries()) {
      const id = `seed-experience-${key}`
      await transaction.experience.upsert({
        where: { id },
        create: {
          ...experience,
          id,
          position: 'Software Developer',
          sortOrder,
          ...seeded,
        },
        update: {},
      })
    }

    for (const [sortOrder, project] of projects.entries()) {
      const id = `seed-project-${project.slug}`
      await transaction.project.upsert({
        where: { id },
        create: { ...project, id, sortOrder, ...seeded },
        update: {},
      })
    }
  })
  console.log(
    'Portfolio draft seed complete; existing records were left unchanged.',
  )
} finally {
  await prisma.$disconnect()
}
