"use client";

import { useCallback } from "react";
import { EditableText } from "./editable-text";
import { EditableDateRange } from "./editable-date-range";
import {
  updateSummary,
  updateBlockHeading,
  updateItemField,
  updateBulletText,
} from "@/app/(dashboard)/resumes/actions";
import {
  updateWorkExperienceDates,
  updateEducationDates,
  updateProjectDates,
} from "@/app/(dashboard)/profile/actions";
import type {
  ResolvedResume,
  ResolvedBlock,
  ResolvedBlockItem,
  ResolvedExperience,
  ResolvedEducation,
  ResolvedSkill,
  ResolvedProject,
  ResolvedCertification,
} from "@/lib/resume/types";

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
        <EducationItems items={visibleItems} resumeId={resumeId} />
      )}
      {block.type === "skills" && (
        <SkillsItems items={visibleItems} resumeId={resumeId} />
      )}
      {block.type === "projects" && (
        <ProjectItems items={visibleItems} resumeId={resumeId} />
      )}
      {block.type === "certifications" && (
        <CertItems items={visibleItems} resumeId={resumeId} />
      )}
    </section>
  );
}

// ============================================================
// Reusable editable field hook
// ============================================================

function useFieldUpdater(resumeId: string, itemId: string) {
  return useCallback(
    (field: string) => (value: string) => {
      updateItemField(resumeId, itemId, field, value);
    },
    [resumeId, itemId]
  );
}

// ============================================================
// Experience
// ============================================================

function ExperienceItems({
  items,
  resumeId,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ExperienceCard key={item.id} item={item} resumeId={resumeId} />
      ))}
    </div>
  );
}

function ExperienceCard({
  item,
  resumeId,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
}) {
  const exp = item.data as ResolvedExperience;
  const visibleBullets = exp.bullets.filter((b) => b.visible);
  const setField = useFieldUpdater(resumeId, item.id);

  const handleDatesChange = useCallback(
    (startDate: string | null, endDate: string | null, isCurrent: boolean) => {
      updateWorkExperienceDates(exp.id, startDate, endDate, isCurrent);
    },
    [exp.id]
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex-1 min-w-0">
          <EditableText
            value={exp.title}
            onSave={setField("title")}
            className="font-semibold text-gray-900"
          />
          <span className="text-gray-600"> | </span>
          <EditableText
            value={exp.company}
            onSave={setField("company")}
            className="text-gray-600"
          />
          <span className="text-gray-400"> | </span>
          <EditableText
            value={exp.location || ""}
            onSave={setField("location")}
            className="text-gray-400"
            placeholder="Location"
          />
        </div>
        <EditableDateRange
          startDate={exp.startDate}
          endDate={exp.endDate}
          isCurrent={exp.isCurrent}
          showIsCurrent
          onSave={handleDatesChange}
          className="shrink-0 text-xs text-gray-500"
        />
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
            />
          ))}
        </ul>
      )}
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
}) {
  const handleSave = useCallback(
    (newText: string) => {
      updateBulletText(resumeId, itemId, bulletId, newText);
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

function EducationItems({
  items,
  resumeId,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <EducationCard key={item.id} item={item} resumeId={resumeId} />
      ))}
    </div>
  );
}

function EducationCard({
  item,
  resumeId,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
}) {
  const edu = item.data as ResolvedEducation;
  const setField = useFieldUpdater(resumeId, item.id);

  const handleDatesChange = useCallback(
    (startDate: string | null, endDate: string | null) => {
      updateEducationDates(edu.id, startDate, endDate);
    },
    [edu.id]
  );

  return (
    <div className="flex items-baseline justify-between gap-2">
      <div className="flex-1 min-w-0">
        <EditableText
          value={edu.degree}
          onSave={setField("degree")}
          className="font-semibold text-gray-900"
        />
        <span className="text-gray-900"> in </span>
        <EditableText
          value={edu.fieldOfStudy || ""}
          onSave={setField("fieldOfStudy")}
          className="font-semibold text-gray-900"
          placeholder="Field of Study"
        />
        <span className="text-gray-600"> | </span>
        <EditableText
          value={edu.institution}
          onSave={setField("institution")}
          className="text-gray-600"
        />
        <span className="text-gray-400"> | GPA: </span>
        <EditableText
          value={edu.gpa || ""}
          onSave={setField("gpa")}
          className="text-gray-400"
          placeholder="—"
        />
      </div>
      <EditableDateRange
        startDate={edu.startDate}
        endDate={edu.endDate}
        onSave={handleDatesChange}
        className="shrink-0 text-xs text-gray-500"
      />
    </div>
  );
}

// ============================================================
// Skills
// ============================================================

function SkillsItems({
  items,
  resumeId,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
}) {
  // Group by category (from resolved data)
  const grouped = items.reduce<
    Record<string, Array<{ item: ResolvedBlockItem; skill: ResolvedSkill }>>
  >((acc, item) => {
    const skill = item.data as ResolvedSkill;
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ item, skill });
    return acc;
  }, {});

  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([category, entries]) => (
        <div key={category} className="text-sm">
          <span className="font-semibold text-gray-900">{category}:</span>{" "}
          <span className="text-gray-700">
            {entries.map((e, i) => (
              <span key={e.item.id}>
                <EditableSkill
                  item={e.item}
                  name={e.skill.name}
                  resumeId={resumeId}
                />
                {i < entries.length - 1 && ", "}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function EditableSkill({
  item,
  name,
  resumeId,
}: {
  item: ResolvedBlockItem;
  name: string;
  resumeId: string;
}) {
  const handleSave = useCallback(
    (newName: string) => {
      updateItemField(resumeId, item.id, "name", newName);
    },
    [resumeId, item.id]
  );

  return <EditableText value={name} onSave={handleSave} className="text-sm" />;
}

// ============================================================
// Projects
// ============================================================

function ProjectItems({
  items,
  resumeId,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} resumeId={resumeId} />
      ))}
    </div>
  );
}

function ProjectCard({
  item,
  resumeId,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
}) {
  const proj = item.data as ResolvedProject;
  const visibleBullets = proj.bullets.filter((b) => b.visible);
  const setField = useFieldUpdater(resumeId, item.id);

  return (
    <div>
      <div>
        <EditableText
          value={proj.name}
          onSave={setField("name")}
          className="font-semibold text-gray-900"
        />
        {proj.technologies && proj.technologies.length > 0 && (
          <span className="text-gray-400">
            {" "}| {proj.technologies.join(", ")}
          </span>
        )}
      </div>
      {(proj.description || true) && (
        <EditableText
          as="p"
          value={proj.description || ""}
          onSave={setField("description")}
          className="text-sm text-gray-600"
          placeholder="Add description..."
        />
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
}

// ============================================================
// Certifications
// ============================================================

function CertItems({
  items,
  resumeId,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <CertCard key={item.id} item={item} resumeId={resumeId} />
      ))}
    </div>
  );
}

function CertCard({
  item,
  resumeId,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
}) {
  const cert = item.data as ResolvedCertification;
  const setField = useFieldUpdater(resumeId, item.id);

  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <div className="flex-1 min-w-0">
        <EditableText
          value={cert.name}
          onSave={setField("name")}
          className="font-semibold text-gray-900"
        />
        <span className="text-gray-600"> | </span>
        <EditableText
          value={cert.issuer || ""}
          onSave={setField("issuer")}
          className="text-gray-600"
          placeholder="Issuer"
        />
      </div>
      {cert.issueDate && (
        <span className="shrink-0 text-xs text-gray-500">
          {new Date(cert.issueDate + "T00:00:00").toLocaleDateString(
            "en-US",
            { month: "short", year: "numeric" }
          )}
        </span>
      )}
    </div>
  );
}
