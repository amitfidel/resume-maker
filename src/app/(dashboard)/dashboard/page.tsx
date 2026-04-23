import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, jobApplications, careerProfiles } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowRight,
  Upload,
  User,
  Briefcase,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  const [resumeCount] = await db
    .select({ count: count() })
    .from(resumes)
    .where(eq(resumes.userId, user.id));

  const [applicationCount] = await db
    .select({ count: count() })
    .from(jobApplications)
    .where(eq(jobApplications.userId, user.id));

  const profile = await db.query.careerProfiles.findFirst({
    where: eq(careerProfiles.userId, user.id),
  });

  const recentResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, user.id),
    orderBy: [desc(resumes.updatedAt)],
    limit: 4,
  });

  const hasProfile = !!(profile?.headline || profile?.summary);
  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
            Overview
          </p>
          <h1 className="font-headline mt-1.5 text-[clamp(32px,4vw,44px)] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--on-surface)]">
            Welcome back
            {firstName ? (
              <>
                , <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">{firstName}</em>
              </>
            ) : null}
            .
          </h1>
          <p className="mt-2 text-[var(--on-surface-muted)]">
            Your professional footprint, at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-full border-0 bg-[var(--surface-raised)] text-[13px] text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink)]"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Total resumes"
          value={resumeCount.count}
          hint="in your library"
        />
        <StatCard
          icon={Briefcase}
          label="Active applications"
          value={applicationCount.count}
          hint={
            applicationCount.count > 0
              ? `${applicationCount.count} being tracked`
              : "No applications yet"
          }
        />
        <MagicStatCard
          label="Interviewing"
          value={0}
          hint="No upcoming interviews"
        />
      </div>

      {/* Recent resumes */}
      <div>
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
              Library
            </p>
            <h2 className="font-headline mt-1 text-[28px] font-normal tracking-[-0.015em]">
              Recent <em className="serif-ital">resumes</em>
            </h2>
          </div>
          <Link href="/resumes">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-full text-[13px] text-[var(--on-surface-soft)] hover:text-[var(--on-surface)]"
            >
              View library <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {recentResumes.length === 0 && !hasProfile ? (
          <div className="grid gap-4 md:grid-cols-2">
            <QuickStart
              href="/import"
              icon={Upload}
              title="Import from PDF"
              sub="Upload your existing resume"
            />
            <QuickStart
              href="/profile"
              icon={User}
              title="Build your profile"
              sub="Start from scratch — AI-guided"
              magical
            />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recentResumes.map((r) => (
              <Link
                key={r.id}
                href={`/resumes/${r.id}/edit`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-[var(--surface-raised)] shadow-[var(--sh-1)] transition-all duration-[var(--t-mid)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--sh-3)]"
              >
                <div className="mx-3.5 mt-3.5 aspect-[8.5/11] overflow-hidden rounded bg-white shadow-[inset_0_0_0_1px_var(--border-ghost),0_4px_16px_-6px_rgba(14,18,32,0.1)]">
                  <div className="h-full px-4 py-3.5 text-[4.5px] leading-[1.4] text-[#0e1220]">
                    <h5 className="font-headline text-[14px] leading-none tracking-[-0.01em]">
                      {r.title}
                    </h5>
                    <div className="mt-1.5 h-[2px] w-[40%] rounded-[1px] bg-[#e3ddd0]" />
                    <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em]">
                      Experience
                    </div>
                    <div className="mt-1 space-y-[3px]">
                      <div className="h-[2px] w-[90%] rounded-[1px] bg-[#e3ddd0]" />
                      <div className="h-[2px] w-[80%] rounded-[1px] bg-[#e3ddd0]" />
                      <div className="h-[2px] w-[60%] rounded-[1px] bg-[#e3ddd0]" />
                    </div>
                    <div className="mt-2 text-[6px] font-semibold uppercase tracking-[0.15em]">
                      Skills
                    </div>
                    <div className="mt-1 space-y-[3px]">
                      <div className="h-[2px] w-[90%] rounded-[1px] bg-[#e3ddd0]" />
                      <div className="h-[2px] w-[60%] rounded-[1px] bg-[#e3ddd0]" />
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-3.5">
                  <p className="truncate text-[14px] font-medium text-[var(--on-surface)]">
                    {r.title}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--on-surface-muted)]">
                    Updated {new Date(r.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Setup progress (for new users) */}
      {!hasProfile && (
        <div className="rounded-2xl bg-[var(--surface-raised)] p-7 shadow-[var(--sh-1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-headline text-[22px] font-normal tracking-[-0.015em]">
                Setup <em className="serif-ital">progress</em>
              </h3>
              <p className="mt-1 text-sm text-[var(--on-surface-muted)]">
                Complete your profile to unlock tailored resumes.
              </p>
            </div>
            <div className="text-right">
              <p className="font-headline text-[40px] leading-none text-[var(--magic-1)] dark:text-[var(--magic-2)]">
                25<span className="text-[20px]">%</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                Complete
              </p>
            </div>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--surface-sunk)]">
            <div
              className="h-full rounded-full"
              style={{
                width: "25%",
                background: "linear-gradient(90deg, var(--magic-1), var(--magic-2))",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface-raised)] p-6 shadow-[var(--sh-1)] transition-all duration-[var(--t-mid)] hover:-translate-y-0.5 hover:shadow-[var(--sh-3)]">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--surface-sunk)]">
        <Icon className="h-4 w-4 text-[var(--on-surface)]" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
        {label}
      </p>
      <p className="font-headline mt-1.5 text-[44px] font-normal leading-none tracking-[-0.02em]">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-[var(--on-surface-muted)]">{hint}</p>
    </div>
  );
}

function MagicStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white transition-all duration-[var(--t-mid)] hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(135deg, var(--magic-1), var(--magic-2))",
        boxShadow: "var(--sh-magic)",
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-[10px] bg-white/15">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.1em] text-white/70">{label}</p>
      <p className="font-headline mt-1.5 text-[44px] font-normal leading-none tracking-[-0.02em]">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-white/75">{hint}</p>
    </div>
  );
}

function QuickStart({
  href,
  icon: Icon,
  title,
  sub,
  magical,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  magical?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl p-7 transition-all duration-[var(--t-mid)] hover:-translate-y-1 hover:shadow-[var(--sh-3)] ${
        magical
          ? "text-white"
          : "bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-[var(--sh-1)]"
      }`}
      style={
        magical
          ? {
              background: "linear-gradient(135deg, var(--magic-1), var(--magic-2))",
              boxShadow: "var(--sh-magic)",
            }
          : undefined
      }
    >
      <div
        className={`mb-4 grid h-11 w-11 place-items-center rounded-[12px] transition-transform group-hover:-rotate-[4deg] ${
          magical ? "bg-white/15" : "bg-[var(--surface-sunk)]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-headline text-[22px] font-normal tracking-[-0.015em]">
        {title}
      </h3>
      <p
        className={`mt-1 text-[13px] ${
          magical ? "text-white/75" : "text-[var(--on-surface-muted)]"
        }`}
      >
        {sub}
      </p>
    </Link>
  );
}
