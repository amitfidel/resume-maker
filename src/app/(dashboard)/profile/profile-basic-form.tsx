"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCareerProfile } from "./actions";
import type { CareerProfile } from "@/db/schema";

export function ProfileBasicForm({
  profile,
}: {
  profile: CareerProfile | undefined;
}) {
  return (
    <div className="resumi-card p-6 sm:p-7">
      <div className="mb-5">
        <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
          Basic <em className="serif-ital">info</em>
        </h2>
        <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
          Contact details + the one-line headline hiring managers see first.
        </p>
      </div>
      <form action={updateCareerProfile} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="headline" className="text-xs text-[var(--on-surface-muted)]">
              Professional headline
            </Label>
            <Input
              id="headline"
              name="headline"
              placeholder="Senior Software Engineer"
              defaultValue={profile?.headline ?? ""}
              className="resumi-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-xs text-[var(--on-surface-muted)]">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              placeholder="San Francisco, CA"
              defaultValue={profile?.location ?? ""}
              className="resumi-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary" className="text-xs text-[var(--on-surface-muted)]">
            Professional summary
          </Label>
          <Textarea
            id="summary"
            name="summary"
            placeholder="A short positioning paragraph — what you do, for whom, with what edge."
            rows={4}
            defaultValue={profile?.summary ?? ""}
            className="resumi-input"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-[var(--on-surface-muted)]">
              Contact email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              defaultValue={profile?.email ?? ""}
              className="resumi-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-[var(--on-surface-muted)]">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+1 (555) 123-4567"
              defaultValue={profile?.phone ?? ""}
              className="resumi-input"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="linkedinUrl" className="text-xs text-[var(--on-surface-muted)]">
              LinkedIn
            </Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              placeholder="linkedin.com/in/…"
              defaultValue={profile?.linkedinUrl ?? ""}
              className="resumi-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="githubUrl" className="text-xs text-[var(--on-surface-muted)]">
              GitHub
            </Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              placeholder="github.com/…"
              defaultValue={profile?.githubUrl ?? ""}
              className="resumi-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl" className="text-xs text-[var(--on-surface-muted)]">
              Website
            </Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              placeholder="yourwebsite.com"
              defaultValue={profile?.websiteUrl ?? ""}
              className="resumi-input"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="magical-gradient magic-shine h-10 rounded-full px-5"
        >
          Save changes
        </Button>
      </form>
    </div>
  );
}
