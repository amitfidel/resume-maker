/**
 * DOCX export for a cover letter. Plain prose, single column, serif
 * font — feels like a letter rather than a CV.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import type { CoverLetter } from "@/db/schema";

const BASE = 22; // 11pt half-point
const NAME = 28; // 14pt half-point (heading-ish)

function p(text: string, opts?: { bold?: boolean; size?: number }) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        size: opts?.size ?? BASE,
        font: "Georgia",
      }),
    ],
    spacing: { after: 200 },
  });
}

function emptyLine() {
  return new Paragraph({
    children: [new TextRun({ text: "", size: BASE })],
    spacing: { after: 120 },
  });
}

export async function renderCoverLetterToDocx(opts: {
  cl: CoverLetter;
  senderName: string;
  senderEmail: string | null;
  senderPhone: string | null;
}): Promise<Buffer> {
  const { cl, senderName, senderEmail, senderPhone } = opts;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs: Paragraph[] = [];

  // Sender identity at the top.
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: senderName, bold: true, size: NAME, font: "Georgia" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
    }),
  );
  const contactLine = [senderEmail, senderPhone].filter(Boolean).join(" | ");
  if (contactLine) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: contactLine, size: BASE - 2, font: "Georgia" }),
        ],
        spacing: { after: 240 },
      }),
    );
  }

  // Date.
  paragraphs.push(p(today));

  // Recipient block.
  if (cl.recipientName || cl.recipientCompany) {
    if (cl.recipientName) paragraphs.push(p(cl.recipientName));
    if (cl.recipientCompany) paragraphs.push(p(cl.recipientCompany));
    paragraphs.push(emptyLine());
  }

  // Greeting line — fill in if we know who.
  const greet = cl.recipientName
    ? `Dear ${cl.recipientName},`
    : "Dear Hiring Manager,";
  paragraphs.push(p(greet));

  // Body — split on double-newlines into paragraphs.
  const bodyParas = cl.body
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);
  for (const text of bodyParas) {
    paragraphs.push(p(text));
  }

  paragraphs.push(emptyLine());
  paragraphs.push(p("Sincerely,"));
  paragraphs.push(p(senderName));

  const doc = new Document({
    creator: "Resumi",
    title: cl.title,
    styles: {
      default: {
        document: {
          run: { font: "Georgia", size: BASE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
