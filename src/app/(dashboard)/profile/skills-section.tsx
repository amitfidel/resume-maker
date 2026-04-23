"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X, Wrench } from "lucide-react";
import { createSkill, deleteSkill } from "./actions";
import type { Skill } from "@/db/schema";

export function SkillsSection({ skills }: { skills: Skill[] }) {
  const [open, setOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    await createSkill(formData);
    setOpen(false);
  }

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
            <em className="serif-ital">Skills</em>
          </h2>
          <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
            Tools, languages, and methods you use.
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
            Add skill
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
            <DialogHeader>
              <DialogTitle className="font-headline text-[22px] font-normal tracking-[-0.01em]">
                Add <em className="serif-ital">skill</em>
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-[var(--on-surface-muted)]">Skill name</Label>
                <Input id="name" name="name" placeholder="React" required className="resumi-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs text-[var(--on-surface-muted)]">Category</Label>
                <Input id="category" name="category" placeholder="Frontend, Backend, Design…" className="resumi-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proficiency" className="text-xs text-[var(--on-surface-muted)]">Proficiency</Label>
                <Input id="proficiency" name="proficiency" placeholder="Expert · Proficient · Familiar" className="resumi-input" />
              </div>
              <Button type="submit" className="magical-gradient magic-shine h-11 w-full rounded-full">
                Add skill
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {skills.length === 0 ? (
        <div className="resumi-card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-sunk)]">
            <Wrench className="h-5 w-5 text-[var(--on-surface-muted)]" />
          </div>
          <p className="text-[var(--on-surface-muted)]">No skills added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, categorySkills]) => (
            <div key={category} className="resumi-card p-5">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-sunk)] py-1 pl-3 pr-1 text-[13px] text-[var(--on-surface)]"
                  >
                    {skill.name}
                    {skill.proficiency && (
                      <span className="text-[11px] text-[var(--on-surface-muted)]">
                        · {skill.proficiency}
                      </span>
                    )}
                    <form action={() => deleteSkill(skill.id)} className="inline">
                      <button
                        type="submit"
                        className="ml-0.5 rounded-full p-1 text-[var(--on-surface-muted)] hover:bg-[var(--surface)] hover:text-[var(--destructive)]"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </form>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
