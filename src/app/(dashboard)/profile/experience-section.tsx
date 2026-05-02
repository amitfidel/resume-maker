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
import { Plus, Trash2, Building2, Shield, HeartHandshake } from "lucide-react";
import { createWorkExperience, deleteWorkExperience } from "./actions";
import type { WorkExperience, ExperienceBullet } from "@/db/schema";
import { useT } from "@/lib/i18n/context";

type ExperienceWithBullets = WorkExperience & {
  bullets: ExperienceBullet[];
};

type Category = "work" | "military" | "volunteer";

const CATEGORY_LABELS: Record<
  Category,
  { title: string; icon: typeof Building2 }
> = {
  work: { title: "Work Experience", icon: Building2 },
  military: { title: "Military Service", icon: Shield },
  volunteer: { title: "Volunteering", icon: HeartHandshake },
};

export function ExperienceSection({
  experiences,
}: {
  experiences: ExperienceWithBullets[];
}) {
  const t = useT();

  // Bucket entries by category. The DB column is "work" by default for
  // every legacy row, so an account that pre-dates the column just sees
  // all its entries under Work Experience — no migration needed.
  const groups: Record<Category, ExperienceWithBullets[]> = {
    work: [],
    military: [],
    volunteer: [],
  };
  for (const exp of experiences) {
    const cat = (exp.category as Category) ?? "work";
    if (cat === "military" || cat === "volunteer") {
      groups[cat].push(exp);
    } else {
      groups.work.push(exp);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
          {t("profile.exp.title")}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
          {t("profile.exp.lead")}
        </p>
      </div>

      {(["work", "military", "volunteer"] as const).map((cat) => (
        <CategoryGroup
          key={cat}
          category={cat}
          experiences={groups[cat]}
        />
      ))}
    </div>
  );
}

function CategoryGroup({
  category,
  experiences,
}: {
  category: Category;
  experiences: ExperienceWithBullets[];
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const meta = CATEGORY_LABELS[category];
  const Icon = meta.icon;

  async function handleCreate(formData: FormData) {
    formData.set("category", category);
    await createWorkExperience(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--on-surface-muted)]" />
          <h3 className="text-[15px] font-semibold text-[var(--on-surface)]">
            {meta.title}
          </h3>
          <span className="font-mono text-[11px] text-[var(--on-surface-muted)]">
            ({experiences.length})
          </span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-full text-[12px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
              />
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {t("profile.exp.add")}
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
            <DialogHeader>
              <DialogTitle className="font-headline text-[22px] font-normal tracking-[-0.01em]">
                {`Add to ${meta.title}`}
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`company-${category}`}
                    className="text-xs text-[var(--on-surface-muted)]"
                  >
                    {category === "volunteer"
                      ? "Organization"
                      : t("profile.exp.company")}
                  </Label>
                  <Input
                    id={`company-${category}`}
                    name="company"
                    required
                    className="resumi-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`title-${category}`}
                    className="text-xs text-[var(--on-surface-muted)]"
                  >
                    {t("profile.exp.job_title")}
                  </Label>
                  <Input
                    id={`title-${category}`}
                    name="title"
                    required
                    className="resumi-input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor={`location-${category}`}
                  className="text-xs text-[var(--on-surface-muted)]"
                >
                  {t("profile.exp.location")}
                </Label>
                <Input
                  id={`location-${category}`}
                  name="location"
                  placeholder={t("profile.exp.location_ph")}
                  className="resumi-input"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`startDate-${category}`}
                    className="text-xs text-[var(--on-surface-muted)]"
                  >
                    {t("profile.exp.start")}
                  </Label>
                  <Input
                    id={`startDate-${category}`}
                    name="startDate"
                    type="month"
                    required
                    className="resumi-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`endDate-${category}`}
                    className="text-xs text-[var(--on-surface-muted)]"
                  >
                    {t("profile.exp.end")}
                  </Label>
                  <Input
                    id={`endDate-${category}`}
                    name="endDate"
                    type="month"
                    className="resumi-input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor={`bullets-${category}`}
                  className="text-xs text-[var(--on-surface-muted)]"
                >
                  {t("profile.exp.bullets")}
                </Label>
                <Textarea
                  id={`bullets-${category}`}
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
        <div className="resumi-card flex items-center gap-3 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--surface-sunk)]">
            <Icon className="h-4 w-4 text-[var(--on-surface-muted)]" />
          </div>
          <p className="text-sm text-[var(--on-surface-muted)]">
            No {meta.title.toLowerCase()} entries yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div key={exp.id} className="resumi-card overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--on-surface)]">
                    {exp.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
                    {exp.company}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[11px] text-[var(--on-surface-soft)]">
                    {exp.startDate} —{" "}
                    {exp.isCurrent ? "Present" : exp.endDate}
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
