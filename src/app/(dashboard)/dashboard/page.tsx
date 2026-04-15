import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, jobApplications, careerProfiles } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Briefcase,
  Sparkles,
  ArrowRight,
  Upload,
  User,
  Play,
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
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-[var(--on-surface)]">
            Overview
          </h1>
          <p className="mt-1 text-[var(--on-surface-variant)]">
            Welcome back{firstName ? `, ${firstName}` : ""}. Your professional footprint is growing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <User className="h-3.5 w-3.5" />
              Share Profile
            </Button>
          </Link>
          <Button size="sm" className="magical-surface text-white gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Magic AI
          </Button>
        </div>
      </div>

      {/* Stat cards - tonal layering, no borders */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-lg bg-[var(--surface-container-lowest)] p-6 shadow-ambient">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-container)]">
            <FileText className="h-5 w-5 text-[var(--on-surface)]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
            Total Resumes
          </p>
          <p className="font-headline mt-1 text-3xl font-bold text-[var(--on-surface)]">
            {resumeCount.count}
          </p>
        </div>

        <div className="rounded-lg bg-[var(--surface-container-lowest)] p-6 shadow-ambient">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[var(--tertiary-fixed)]">
            <Play className="h-5 w-5 text-[var(--tertiary)]" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
            Active Apps
          </p>
          <p className="font-headline mt-1 text-3xl font-bold text-[var(--on-surface)]">
            {applicationCount.count}
          </p>
          <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
            {applicationCount.count > 0
              ? `${applicationCount.count} pending response`
              : "No applications yet"}
          </p>
        </div>

        <div className="rounded-lg bg-[var(--tertiary-container)] p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-tertiary-container)]">
            Interviewing
          </p>
          <p className="font-headline mt-2 text-3xl font-bold text-white">
            0
          </p>
          <p className="mt-1 text-xs text-[var(--on-tertiary-container)]">
            No upcoming interviews
          </p>
        </div>
      </div>

      {/* Recent resumes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-[var(--on-surface)]">
            Recent Resumes
          </h2>
          <Link href="/resumes">
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-[var(--on-surface-variant)]">
              View Library <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {recentResumes.length === 0 && !hasProfile ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/import" className="block">
              <div className="rounded-lg bg-[var(--surface-container-lowest)] p-6 shadow-ambient transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer text-center">
                <Upload className="mx-auto mb-3 h-8 w-8 text-[var(--on-surface-variant)]" />
                <p className="font-medium text-sm text-[var(--on-surface)]">Import Resume</p>
                <p className="text-xs text-[var(--on-surface-variant)] mt-1">Upload PDF or paste text</p>
              </div>
            </Link>
            <Link href="/profile" className="block">
              <div className="rounded-lg bg-[var(--surface-container-lowest)] p-6 shadow-ambient transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer text-center">
                <User className="mx-auto mb-3 h-8 w-8 text-[var(--on-surface-variant)]" />
                <p className="font-medium text-sm text-[var(--on-surface)]">Build Profile</p>
                <p className="text-xs text-[var(--on-surface-variant)] mt-1">Start from scratch</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {recentResumes.map((r) => (
              <Link key={r.id} href={`/resumes/${r.id}/edit`}>
                <div className="group rounded-lg bg-[var(--surface-container-lowest)] shadow-ambient transition-all hover:translate-y-[-2px] hover:shadow-md overflow-hidden cursor-pointer">
                  <div className="h-40 bg-[var(--primary)] flex items-center justify-center">
                    <FileText className="h-10 w-10 text-[var(--primary-foreground)] opacity-30" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-[var(--on-surface)] truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                      Last edited {new Date(r.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Setup progress (for new users) */}
      {!hasProfile && (
        <div className="rounded-lg bg-[var(--surface-container-lowest)] p-6 shadow-ambient">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline font-bold text-[var(--on-surface)]">
                Setup Progress
              </h3>
              <p className="text-sm text-[var(--on-surface-variant)] mt-1">
                Complete your profile to get started
              </p>
            </div>
            <div className="text-right">
              <p className="font-headline text-3xl font-bold text-[var(--tertiary)]">
                25%
              </p>
              <p className="text-xs text-[var(--on-surface-variant)]">Complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
