/**
 * DOCX export. Some employer ATSes (Workday, Taleo, older Greenhouse
 * configurations) reject PDF uploads or parse them poorly — DOCX is
 * the safer fallback. We render a single-column, single-font document
 * regardless of the user's chosen template style: ATS parsers strip
 * formatting anyway, and the goal here is "machine-readable", not
 * "pretty". The PDF route remains the visual export.
 *
 * Library: `docx` (https://docx.js.org/) — pure JS, no headless
 * browser, runs in the Node runtime.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ExternalHyperlink,
} from "docx";
import { isItemEmpty, notLegacy } from "@/lib/i18n/dictionary";
import type {
  ResolvedResume,
  ResolvedBlock,
  ResolvedBlockItem,
  ResolvedExperience,
  ResolvedEducation,
  ResolvedSkill,
  ResolvedProject,
  ResolvedCertification,
  ResolvedCustomItem,
} from "@/lib/resume/types";

// Single-source-of-truth for sizing. `docx` uses half-points (so 22 = 11pt).
const BASE_PT_HALF = 22; // 11pt body
const HEADING_PT_HALF = 26; // 13pt section headings
const NAME_PT_HALF = 36; // 18pt name
const SUBTLE_PT_HALF = 20; // 10pt for muted text

function p(text: string, opts?: { bold?: boolean; size?: number; italic?: boolean }) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        size: opts?.size ?? BASE_PT_HALF,
        font: "Arial",
      }),
    ],
    spacing: { after: 80 },
  });
}

function emptyLine() {
  return new Paragraph({
    children: [new TextRun({ text: "", size: BASE_PT_HALF })],
    spacing: { after: 60 },
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: HEADING_PT_HALF,
        font: "Arial",
      }),
    ],
    spacing: { before: 240, after: 120 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [
      new TextRun({ text, size: BASE_PT_HALF, font: "Arial" }),
    ],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function dateRange(start: string | null, end: string | null, current: boolean): string {
  const s = formatYearMonth(start);
  const e = current ? "Present" : formatYearMonth(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

function formatYearMonth(value: string | null | undefined): string {
  if (!value) return "";
  // Accept YYYY-MM, YYYY-MM-DD, or full ISO. Keep just the YYYY-MM
  // surface — DOCX parsers care about machine-readable text, but the
  // user-facing string can stay friendly.
  const m = value.match(/^(\d{4})-(\d{2})/);
  if (!m) return value;
  const [, year, month] = m;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] ?? month} ${year}`;
}

function inlineLink(text: string, url: string) {
  return new ExternalHyperlink({
    link: url,
    children: [
      new TextRun({
        text,
        size: BASE_PT_HALF,
        font: "Arial",
        // Leave color black — colored links survive copy-paste poorly
        // in ATSes and look out of place against a plain doc.
        underline: {},
      }),
    ],
  });
}

/**
 * Build the DOCX header block: name on its own line, contact info
 * pipe-separated underneath.
 */
function buildHeaderParagraphs(resume: ResolvedResume): Paragraph[] {
  const out: Paragraph[] = [];

  out.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: resume.header.fullName || "",
          bold: true,
          size: NAME_PT_HALF,
          font: "Arial",
        }),
      ],
      spacing: { after: 80 },
    }),
  );

  if (resume.header.headline) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.header.headline,
            size: BASE_PT_HALF,
            font: "Arial",
          }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  // Contact line: email | phone | location | links
  const contactParts: Array<TextRun | ExternalHyperlink> = [];
  const push = (t: string) => {
    if (contactParts.length > 0) {
      contactParts.push(
        new TextRun({ text: " | ", size: BASE_PT_HALF, font: "Arial" }),
      );
    }
    contactParts.push(new TextRun({ text: t, size: BASE_PT_HALF, font: "Arial" }));
  };
  const pushLink = (label: string, url: string) => {
    if (contactParts.length > 0) {
      contactParts.push(
        new TextRun({ text: " | ", size: BASE_PT_HALF, font: "Arial" }),
      );
    }
    contactParts.push(inlineLink(label, url));
  };

  if (resume.header.email) push(resume.header.email);
  if (resume.header.phone) push(resume.header.phone);
  if (resume.header.location) push(resume.header.location);
  if (resume.header.linkedinUrl) pushLink("LinkedIn", resume.header.linkedinUrl);
  if (resume.header.githubUrl) pushLink("GitHub", resume.header.githubUrl);
  if (resume.header.websiteUrl) pushLink("Website", resume.header.websiteUrl);

  if (contactParts.length > 0) {
    out.push(
      new Paragraph({
        children: contactParts,
        spacing: { after: 240 },
      }),
    );
  }

  return out;
}

function buildSummary(text: string): Paragraph[] {
  return [sectionHeading("Summary"), p(text)];
}

function buildExperience(block: ResolvedBlock): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(block.heading)];
  const visible = block.items.filter(
    (i) => i.isVisible && !isItemEmpty("experience", (i as ResolvedBlockItem<ResolvedExperience>).data),
  );
  for (const item of visible) {
    const exp = (item as ResolvedBlockItem<ResolvedExperience>).data;
    const title = notLegacy(exp.title);
    const company = notLegacy(exp.company);
    const location = exp.location ? `, ${exp.location}` : "";
    const dates = dateRange(exp.startDate, exp.endDate, exp.isCurrent);

    // Title + company on the same paragraph: "Senior Engineer, Acme Inc."
    const headLine = [title, company].filter(Boolean).join(", ") + location;
    if (headLine) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: headLine,
              bold: true,
              size: BASE_PT_HALF,
              font: "Arial",
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    if (dates) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dates,
              italics: true,
              size: SUBTLE_PT_HALF,
              font: "Arial",
            }),
          ],
          spacing: { after: 60 },
        }),
      );
    }

    if (exp.description) {
      out.push(p(exp.description));
    }

    for (const b of exp.bullets) {
      if (!b.visible || !b.text.trim()) continue;
      out.push(bullet(b.text));
    }

    out.push(emptyLine());
  }
  return out;
}

function buildEducation(block: ResolvedBlock): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(block.heading)];
  const visible = block.items.filter(
    (i) => i.isVisible && !isItemEmpty("education", (i as ResolvedBlockItem<ResolvedEducation>).data),
  );
  for (const item of visible) {
    const edu = (item as ResolvedBlockItem<ResolvedEducation>).data;
    const degree = notLegacy(edu.degree);
    const institution = notLegacy(edu.institution);
    const field = edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : "";
    const head = [degree, institution].filter(Boolean).join(" — ") + field;

    if (head) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: head,
              bold: true,
              size: BASE_PT_HALF,
              font: "Arial",
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    const dates = dateRange(edu.startDate, edu.endDate, false);
    const meta: string[] = [];
    if (dates) meta.push(dates);
    if (edu.gpa) meta.push(`GPA: ${edu.gpa}`);
    if (meta.length) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: meta.join(" | "),
              italics: true,
              size: SUBTLE_PT_HALF,
              font: "Arial",
            }),
          ],
          spacing: { after: 60 },
        }),
      );
    }
    if (edu.description) out.push(p(edu.description));
    out.push(emptyLine());
  }
  return out;
}

function buildSkills(block: ResolvedBlock): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(block.heading)];
  const visible = block.items.filter(
    (i) => i.isVisible && !isItemEmpty("skill", (i as ResolvedBlockItem<ResolvedSkill>).data),
  );
  // Group by category, comma-separate within each. Mimics how recruiters
  // and ATSes prefer skills to be presented.
  const byCategory = new Map<string, string[]>();
  for (const item of visible) {
    const skill = (item as ResolvedBlockItem<ResolvedSkill>).data;
    const cat = skill.category?.trim() || "Skills";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(notLegacy(skill.name));
  }
  for (const [cat, names] of byCategory) {
    if (names.length === 0) continue;
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${cat}: `,
            bold: true,
            size: BASE_PT_HALF,
            font: "Arial",
          }),
          new TextRun({
            text: names.filter(Boolean).join(", "),
            size: BASE_PT_HALF,
            font: "Arial",
          }),
        ],
        spacing: { after: 60 },
      }),
    );
  }
  return out;
}

function buildProjects(block: ResolvedBlock): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(block.heading)];
  const visible = block.items.filter(
    (i) => i.isVisible && !isItemEmpty("project", (i as ResolvedBlockItem<ResolvedProject>).data),
  );
  for (const item of visible) {
    const proj = (item as ResolvedBlockItem<ResolvedProject>).data;
    const head = notLegacy(proj.name);
    if (head) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: head,
              bold: true,
              size: BASE_PT_HALF,
              font: "Arial",
            }),
            ...(proj.url
              ? [
                  new TextRun({
                    text: " — ",
                    size: BASE_PT_HALF,
                    font: "Arial",
                  }),
                  inlineLink(proj.url, proj.url) as unknown as TextRun,
                ]
              : []),
          ],
          spacing: { after: 40 },
        }),
      );
    }
    if (proj.description) out.push(p(proj.description));
    if (proj.technologies && proj.technologies.length > 0) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Tech: ${proj.technologies.join(", ")}`,
              italics: true,
              size: SUBTLE_PT_HALF,
              font: "Arial",
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
    for (const b of proj.bullets) {
      if (!b.visible || !b.text.trim()) continue;
      out.push(bullet(b.text));
    }
    out.push(emptyLine());
  }
  return out;
}

function buildCertifications(block: ResolvedBlock): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(block.heading)];
  const visible = block.items.filter(
    (i) => i.isVisible && !isItemEmpty("certification", (i as ResolvedBlockItem<ResolvedCertification>).data),
  );
  for (const item of visible) {
    const cert = (item as ResolvedBlockItem<ResolvedCertification>).data;
    const name = notLegacy(cert.name);
    const issuer = cert.issuer ? ` — ${cert.issuer}` : "";
    const date = formatYearMonth(cert.issueDate);
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${name}${issuer}`,
            bold: true,
            size: BASE_PT_HALF,
            font: "Arial",
          }),
          ...(date
            ? [
                new TextRun({
                  text: ` (${date})`,
                  size: SUBTLE_PT_HALF,
                  italics: true,
                  font: "Arial",
                }),
              ]
            : []),
        ],
        spacing: { after: 60 },
      }),
    );
  }
  return out;
}

function buildCustom(block: ResolvedBlock): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(block.heading)];
  const visible = block.items.filter(
    (i) => i.isVisible && !isItemEmpty("custom", (i as ResolvedBlockItem<ResolvedCustomItem>).data),
  );
  for (const item of visible) {
    const data = (item as ResolvedBlockItem<ResolvedCustomItem>).data;
    if (data.title) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.title,
              bold: true,
              size: BASE_PT_HALF,
              font: "Arial",
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
    if (data.text) out.push(p(data.text));
    out.push(emptyLine());
  }
  return out;
}

/**
 * Render a resolved resume as a DOCX buffer. Caller is responsible for
 * setting Content-Disposition on the response.
 */
export async function renderResumeToDocx(resume: ResolvedResume): Promise<Buffer> {
  const sections: Paragraph[] = [];

  sections.push(...buildHeaderParagraphs(resume));

  if (resume.summary) {
    sections.push(...buildSummary(resume.summary));
  }

  // Render in user's block order, skip hidden blocks.
  for (const block of resume.blocks) {
    if (!block.isVisible) continue;
    switch (block.type) {
      case "experience":
        sections.push(...buildExperience(block));
        break;
      case "education":
        sections.push(...buildEducation(block));
        break;
      case "skills":
        sections.push(...buildSkills(block));
        break;
      case "projects":
        sections.push(...buildProjects(block));
        break;
      case "certifications":
        sections.push(...buildCertifications(block));
        break;
      case "custom":
        sections.push(...buildCustom(block));
        break;
      // header + summary handled above; nothing else here.
    }
  }

  const doc = new Document({
    creator: "Resumi",
    title: resume.title,
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: BASE_PT_HALF },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch (1440 twips/in, 720 twips = 0.5in)
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: sections,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/**
 * Plain-text export. Same data shape, even more parser-friendly than
 * DOCX. Useful as a "copy into the textarea" fallback.
 */
export function renderResumeToText(resume: ResolvedResume): string {
  const lines: string[] = [];
  const h = resume.header;

  if (h.fullName) lines.push(h.fullName);
  if (h.headline) lines.push(h.headline);
  const contact = [h.email, h.phone, h.location].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  const links = [h.linkedinUrl, h.githubUrl, h.websiteUrl].filter(Boolean).join(" | ");
  if (links) lines.push(links);
  lines.push("");

  if (resume.summary) {
    lines.push("SUMMARY");
    lines.push(resume.summary);
    lines.push("");
  }

  for (const block of resume.blocks) {
    if (!block.isVisible) continue;
    lines.push(block.heading.toUpperCase());
    for (const item of block.items) {
      if (!item.isVisible) continue;
      switch (block.type) {
        case "experience": {
          const e = (item as ResolvedBlockItem<ResolvedExperience>).data;
          if (isItemEmpty("experience", e)) continue;
          lines.push(
            `${notLegacy(e.title)} — ${notLegacy(e.company)} (${dateRange(e.startDate, e.endDate, e.isCurrent)})`,
          );
          for (const b of e.bullets) {
            if (b.visible && b.text.trim()) lines.push(`- ${b.text}`);
          }
          lines.push("");
          break;
        }
        case "education": {
          const ed = (item as ResolvedBlockItem<ResolvedEducation>).data;
          if (isItemEmpty("education", ed)) continue;
          lines.push(`${notLegacy(ed.degree)} — ${notLegacy(ed.institution)}`);
          break;
        }
        case "skills": {
          const sk = (item as ResolvedBlockItem<ResolvedSkill>).data;
          if (isItemEmpty("skill", sk)) continue;
          lines.push(`- ${notLegacy(sk.name)}`);
          break;
        }
        case "projects": {
          const pr = (item as ResolvedBlockItem<ResolvedProject>).data;
          if (isItemEmpty("project", pr)) continue;
          lines.push(`${notLegacy(pr.name)}${pr.url ? ` (${pr.url})` : ""}`);
          for (const b of pr.bullets) {
            if (b.visible && b.text.trim()) lines.push(`- ${b.text}`);
          }
          break;
        }
        case "certifications": {
          const c = (item as ResolvedBlockItem<ResolvedCertification>).data;
          if (isItemEmpty("certification", c)) continue;
          lines.push(`${notLegacy(c.name)}${c.issuer ? ` — ${c.issuer}` : ""}`);
          break;
        }
        case "custom": {
          const cu = (item as ResolvedBlockItem<ResolvedCustomItem>).data;
          if (isItemEmpty("custom", cu)) continue;
          if (cu.title) lines.push(cu.title);
          if (cu.text) lines.push(cu.text);
          break;
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
