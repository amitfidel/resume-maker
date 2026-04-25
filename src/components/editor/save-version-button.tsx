"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bookmark, Loader2 } from "lucide-react";
import { saveResumeVersion } from "@/app/(dashboard)/resumes/actions";
import { useT } from "@/lib/i18n/context";

type Props = {
  resumeId: string;
};

export function SaveVersionButton({ resumeId }: Props) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useT();

  const handleSave = () => {
    if (!summary.trim()) return;
    startTransition(async () => {
      await saveResumeVersion(resumeId, summary.trim());
      setSummary("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--on-surface-variant)] gap-2"
          />
        }
      >
        <Bookmark className="h-4 w-4" />
        {t("editor.save_version")}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {t("editor.save_version.dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {t("editor.save_version.dialog_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="summary">{t("editor.save_version.label")}</Label>
          <Input
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && summary.trim()) handleSave();
            }}
            placeholder={t("editor.save_version.placeholder")}
            autoFocus
            className="border-ghost"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!summary.trim() || isPending}
            className="flex-1 magical-gradient text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("editor.saving")}
              </>
            ) : (
              t("editor.save_version")
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
