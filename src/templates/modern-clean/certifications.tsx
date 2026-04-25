import type {
  ResolvedBlock,
  ResolvedCertification,
} from "@/lib/resume/types";
import { SectionWrapper } from "./shared";
import { notLegacy } from "@/lib/i18n/dictionary";

export function CertificationsSection({
  block,
}: {
  block: ResolvedBlock;
  mode: string;
}) {
  const items = block.items.filter((i) => i.isVisible);

  return (
    <SectionWrapper block={block}>
      <div className="space-y-1">
        {items.map((item) => {
          const cert = item.data as ResolvedCertification;

          return (
            <div key={item.id} className="flex items-baseline justify-between text-sm">
              <div>
                <span className="font-semibold text-gray-900">
                  {notLegacy(cert.name)}
                </span>
                {cert.issuer && (
                  <span className="text-gray-600"> | {cert.issuer}</span>
                )}
              </div>
              {cert.issueDate && (
                <span className="text-xs text-gray-500">
                  {new Date(cert.issueDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
