import type { ResolvedBlock, ResolvedSkill } from "@/lib/resume/types";
import { SectionWrapper } from "./shared";

export function SkillsSection({
  block,
}: {
  block: ResolvedBlock;
  mode: string;
}) {
  const items = block.items.filter((i) => i.isVisible);
  const skillData = items.map((i) => i.data as ResolvedSkill);

  // Group by category
  const grouped = skillData.reduce<Record<string, ResolvedSkill[]>>(
    (acc, skill) => {
      const cat = skill.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {}
  );

  return (
    <SectionWrapper block={block}>
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
    </SectionWrapper>
  );
}
