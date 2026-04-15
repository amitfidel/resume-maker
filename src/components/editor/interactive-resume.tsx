"use client";

import { useCallback } from "react";
import { EditableText } from "./editable-text";
import { EditableDateRange } from "./editable-date-range";
import {
  updateSummary,
  updateBlockHeading,
  updateItemField,
  updateBulletText,
  addItemToBlock,
  removeItemFromBlock,
  addBulletToItem,
  deleteBlock,
} from "@/app/(dashboard)/resumes/actions";
import {
  updateWorkExperienceDates,
  updateEducationDates,
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
  ResolvedCustomItem,
} from "@/lib/resume/types";
import { getStyle, type TemplateStyle } from "@/templates/styles";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  resume: ResolvedResume;
};

const BLOCK_ADD_LABELS: Record<string, string> = {
  experience: "Add Experience",
  education: "Add Education",
  skills: "Add Skill",
  projects: "Add Project",
  certifications: "Add Certification",
  custom: "Add Item",
};

export function InteractiveResume({ resume }: Props) {
  const style = getStyle(resume.templateId);

  if (style.layout === "two-column") {
    return <TwoColumnLayout resume={resume} style={style} />;
  }

  return <SingleColumnLayout resume={resume} style={style} />;
}

// ============================================================
// Single-column layout
// ============================================================

function SingleColumnLayout({
  resume,
  style,
}: {
  resume: ResolvedResume;
  style: TemplateStyle;
}) {
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);

  const handleSummaryChange = useCallback(
    (text: string) => {
      updateSummary(resume.id, text);
    },
    [resume.id]
  );

  return (
    <div
      className="mx-auto w-full max-w-[820px] bg-white shadow-sm"
      style={{
        fontFamily: style.fontFamily,
        fontSize: style.baseFontSize,
        lineHeight: style.lineHeight,
        color: style.textColor,
        padding: style.padding,
      }}
    >
      <Header resume={resume} style={style} />

      {resume.summary && (
        <SummarySection
          summary={resume.summary}
          style={style}
          onSave={handleSummaryChange}
        />
      )}

      {visibleBlocks.map((block) => {
        if (block.type === "summary") return null;
        return (
          <InteractiveBlock
            key={block.id}
            block={block}
            resumeId={resume.id}
            style={style}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// Two-column layout (sidebar + main)
// ============================================================

function TwoColumnLayout({
  resume,
  style,
}: {
  resume: ResolvedResume;
  style: TemplateStyle;
}) {
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);

  // Route certain block types to sidebar: skills, certifications
  const sidebarBlocks = visibleBlocks.filter(
    (b) => b.type === "skills" || b.type === "certifications"
  );
  const mainBlocks = visibleBlocks.filter(
    (b) => b.type !== "skills" && b.type !== "certifications" && b.type !== "summary"
  );

  const handleSummaryChange = useCallback(
    (text: string) => {
      updateSummary(resume.id, text);
    },
    [resume.id]
  );

  return (
    <div
      className="mx-auto w-full max-w-[820px] bg-white shadow-sm flex"
      style={{
        fontFamily: style.fontFamily,
        fontSize: style.baseFontSize,
        lineHeight: style.lineHeight,
        color: style.textColor,
      }}
    >
      {/* Sidebar */}
      <aside
        className="w-[38%] shrink-0 p-6 space-y-5"
        style={{
          backgroundColor: style.sidebarBg,
          color: style.sidebarTextColor,
        }}
      >
        <Header resume={resume} style={style} sidebar />

        {/* Contact section in sidebar */}
        <div>
          <SidebarHeading style={style}>Contact</SidebarHeading>
          <div className="space-y-1 text-xs" style={{ color: style.sidebarTextColor }}>
            {resume.header.email && <div>{resume.header.email}</div>}
            {resume.header.phone && <div>{resume.header.phone}</div>}
            {resume.header.location && <div>{resume.header.location}</div>}
            {resume.header.linkedinUrl && <div className="truncate">{resume.header.linkedinUrl}</div>}
            {resume.header.githubUrl && <div className="truncate">{resume.header.githubUrl}</div>}
          </div>
        </div>

        {sidebarBlocks.map((block) => (
          <SidebarBlock key={block.id} block={block} resumeId={resume.id} style={style} />
        ))}
      </aside>

      {/* Main column */}
      <main className="flex-1 p-6 space-y-4 min-w-0">
        {resume.summary && (
          <SummarySection
            summary={resume.summary}
            style={style}
            onSave={handleSummaryChange}
          />
        )}

        {mainBlocks.map((block) => (
          <InteractiveBlock
            key={block.id}
            block={block}
            resumeId={resume.id}
            style={style}
          />
        ))}
      </main>
    </div>
  );
}

// ============================================================
// Header
// ============================================================

function Header({
  resume,
  style,
  sidebar = false,
}: {
  resume: ResolvedResume;
  style: TemplateStyle;
  sidebar?: boolean;
}) {
  if (sidebar) {
    return (
      <header className="mb-2">
        <h1
          style={{
            fontFamily: style.headingFont,
            fontSize: style.header.nameSize,
            fontWeight: style.header.nameWeight,
            letterSpacing: style.nameTracking,
            color: style.sidebarTextColor,
            lineHeight: "1.1",
          }}
        >
          {resume.header.fullName}
        </h1>
        {resume.header.headline && (
          <p className="mt-1 text-xs opacity-80" style={{ color: style.sidebarTextColor }}>
            {resume.header.headline}
          </p>
        )}
      </header>
    );
  }

  const headerStyle = style.header;
  const contacts = [resume.header.email, resume.header.phone, resume.header.location].filter(Boolean);
  const links = [resume.header.linkedinUrl, resume.header.githubUrl, resume.header.websiteUrl].filter(Boolean);

  const alignClass = headerStyle.align === "center" ? "text-center" : "text-left";

  return (
    <header
      className={`${alignClass} pb-3`}
      style={{
        marginBottom: "1rem",
        borderBottom:
          headerStyle.style === "bordered-bottom"
            ? `3px solid ${style.primaryColor}`
            : headerStyle.style === "bordered-top"
            ? "none"
            : "none",
        borderTop:
          headerStyle.style === "bordered-top"
            ? `3px solid ${style.primaryColor}`
            : "none",
        paddingTop: headerStyle.style === "bordered-top" ? "0.75rem" : undefined,
        position: "relative",
      }}
    >
      {headerStyle.style === "accent-bar" && (
        <div
          className="mb-2 h-1 w-16"
          style={{ backgroundColor: style.accentBarColor }}
        />
      )}

      <h1
        style={{
          fontFamily: style.headingFont,
          fontSize: headerStyle.nameSize,
          fontWeight: headerStyle.nameWeight,
          color: headerStyle.nameColor,
          letterSpacing: style.nameTracking,
          lineHeight: "1.15",
        }}
      >
        {resume.header.fullName}
      </h1>

      {resume.header.headline && (
        <p
          className="mt-0.5"
          style={{ fontSize: "0.9rem", color: style.mutedColor }}
        >
          {resume.header.headline}
        </p>
      )}

      {contacts.length > 0 && (
        <p className="mt-1.5" style={{ fontSize: "0.75rem", color: style.mutedColor }}>
          {contacts.join("   •   ")}
        </p>
      )}

      {links.length > 0 && (
        <p className="mt-0.5" style={{ fontSize: "0.75rem", color: style.mutedColor }}>
          {links.join("   •   ")}
        </p>
      )}
    </header>
  );
}

// ============================================================
// Section heading
// ============================================================

function SectionHeadingEl({
  children,
  style,
}: {
  children: React.ReactNode;
  style: TemplateStyle;
}) {
  const sh = style.sectionHeading;

  return (
    <h2
      style={{
        fontFamily: style.headingFont,
        fontSize: sh.size,
        fontWeight: sh.weight,
        color: sh.color,
        letterSpacing: sh.tracking,
        textTransform: sh.case === "upper" ? "uppercase" : "none",
        marginBottom: sh.marginBottom,
        borderBottom:
          sh.border === "bottom"
            ? `1px solid ${style.dividerColor}`
            : sh.border === "full-bottom"
            ? `2px solid ${style.dividerColor}`
            : "none",
        borderLeft:
          sh.border === "left-accent" ? `3px solid ${style.accentColor}` : "none",
        paddingLeft: sh.border === "left-accent" ? "0.5rem" : 0,
        paddingBottom: sh.border === "bottom" || sh.border === "full-bottom" ? "0.25rem" : 0,
      }}
    >
      {children}
    </h2>
  );
}

function SidebarHeading({
  children,
  style,
}: {
  children: React.ReactNode;
  style: TemplateStyle;
}) {
  return (
    <h2
      className="mb-2 pb-1"
      style={{
        fontFamily: style.headingFont,
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: style.sidebarTextColor,
        borderBottom: `1px solid rgba(255,255,255,0.2)`,
      }}
    >
      {children}
    </h2>
  );
}

// ============================================================
// Summary
// ============================================================

function SummarySection({
  summary,
  style,
  onSave,
}: {
  summary: string;
  style: TemplateStyle;
  onSave: (text: string) => void;
}) {
  return (
    <section style={{ marginTop: style.sectionSpacing }}>
      <SectionHeadingEl style={style}>Summary</SectionHeadingEl>
      <EditableText
        as="p"
        value={summary}
        onSave={onSave}
        multiline
        aiEnabled
        style={{ fontSize: "0.9rem", color: style.textColor, lineHeight: style.lineHeight }}
      />
    </section>
  );
}

// ============================================================
// Block
// ============================================================

function InteractiveBlock({
  block,
  resumeId,
  style,
}: {
  block: ResolvedBlock;
  resumeId: string;
  style: TemplateStyle;
}) {
  const handleHeadingChange = useCallback(
    (text: string) => {
      const override = text === block.defaultHeading ? null : text;
      updateBlockHeading(resumeId, block.id, override);
    },
    [resumeId, block.id, block.defaultHeading]
  );

  const handleAddItem = useCallback(() => {
    addItemToBlock(resumeId, block.id);
  }, [resumeId, block.id]);

  const handleDeleteBlock = useCallback(() => {
    if (confirm(`Delete the "${block.heading}" section from this resume?`)) {
      deleteBlock(resumeId, block.id);
    }
  }, [resumeId, block.id, block.heading]);

  const visibleItems = block.items.filter((i) => i.isVisible);
  const sh = style.sectionHeading;

  return (
    <section
      className="group/section relative"
      style={{ marginTop: style.sectionSpacing }}
    >
      <div
        className="mb-1 flex items-end justify-between"
        style={{
          borderBottom:
            sh.border === "bottom" ? `1px solid ${style.dividerColor}` :
            sh.border === "full-bottom" ? `2px solid ${style.dividerColor}` :
            "none",
          paddingBottom: (sh.border === "bottom" || sh.border === "full-bottom") ? "0.25rem" : 0,
        }}
      >
        <EditableText
          value={block.heading}
          originalValue={block.defaultHeading || undefined}
          onSave={handleHeadingChange}
          placeholder="Section Name"
          style={{
            fontFamily: style.headingFont,
            fontSize: sh.size,
            fontWeight: sh.weight,
            color: sh.color,
            letterSpacing: sh.tracking,
            textTransform: sh.case === "upper" ? "uppercase" : "none",
          }}
        />
        <button
          onClick={handleDeleteBlock}
          className="opacity-0 group-hover/section:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
          title="Remove section from this resume"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div style={{ marginTop: sh.marginBottom }}>
        {block.type === "experience" && (
          <ExperienceItems items={visibleItems} resumeId={resumeId} style={style} />
        )}
        {block.type === "education" && (
          <EducationItems items={visibleItems} resumeId={resumeId} style={style} />
        )}
        {block.type === "skills" && (
          <SkillsItems items={visibleItems} resumeId={resumeId} style={style} />
        )}
        {block.type === "projects" && (
          <ProjectItems items={visibleItems} resumeId={resumeId} style={style} />
        )}
        {block.type === "certifications" && (
          <CertItems items={visibleItems} resumeId={resumeId} style={style} />
        )}
        {block.type === "custom" && (
          <CustomItems items={visibleItems} resumeId={resumeId} style={style} />
        )}
      </div>

      <button
        onClick={handleAddItem}
        className="mt-2 flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-all"
        style={{ color: style.accentColor }}
      >
        <Plus className="h-3 w-3" />
        {BLOCK_ADD_LABELS[block.type] ?? "Add Item"}
      </button>
    </section>
  );
}

// Sidebar version of blocks (only for skills / certs in two-column layout)
function SidebarBlock({
  block,
  resumeId,
  style,
}: {
  block: ResolvedBlock;
  resumeId: string;
  style: TemplateStyle;
}) {
  const handleHeadingChange = useCallback(
    (text: string) => {
      const override = text === block.defaultHeading ? null : text;
      updateBlockHeading(resumeId, block.id, override);
    },
    [resumeId, block.id, block.defaultHeading]
  );

  const handleAddItem = useCallback(() => {
    addItemToBlock(resumeId, block.id);
  }, [resumeId, block.id]);

  const visibleItems = block.items.filter((i) => i.isVisible);

  return (
    <div>
      <SidebarHeading style={style}>
        <EditableText
          value={block.heading}
          originalValue={block.defaultHeading || undefined}
          onSave={handleHeadingChange}
          style={{ color: style.sidebarTextColor }}
        />
      </SidebarHeading>

      {block.type === "skills" && (
        <SidebarSkills items={visibleItems} resumeId={resumeId} style={style} />
      )}
      {block.type === "certifications" && (
        <SidebarCerts items={visibleItems} resumeId={resumeId} style={style} />
      )}

      <button
        onClick={handleAddItem}
        className="mt-2 flex items-center gap-1.5 text-[0.65rem] opacity-70 hover:opacity-100"
        style={{ color: style.sidebarTextColor }}
      >
        <Plus className="h-2.5 w-2.5" />
        Add
      </button>
    </div>
  );
}

// ============================================================
// Reusable hooks
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
// Item wrapper with delete button
// ============================================================

function ItemWrapper({
  children,
  resumeId,
  itemId,
  className,
  style,
}: {
  children: React.ReactNode;
  resumeId: string;
  itemId: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const handleDelete = useCallback(() => {
    removeItemFromBlock(resumeId, itemId);
  }, [resumeId, itemId]);

  return (
    <div className={`group/item relative ${className ?? ""}`} style={style}>
      {children}
      <button
        onClick={handleDelete}
        className="absolute -right-1 top-0 opacity-0 group-hover/item:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
        title="Remove from this resume"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================================
// Experience
// ============================================================

function ExperienceItems({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: style.itemSpacing }}>
      {items.map((item) => (
        <ExperienceCard key={item.id} item={item} resumeId={resumeId} style={style} />
      ))}
    </div>
  );
}

function ExperienceCard({
  item,
  resumeId,
  style,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
  style: TemplateStyle;
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

  const handleAddBullet = useCallback(() => {
    addBulletToItem(resumeId, item.id);
  }, [resumeId, item.id]);

  return (
    <ItemWrapper resumeId={resumeId} itemId={item.id}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex-1 min-w-0">
          <EditableText
            value={exp.title}
            onSave={setField("title")}
            style={{ fontWeight: 600, color: style.primaryColor }}
          />
          <span style={{ color: style.mutedColor }}> · </span>
          <EditableText
            value={exp.company}
            onSave={setField("company")}
            style={{ color: style.textColor }}
          />
          {(exp.location || true) && (
            <>
              <span style={{ color: style.mutedColor }}> · </span>
              <EditableText
                value={exp.location || ""}
                onSave={setField("location")}
                placeholder="Location"
                style={{ color: style.mutedColor, fontSize: "0.85em" }}
              />
            </>
          )}
        </div>
        <EditableDateRange
          startDate={exp.startDate}
          endDate={exp.endDate}
          isCurrent={exp.isCurrent}
          showIsCurrent
          onSave={handleDatesChange}
          style={{ color: style.mutedColor, fontSize: "0.8rem", flexShrink: 0 }}
        />
      </div>
      <ul
        style={{
          marginTop: "0.25rem",
          marginLeft: "1.25rem",
          listStyle: bulletListStyle(style.bulletStyle),
          fontSize: "0.9em",
          color: style.textColor,
        }}
      >
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
      <button
        onClick={handleAddBullet}
        className="mt-1 ml-5 flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-all"
        style={{ color: style.accentColor }}
      >
        <Plus className="h-3 w-3" />
        Add bullet
      </button>
    </ItemWrapper>
  );
}

function bulletListStyle(type: string): string {
  switch (type) {
    case "disc":
      return "disc";
    case "square":
      return "square";
    case "dash":
      return "'— '";
    case "none":
      return "none";
    default:
      return "disc";
  }
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
      <EditableText value={text} onSave={handleSave} aiEnabled />
    </li>
  );
}

// ============================================================
// Education
// ============================================================

function EducationItems({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item) => (
        <EducationCard key={item.id} item={item} resumeId={resumeId} style={style} />
      ))}
    </div>
  );
}

function EducationCard({
  item,
  resumeId,
  style,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
  style: TemplateStyle;
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
    <ItemWrapper
      resumeId={resumeId}
      itemId={item.id}
      className="flex items-baseline justify-between gap-2"
    >
      <div className="flex-1 min-w-0">
        <EditableText
          value={edu.degree}
          onSave={setField("degree")}
          style={{ fontWeight: 600, color: style.primaryColor }}
        />
        <span style={{ color: style.primaryColor }}> in </span>
        <EditableText
          value={edu.fieldOfStudy || ""}
          onSave={setField("fieldOfStudy")}
          placeholder="Field of Study"
          style={{ fontWeight: 600, color: style.primaryColor }}
        />
        <span style={{ color: style.mutedColor }}> · </span>
        <EditableText
          value={edu.institution}
          onSave={setField("institution")}
          style={{ color: style.textColor }}
        />
        <span style={{ color: style.mutedColor }}> · GPA: </span>
        <EditableText
          value={edu.gpa || ""}
          onSave={setField("gpa")}
          placeholder="—"
          style={{ color: style.mutedColor }}
        />
      </div>
      <EditableDateRange
        startDate={edu.startDate}
        endDate={edu.endDate}
        onSave={handleDatesChange}
        style={{ color: style.mutedColor, fontSize: "0.8rem", flexShrink: 0 }}
      />
    </ItemWrapper>
  );
}

// ============================================================
// Skills
// ============================================================

function SkillsItems({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  const grouped = groupSkills(items);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {Object.entries(grouped).map(([category, entries]) => (
        <div key={category} style={{ fontSize: "0.9em" }}>
          <span style={{ fontWeight: 600, color: style.primaryColor }}>{category}:</span>{" "}
          <span style={{ color: style.textColor }}>
            {entries.map((e, i) => (
              <span key={e.item.id} className="group/skill relative inline-flex items-center">
                <EditableSkill
                  item={e.item}
                  name={e.skill.name}
                  resumeId={resumeId}
                />
                <button
                  onClick={() => removeItemFromBlock(resumeId, e.item.id)}
                  className="ml-0.5 opacity-0 group-hover/skill:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
                {i < entries.length - 1 && ", "}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function SidebarSkills({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  const grouped = groupSkills(items);

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, entries]) => (
        <div key={category}>
          <p className="text-[0.65rem] uppercase tracking-wider opacity-70 mb-1" style={{ color: style.sidebarTextColor }}>
            {category}
          </p>
          <div className="flex flex-wrap gap-1">
            {entries.map((e) => (
              <span
                key={e.item.id}
                className="group/skill relative text-[0.7rem] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: style.sidebarTextColor,
                }}
              >
                <EditableSkill item={e.item} name={e.skill.name} resumeId={resumeId} />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupSkills(items: ResolvedBlockItem[]) {
  return items.reduce<
    Record<string, Array<{ item: ResolvedBlockItem; skill: ResolvedSkill }>>
  >((acc, item) => {
    const skill = item.data as ResolvedSkill;
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ item, skill });
    return acc;
  }, {});
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

  return <EditableText value={name} onSave={handleSave} />;
}

// ============================================================
// Projects
// ============================================================

function ProjectItems({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: style.itemSpacing }}>
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} resumeId={resumeId} style={style} />
      ))}
    </div>
  );
}

function ProjectCard({
  item,
  resumeId,
  style,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
  style: TemplateStyle;
}) {
  const proj = item.data as ResolvedProject;
  const visibleBullets = proj.bullets.filter((b) => b.visible);
  const setField = useFieldUpdater(resumeId, item.id);

  const handleAddBullet = useCallback(() => {
    addBulletToItem(resumeId, item.id);
  }, [resumeId, item.id]);

  return (
    <ItemWrapper resumeId={resumeId} itemId={item.id}>
      <div>
        <EditableText
          value={proj.name}
          onSave={setField("name")}
          style={{ fontWeight: 600, color: style.primaryColor }}
        />
        {proj.technologies && proj.technologies.length > 0 && (
          <span style={{ color: style.mutedColor }}>
            {" "}· {proj.technologies.join(", ")}
          </span>
        )}
      </div>
      <EditableText
        as="p"
        value={proj.description || ""}
        onSave={setField("description")}
        placeholder="Add description..."
        style={{ fontSize: "0.9em", color: style.textColor }}
      />
      <ul
        style={{
          marginTop: "0.125rem",
          marginLeft: "1.25rem",
          listStyle: bulletListStyle(style.bulletStyle),
          fontSize: "0.9em",
          color: style.textColor,
        }}
      >
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
      <button
        onClick={handleAddBullet}
        className="mt-1 ml-5 flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-all"
        style={{ color: style.accentColor }}
      >
        <Plus className="h-3 w-3" />
        Add bullet
      </button>
    </ItemWrapper>
  );
}

// ============================================================
// Certifications
// ============================================================

function CertItems({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {items.map((item) => (
        <CertCard key={item.id} item={item} resumeId={resumeId} style={style} />
      ))}
    </div>
  );
}

function SidebarCerts({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const cert = item.data as ResolvedCertification;
        return (
          <div key={item.id} className="text-[0.75rem]" style={{ color: style.sidebarTextColor }}>
            <EditableText
              value={cert.name}
              onSave={(v) => updateItemField(resumeId, item.id, "name", v)}
              style={{ fontWeight: 600, color: style.sidebarTextColor }}
            />
            {cert.issuer && (
              <div className="opacity-75">{cert.issuer}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CertCard({
  item,
  resumeId,
  style,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
  style: TemplateStyle;
}) {
  const cert = item.data as ResolvedCertification;
  const setField = useFieldUpdater(resumeId, item.id);

  return (
    <ItemWrapper
      resumeId={resumeId}
      itemId={item.id}
      className="flex items-baseline justify-between gap-2"
      style={{ fontSize: "0.9em" }}
    >
      <div className="flex-1 min-w-0">
        <EditableText
          value={cert.name}
          onSave={setField("name")}
          style={{ fontWeight: 600, color: style.primaryColor }}
        />
        <span style={{ color: style.mutedColor }}> · </span>
        <EditableText
          value={cert.issuer || ""}
          onSave={setField("issuer")}
          placeholder="Issuer"
          style={{ color: style.textColor }}
        />
      </div>
      {cert.issueDate && (
        <span style={{ color: style.mutedColor, fontSize: "0.8rem", flexShrink: 0 }}>
          {new Date(cert.issueDate + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      )}
    </ItemWrapper>
  );
}

// ============================================================
// Custom
// ============================================================

function CustomItems({
  items,
  resumeId,
  style,
}: {
  items: ResolvedBlockItem[];
  resumeId: string;
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item) => (
        <CustomItemCard key={item.id} item={item} resumeId={resumeId} style={style} />
      ))}
    </div>
  );
}

function CustomItemCard({
  item,
  resumeId,
  style,
}: {
  item: ResolvedBlockItem;
  resumeId: string;
  style: TemplateStyle;
}) {
  const data = item.data as ResolvedCustomItem;
  const setField = useFieldUpdater(resumeId, item.id);

  return (
    <ItemWrapper resumeId={resumeId} itemId={item.id}>
      <EditableText
        value={data.title}
        onSave={setField("title")}
        placeholder="Title"
        style={{ fontWeight: 600, color: style.primaryColor }}
      />
      <EditableText
        as="p"
        value={data.text}
        onSave={setField("text")}
        placeholder="Description or details..."
        multiline
        style={{ fontSize: "0.9em", color: style.textColor }}
      />
    </ItemWrapper>
  );
}
