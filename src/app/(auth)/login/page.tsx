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
import {
  signIn,
  signInWithGoogle,
  signInWithMagicLink,
  requestPasswordReset,
} from "../actions";
import { useT } from "@/lib/i18n/context";

export default function LoginPage() {
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setInfo(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setInfo(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError(t("auth.login.magic_need_email"));
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const fd = new FormData();
    fd.set("email", email);
    const result = await signInWithMagicLink(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setInfo(t("auth.login.magic_sent"));
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError(t("auth.login.magic_need_email"));
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const fd = new FormData();
    fd.set("email", email);
    const result = await requestPasswordReset(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setInfo(t("auth.login.reset_sent"));
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
            {t("auth.login.title.part1")}{" "}
            <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">
              {t("auth.login.title.italic")}
            </em>
          </CardTitle>
          <CardDescription className="text-[var(--on-surface-muted)]">
            {t("auth.login.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="h-11 w-full rounded-full border-0 bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong)] hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_var(--ink)]"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("auth.login.google")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.login.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.login.password")}</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs text-[var(--magic-1)] hover:underline disabled:opacity-50 dark:text-[var(--magic-2)]"
                >
                  {t("auth.login.forgot")}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            )}
            {info && (
              <p className="text-sm text-[var(--success)]">{info}</p>
            )}

            <Button
              type="submit"
              className="magical-gradient magic-shine h-11 w-full rounded-full"
              disabled={loading}
            >
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleMagicLink}
              disabled={loading}
              className="h-10 w-full rounded-full text-[13px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
            >
              {loading ? t("auth.login.magic_sending") : t("auth.login.magic")}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--on-surface-muted)]">
            {t("auth.login.no_account")}{" "}
            <Link
              href="/signup"
              className="text-[var(--magic-1)] underline-offset-4 hover:underline dark:text-[var(--magic-2)]"
            >
              {t("auth.signup.submit")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
