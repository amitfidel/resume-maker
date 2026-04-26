"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileType, FileType2, ChevronDown } from "lucide-react";
import { useT, useI18n } from "@/lib/i18n/context";

/**
 * Export dropdown — collapses three formats behind one button. The PDF
 * export goes through Puppeteer (pixel-faithful to the editor), DOCX
 * uses the docx npm package (pure Node, ATS-friendlier), and TXT is a
 * static plain-text dump for "paste into the textarea" workflows.
 */
export function ExportMenu({ resumeId }: { resumeId: string }) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="sm"
            className="magic-shine h-9 gap-2 rounded-full bg-[var(--ink)] px-4 text-[var(--cream)] hover:-translate-y-px hover:bg-[var(--ink)]"
          />
        }
      >
        {t("common.export")}
        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        <Download className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[220px]">
        <a
          href={`/api/pdf/${resumeId}?locale=${encodeURIComponent(locale)}`}
          download
          className="block"
        >
          <DropdownMenuItem className="gap-2.5">
            <FileType className="h-4 w-4 text-[var(--magic-1)]" />
            <div className="flex flex-col">
              <span className="font-medium">{t("export.pdf")}</span>
              <span className="text-[11px] text-[var(--on-surface-muted)]">
                {t("export.pdf.hint")}
              </span>
            </div>
          </DropdownMenuItem>
        </a>
        <a href={`/api/docx/${resumeId}`} download className="block">
          <DropdownMenuItem className="gap-2.5">
            <FileType2 className="h-4 w-4 text-[var(--magic-1)]" />
            <div className="flex flex-col">
              <span className="font-medium">{t("export.docx")}</span>
              <span className="text-[11px] text-[var(--on-surface-muted)]">
                {t("export.docx.hint")}
              </span>
            </div>
          </DropdownMenuItem>
        </a>
        <a href={`/api/txt/${resumeId}`} download className="block">
          <DropdownMenuItem className="gap-2.5">
            <FileText className="h-4 w-4 text-[var(--on-surface-muted)]" />
            <div className="flex flex-col">
              <span className="font-medium">{t("export.txt")}</span>
              <span className="text-[11px] text-[var(--on-surface-muted)]">
                {t("export.txt.hint")}
              </span>
            </div>
          </DropdownMenuItem>
        </a>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
