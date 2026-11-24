-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialSession" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL DEFAULT '',
    "user" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proficiency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Proficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT,
    "proficiency" TEXT,
    "logo" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "startYear" INTEGER NOT NULL,
    "startMonth" INTEGER NOT NULL,
    "endYear" INTEGER,
    "endMonth" INTEGER,
    "employmentStatus" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "responsibilities" TEXT NOT NULL DEFAULT '',
    "achievements" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "cover" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Experience_skills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Experience_skills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_Project_skills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Project_skills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialSession_keyHash_key" ON "EditorialSession"("keyHash");

-- CreateIndex
CREATE INDEX "EditorialSession_user_idx" ON "EditorialSession"("user");

-- CreateIndex
CREATE INDEX "EditorialSession_expiresAt_idx" ON "EditorialSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkillCategory_name_key" ON "SkillCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Proficiency_name_key" ON "Proficiency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_proficiency_idx" ON "Skill"("proficiency");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "_Experience_skills_B_index" ON "_Experience_skills"("B");

-- CreateIndex
CREATE INDEX "_Project_skills_B_index" ON "_Project_skills"("B");

-- AddForeignKey
ALTER TABLE "EditorialSession" ADD CONSTRAINT "EditorialSession_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_category_fkey" FOREIGN KEY ("category") REFERENCES "SkillCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_proficiency_fkey" FOREIGN KEY ("proficiency") REFERENCES "Proficiency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Experience_skills" ADD CONSTRAINT "_Experience_skills_A_fkey" FOREIGN KEY ("A") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Experience_skills" ADD CONSTRAINT "_Experience_skills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Project_skills" ADD CONSTRAINT "_Project_skills_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Project_skills" ADD CONSTRAINT "_Project_skills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Enforce the published-row and ordering invariants for operator writes too.
ALTER TABLE "SkillCategory" ADD CONSTRAINT "SkillCategory_editorial_check"
  CHECK (btrim("name") <> '' AND "sortOrder" >= 0 AND "status" IN ('draft', 'published'));

ALTER TABLE "Proficiency" ADD CONSTRAINT "Proficiency_editorial_check"
  CHECK (btrim("name") <> '' AND "sortOrder" >= 0 AND "status" IN ('draft', 'published'));

ALTER TABLE "Skill" ADD CONSTRAINT "Skill_editorial_check"
  CHECK (btrim("name") <> '' AND "sortOrder" >= 0 AND "status" IN ('draft', 'published'));

ALTER TABLE "Project" ADD CONSTRAINT "Project_editorial_check"
  CHECK (btrim("name") <> '' AND "sortOrder" >= 0 AND "status" IN ('draft', 'published')
    AND "slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE "Experience" ADD CONSTRAINT "Experience_editorial_check"
  CHECK (btrim("company") <> '' AND btrim("position") <> '' AND "sortOrder" >= 0
    AND "status" IN ('draft', 'published')
    AND ("employmentStatus" IS NULL OR "employmentStatus" IN ('active', 'ended')));

ALTER TABLE "Experience" ADD CONSTRAINT "Experience_date_check"
  CHECK ("startYear" BETWEEN 1 AND 9999 AND "startMonth" BETWEEN 1 AND 12
    AND (("endYear" IS NULL AND "endMonth" IS NULL)
      OR ("endYear" IS NOT NULL AND "endMonth" IS NOT NULL
        AND "endYear" BETWEEN 1 AND 9999 AND "endMonth" BETWEEN 1 AND 12
        AND ("endYear", "endMonth") >= ("startYear", "startMonth"))));

CREATE UNIQUE INDEX "User_single_owner_key" ON "User" ("isOwner") WHERE "isOwner";
