import { SectionHeading } from "./shared";

export function SummarySection({ summary }: { summary: string }) {
  return (
    <section className="mt-4">
      <SectionHeading>Summary</SectionHeading>
      <p className="text-sm leading-relaxed text-gray-700">{summary}</p>
    </section>
  );
}
