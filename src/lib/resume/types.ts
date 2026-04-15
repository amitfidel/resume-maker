// Block types that map to career profile data
export type BlockType =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "custom";

// Source types that map to career profile tables
export type SourceType =
  | "work_experience"
  | "education"
  | "skill"
  | "project"
  | "certification";

// ============================================================
// Resolved data types (profile data merged with overrides)
// ============================================================

export type ResolvedBullet = {
  id: string;
  text: string;
  visible: boolean;
};

export type ResolvedExperience = {
  id: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  bullets: ResolvedBullet[];
};

export type ResolvedEducation = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  gpa: string | null;
  description: string | null;
};

export type ResolvedSkill = {
  id: string;
  name: string;
  category: string | null;
  proficiency: string | null;
};

export type ResolvedProject = {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  technologies: string[] | null;
  bullets: ResolvedBullet[];
};

export type ResolvedCertification = {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
};

// ============================================================
// Block item (a profile item within a block, with overrides)
// ============================================================

export type ResolvedBlockItem<T = unknown> = {
  id: string; // resume_block_items.id
  sourceId: string;
  sourceType: SourceType;
  sortOrder: number;
  isVisible: boolean;
  data: T;
  hasOverrides: boolean;
};

// ============================================================
// Block (a section of the resume)
// ============================================================

export type ResolvedBlock = {
  id: string; // resume_blocks.id
  type: BlockType;
  heading: string; // resolved heading (override or default)
  defaultHeading: string;
  headingOverride: string | null;
  sortOrder: number;
  isVisible: boolean;
  config: Record<string, unknown>;
  items: ResolvedBlockItem[];
};

// ============================================================
// Full resolved resume
// ============================================================

export type ResolvedHeader = {
  fullName: string;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

export type ResolvedResume = {
  id: string;
  title: string;
  templateId: string;
  status: string;
  targetJobTitle: string | null;
  targetCompany: string | null;
  header: ResolvedHeader;
  summary: string | null;
  blocks: ResolvedBlock[];
  settings: Record<string, unknown>;
};

// Default headings for each block type
export const DEFAULT_HEADINGS: Record<BlockType, string> = {
  header: "",
  summary: "Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  custom: "Additional",
};
