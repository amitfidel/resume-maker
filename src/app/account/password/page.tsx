"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updatePassword } from "@/app/(auth)/actions";
import { useT } from "@/lib/i18n/context";

/**
 * Set-new-password screen. Reached via the email link from
 * `requestPasswordReset` after the auth callback exchanges the recovery
 * `code=` for a session — by the time we land here the user is signed in
 * and can call `updateUser({ password })`.
 */
export default function PasswordPage() {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updatePassword(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-2xl border-0 bg-[var(--surface-raised)] shadow-[var(--sh-3),0_0_0_1px_var(--border-ghost)]">
        <CardHeader className="items-center space-y-3 pb-4 text-center">
          <Link href="/" className="inline-flex items-baseline gap-0.5">
            <span className="font-headline text-[28px] tracking-[-0.02em] text-[var(--on-surface)]">
              Resumi
            </span>
            <span className="ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-[var(--magic-2)]" />
          </Link>
          <CardTitle className="font-headline text-[28px] font-normal leading-none tracking-[-0.02em]">
            {t("auth.password.title.part1")}{" "}
            <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">
              {t("auth.password.title.italic")}
            </em>
          </CardTitle>
          <CardDescription className="text-[var(--on-surface-muted)]">
            {t("auth.password.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password.label")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            )}

            <Button
              type="submit"
              className="magical-gradient magic-shine h-11 w-full rounded-full"
              disabled={loading}
            >
              {loading
                ? t("auth.password.submitting")
                : t("auth.password.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
