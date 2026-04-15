"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Wrench } from "lucide-react";
import { createSkill, deleteSkill } from "./actions";
import type { Skill } from "@/db/schema";

export function SkillsSection({ skills }: { skills: Skill[] }) {
  const [open, setOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    await createSkill(formData);
    setOpen(false);
  }

  // Group skills by category
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">
            Technical skills, tools, and competencies.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Skill</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Skill Name</Label>
                <Input id="name" name="name" placeholder="React" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="Languages, Frameworks, Tools..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency</Label>
                <Input
                  id="proficiency"
                  name="proficiency"
                  placeholder="Expert, Proficient, Familiar"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Skill
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No skills added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categorySkills]) => (
            <Card key={category}>
              <CardContent className="pt-6">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {skill.name}
                      {skill.proficiency && (
                        <span className="text-xs text-muted-foreground">
                          ({skill.proficiency})
                        </span>
                      )}
                      <form action={() => deleteSkill(skill.id)} className="inline">
                        <button
                          type="submit"
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </form>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
