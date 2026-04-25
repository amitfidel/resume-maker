"use client";

import type { ResolvedResume, ResolvedBlock, ResolvedExperience, ResolvedEducation, ResolvedSkill, ResolvedProject, ResolvedCertification } from "@/lib/resume/types";
import { formatDateRange } from "@/templates/modern-clean/shared";
import { useT } from "@/lib/i18n/context";
import { localizedHeading, notLegacy } from "@/lib/i18n/dictionary";

type TemplateProps = {
  resume: ResolvedResume;
  mode: "edit" | "preview" | "export";
};

export function ClassicProfessionalTemplate({ resume, mode }: TemplateProps) {
  const t = useT();
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);

  return (
    <div
      className={`mx-auto bg-white text-gray-900 ${
        mode === "export"
          ? "w-[210mm] min-h-[297mm] p-[18mm_22mm]"
          : "w-full max-w-[800px] p-8 shadow-sm"
      }`}
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: "10.5pt", lineHeight: "1.45" }}
    >
      {/* Header - left aligned, bold name */}
      <header className="mb-1 border-b-2 border-gray-900 pb-3">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
          {resume.header.fullName}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-600">
          {resume.header.email && <span>{resume.header.email}</span>}
          {resume.header.phone && <span>{resume.header.phone}</span>}
          {resume.header.location && <span>{resume.header.location}</span>}
          {resume.header.linkedinUrl && <span>{resume.header.linkedinUrl}</span>}
          {resume.header.githubUrl && <span>{resume.header.githubUrl}</span>}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mt-4">
          <SectionTitle>{t("canvas.heading.summary")}</SectionTitle>
          <p className="text-sm text-gray-700 italic">{resume.summary}</p>
        </section>
      )}

      {/* Dynamic blocks */}
      {visibleBlocks.map((block) => {
        if (block.type === "summary") return null;
        return <ClassicBlock key={block.id} block={block} />;
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5">
      {children}
    </h2>
  );
}

function ClassicBlock({ block }: { block: ResolvedBlock }) {
  const t = useT();
  const items = block.items.filter((i) => i.isVisible);

  return (
    <section className="mt-4">
      <SectionTitle>{localizedHeading(block.heading, block.type, t)}</SectionTitle>

      {block.type === "experience" && (
        <div className="space-y-3">
          {items.map((item) => {
            const exp = item.data as ResolvedExperience;
            const bullets = exp.bullets.filter((b) => b.visible);
            return (
              <div key={item.id}>
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">{notLegacy(exp.title)}</span>
                    <span className="text-gray-600">, {notLegacy(exp.company)}</span>
                    {exp.location && <span className="text-gray-500"> - {exp.location}</span>}
                  </div>
                  <span className="text-sm text-gray-500 italic">
                    {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </span>
                </div>
                {bullets.length > 0 && (
                  <ul className="mt-1 ml-4 list-disc space-y-0.5 text-sm text-gray-700">
                    {bullets.map((b) => <li key={b.id}>{b.text}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {block.type === "education" && (
        <div className="space-y-2">
          {items.map((item) => {
            const edu = item.data as ResolvedEducation;
            return (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span className="font-bold">{notLegacy(edu.degree)}{edu.fieldOfStudy && ` · ${edu.fieldOfStudy}`}</span>
                  <span className="text-gray-600">, {notLegacy(edu.institution)}</span>
                  {edu.gpa && <span className="text-gray-500"> (GPA: {edu.gpa})</span>}
                </div>
                <span className="text-sm text-gray-500 italic">
                  {formatDateRange(edu.startDate, edu.endDate)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {block.type === "skills" && (() => {
        const skills = items.map((i) => i.data as ResolvedSkill);
        const grouped = skills.reduce<Record<string, string[]>>((acc, s) => {
          const cat = s.category || "Other";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(s.name);
          return acc;
        }, {});
        return (
          <div className="space-y-0.5">
            {Object.entries(grouped).map(([cat, names]) => (
              <div key={cat} className="text-sm">
                <span className="font-bold">{cat}:</span>{" "}
                <span className="text-gray-700">{names.join(", ")}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {block.type === "projects" && (
        <div className="space-y-2">
          {items.map((item) => {
            const proj = item.data as ResolvedProject;
            const bullets = proj.bullets.filter((b) => b.visible);
            return (
              <div key={item.id}>
                <span className="font-bold">{notLegacy(proj.name)}</span>
                {proj.technologies && proj.technologies.length > 0 && (
                  <span className="text-gray-500 text-sm"> ({proj.technologies.join(", ")})</span>
                )}
                {proj.description && <p className="text-sm text-gray-600">{proj.description}</p>}
                {bullets.length > 0 && (
                  <ul className="mt-0.5 ml-4 list-disc space-y-0.5 text-sm text-gray-700">
                    {bullets.map((b) => <li key={b.id}>{b.text}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {block.type === "certifications" && (
        <div className="space-y-1">
          {items.map((item) => {
            const cert = item.data as ResolvedCertification;
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-bold">{notLegacy(cert.name)}</span>
                  {cert.issuer && <span className="text-gray-600">, {cert.issuer}</span>}
                </div>
                {cert.issueDate && (
                  <span className="text-gray-500 italic">
                    {new Date(cert.issueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
