import type { ResolvedBlock, ResolvedExperience } from "@/lib/resume/types";
import { SectionWrapper, formatDateRange } from "./shared";
import { notLegacy } from "@/lib/i18n/dictionary";

export function ExperienceSection({
  block,
}: {
  block: ResolvedBlock;
  mode: string;
}) {
  const items = block.items.filter((i) => i.isVisible);

  return (
    <SectionWrapper block={block}>
      <div className="space-y-3">
        {items.map((item) => {
          const exp = item.data as ResolvedExperience;
          const visibleBullets = exp.bullets.filter((b) => b.visible);

          return (
            <div key={item.id}>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-semibold text-gray-900">
                    {notLegacy(exp.title)}
                  </span>
                  <span className="text-gray-600"> | {notLegacy(exp.company)}</span>
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
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
