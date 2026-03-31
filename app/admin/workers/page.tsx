import { AdminPageShell } from "@/components/admin-page-shell";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getWorkerManagementList } from "@/lib/data/workers";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { AppButton } from "@/components/app-button";
import { MagicLinkHelp } from "@/components/magic-link-help";

type AdminWorkersPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function AdminWorkersPage({ searchParams }: AdminWorkersPageProps) {
  await requireProfile("admin");
  const workers = await getWorkerManagementList();
  const params = (await searchParams) ?? {};

  return (
    <AdminPageShell
      actions={
        <div className="button-row">
          <Link className="btn primary" href="/admin/workers/new">
            Add Worker
          </Link>
        </div>
      }
      subtitle="Live worker list for practical worker management"
      title="Workers"
    >
      <section className="card">
        <div className="eyebrow">Worker Directory</div>
        <h2>Workers and contractors</h2>
        {params.message ? <div className="pill" style={{ marginBottom: 12 }}>{params.message}</div> : null}
        <div style={{ marginBottom: 16 }}>
          <MagicLinkHelp title="Invite delivery tips" />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Type</th>
                <th>Status</th>
                <th>Wage</th>
                <th>Tip Eligible</th>
                <th>Training</th>
                <th>Invite</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.full_name}</td>
                  <td>{worker.email}</td>
                  <td>{worker.role}</td>
                  <td>{worker.employee_type}</td>
                  <td>{worker.status}</td>
                  <td>
                    <div>{formatCurrencyFromCents(worker.wage_rate_cents)}</div>
                    <div className="muted">
                      Travel {formatCurrencyFromCents(worker.travel_wage_rate_cents)} · Prep{" "}
                      {formatCurrencyFromCents(worker.prep_wage_rate_cents)} · Service{" "}
                      {formatCurrencyFromCents(worker.service_wage_rate_cents)}
                    </div>
                  </td>
                  <td>{worker.tip_eligible ? "Yes" : "No"}</td>
                  <td>
                    {worker.trainingSummary.assigned > 0
                      ? `${worker.trainingSummary.assigned} assigned, ${worker.trainingSummary.overdue} overdue`
                      : "No training assigned"}
                  </td>
                  <td>
                    <form action="/admin/workers/invite" method="post">
                      <input name="email" type="hidden" value={worker.email} />
                      <input name="return_to" type="hidden" value="/admin/workers" />
                      <AppButton type="submit" variant="secondary">
                        {worker.source === "pending" ? "Send invite" : "Re-send invite"}
                      </AppButton>
                    </form>
                  </td>
                  <td>
                    <Link href={`/admin/workers/${worker.source === "pending" ? `pending-${worker.id}` : worker.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}
