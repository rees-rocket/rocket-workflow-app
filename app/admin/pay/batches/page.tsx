import Link from "next/link";
import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { getPayBatchSummary } from "@/lib/data/pay-batches";

type AdminPayPeriodsPageProps = {
  searchParams?: Promise<{
    period?: string;
    message?: string;
  }>;
};

export default async function AdminPayBatchesPage({ searchParams }: AdminPayPeriodsPageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const data = await getPayBatchSummary({ payPeriodId: params.period });

  return (
    <AdminPageShell title="Pay Periods" subtitle="Two-week payroll periods replace manual pay batches">
      {params.message ? <div className="pill" style={{ marginBottom: 16 }}>{params.message}</div> : null}

      <div className="grid two">
        <section className="card stack">
          <div className="eyebrow">Current View</div>
          <h2>Selected pay period</h2>
          {data.selectedPeriod ? (
            <div className="screen-frame">
              <strong>
                {data.selectedPeriod.start_date} to {data.selectedPeriod.end_date}
              </strong>
              <p className="muted">
                Status{" "}
                {data.selectedPeriod.status === "paid"
                  ? "Paid"
                  : data.selectedPeriod.status === "ready"
                    ? "Ready to Pay"
                    : "Open"}
              </p>
              <p className="muted">
                {data.selectedPeriod.paid_at
                  ? `Payment date ${data.selectedPeriod.paid_at.slice(0, 10)}`
                  : "No payment date recorded yet"}
              </p>
              <div className="button-row">
                <Link className="btn secondary" href={`/admin/pay/batches/${data.selectedPeriod.id}`}>
                  Open this pay period
                </Link>
                <Link className="btn secondary" href={`/admin/pay/reports/period/${data.selectedPeriod.id}`}>
                  Print period report
                </Link>
              </div>
            </div>
          ) : (
            <p className="muted">No pay periods found yet.</p>
          )}
        </section>

        <section className="card stack">
          <div className="eyebrow">How It Works</div>
          <h2>Automatic two-week grouping</h2>
          <div className="screen-frame">
            <p className="muted">
              Time days and tip records are automatically linked to a two-week pay period based on
              their date. You no longer need to build manual pay batches.
            </p>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Recent Pay Periods</div>
        <h2>Open, ready, and paid periods</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Range</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {data.batches.map((period) => (
                <tr
                  className={period.status === "paid" ? "row-paid" : period.status === "ready" ? "row-partial" : "row-unpaid"}
                  key={period.id}
                >
                  <td>
                    {period.start_date} to {period.end_date}
                  </td>
                  <td>{period.status === "paid" ? "Paid" : period.status === "ready" ? "Ready to Pay" : "Open"}</td>
                  <td>{period.paid_at ? period.paid_at.slice(0, 10) : "Not paid"}</td>
                  <td>
                    <Link href={`/admin/pay/batches/${period.id}`}>Open</Link>
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
