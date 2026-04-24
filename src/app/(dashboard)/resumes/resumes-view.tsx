"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { createResume } from "./actions";
import { useT } from "@/lib/i18n/context";

type ResumeRow = {
  id: string;
  title: string;
  status: string | null;
  updatedAt: Date;
};

type Props = {
  firstName: string;
  resumes: ResumeRow[];
};

export function ResumesView({ firstName, resumes }: Props) {
  const t = useT();

  return (
    <div className="space-y-10">
      {/* Hero welcome card */}
      <div
        className="relative grid items-center gap-10 overflow-hidden rounded-[28px] p-11 text-[var(--cream)]"
        style={{
          gridTemplateColumns: "1fr auto",
          background: "linear-gradient(135deg, var(--ink) 0%, #1b2236 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(500px 360px at 90% -10%, rgba(109,60,255,0.40), transparent 60%)",
          }}
        />
        <div className="relative">
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/55">
            {t("resumes.hero.eyebrow")}
          </p>
          <h1 className="font-headline mt-2.5 max-w-[20ch] text-[clamp(36px,5vw,54px)] font-normal leading-[1.02] tracking-[-0.022em]">
            {t("resumes.hero.title.part1")}{" "}
            <em className="serif-ital" style={{ color: "#c9b2ff" }}>
              {t("resumes.hero.title.italic")}
            </em>
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <div className="mt-7 flex flex-wrap gap-3">
            <form action={createResume}>
              <input type="hidden" name="title" value="Untitled Resume" />
              <Button
                type="submit"
                className="magical-gradient magic-shine h-11 rounded-full px-5 text-[14px]"
              >
                <Plus className="me-1.5 h-4 w-4" />
                {t("resumes.hero.new")}
              </Button>
            </form>
            <Link href="/import">
              <Button
                variant="ghost"
                className="h-11 rounded-full bg-transparent px-5 text-[14px] text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] hover:bg-white/5 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]"
              >
                <Sparkles className="me-1.5 h-4 w-4" />
                {t("resumes.hero.import")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mini paper */}
        <div
          className="relative aspect-[8.5/11] w-[180px] overflow-hidden rounded-md bg-white transition-transform duration-500 ease-[var(--ease-spring)] hover:rotate-0 hover:scale-[1.04]"
          style={{
            transform: "rotate(4deg)",
            boxShadow:
              "0 40px 80px -30px rgba(0,0,0,0.6), 0 16px 40px -20px rgba(109,60,255,0.35)",
          }}
        >
          <MiniPaper />
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
            {t("resumes.library.eyebrow")}
          </p>
          <h2 className="font-headline mt-1 text-[32px] font-normal tracking-[-0.015em]">
            {t("resumes.library.title.part1")}{" "}
            <em className="serif-ital">
              {t("resumes.library.title.italic")}
            </em>
          </h2>
        </div>
        <form action={createResume}>
          <input type="hidden" name="title" value="Untitled Resume" />
          <Button
            type="submit"
            variant="ghost"
            className="rounded-full text-[var(--on-surface-soft)] hover:text-[var(--on-surface)]"
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t("resumes.hero.new")}
          </Button>
        </form>
      </div>

      {/* Thumbnails grid */}
      {resumes.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resumes.map((resume) => (
            <Link
              key={resume.id}
              href={`/resumes/${resume.id}/edit`}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-[var(--surface-raised)] shadow-[var(--sh-1)] transition-all duration-[var(--t-mid)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--sh-3)]"
            >
              <div
                className="mx-3.5 mt-3.5 aspect-[8.5/11] overflow-hidden rounded shadow-[inset_0_0_0_1px_var(--border-ghost),0_4px_16px_-6px_rgba(14,18,32,0.1)]"
                style={{ background: "white" }}
              >
                <MiniPaper title={resume.title} variant={idToVariant(resume.id)} />
              </div>
              <div className="px-4 pb-4 pt-3.5">
                <div className="truncate text-[14px] font-medium text-[var(--on-surface)]">
                  {resume.title}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--on-surface-muted)]">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] ${
                      resume.status === "active"
                        ? "bg-[var(--magic-tint)] text-[var(--magic-1)]"
                        : "bg-[var(--surface-sunk)] text-[var(--on-surface-soft)]"
                    }`}
                  >
                    {resume.status}
                  </span>
                  <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}

          {/* New resume card */}
          <form
            action={createResume}
            className="grid place-items-center min-h-[260px] rounded-2xl text-center text-[var(--on-surface-muted)] transition-all duration-[var(--t-mid)] group"
            style={{
              background: "transparent",
              boxShadow: "inset 0 0 0 2px var(--border-ghost-strong)",
            }}
          >
            <input type="hidden" name="title" value="Untitled Resume" />
            <button
              type="submit"
              className="flex flex-col items-center gap-3.5 px-5 py-10 transition-colors group-hover:text-[var(--on-surface)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--surface-raised)] transition-all duration-[var(--t-mid)] ease-[var(--ease-out)] group-hover:rotate-90 group-hover:bg-[var(--ink)] group-hover:text-[var(--cream)]">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{t("resumes.thumb.new")}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-raised)] p-16 text-center shadow-[var(--sh-1)]">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--surface-sunk)]">
        <Sparkles className="h-6 w-6 text-[var(--on-surface-soft)]" />
      </div>
      <h2 className="font-headline mt-5 text-2xl font-normal">
        {t("resumes.empty.title.part1")}{" "}
        <em className="serif-ital">{t("resumes.empty.title.italic")}</em>.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--on-surface-muted)]">
        {t("resumes.empty.lead")}
      </p>
      <form action={createResume} className="mt-6 inline-block">
        <input type="hidden" name="title" value="My Resume" />
        <Button
          type="submit"
          className="magical-gradient magic-shine h-11 rounded-full px-5"
        >
          <Plus className="me-1.5 h-4 w-4" />
          {t("resumes.empty.cta")}
          <ArrowUpRight className="ms-1 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function idToVariant(id: string): "modern" | "two-col" {
  const sum = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return sum % 2 === 0 ? "modern" : "two-col";
}

function MiniPaper({
  title = "Avery Chen",
  variant = "modern",
}: {
  title?: string;
  variant?: "modern" | "two-col";
}) {
  if (variant === "two-col") {
    return (
      <div className="flex h-full text-[4.5px] leading-[1.4] text-[#0e1220]">
        <div className="w-[36%] bg-[#0e1220] px-2 py-2.5">
          <h5 className="font-headline text-[10px] leading-none text-white">
            {title.split(" ")[0] || "Name"}
          </h5>
          <div className="mt-2.5 text-[6px] font-semibold uppercase tracking-[0.15em] text-white">
            Contact
          </div>
          <Lines colorClass="white" widths={["80%", "60%", "70%"]} />
          <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em] text-white">
            Skills
          </div>
          <Lines colorClass="white" widths={["50%", "70%", "40%", "60%"]} />
        </div>
        <div className="flex-1 px-2 py-2.5">
          <div className="text-[6px] font-semibold uppercase tracking-[0.15em]">
            Experience
          </div>
          <Lines widths={["90%", "60%", "80%", "70%"]} />
          <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em]">
            Education
          </div>
          <Lines widths={["70%", "50%"]} />
        </div>
      </div>
    );
  }
  return (
    <div className="h-full px-4 py-3.5 text-[4.5px] leading-[1.4] text-[#0e1220]">
      <h5 className="font-headline text-[14px] leading-none tracking-[-0.01em]">
        {title}
      </h5>
      <Lines widths={["40%"]} />
      <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em]">
        Experience
      </div>
      <Lines widths={["90%", "80%", "60%"]} />
      <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em]">
        Skills
      </div>
      <Lines widths={["90%", "60%"]} />
      <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em]">
        Education
      </div>
      <Lines widths={["80%"]} />
    </div>
  );
}

function Lines({
  widths,
  colorClass,
}: {
  widths: string[];
  colorClass?: "white";
}) {
  return (
    <div className="mt-0.5 space-y-[3px]">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-[2px] rounded-[1px]"
          style={{
            width: w,
            background: colorClass === "white" ? "rgba(255,255,255,0.5)" : "#e3ddd0",
          }}
        />
      ))}
    </div>
  );
}
