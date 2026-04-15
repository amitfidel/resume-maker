import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq } from "drizzle-orm";
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
import { Plus, FileText } from "lucide-react";
import { createResume } from "./actions";

export default async function ResumesPage() {
  const user = await requireUser();

  const userResumes = await db.query.resumes.findMany({
    where: eq(resumes.userId, user.id),
    orderBy: (r, { desc }) => [desc(r.updatedAt)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your resume versions.
          </p>
        </div>
        <form action={createResume}>
          <input type="hidden" name="title" value="Untitled Resume" />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" />
            New Resume
          </Button>
        </form>
      </div>

      {userResumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">No resumes yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first resume from your career profile. You can tailor
              it for different jobs later.
            </p>
            <form action={createResume}>
              <input type="hidden" name="title" value="My Resume" />
              <Button type="submit" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Resume
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userResumes.map((resume) => (
            <Link key={resume.id} href={`/resumes/${resume.id}/edit`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{resume.title}</CardTitle>
                    <Badge
                      variant={
                        resume.status === "active" ? "default" : "secondary"
                      }
                    >
                      {resume.status}
                    </Badge>
                  </div>
                  {resume.targetCompany && (
                    <CardDescription>
                      {resume.targetJobTitle} at {resume.targetCompany}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
