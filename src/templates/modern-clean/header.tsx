import type { ResolvedHeader } from "@/lib/resume/types";

export function HeaderSection({ header }: { header: ResolvedHeader }) {
  const contactItems = [
    header.email,
    header.phone,
    header.location,
  ].filter(Boolean);

  const linkItems = [
    header.linkedinUrl,
    header.githubUrl,
    header.websiteUrl,
  ].filter(Boolean);

  return (
    <header className="mb-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {header.fullName}
      </h1>
      {header.headline && (
        <p className="mt-0.5 text-sm text-gray-600">{header.headline}</p>
      )}
      {contactItems.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          {contactItems.join("  |  ")}
        </p>
      )}
      {linkItems.length > 0 && (
        <p className="mt-0.5 text-xs text-gray-500">
          {linkItems.join("  |  ")}
        </p>
      )}
    </header>
  );
}
