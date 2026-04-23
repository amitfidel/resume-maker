import { Sidebar } from "@/components/layout/sidebar";
import { ViewTransition } from "@/components/layout/view-transition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <ViewTransition>
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </ViewTransition>
      </main>
    </div>
  );
}
