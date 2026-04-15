import type { ResolvedResume } from "@/lib/resume/types";
import { ModernCleanTemplate } from "./modern-clean";
import { ClassicProfessionalTemplate } from "./classic-professional";

export type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<{
    resume: ResolvedResume;
    mode: "edit" | "preview" | "export";
  }>;
};

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Clean sans-serif layout with centered header. Great for tech roles.",
    component: ModernCleanTemplate,
  },
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional serif layout with left-aligned header. Suits corporate and finance roles.",
    component: ClassicProfessionalTemplate,
  },
];

export function getTemplate(id: string): TemplateInfo {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
