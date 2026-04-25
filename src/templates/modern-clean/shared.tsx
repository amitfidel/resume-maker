"use client";

import type { ResolvedBlock } from "@/lib/resume/types";
import { useT } from "@/lib/i18n/context";
import { localizedHeading } from "@/lib/i18n/dictionary";

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-widest text-gray-700"
    >
      {children}
    </h2>
  );
}

export function SectionWrapper({
  block,
  children,
}: {
  block: ResolvedBlock;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <section className="mt-5">
      <SectionHeading>{localizedHeading(block.heading, block.type, t)}</SectionHeading>
      {children}
    </section>
  );
}

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent?: boolean
): string {
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  if (!startDate) return endDate ? fmt(endDate) : "";

  const start = fmt(startDate);
  const end = isCurrent ? "Present" : endDate ? fmt(endDate) : "";

  return end ? `${start} – ${end}` : start;
}
