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
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { createEducation, deleteEducation } from "./actions";
import type { Education } from "@/db/schema";
import { useT } from "@/lib/i18n/context";

export function EducationSection({ education }: { education: Education[] }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  async function handleCreate(formData: FormData) {
    await createEducation(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
            {t("profile.edu.title")}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
            {t("profile.edu.lead")}
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
            {t("profile.edu.add")}
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
            <DialogHeader>
              <DialogTitle className="font-headline text-[22px] font-normal tracking-[-0.01em]">
                {t("profile.edu.add")}
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="institution" className="text-xs text-[var(--on-surface-muted)]">
                  {t("profile.edu.institution")}
                </Label>
                <Input id="institution" name="institution" required className="resumi-input" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="degree" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.edu.degree")}
                  </Label>
                  <Input id="degree" name="degree" placeholder={t("profile.edu.degree_ph")} required className="resumi-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fieldOfStudy" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.edu.field")}
                  </Label>
                  <Input id="fieldOfStudy" name="fieldOfStudy" placeholder={t("profile.edu.field_ph")} className="resumi-input" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.edu.start")}
                  </Label>
                  <Input id="startDate" name="startDate" type="month" className="resumi-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs text-[var(--on-surface-muted)]">
                    {t("profile.edu.end")}
                  </Label>
                  <Input id="endDate" name="endDate" type="month" className="resumi-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gpa" className="text-xs text-[var(--on-surface-muted)]">
                  {t("profile.edu.gpa")}
                </Label>
                <Input id="gpa" name="gpa" placeholder={t("profile.edu.gpa_ph")} className="resumi-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs text-[var(--on-surface-muted)]">
                  {t("profile.edu.notes")}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder={t("profile.edu.notes_ph")}
                  className="resumi-input"
                />
              </div>
              <Button
                type="submit"
                className="magical-gradient magic-shine h-11 w-full rounded-full"
              >
                {t("profile.edu.add")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {education.length === 0 ? (
        <div className="resumi-card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-sunk)]">
            <GraduationCap className="h-5 w-5 text-[var(--on-surface-muted)]" />
          </div>
          <p className="text-[var(--on-surface-muted)]">{t("profile.edu.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {education.map((ed) => (
            <div key={ed.id} className="resumi-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--on-surface)]">
                    {ed.degree}
                    {ed.fieldOfStudy && ` in ${ed.fieldOfStudy}`}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
                    {ed.institution}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {ed.endDate && (
                    <span className="font-mono rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[11px] text-[var(--on-surface-soft)]">
                      {ed.endDate}
                    </span>
                  )}
                  {ed.gpa && (
                    <span className="rounded-full bg-[var(--magic-tint)] px-2.5 py-1 text-[11px] text-[var(--magic-1)]">
                      GPA {ed.gpa}
                    </span>
                  )}
                  <form action={() => deleteEducation(ed.id)}>
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
              {ed.description && (
                <p className="mt-3 text-sm text-[var(--on-surface-soft)]">{ed.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
