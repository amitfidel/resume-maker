/**
 * Template renderer used by PDF export (non-interactive).
 * Matches the visual layout of InteractiveResume but without edit handles.
 */

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
import type { TemplateStyle } from "./styles";
import { getStyle } from "./styles";
import { formatDateRange } from "./modern-clean/shared";

export function TemplateRenderer({ resume }: { resume: ResolvedResume }) {
  const style = getStyle(resume.templateId);

  if (style.layout === "two-column") {
    return <TwoColumnRender resume={resume} style={style} />;
  }
  return <SingleColumnRender resume={resume} style={style} />;
}

function SingleColumnRender({
  resume,
  style,
}: {
  resume: ResolvedResume;
  style: TemplateStyle;
}) {
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);

  return (
    <div
      style={{
        fontFamily: style.fontFamily,
        fontSize: style.baseFontSize,
        lineHeight: style.lineHeight,
        color: style.textColor,
        padding: "20mm",
        backgroundColor: "white",
        minHeight: "297mm",
        width: "210mm",
      }}
    >
      <RenderHeader resume={resume} style={style} />

      {resume.summary && (
        <section style={{ marginTop: style.sectionSpacing }}>
          <RenderSectionHeading style={style}>Summary</RenderSectionHeading>
          <p style={{ fontSize: "0.9em", color: style.textColor }}>
            {resume.summary}
          </p>
        </section>
      )}

      {visibleBlocks.map((block) => {
        if (block.type === "summary") return null;
        return <RenderBlock key={block.id} block={block} style={style} />;
      })}
    </div>
  );
}

function TwoColumnRender({
  resume,
  style,
}: {
  resume: ResolvedResume;
  style: TemplateStyle;
}) {
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);
  const sidebarBlocks = visibleBlocks.filter(
    (b) => b.type === "skills" || b.type === "certifications"
  );
  const mainBlocks = visibleBlocks.filter(
    (b) => b.type !== "skills" && b.type !== "certifications" && b.type !== "summary"
  );

  return (
    <div
      style={{
        display: "flex",
        fontFamily: style.fontFamily,
        fontSize: style.baseFontSize,
        lineHeight: style.lineHeight,
        color: style.textColor,
        minHeight: "297mm",
        width: "210mm",
        backgroundColor: "white",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "38%",
          padding: "15mm 10mm",
          backgroundColor: style.sidebarBg,
          color: style.sidebarTextColor,
        }}
      >
        <h1
          style={{
            fontSize: style.header.nameSize,
            fontWeight: style.header.nameWeight,
            color: style.sidebarTextColor,
            lineHeight: 1.1,
            letterSpacing: style.nameTracking,
          }}
        >
          {resume.header.fullName}
        </h1>
        {resume.header.headline && (
          <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", opacity: 0.8 }}>
            {resume.header.headline}
          </p>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <RenderSidebarHeading style={style}>Contact</RenderSidebarHeading>
          <div style={{ fontSize: "0.75rem" }}>
            {resume.header.email && <div>{resume.header.email}</div>}
            {resume.header.phone && <div>{resume.header.phone}</div>}
            {resume.header.location && <div>{resume.header.location}</div>}
            {resume.header.linkedinUrl && <div>{resume.header.linkedinUrl}</div>}
            {resume.header.githubUrl && <div>{resume.header.githubUrl}</div>}
          </div>
        </div>

        {sidebarBlocks.map((block) => (
          <div key={block.id} style={{ marginTop: "1.5rem" }}>
            <RenderSidebarHeading style={style}>{block.heading}</RenderSidebarHeading>
            {block.type === "skills" && (
              <RenderSidebarSkills items={block.items.filter((i) => i.isVisible)} style={style} />
            )}
            {block.type === "certifications" && (
              <RenderSidebarCerts items={block.items.filter((i) => i.isVisible)} style={style} />
            )}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "15mm" }}>
        {resume.summary && (
          <section>
            <RenderSectionHeading style={style}>Summary</RenderSectionHeading>
            <p style={{ fontSize: "0.9em" }}>{resume.summary}</p>
          </section>
        )}

        {mainBlocks.map((block) => (
          <RenderBlock key={block.id} block={block} style={style} />
        ))}
      </div>
    </div>
  );
}

function RenderHeader({
  resume,
  style,
}: {
  resume: ResolvedResume;
  style: TemplateStyle;
}) {
  const h = style.header;
  const contacts = [resume.header.email, resume.header.phone, resume.header.location].filter(Boolean);
  const links = [resume.header.linkedinUrl, resume.header.githubUrl, resume.header.websiteUrl].filter(Boolean);

  return (
    <header
      style={{
        textAlign: h.align,
        paddingBottom: "0.75rem",
        marginBottom: "1rem",
        borderBottom: h.style === "bordered-bottom" ? `3px solid ${style.primaryColor}` : "none",
        borderTop: h.style === "bordered-top" ? `3px solid ${style.primaryColor}` : "none",
        paddingTop: h.style === "bordered-top" ? "0.75rem" : 0,
      }}
    >
      {h.style === "accent-bar" && (
        <div
          style={{
            width: "4rem",
            height: "0.25rem",
            backgroundColor: style.accentBarColor,
            marginBottom: "0.5rem",
          }}
        />
      )}

      <h1
        style={{
          fontFamily: style.headingFont,
          fontSize: h.nameSize,
          fontWeight: h.nameWeight,
          color: h.nameColor,
          letterSpacing: style.nameTracking,
          lineHeight: 1.15,
        }}
      >
        {resume.header.fullName}
      </h1>
      {resume.header.headline && (
        <p style={{ marginTop: "0.125rem", fontSize: "0.9rem", color: style.mutedColor }}>
          {resume.header.headline}
        </p>
      )}
      {contacts.length > 0 && (
        <p style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: style.mutedColor }}>
          {contacts.join("   •   ")}
        </p>
      )}
      {links.length > 0 && (
        <p style={{ marginTop: "0.125rem", fontSize: "0.75rem", color: style.mutedColor }}>
          {links.join("   •   ")}
        </p>
      )}
    </header>
  );
}

function RenderSectionHeading({
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
        paddingBottom: sh.border === "bottom" || sh.border === "full-bottom" ? "0.25rem" : 0,
      }}
    >
      {children}
    </h2>
  );
}

function RenderSidebarHeading({
  children,
  style,
}: {
  children: React.ReactNode;
  style: TemplateStyle;
}) {
  return (
    <h2
      style={{
        fontFamily: style.headingFont,
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: style.sidebarTextColor,
        borderBottom: `1px solid rgba(255,255,255,0.2)`,
        paddingBottom: "0.25rem",
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </h2>
  );
}

function RenderBlock({ block, style }: { block: ResolvedBlock; style: TemplateStyle }) {
  const items = block.items.filter((i) => i.isVisible);
  return (
    <section style={{ marginTop: style.sectionSpacing }}>
      <RenderSectionHeading style={style}>{block.heading}</RenderSectionHeading>

      {block.type === "experience" && <RenderExperience items={items} style={style} />}
      {block.type === "education" && <RenderEducation items={items} style={style} />}
      {block.type === "skills" && <RenderSkills items={items} style={style} />}
      {block.type === "projects" && <RenderProjects items={items} style={style} />}
      {block.type === "certifications" && <RenderCerts items={items} style={style} />}
      {block.type === "custom" && <RenderCustom items={items} style={style} />}
    </section>
  );
}

function RenderExperience({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: style.itemSpacing }}>
      {items.map((item) => {
        const exp = item.data as ResolvedExperience;
        const bullets = exp.bullets.filter((b) => b.visible);
        return (
          <div key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span style={{ fontWeight: 600, color: style.primaryColor }}>
                  {exp.title}
                </span>
                <span style={{ color: style.mutedColor }}> · {exp.company}</span>
                {exp.location && (
                  <span style={{ color: style.mutedColor, fontSize: "0.85em" }}>
                    {" "}· {exp.location}
                  </span>
                )}
              </div>
              <span style={{ color: style.mutedColor, fontSize: "0.8rem" }}>
                {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
              </span>
            </div>
            {bullets.length > 0 && (
              <ul
                style={{
                  marginTop: "0.25rem",
                  marginLeft: "1.25rem",
                  listStyle: listStyle(style.bulletStyle),
                  fontSize: "0.9em",
                }}
              >
                {bullets.map((b) => <li key={b.id}>{b.text}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RenderEducation({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item) => {
        const edu = item.data as ResolvedEducation;
        return (
          <div
            key={item.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
          >
            <div>
              <span style={{ fontWeight: 600, color: style.primaryColor }}>
                {edu.degree}
                {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
              </span>
              <span style={{ color: style.mutedColor }}> · {edu.institution}</span>
              {edu.gpa && <span style={{ color: style.mutedColor }}> · GPA: {edu.gpa}</span>}
            </div>
            <span style={{ color: style.mutedColor, fontSize: "0.8rem" }}>
              {formatDateRange(edu.startDate, edu.endDate)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RenderSkills({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  const skills = items.map((i) => i.data as ResolvedSkill);
  const grouped = skills.reduce<Record<string, ResolvedSkill[]>>((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {Object.entries(grouped).map(([category, sks]) => (
        <div key={category} style={{ fontSize: "0.9em" }}>
          <span style={{ fontWeight: 600, color: style.primaryColor }}>{category}:</span>{" "}
          <span>{sks.map((s) => s.name).join(", ")}</span>
        </div>
      ))}
    </div>
  );
}

function RenderSidebarSkills({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  const skills = items.map((i) => i.data as ResolvedSkill);
  const grouped = skills.reduce<Record<string, ResolvedSkill[]>>((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {Object.entries(grouped).map(([category, sks]) => (
        <div key={category}>
          <p
            style={{
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.7,
              marginBottom: "0.25rem",
            }}
          >
            {category}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {sks.map((s) => (
              <span
                key={s.id}
                style={{
                  fontSize: "0.7rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderProjects({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: style.itemSpacing }}>
      {items.map((item) => {
        const proj = item.data as ResolvedProject;
        const bullets = proj.bullets.filter((b) => b.visible);
        return (
          <div key={item.id}>
            <div>
              <span style={{ fontWeight: 600, color: style.primaryColor }}>{proj.name}</span>
              {proj.technologies && proj.technologies.length > 0 && (
                <span style={{ color: style.mutedColor }}>
                  {" "}· {proj.technologies.join(", ")}
                </span>
              )}
            </div>
            {proj.description && (
              <p style={{ fontSize: "0.9em" }}>{proj.description}</p>
            )}
            {bullets.length > 0 && (
              <ul
                style={{
                  marginTop: "0.125rem",
                  marginLeft: "1.25rem",
                  listStyle: listStyle(style.bulletStyle),
                  fontSize: "0.9em",
                }}
              >
                {bullets.map((b) => <li key={b.id}>{b.text}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RenderCerts({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {items.map((item) => {
        const cert = item.data as ResolvedCertification;
        return (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "0.9em",
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: style.primaryColor }}>{cert.name}</span>
              {cert.issuer && <span style={{ color: style.mutedColor }}> · {cert.issuer}</span>}
            </div>
            {cert.issueDate && (
              <span style={{ color: style.mutedColor, fontSize: "0.8rem" }}>
                {new Date(cert.issueDate + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RenderSidebarCerts({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item) => {
        const cert = item.data as ResolvedCertification;
        return (
          <div key={item.id} style={{ fontSize: "0.75rem" }}>
            <div style={{ fontWeight: 600 }}>{cert.name}</div>
            {cert.issuer && <div style={{ opacity: 0.75 }}>{cert.issuer}</div>}
          </div>
        );
      })}
    </div>
  );
}

function RenderCustom({
  items,
  style,
}: {
  items: ResolvedBlockItem[];
  style: TemplateStyle;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {items.map((item) => {
        const d = item.data as ResolvedCustomItem;
        return (
          <div key={item.id}>
            {d.title && (
              <div style={{ fontWeight: 600, color: style.primaryColor }}>{d.title}</div>
            )}
            {d.text && <p style={{ fontSize: "0.9em" }}>{d.text}</p>}
          </div>
        );
      })}
    </div>
  );
}

function listStyle(type: string): string {
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
