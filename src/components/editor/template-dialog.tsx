"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TemplatePicker } from "./template-picker";
import { LayoutTemplate } from "lucide-react";
import { useT } from "@/lib/i18n/context";

type Props = {
  resumeId: string;
  currentTemplateId: string;
};

/**
 * Toolbar button + modal that holds the TemplatePicker. Click a template card
 * in the modal to switch; the existing server action fires and the modal stays
 * open so the user can preview by toggling templates.
 */
export function TemplateDialog({ resumeId, currentTemplateId }: Props) {
  const t = useT();
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-full text-[13px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
          />
        }
      >
        <LayoutTemplate className="h-3.5 w-3.5" />
        {t("editor.templates")}
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
        <DialogHeader>
          <DialogTitle className="font-headline text-[24px] font-normal tracking-[-0.015em]">
            {t("templates.dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-[var(--on-surface-muted)]">
            {t("templates.dialog.desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <TemplatePicker resumeId={resumeId} currentTemplateId={currentTemplateId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
