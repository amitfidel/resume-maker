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

type Props = {
  resumeId: string;
};

export function SaveVersionButton({ resumeId }: Props) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        Save Version
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-headline">Save a Version</DialogTitle>
          <DialogDescription>
            Create a snapshot you can return to later. Good for checkpointing
            before big changes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="summary">What&apos;s different about this version?</Label>
          <Input
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && summary.trim()) handleSave();
            }}
            placeholder="e.g. Tailored for Google SWE role"
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
                Saving...
              </>
            ) : (
              "Save Version"
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
