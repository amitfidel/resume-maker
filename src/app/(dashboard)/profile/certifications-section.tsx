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
import { Plus, Trash2, Award } from "lucide-react";
import { createCertification, deleteCertification } from "./actions";
import type { Certification } from "@/db/schema";

export function CertificationsSection({
  certifications,
}: {
  certifications: Certification[];
}) {
  const [open, setOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    await createCertification(formData);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
            <em className="serif-ital">Certifications</em>
          </h2>
          <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
            Credentials, licenses, and certifications you hold.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="magical-gradient magic-shine h-9 rounded-full px-4" />
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add certification
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
            <DialogHeader>
              <DialogTitle className="font-headline text-[22px] font-normal tracking-[-0.01em]">
                Add <em className="serif-ital">certification</em>
              </DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-[var(--on-surface-muted)]">
                  Certification name
                </Label>
                <Input id="name" name="name" required className="resumi-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issuer" className="text-xs text-[var(--on-surface-muted)]">
                  Issuer
                </Label>
                <Input id="issuer" name="issuer" placeholder="AWS, Google, etc." className="resumi-input" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="issueDate" className="text-xs text-[var(--on-surface-muted)]">
                    Issue date
                  </Label>
                  <Input id="issueDate" name="issueDate" type="month" className="resumi-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiryDate" className="text-xs text-[var(--on-surface-muted)]">
                    Expiry date
                  </Label>
                  <Input id="expiryDate" name="expiryDate" type="month" className="resumi-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="credentialUrl" className="text-xs text-[var(--on-surface-muted)]">
                  Credential URL
                </Label>
                <Input id="credentialUrl" name="credentialUrl" placeholder="https://…" className="resumi-input" />
              </div>
              <Button type="submit" className="magical-gradient magic-shine h-11 w-full rounded-full">
                Add certification
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {certifications.length === 0 ? (
        <div className="resumi-card flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-[12px] bg-[var(--surface-sunk)]">
            <Award className="h-5 w-5 text-[var(--on-surface-muted)]" />
          </div>
          <p className="text-[var(--on-surface-muted)]">No certifications added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div key={cert.id} className="resumi-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--on-surface)]">{cert.name}</h3>
                  {cert.issuer && (
                    <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">{cert.issuer}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {cert.issueDate && (
                    <span className="font-mono rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[11px] text-[var(--on-surface-soft)]">
                      {cert.issueDate}
                    </span>
                  )}
                  <form action={() => deleteCertification(cert.id)}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
