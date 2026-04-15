import type { ResolvedResume } from "@/lib/resume/types";
import { HeaderSection } from "./header";
import { SummarySection } from "./summary";
import { ExperienceSection } from "./experience";
import { EducationSection } from "./education";
import { SkillsSection } from "./skills";
import { ProjectsSection } from "./projects";
import { CertificationsSection } from "./certifications";

type TemplateProps = {
  resume: ResolvedResume;
  mode: "edit" | "preview" | "export";
};

const BLOCK_RENDERERS: Record<
  string,
  React.ComponentType<{ block: ResolvedResume["blocks"][number]; mode: string }>
> = {
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  certifications: CertificationsSection,
};

export function ModernCleanTemplate({ resume, mode }: TemplateProps) {
  const visibleBlocks = resume.blocks.filter((b) => b.isVisible);

  return (
    <div
      className={`mx-auto bg-white text-gray-900 ${
        mode === "export"
          ? "w-[210mm] min-h-[297mm] p-[20mm]"
          : "w-full max-w-[800px] p-8 shadow-sm"
      }`}
      style={{ fontFamily: "'Inter', sans-serif", fontSize: "10pt", lineHeight: "1.4" }}
    >
      {/* Header - always first */}
      <HeaderSection header={resume.header} />

      {/* Summary */}
      {resume.summary && (
        <SummarySection summary={resume.summary} />
      )}

      {/* Dynamic blocks */}
      {visibleBlocks.map((block) => {
        if (block.type === "summary") return null; // handled above

        const Renderer = BLOCK_RENDERERS[block.type];
        if (!Renderer) return null;

        return <Renderer key={block.id} block={block} mode={mode} />;
      })}
    </div>
  );
}
