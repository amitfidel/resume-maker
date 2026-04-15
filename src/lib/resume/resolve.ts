import { db } from "@/db";
import {
  resumes,
  resumeBlocks,
  resumeBlockItems,
  careerProfiles,
  workExperiences,
  experienceBullets,
  education,
  skills,
  projects,
  projectBullets,
  certifications,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_HEADINGS,
  type BlockType,
  type ResolvedResume,
  type ResolvedBlock,
  type ResolvedBlockItem,
  type ResolvedHeader,
  type ResolvedBullet,
  type ResolvedExperience,
  type ResolvedEducation,
  type ResolvedSkill,
  type ResolvedProject,
  type ResolvedCertification,
} from "./types";

/**
 * Loads a resume and resolves all blocks by merging profile data with overrides.
 * This is the core data transformation that the editor, preview, and export all use.
 */
export async function resolveResume(
  resumeId: string
): Promise<ResolvedResume | null> {
  // Load resume with blocks and items
  const resume = await db.query.resumes.findFirst({
    where: eq(resumes.id, resumeId),
    with: {
      blocks: {
        with: { items: true },
        orderBy: (b, { asc }) => [asc(b.sortOrder)],
      },
    },
  });

  if (!resume) return null;

  // Load user and career profile with all related data
  const user = await db.query.users.findFirst({
    where: eq(users.id, resume.userId),
  });

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, resume.userId),
  });

  if (!user || !profile) return null;

  // Load all profile data in parallel
  const [expList, eduList, skillList, projList, certList] = await Promise.all([
    db.query.workExperiences.findMany({
      where: eq(workExperiences.profileId, profile.id),
      with: { bullets: { orderBy: (b, { asc }) => [asc(b.sortOrder)] } },
    }),
    db.query.education.findMany({
      where: eq(education.profileId, profile.id),
    }),
    db.query.skills.findMany({
      where: eq(skills.profileId, profile.id),
    }),
    db.query.projects.findMany({
      where: eq(projects.profileId, profile.id),
      with: { bullets: { orderBy: (b, { asc }) => [asc(b.sortOrder)] } },
    }),
    db.query.certifications.findMany({
      where: eq(certifications.profileId, profile.id),
    }),
  ]);

  // Build lookup maps for fast resolution
  const profileData = {
    work_experience: new Map(expList.map((e) => [e.id, e])),
    education: new Map(eduList.map((e) => [e.id, e])),
    skill: new Map(skillList.map((s) => [s.id, s])),
    project: new Map(projList.map((p) => [p.id, p])),
    certification: new Map(certList.map((c) => [c.id, c])),
  };

  // Resolve header
  const headerOverrides = (resume.headerOverrides ?? {}) as Record<
    string,
    string
  >;
  const header: ResolvedHeader = {
    fullName: headerOverrides.fullName ?? user.fullName ?? "",
    headline: headerOverrides.headline ?? profile.headline,
    email: headerOverrides.email ?? profile.email,
    phone: headerOverrides.phone ?? profile.phone,
    location: headerOverrides.location ?? profile.location,
    linkedinUrl: headerOverrides.linkedinUrl ?? profile.linkedinUrl,
    githubUrl: headerOverrides.githubUrl ?? profile.githubUrl,
    websiteUrl: headerOverrides.websiteUrl ?? profile.websiteUrl,
  };

  // Resolve summary
  const summary = resume.summaryOverride ?? profile.summary;

  // Resolve blocks
  const resolvedBlocks: ResolvedBlock[] = resume.blocks.map((block) => {
    const blockType = block.blockType as BlockType;
    const defaultHeading = DEFAULT_HEADINGS[blockType];

    // Sort items
    const sortedItems = [...block.items].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    // Resolve each item
    const resolvedItems: ResolvedBlockItem[] = sortedItems
      .map((item) => {
        const overrides = (item.overrides ?? {}) as Record<string, unknown>;
        const hasOverrides = Object.keys(overrides).length > 0;

        // Custom items: data is stored entirely in overrides
        if (item.sourceType === "custom") {
          return {
            id: item.id,
            sourceId: item.sourceId,
            sourceType: item.sourceType,
            sortOrder: item.sortOrder,
            isVisible: item.isVisible,
            data: {
              id: item.id,
              text: (overrides.text as string) ?? "",
              title: (overrides.title as string) ?? "",
            },
            hasOverrides,
          } as ResolvedBlockItem;
        }

        const sourceMap =
          profileData[item.sourceType as keyof typeof profileData];
        if (!sourceMap) return null;

        const sourceData = sourceMap.get(item.sourceId);
        if (!sourceData) return null;

        const resolved = resolveItem(
          item.sourceType,
          sourceData,
          overrides
        );

        return {
          id: item.id,
          sourceId: item.sourceId,
          sourceType: item.sourceType,
          sortOrder: item.sortOrder,
          isVisible: item.isVisible,
          data: resolved,
          hasOverrides,
        } as ResolvedBlockItem;
      })
      .filter((item): item is ResolvedBlockItem => item !== null);

    return {
      id: block.id,
      type: blockType,
      heading: block.headingOverride ?? defaultHeading,
      defaultHeading,
      headingOverride: block.headingOverride,
      sortOrder: block.sortOrder,
      isVisible: block.isVisible,
      config: (block.config ?? {}) as Record<string, unknown>,
      items: resolvedItems,
    };
  });

  return {
    id: resume.id,
    title: resume.title,
    templateId: resume.templateId,
    status: resume.status,
    targetJobTitle: resume.targetJobTitle,
    targetCompany: resume.targetCompany,
    header,
    summary,
    blocks: resolvedBlocks,
    settings: (resume.settings ?? {}) as Record<string, unknown>,
  };
}

/**
 * Merges a profile item with its per-resume overrides.
 * Only fields present in overrides take precedence.
 */
function resolveItem(
  sourceType: string,
  sourceData: Record<string, unknown>,
  overrides: Record<string, unknown>
): unknown {
  switch (sourceType) {
    case "work_experience":
      return resolveExperience(
        sourceData as Record<string, unknown>,
        overrides
      );
    case "education":
      return resolveEducationItem(
        sourceData as Record<string, unknown>,
        overrides
      );
    case "skill":
      return resolveSkillItem(
        sourceData as Record<string, unknown>,
        overrides
      );
    case "project":
      return resolveProjectItem(
        sourceData as Record<string, unknown>,
        overrides
      );
    case "certification":
      return resolveCertItem(
        sourceData as Record<string, unknown>,
        overrides
      );
    default:
      return sourceData;
  }
}

function resolveExperience(
  src: Record<string, unknown>,
  overrides: Record<string, unknown>
): ResolvedExperience {
  const bullets = (src.bullets as Array<Record<string, unknown>>) ?? [];
  const bulletOverrides = (overrides.bullets ?? {}) as Record<
    string,
    { text?: string; visible?: boolean }
  >;

  const resolvedBullets: ResolvedBullet[] = bullets.map((b) => {
    const bo = bulletOverrides[b.id as string];
    return {
      id: b.id as string,
      text: bo?.text ?? (b.text as string),
      visible: bo?.visible ?? true,
    };
  });

  return {
    id: src.id as string,
    company: (overrides.company as string) ?? (src.company as string),
    title: (overrides.title as string) ?? (src.title as string),
    location: (overrides.location as string) ?? (src.location as string | null),
    startDate: src.startDate as string,
    endDate: src.endDate as string | null,
    isCurrent: src.isCurrent as boolean,
    description:
      (overrides.description as string) ??
      (src.description as string | null),
    bullets: resolvedBullets,
  };
}

function resolveEducationItem(
  src: Record<string, unknown>,
  overrides: Record<string, unknown>
): ResolvedEducation {
  return {
    id: src.id as string,
    institution:
      (overrides.institution as string) ?? (src.institution as string),
    degree: (overrides.degree as string) ?? (src.degree as string),
    fieldOfStudy:
      (overrides.fieldOfStudy as string) ??
      (src.fieldOfStudy as string | null),
    startDate: src.startDate as string | null,
    endDate: src.endDate as string | null,
    gpa: (overrides.gpa as string) ?? (src.gpa as string | null),
    description:
      (overrides.description as string) ??
      (src.description as string | null),
  };
}

function resolveSkillItem(
  src: Record<string, unknown>,
  overrides: Record<string, unknown>
): ResolvedSkill {
  return {
    id: src.id as string,
    name: (overrides.name as string) ?? (src.name as string),
    category:
      (overrides.category as string) ?? (src.category as string | null),
    proficiency:
      (overrides.proficiency as string) ??
      (src.proficiency as string | null),
  };
}

function resolveProjectItem(
  src: Record<string, unknown>,
  overrides: Record<string, unknown>
): ResolvedProject {
  const bullets = (src.bullets as Array<Record<string, unknown>>) ?? [];
  const bulletOverrides = (overrides.bullets ?? {}) as Record<
    string,
    { text?: string; visible?: boolean }
  >;

  const resolvedBullets: ResolvedBullet[] = bullets.map((b) => {
    const bo = bulletOverrides[b.id as string];
    return {
      id: b.id as string,
      text: bo?.text ?? (b.text as string),
      visible: bo?.visible ?? true,
    };
  });

  return {
    id: src.id as string,
    name: (overrides.name as string) ?? (src.name as string),
    url: (overrides.url as string) ?? (src.url as string | null),
    description:
      (overrides.description as string) ??
      (src.description as string | null),
    technologies: src.technologies as string[] | null,
    bullets: resolvedBullets,
  };
}

function resolveCertItem(
  src: Record<string, unknown>,
  overrides: Record<string, unknown>
): ResolvedCertification {
  return {
    id: src.id as string,
    name: (overrides.name as string) ?? (src.name as string),
    issuer: (overrides.issuer as string) ?? (src.issuer as string | null),
    issueDate: src.issueDate as string | null,
    expiryDate: src.expiryDate as string | null,
    credentialUrl: src.credentialUrl as string | null,
  };
}
