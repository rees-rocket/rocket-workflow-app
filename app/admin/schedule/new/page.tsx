import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { createShift } from "@/app/admin/schedule/actions";
import { getWorkerList } from "@/lib/data/time";
import { createClient } from "@/lib/supabase/server";
import { AdminShiftForm } from "@/components/admin-shift-form";

type Props = {
  searchParams?: Promise<{ message?: string; date?: string }>;
};

export default async function NewShiftPage({ searchParams }: Props) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const [workers, pendingWorkers] = await Promise.all([
    getWorkerList(),
    supabase
      .from("pending_worker_profiles")
      .select("id, full_name, email")
      .order("full_name")
  ]);

  return (
    <AdminPageShell title="New Shift" subtitle="Create the shift first, then add workers">
      {params.message ? <div className="pill" style={{ marginBottom: 16 }}>{params.message}</div> : null}
      {(pendingWorkers.data?.length ?? 0) > 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Pending Workers</div>
          <h2>Not ready for shift assignment yet</h2>
          <p className="muted">
            These workers were added in admin, but they will not appear in the assignment dropdown
            until they sign in once and activate their account.
          </p>
          <div className="muted">
            {pendingWorkers.data?.map((worker) => `${worker.full_name} (${worker.email})`).join(", ")}
          </div>
        </div>
      ) : null}
      <AdminShiftForm
        action={createShift}
        initialDate={params.date}
        submitLabel="Create shift"
        workers={workers}
      />
    </AdminPageShell>
  );
}
