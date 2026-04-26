import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// Users (extends Supabase Auth)
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase auth.users.id
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  careerProfile: one(careerProfiles, {
    fields: [users.id],
    references: [careerProfiles.userId],
  }),
  resumes: many(resumes),
  jobApplications: many(jobApplications),
}));

// ============================================================
// Career Profiles (1:1 with user)
// ============================================================

export const careerProfiles = pgTable("career_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"), // "Senior Software Engineer"
  summary: text("summary"),
  location: text("location"),
  phone: text("phone"),
  email: text("email"), // may differ from login email
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const careerProfilesRelations = relations(
  careerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [careerProfiles.userId],
      references: [users.id],
    }),
    workExperiences: many(workExperiences),
    education: many(education),
    skills: many(skills),
    projects: many(projects),
    certifications: many(certifications),
  })
);

// ============================================================
// Work Experiences
// ============================================================

export const workExperiences = pgTable("work_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => careerProfiles.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isCurrent: boolean("is_current").notNull().default(false),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workExperiencesRelations = relations(
  workExperiences,
  ({ one, many }) => ({
    profile: one(careerProfiles, {
      fields: [workExperiences.profileId],
      references: [careerProfiles.id],
    }),
    bullets: many(experienceBullets),
  })
);

// ============================================================
// Experience Bullets
// ============================================================

export const experienceBullets = pgTable("experience_bullets", {
  id: uuid("id").primaryKey().defaultRandom(),
  experienceId: uuid("experience_id")
    .notNull()
    .references(() => workExperiences.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const experienceBulletsRelations = relations(
  experienceBullets,
  ({ one }) => ({
    experience: one(workExperiences, {
      fields: [experienceBullets.experienceId],
      references: [workExperiences.id],
    }),
  })
);

// ============================================================
// Education
// ============================================================

export const education = pgTable("education", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => careerProfiles.id, { onDelete: "cascade" }),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  gpa: text("gpa"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const educationRelations = relations(education, ({ one }) => ({
  profile: one(careerProfiles, {
    fields: [education.profileId],
    references: [careerProfiles.id],
  }),
}));

// ============================================================
// Skills
// ============================================================

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => careerProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"), // "Languages", "Frameworks", "Tools"
  proficiency: text("proficiency"), // "expert", "proficient", "familiar"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const skillsRelations = relations(skills, ({ one }) => ({
  profile: one(careerProfiles, {
    fields: [skills.profileId],
    references: [careerProfiles.id],
  }),
}));

// ============================================================
// Projects
// ============================================================

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => careerProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url"),
  description: text("description"),
  technologies: text("technologies").array(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  profile: one(careerProfiles, {
    fields: [projects.profileId],
    references: [careerProfiles.id],
  }),
  bullets: many(projectBullets),
}));

// ============================================================
// Project Bullets
// ============================================================

export const projectBullets = pgTable("project_bullets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectBulletsRelations = relations(
  projectBullets,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectBullets.projectId],
      references: [projects.id],
    }),
  })
);

// ============================================================
// Certifications
// ============================================================

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => careerProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  issuer: text("issuer"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  credentialUrl: text("credential_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const certificationsRelations = relations(
  certifications,
  ({ one }) => ({
    profile: one(careerProfiles, {
      fields: [certifications.profileId],
      references: [careerProfiles.id],
    }),
  })
);

// ============================================================
// Resumes
// ============================================================

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  templateId: text("template_id").notNull().default("modern-clean"),
  isBase: boolean("is_base").notNull().default(true),
  parentResumeId: uuid("parent_resume_id"),
  targetJobTitle: text("target_job_title"),
  targetCompany: text("target_company"),
  status: text("status").notNull().default("draft"), // draft, active, archived
  headerOverrides: jsonb("header_overrides").$type<Record<string, string>>(),
  summaryOverride: text("summary_override"),
  settings: jsonb("settings").$type<Record<string, unknown>>(), // template customizations (colors, fonts)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  parentResume: one(resumes, {
    fields: [resumes.parentResumeId],
    references: [resumes.id],
  }),
  blocks: many(resumeBlocks),
  versions: many(resumeVersions),
  jobApplications: many(jobApplications),
}));

// ============================================================
// Resume Blocks (ordered sections of a resume)
// ============================================================

export const resumeBlocks = pgTable("resume_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  blockType: text("block_type").notNull(), // summary, experience, education, skills, projects, certifications, custom
  headingOverride: text("heading_override"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  config: jsonb("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const resumeBlocksRelations = relations(
  resumeBlocks,
  ({ one, many }) => ({
    resume: one(resumes, {
      fields: [resumeBlocks.resumeId],
      references: [resumes.id],
    }),
    items: many(resumeBlockItems),
  })
);

// ============================================================
// Resume Block Items (profile items included in a block, with overrides)
// ============================================================

export const resumeBlockItems = pgTable("resume_block_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockId: uuid("block_id")
    .notNull()
    .references(() => resumeBlocks.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // work_experience, education, skill, project, certification
  sourceId: uuid("source_id").notNull(), // FK to the profile item (polymorphic)
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  overrides: jsonb("overrides").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const resumeBlockItemsRelations = relations(
  resumeBlockItems,
  ({ one }) => ({
    block: one(resumeBlocks, {
      fields: [resumeBlockItems.blockId],
      references: [resumeBlocks.id],
    }),
  })
);

// ============================================================
// Resume Versions (snapshot history)
// ============================================================

export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeSummary: text("change_summary"),
  createdBy: text("created_by").notNull().default("user"), // user, ai_tailoring
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const resumeVersionsRelations = relations(
  resumeVersions,
  ({ one }) => ({
    resume: one(resumes, {
      fields: [resumeVersions.resumeId],
      references: [resumes.id],
    }),
  })
);

// ============================================================
// Templates (metadata - actual rendering is in code)
// ============================================================

export const templates = pgTable("templates", {
  id: text("id").primaryKey(), // slug: "modern-clean", "classic-professional"
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  config: jsonb("config").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// Job Applications
// ============================================================

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "set null",
  }),
  company: text("company").notNull(),
  position: text("position").notNull(),
  jobUrl: text("job_url"),
  jobDescription: text("job_description"),
  status: text("status").notNull().default("saved"), // saved, applied, interviewing, offered, rejected, withdrawn
  appliedDate: date("applied_date"),
  notes: text("notes"),
  salaryRange: text("salary_range"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one }) => ({
    user: one(users, {
      fields: [jobApplications.userId],
      references: [users.id],
    }),
    resume: one(resumes, {
      fields: [jobApplications.resumeId],
      references: [resumes.id],
    }),
  })
);

// ============================================================
// AI Interactions (learning layer + audit trail)
// ============================================================

export const aiInteractions = pgTable("ai_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resumeId: uuid("resume_id").references(() => resumes.id, {
    onDelete: "set null",
  }),
  interactionType: text("interaction_type").notNull(), // inline_rewrite, full_review, job_tailoring, bullet_generate, summary_generate
  inputContext: jsonb("input_context"),
  promptTemplate: text("prompt_template"),
  output: text("output"),
  wasAccepted: boolean("was_accepted"),
  wasEdited: boolean("was_edited"),
  finalText: text("final_text"),
  model: text("model"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aiInteractionsRelations = relations(
  aiInteractions,
  ({ one }) => ({
    user: one(users, {
      fields: [aiInteractions.userId],
      references: [users.id],
    }),
    resume: one(resumes, {
      fields: [aiInteractions.resumeId],
      references: [resumes.id],
    }),
  })
);

// ============================================================
// Cover Letters (per-resume, per-job)
// ============================================================
//
// A user starts with a base resume, then writes a cover letter against
// a specific job description. The CL belongs to the resume so it
// shares ownership/privacy and can be exported alongside.

export const coverLetters = pgTable("cover_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Free-text label so users can keep multiple letters per resume
  // (e.g., "Acme Senior Eng", "Pied Piper Staff Eng").
  title: text("title").notNull().default("Cover Letter"),
  // The body, plain text with paragraph breaks. Rendered in a single
  // serif column for the PDF/DOCX exports.
  body: text("body").notNull().default(""),
  // The job description the letter was written against — kept so a
  // user can re-tailor later, and so the AI sees the source-of-truth
  // when asked to rewrite.
  jobDescription: text("job_description"),
  recipientName: text("recipient_name"), // "Hiring Manager" or "Ada Lovelace"
  recipientCompany: text("recipient_company"),
  status: text("status").notNull().default("draft"), // draft | final
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const coverLettersRelations = relations(coverLetters, ({ one }) => ({
  resume: one(resumes, {
    fields: [coverLetters.resumeId],
    references: [resumes.id],
  }),
  user: one(users, {
    fields: [coverLetters.userId],
    references: [users.id],
  }),
}));

// ============================================================
// Type exports for use in application code
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type CareerProfile = typeof careerProfiles.$inferSelect;
export type NewCareerProfile = typeof careerProfiles.$inferInsert;

export type WorkExperience = typeof workExperiences.$inferSelect;
export type NewWorkExperience = typeof workExperiences.$inferInsert;

export type ExperienceBullet = typeof experienceBullets.$inferSelect;
export type NewExperienceBullet = typeof experienceBullets.$inferInsert;

export type Education = typeof education.$inferSelect;
export type NewEducation = typeof education.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectBullet = typeof projectBullets.$inferSelect;
export type NewProjectBullet = typeof projectBullets.$inferInsert;

export type Certification = typeof certifications.$inferSelect;
export type NewCertification = typeof certifications.$inferInsert;

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

export type ResumeBlock = typeof resumeBlocks.$inferSelect;
export type NewResumeBlock = typeof resumeBlocks.$inferInsert;

export type ResumeBlockItem = typeof resumeBlockItems.$inferSelect;
export type NewResumeBlockItem = typeof resumeBlockItems.$inferInsert;

export type ResumeVersion = typeof resumeVersions.$inferSelect;

export type Template = typeof templates.$inferSelect;

export type CoverLetter = typeof coverLetters.$inferSelect;
export type NewCoverLetter = typeof coverLetters.$inferInsert;

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;

export type AiInteraction = typeof aiInteractions.$inferSelect;
