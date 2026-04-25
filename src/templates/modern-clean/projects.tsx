import type { ResolvedBlock, ResolvedProject } from "@/lib/resume/types";
import { SectionWrapper } from "./shared";
import { notLegacy } from "@/lib/i18n/dictionary";

export function ProjectsSection({
  block,
}: {
  block: ResolvedBlock;
  mode: string;
}) {
  const items = block.items.filter((i) => i.isVisible);

  return (
    <SectionWrapper block={block}>
      <div className="space-y-2">
        {items.map((item) => {
          const proj = item.data as ResolvedProject;
          const visibleBullets = proj.bullets.filter((b) => b.visible);

          return (
            <div key={item.id}>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-semibold text-gray-900">
                    {notLegacy(proj.name)}
                  </span>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span className="text-gray-400">
                      {" "}
                      | {proj.technologies.join(", ")}
                    </span>
                  )}
                </div>
                {proj.url && (
                  <span className="text-xs text-gray-500">{proj.url}</span>
                )}
              </div>
              {proj.description && (
                <p className="text-sm text-gray-600">{proj.description}</p>
              )}
              {visibleBullets.length > 0 && (
                <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-sm text-gray-700">
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
