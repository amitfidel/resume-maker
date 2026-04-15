"use client";

import { useCallback } from "react";
import { EditableText } from "./editable-text";
import {
  updateSummary,
  updateBlockHeading,
  updateItemOverride,
} from "@/app/(dashboard)/resumes/actions";
import type {
  ResolvedResume,
  ResolvedBlock,
  ResolvedExperience,
  ResolvedEducation,
  ResolvedSkill,
  ResolvedProject,
  ResolvedCertification,
} from "@/lib/resume/types";
import { formatDateRange } from "@/templates/modern-clean/shared";

type Props = {
  resume: ResolvedResume;
};

export function InteractiveResume({ resume }: Props) {
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);

  const handleSummaryChange = useCallback(
    (text: string) => {
      updateSummary(resume.id, text);
    },
    [resume.id]
  );

  return (
    <div
      className="mx-auto w-full max-w-[800px] bg-white p-8 shadow-sm"
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "10pt",
        lineHeight: "1.4",
      }}
    >
      {/* Header */}
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {resume.header.fullName}
        </h1>
        {resume.header.headline && (
          <p className="mt-0.5 text-sm text-gray-600">
            {resume.header.headline}
          </p>
        )}
        {[resume.header.email, resume.header.phone, resume.header.location].filter(Boolean).length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {[resume.header.email, resume.header.phone, resume.header.location]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        )}
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mt-4">
          <SectionHeading>Summary</SectionHeading>
          <EditableText
            as="p"
            value={resume.summary}
            onSave={handleSummaryChange}
            className="text-sm leading-relaxed text-gray-700"
            multiline
            aiEnabled
          />
        </section>
      )}

      {/* Dynamic blocks */}
      {visibleBlocks.map((block) => {
        if (block.type === "summary") return null;
        return (
          <InteractiveBlock
            key={block.id}
            block={block}
            resumeId={resume.id}
          />
        );
      })}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-widest text-gray-700">
      {children}
    </h2>
  );
}

function InteractiveBlock({
  block,
  resumeId,
}: {
  block: ResolvedBlock;
  resumeId: string;
}) {
  const handleHeadingChange = useCallback(
    (text: string) => {
      const override = text === block.defaultHeading ? null : text;
      updateBlockHeading(resumeId, block.id, override);
    },
    [resumeId, block.id, block.defaultHeading]
  );

  const visibleItems = block.items.filter((i) => i.isVisible);

  return (
    <section className="mt-5">
      <h2 className="mb-2 border-b border-gray-300 pb-1">
        <EditableText
          value={block.heading}
          originalValue={block.defaultHeading}
          onSave={handleHeadingChange}
          className="text-xs font-bold uppercase tracking-widest text-gray-700"
        />
      </h2>

      {block.type === "experience" && (
        <ExperienceItems items={visibleItems} resumeId={resumeId} />
      )}
      {block.type === "education" && (
        <EducationItems items={visibleItems} />
      )}
      {block.type === "skills" && (
        <SkillsItems items={visibleItems} />
      )}
      {block.type === "projects" && (
        <ProjectItems items={visibleItems} resumeId={resumeId} />
      )}
      {block.type === "certifications" && (
        <CertItems items={visibleItems} />
      )}
    </section>
  );
}

// ============================================================
// Experience
// ============================================================

function ExperienceItems({
  items,
  resumeId,
}: {
  items: ResolvedBlock["items"];
  resumeId: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const exp = item.data as ResolvedExperience;
        const visibleBullets = exp.bullets.filter((b) => b.visible);

        return (
          <div key={item.id}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-semibold text-gray-900">{exp.title}</span>
                <span className="text-gray-600"> | {exp.company}</span>
                {exp.location && (
                  <span className="text-gray-400"> | {exp.location}</span>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-500">
                {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
              </span>
            </div>
            {visibleBullets.length > 0 && (
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-700">
                {visibleBullets.map((bullet) => (
                  <EditableBullet
                    key={bullet.id}
                    bulletId={bullet.id}
                    text={bullet.text}
                    itemId={item.id}
                    resumeId={resumeId}
                    currentOverrides={
                      item.hasOverrides
                        ? (undefined as unknown as Record<string, unknown>)
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditableBullet({
  bulletId,
  text,
  itemId,
  resumeId,
}: {
  bulletId: string;
  text: string;
  itemId: string;
  resumeId: string;
  currentOverrides?: Record<string, unknown>;
}) {
  const handleSave = useCallback(
    (newText: string) => {
      updateItemOverride(resumeId, itemId, {
        bullets: { [bulletId]: { text: newText } },
      });
    },
    [resumeId, itemId, bulletId]
  );

  return (
    <li>
      <EditableText value={text} onSave={handleSave} className="text-sm" aiEnabled />
    </li>
  );
}

// ============================================================
// Education
// ============================================================

function EducationItems({ items }: { items: ResolvedBlock["items"] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const edu = item.data as ResolvedEducation;
        return (
          <div key={item.id} className="flex items-baseline justify-between">
            <div>
              <span className="font-semibold text-gray-900">
                {edu.degree}
                {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
              </span>
              <span className="text-gray-600"> | {edu.institution}</span>
              {edu.gpa && (
                <span className="text-gray-400"> | GPA: {edu.gpa}</span>
              )}
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {formatDateRange(edu.startDate, edu.endDate)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Skills
// ============================================================

function SkillsItems({ items }: { items: ResolvedBlock["items"] }) {
  const skills = items.map((i) => i.data as ResolvedSkill);
  const grouped = skills.reduce<Record<string, ResolvedSkill[]>>(
    (acc, skill) => {
      const cat = skill.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([category, categorySkills]) => (
        <div key={category} className="text-sm">
          <span className="font-semibold text-gray-900">{category}:</span>{" "}
          <span className="text-gray-700">
            {categorySkills.map((s) => s.name).join(", ")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Projects
// ============================================================

function ProjectItems({
  items,
  resumeId,
}: {
  items: ResolvedBlock["items"];
  resumeId: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const proj = item.data as ResolvedProject;
        const visibleBullets = proj.bullets.filter((b) => b.visible);

        return (
          <div key={item.id}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-semibold text-gray-900">{proj.name}</span>
                {proj.technologies && proj.technologies.length > 0 && (
                  <span className="text-gray-400">
                    {" "}| {proj.technologies.join(", ")}
                  </span>
                )}
              </div>
            </div>
            {proj.description && (
              <p className="text-sm text-gray-600">{proj.description}</p>
            )}
            {visibleBullets.length > 0 && (
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-sm text-gray-700">
                {visibleBullets.map((bullet) => (
                  <EditableBullet
                    key={bullet.id}
                    bulletId={bullet.id}
                    text={bullet.text}
                    itemId={item.id}
                    resumeId={resumeId}
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Certifications
// ============================================================

function CertItems({ items }: { items: ResolvedBlock["items"] }) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const cert = item.data as ResolvedCertification;
        return (
          <div
            key={item.id}
            className="flex items-baseline justify-between text-sm"
          >
            <div>
              <span className="font-semibold text-gray-900">{cert.name}</span>
              {cert.issuer && (
                <span className="text-gray-600"> | {cert.issuer}</span>
              )}
            </div>
            {cert.issueDate && (
              <span className="text-xs text-gray-500">
                {new Date(cert.issueDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", year: "numeric" }
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
