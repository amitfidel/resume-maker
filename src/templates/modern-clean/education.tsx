import type { ResolvedBlock, ResolvedEducation } from "@/lib/resume/types";
import { SectionWrapper, formatDateRange } from "./shared";

export function EducationSection({
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
    </SectionWrapper>
  );
}
