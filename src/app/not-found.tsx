"use client";

import Link from "next/link";
import { ArrowUpRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/context";

export default function NotFound() {
  const t = useT();

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--surface)] px-4 py-16 text-center">
      <div className="max-w-xl">
        <p className="text-[12px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
          {t("notfound.eyebrow")}
        </p>
        <h1 className="font-headline mt-4 text-[clamp(40px,6vw,72px)] font-normal leading-[1.02] tracking-[-0.022em] text-[var(--on-surface)]">
          {t("notfound.title.part1")}{" "}
          <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">
            {t("notfound.title.italic")}
          </em>
          .
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[var(--on-surface-muted)]">
          {t("notfound.lead")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              className="h-11 rounded-full bg-transparent px-5 text-[14px] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong)] hover:bg-[var(--surface-sunk)] hover:shadow-[inset_0_0_0_1px_var(--ink)]"
            >
              <Home className="me-1.5 h-4 w-4" />
              {t("notfound.cta_home")}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="magical-gradient magic-shine h-11 rounded-full px-5 text-[14px]">
              {t("notfound.cta_dashboard")}
              <ArrowUpRight className="ms-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
