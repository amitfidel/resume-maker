"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Building2 } from "lucide-react";
import { createWorkExperience, deleteWorkExperience } from "./actions";
import type { WorkExperience, ExperienceBullet } from "@/db/schema";
import { useT } from "@/lib/i18n/context";

type ExperienceWithBullets = WorkExperience & {
  bullets: ExperienceBullet[];
};

export function ExperienceSection({
  experiences,
}: {
  experiences: ExperienceWithBullets[];
}) {
  const [open, setOpen] = useState(false);
  const t = useT();

  async function handleCreate(formData: FormData) {
    await createWorkExperience(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
            {t("profile.exp.title")}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
            {t("profile.exp.lead")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                className="magical-gradient magic-shine h-9 rounded-full px-4"
              />
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("profile.exp.add")}
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
            <DialogHeader>
              <DialogTitle className="font-headline text-[22px] font-normal tracking-[-0.01em]">
                {t("profile.exp.dialog_title")}
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.exp.company")}
                  </Label>
                  <Input id="company" name="company" required className="resumi-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.exp.job_title")}
                  </Label>
                  <Input id="title" name="title" required className="resumi-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs text-[var(--on-surface-muted)]">
                  {t("profile.exp.location")}
                </Label>
                <Input id="location" name="location" placeholder={t("profile.exp.location_ph")} className="resumi-input" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.exp.start")}
                  </Label>
                  <Input id="startDate" name="startDate" type="month" required className="resumi-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.exp.end")}
                  </Label>
                  <Input id="endDate" name="endDate" type="month" className="resumi-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bullets" className="text-xs text-[var(--on-surface-muted)]">
                  {t("profile.exp.bullets")}
                </Label>
                <Textarea
                  id="bullets"
                  name="bullets"
                  rows={5}
                  placeholder={t("profile.exp.bullets_ph")}
                  className="resumi-input"
                />
              </div>
              <Button
                type="submit"
                className="magical-gradient magic-shine h-11 w-full rounded-full"
              >
                {t("profile.exp.add")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {experiences.length === 0 ? (
        <div className="resumi-card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-sunk)]">
            <Building2 className="h-5 w-5 text-[var(--on-surface-muted)]" />
          </div>
          <p className="text-[var(--on-surface-muted)]">{t("profile.exp.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div key={exp.id} className="resumi-card overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--on-surface)]">{exp.title}</h3>
                  <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
                    {exp.company}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[11px] text-[var(--on-surface-soft)]">
                    {exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}
                  </span>
                  <form action={() => deleteWorkExperience(exp.id)}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-[8px] text-[var(--on-surface-muted)] hover:bg-[var(--surface-sunk)] hover:text-[var(--destructive)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              {exp.bullets.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--on-surface-soft)]">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
