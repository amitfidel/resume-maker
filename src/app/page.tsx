"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PaperPreview } from "@/components/landing/paper-preview";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { useT } from "@/lib/i18n/context";
import {
  FileText,
  Sparkles,
  Target,
  BarChart3,
  ArrowRight,
  Wand2,
  ArrowUpRight,
} from "lucide-react";

export default function Home() {
  const t = useT();
  const STEPS = [
    {
      n: "01",
      icon: FileText,
      title: t("landing.step1.title"),
      desc: t("landing.step1.desc"),
      magical: false,
    },
    {
      n: "02",
      icon: Sparkles,
      title: t("landing.step2.title"),
      desc: t("landing.step2.desc"),
      magical: true,
    },
    {
      n: "03",
      icon: Target,
      title: t("landing.step3.title"),
      desc: t("landing.step3.desc"),
      magical: true,
    },
    {
      n: "04",
      icon: BarChart3,
      title: t("landing.step4.title"),
      desc: t("landing.step4.desc"),
      magical: false,
    },
  ];
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="glass-effect sticky top-0 z-50 flex items-center justify-between px-10 py-5 transition-colors">
        <Link href="/" className="inline-flex items-baseline gap-0.5">
          <span className="font-headline text-2xl tracking-[-0.02em] text-[var(--on-surface)]">
            Resumi
          </span>
          <span className="ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-[var(--magic-2)]" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[var(--on-surface-soft)] md:flex">
          <a href="#how" className="relative py-1 transition-colors hover:text-[var(--on-surface)]">
            {t("nav.how")}
          </a>
          <a href="#pricing" className="relative py-1 transition-colors hover:text-[var(--on-surface)]">
            {t("nav.pricing")}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-[var(--on-surface-soft)]"
            >
              {t("nav.signin")}
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="magic-shine rounded-full bg-[var(--ink)] px-4 text-[var(--cream)] hover:-translate-y-px hover:bg-[var(--ink)]"
            >
              {t("nav.get_started")}
              <ArrowRight className="ms-1.5 h-3.5 w-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-[1240px] px-10 pb-10 pt-20">
        <span className="mb-7 inline-flex items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3.5 py-1.5 text-[12px] tracking-[0.04em] text-[var(--on-surface-soft)] shadow-[inset_0_0_0_1px_var(--border-ghost),var(--sh-1)]">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            {t("landing.eyebrow")}
          </span>

        <h1 className="font-headline max-w-[1000px] text-[clamp(56px,8vw,112px)] font-normal leading-[0.96] tracking-[-0.025em] text-[var(--on-surface)]">
          {t("landing.h1.part1")}{" "}
          <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">
            {t("landing.h1.italic")}
          </em>{" "}
          {t("landing.h1.part2")}
        </h1>

        <p className="mt-7 max-w-[520px] text-[19px] leading-[1.55] text-[var(--on-surface-soft)]">
          {t("landing.lead")}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3.5">
          <MagneticButton>
            <Link href="/signup">
              <Button className="magical-gradient magic-shine h-12 rounded-full px-6 text-[15px] font-medium shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_10px_24px_-8px_var(--magic-glow)]">
                {t("landing.cta.primary")}
                <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.25}>
            <Link href="/login">
              <Button
                variant="outline"
                className="h-12 rounded-full border-0 bg-[var(--surface-raised)] px-6 text-[15px] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong),var(--sh-1)] hover:shadow-[inset_0_0_0_1px_var(--ink),var(--sh-2)]"
              >
                {t("landing.cta.secondary")}
              </Button>
            </Link>
          </MagneticButton>
          <span className="ms-1 inline-flex items-center gap-1.5 text-[13px] text-[var(--on-surface-muted)]">
            {t("landing.press")}
            <kbd className="font-mono rounded bg-[var(--surface-raised)] px-1.5 py-0.5 text-[11px] shadow-[inset_0_0_0_1px_var(--border-ghost-strong),0_1px_0_var(--border-ghost-strong)]">
              ⌘K
            </kbd>
            {t("landing.anywhere")}
          </span>
        </div>
      </section>

      {/* Hero stage — paper preview + callouts */}
      <section className="relative px-10 py-20">
        <div className="absolute inset-x-0 top-12 bottom-20 bg-gradient-to-b from-transparent via-[var(--surface-sunk)] to-transparent" />
        <div className="relative mx-auto grid max-w-[1200px] place-items-center">
          <div className="relative aspect-[8.5/11] w-full max-w-[720px] overflow-hidden rounded bg-white shadow-paper [transform:perspective(1800px)_rotateX(3deg)] transition-transform duration-[600ms] ease-[var(--ease-out)] hover:[transform:perspective(1800px)_rotateX(0deg)]">
            <PaperPreview />
          </div>

          <div className="float absolute left-[-2%] top-[6%] z-10 flex max-w-[260px] items-start gap-2.5 rounded-xl bg-[var(--surface-raised)] p-3.5 text-[13px] shadow-[var(--sh-3)]">
            <div className="flex h-7 w-7 flex-none place-items-center rounded-[8px] bg-[var(--surface-sunk)]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-medium leading-tight">Rewrote 3 bullets</div>
              <div className="mt-0.5 text-[12px] text-[var(--on-surface-muted)]">
                Stronger verbs, added metrics
              </div>
            </div>
          </div>

          <div
            className="float absolute right-[-4%] top-[36%] z-10 flex max-w-[260px] items-start gap-2.5 rounded-xl p-3.5 text-[13px] shadow-magic [animation-delay:-2s]"
            style={{
              background: "linear-gradient(135deg, var(--magic-1), var(--magic-2))",
              color: "white",
            }}
          >
            <div className="flex h-7 w-7 flex-none place-items-center rounded-[8px] bg-white/15">
              <Target className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-medium leading-tight">Match: 92%</div>
              <div className="mt-0.5 text-[12px] text-white/80">Senior PM @ Linear</div>
            </div>
          </div>

          <div className="float absolute bottom-[12%] left-[-1%] z-10 flex max-w-[260px] items-start gap-2.5 rounded-xl bg-[var(--surface-raised)] p-3.5 text-[13px] shadow-[var(--sh-3)] [animation-delay:-4s]">
            <div className="flex h-7 w-7 flex-none place-items-center rounded-[8px] bg-[var(--surface-sunk)]">
              <Wand2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-medium leading-tight">Saved · just now</div>
              <div className="mt-0.5 text-[12px] text-[var(--on-surface-muted)]">
                Version 4 — Linear tailor
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — combined workflow + features */}
      <section id="how" className="mx-auto max-w-[1240px] px-10 py-[120px]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
          {t("landing.how.eyebrow")}
        </p>
        <h2 className="font-headline mt-3.5 max-w-[900px] text-[clamp(40px,5vw,64px)] font-normal leading-[1.02] tracking-[-0.02em]">
          {t("landing.how.h2.part1")}{" "}
          <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">
            {t("landing.how.h2.italic")}
          </em>
          {t("landing.how.h2.part2")}
        </h2>
        <p className="mt-5 max-w-[640px] text-[17px] leading-[1.55] text-[var(--on-surface-soft)]">
          {t("landing.how.lead")}
        </p>

        <div className="mt-[60px] grid grid-cols-1 gap-[1px] overflow-hidden rounded-2xl bg-[var(--border-ghost)] shadow-[inset_0_0_0_1px_var(--border-ghost)] md:grid-cols-2">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="group relative flex flex-col gap-4 overflow-hidden bg-[var(--surface)] p-10 transition-colors hover:bg-[var(--surface-raised)]"
            >
              <span className="absolute start-0 top-0 h-0.5 w-0 bg-gradient-to-r from-[var(--magic-1)] to-[var(--magic-2)] transition-[width] duration-[var(--t-slow)] ease-[var(--ease-out)] group-hover:w-full" />
              <div className="flex items-center gap-4">
                <span className="font-headline text-[54px] leading-none tracking-[-0.02em] text-[var(--on-surface-faint)] transition-colors group-hover:text-[var(--magic-2)]">
                  {s.n}
                </span>
                <div
                  className={`flex h-[42px] w-[42px] place-items-center rounded-[10px] bg-[var(--surface-sunk)] text-[var(--on-surface)] transition-all duration-[var(--t-mid)] ease-[var(--ease-out)] group-hover:-rotate-[4deg] group-hover:text-[var(--cream)] ${
                    s.magical
                      ? "group-hover:[background:linear-gradient(135deg,var(--magic-1),var(--magic-2))]"
                      : "group-hover:bg-[var(--ink)]"
                  }`}
                >
                  <s.icon className="mx-auto h-[18px] w-[18px]" />
                </div>
              </div>
              <h3 className="font-headline text-[28px] font-normal leading-tight tracking-[-0.015em]">
                {s.title}
              </h3>
              <p className="max-w-[42ch] text-[15px] leading-[1.55] text-[var(--on-surface-soft)]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="px-10">
        <div className="relative mx-auto my-10 max-w-[1160px] overflow-hidden rounded-[28px] bg-[var(--ink)] px-10 py-20 text-center text-[var(--cream)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 400px at 80% 0%, rgba(109,60,255,0.35), transparent 60%), radial-gradient(700px 500px at 10% 100%, rgba(226,98,47,0.20), transparent 60%)",
            }}
          />
          <h2 className="font-headline relative text-[clamp(44px,6vw,84px)] font-normal leading-none tracking-[-0.025em]">
            {t("landing.cta2.part1")}{" "}
            <em className="serif-ital" style={{ color: "#c9b2ff" }}>
              {t("landing.cta2.italic")}
            </em>{" "}
            {t("landing.cta2.part2")}
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-[17px] text-[rgba(250,248,243,0.75)]">
            {t("landing.cta2.lead")}
          </p>
          <div className="relative mt-9 inline-flex flex-wrap justify-center gap-3.5">
            <MagneticButton>
              <Link href="/signup">
                <Button className="magical-gradient magic-shine h-12 rounded-full px-7 text-[15px]">
                  {t("landing.cta2.primary")}
                  <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.2}>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="h-12 rounded-full bg-transparent px-7 text-[15px] text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] hover:bg-white/5 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
                >
                  {t("nav.signin")}
                  <ArrowUpRight className="ms-1.5 h-4 w-4" />
                </Button>
              </Link>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1240px] justify-between px-10 py-10 text-[13px] text-[var(--on-surface-muted)]">
        <span>
          <span className="font-headline text-[15px] text-[var(--on-surface)]">
            Resumi
          </span>{" "}
          {t("landing.footer.tagline")}
        </span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

