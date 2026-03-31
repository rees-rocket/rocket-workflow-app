import { WorkerTopNav } from "@/components/worker-top-nav";
import { requireProfile } from "@/lib/auth";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  await requireProfile("worker");

  return (
    <main className="shell">
      <WorkerTopNav />
      {children}
    </main>
  );
}
