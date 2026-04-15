"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { createEducation, deleteEducation } from "./actions";
import type { Education } from "@/db/schema";

export function EducationSection({
  education,
}: {
  education: Education[];
}) {
  const [open, setOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    await createEducation(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Education</h2>
          <p className="text-sm text-muted-foreground">
            Your educational background.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Education
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Education</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" name="institution" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input id="degree" name="degree" placeholder="B.S." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input id="fieldOfStudy" name="fieldOfStudy" placeholder="Computer Science" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (optional)</Label>
                <Input id="gpa" name="gpa" placeholder="3.8/4.0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Relevant coursework, honors, activities..."
                />
              </div>
              <Button type="submit" className="w-full">
                Add Education
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {education.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No education added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {education.map((ed) => (
            <Card key={ed.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {ed.degree}
                      {ed.fieldOfStudy && ` in ${ed.fieldOfStudy}`}
                    </CardTitle>
                    <CardDescription>{ed.institution}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {ed.endDate && <Badge variant="outline">{ed.endDate}</Badge>}
                    {ed.gpa && <Badge variant="secondary">GPA: {ed.gpa}</Badge>}
                    <form action={() => deleteEducation(ed.id)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardHeader>
              {ed.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{ed.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
