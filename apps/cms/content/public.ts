import { g } from '@keystone-6/core'
import type { PrismaClient } from '../generated/prisma/client.ts'

const published = { status: 'published', visible: true }
const orderBy = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }]
const name = { id: true, name: true } as const
const projectLink = { ...name, slug: true } as const
const summary = { ...name, description: true } as const

export async function getPublicPortfolio(prisma: PrismaClient) {
  const [categories, skills, experiences, projects, logos, covers] =
    await prisma.$transaction(
      async (transaction) =>
        [
          await transaction.skillCategory.findMany({
            where: published,
            orderBy,
            select: summary,
          }),
          await transaction.skill.findMany({
            where: published,
            orderBy,
            select: {
              ...summary,
              category: { select: { ...name, status: true, visible: true } },
              proficiency: { select: { ...name, status: true, visible: true } },
              projects: { where: published, orderBy, select: projectLink },
            },
          }),
          await transaction.experience.findMany({
            where: published,
            orderBy,
            select: {
              id: true,
              company: true,
              position: true,
              startYear: true,
              startMonth: true,
              endYear: true,
              endMonth: true,
              employmentStatus: true,
              description: true,
              responsibilities: true,
              achievements: true,
              skills: { where: published, orderBy, select: name },
            },
          }),
          await transaction.project.findMany({
            where: published,
            orderBy,
            select: {
              ...summary,
              slug: true,
              skills: { where: published, orderBy, select: name },
            },
          }),
          await transaction.skill.findMany({
            where: { ...published, logo: { not: '' } },
            select: { id: true },
          }),
          await transaction.project.findMany({
            where: { ...published, cover: { not: '' } },
            select: { id: true },
          }),
        ] as const,
      { isolationLevel: 'RepeatableRead' },
    )

  const logoIds = new Set(logos.map(({ id }) => id))
  const coverIds = new Set(covers.map(({ id }) => id))

  return {
    categories,
    skills: skills.map(({ category, proficiency, ...skill }) => ({
      ...skill,
      category: publicTaxonomy(category),
      proficiency: publicTaxonomy(proficiency),
      logo: logoIds.has(skill.id) ? imagePath('skill', skill.id) : null,
    })),
    experiences,
    projects: projects.map((project) => ({
      ...project,
      cover: coverIds.has(project.id) ? imagePath('project', project.id) : null,
    })),
  }
}

function publicTaxonomy(
  taxonomy: (typeof published & { id: string; name: string }) | null,
) {
  return taxonomy?.visible && taxonomy.status === 'published'
    ? { id: taxonomy.id, name: taxonomy.name }
    : null
}

function imagePath(kind: 'skill' | 'project', id: string) {
  return `/api/images/${kind}/${encodeURIComponent(id)}`
}

export const publicSchema = g.extend({
  query: {
    publicPortfolio: g.field({
      type: g.nonNull(g.JSON),
      resolve: (_, __, context) =>
        getPublicPortfolio(context.prisma as PrismaClient),
    }),
    publicImage: g.field({
      args: {
        kind: g.arg({ type: g.nonNull(g.String) }),
        id: g.arg({ type: g.nonNull(g.ID) }),
      },
      type: g.String,
      async resolve(_, { kind, id }, context) {
        const prisma = context.prisma as PrismaClient
        const where = { ...published, id }
        if (kind === 'skill') {
          const skill = await prisma.skill.findFirst({
            where,
            select: { logo: true },
          })
          return skill?.logo || null
        }
        if (kind === 'project') {
          const project = await prisma.project.findFirst({
            where,
            select: { cover: true },
          })
          return project?.cover || null
        }
        return null
      },
    }),
  },
})
