import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, jobApplications, careerProfiles } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Briefcase,
  Plus,
  Upload,
  User,
  ArrowRight,
} from "lucide-react";
import { createResume } from "../resumes/actions";

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
    limit: 5,
  });

  const recentApps = await db.query.jobApplications.findMany({
    where: eq(jobApplications.userId, user.id),
    orderBy: [desc(jobApplications.updatedAt)],
    limit: 5,
  });

  const hasProfile = !!(profile?.headline || profile?.summary);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s your resume workspace.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumeCount.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationCount.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasProfile ? "Complete" : "Incomplete"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting started (show if new user) */}
      {!hasProfile && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <h2 className="text-lg font-semibold">Get started</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your career profile first, then create resumes from it.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/import">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Existing Resume
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Build Profile Manually
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <form action={createResume}>
          <input type="hidden" name="title" value="Untitled Resume" />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Resume
          </Button>
        </form>
        <Link href="/applications">
          <Button variant="outline">
            <Briefcase className="mr-2 h-4 w-4" />
            Track Application
          </Button>
        </Link>
      </div>

      {/* Recent resumes */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Resumes</h2>
            <Link href="/resumes">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          {recentResumes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resumes yet.</p>
          ) : (
            <div className="space-y-2">
              {recentResumes.map((r) => (
                <Link key={r.id} href={`/resumes/${r.id}/edit`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {r.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Applications</h2>
            <Link href="/applications">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No applications tracked yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentApps.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{a.position}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.company}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
