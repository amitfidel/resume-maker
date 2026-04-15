import { requireUser } from "@/lib/auth";
import { getApplications } from "./actions";
import { ApplicationBoard } from "./application-board";

export default async function ApplicationsPage() {
  await requireUser();
  const applications = await getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="mt-1 text-muted-foreground">
          Track your job applications and outcomes.
        </p>
      </div>

      <ApplicationBoard applications={applications} />
    </div>
  );
}
