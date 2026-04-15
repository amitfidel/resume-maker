import { requireUser } from "@/lib/auth";
import { getApplications } from "./actions";
import { ApplicationBoard } from "./application-board";

export default async function ApplicationsPage() {
  await requireUser();
  const applications = await getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold text-[var(--on-surface)]">
          Applications Tracker
        </h1>
        <p className="mt-1 text-[var(--on-surface-variant)]">
          Manage your professional journey with editorial precision.
        </p>
      </div>

      <ApplicationBoard applications={applications} />
    </div>
  );
}
