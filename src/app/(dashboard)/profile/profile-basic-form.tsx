"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCareerProfile } from "./actions";
import type { CareerProfile } from "@/db/schema";
import { useT } from "@/lib/i18n/context";

export function ProfileBasicForm({
  profile,
}: {
  profile: CareerProfile | undefined;
}) {
  const t = useT();
  return (
    <div className="resumi-card p-6 sm:p-7">
      <div className="mb-5">
        <h2 className="font-headline text-[26px] font-normal tracking-[-0.015em]">
          {t("profile.basic.title")}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
          {t("profile.basic.lead")}
        </p>
      </div>
      <form action={updateCareerProfile} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="headline" className="text-xs text-[var(--on-surface-muted)]">
              {t("profile.basic.headline")}
            </Label>
            <Input
              id="headline"
              name="headline"
              placeholder={t("profile.basic.headline_ph")}
              defaultValue={profile?.headline ?? ""}
              className="resumi-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-xs text-[var(--on-surface-muted)]">
              {t("profile.basic.location")}
            </Label>
            <Input
              id="location"
              name="location"
              placeholder={t("profile.basic.location_ph")}
              defaultValue={profile?.location ?? ""}
              className="resumi-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary" className="text-xs text-[var(--on-surface-muted)]">
            {t("profile.basic.summary")}
          </Label>
          <Textarea
            id="summary"
            name="summary"
            placeholder={t("profile.basic.summary_ph")}
            rows={4}
            defaultValue={profile?.summary ?? ""}
            className="resumi-input"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-[var(--on-surface-muted)]">
              {t("profile.basic.email")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("profile.basic.email_ph")}
              defaultValue={profile?.email ?? ""}
              className="resumi-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-[var(--on-surface-muted)]">
              {t("profile.basic.phone")}
            </Label>
            <Input
              id="phone"
              name="phone"
              placeholder={t("profile.basic.phone_ph")}
              defaultValue={profile?.phone ?? ""}
              className="resumi-input"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="linkedinUrl" className="text-xs text-[var(--on-surface-muted)]">
              {t("profile.basic.linkedin")}
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
              {t("profile.basic.github")}
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
              {t("profile.basic.website")}
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
          {t("profile.basic.save")}
        </Button>
      </form>
    </div>
  );
}
