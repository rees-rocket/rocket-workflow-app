import Link from "next/link";
import { AdminPageShell } from "@/components/admin-page-shell";
import { PrintButton } from "@/components/print-button";
import { updatePayBatchStatus } from "@/app/admin/pay/batches/actions";
import { requireProfile } from "@/lib/auth";
import { getPayBatchDetail } from "@/lib/data/pay-batches";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { notFound } from "next/navigation";
import { AppButton } from "@/components/app-button";

type PayPeriodDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string }>;
};

function getSummaryStatus(summary: { total_paid_cents: number; total_unpaid_cents: number }) {
  if (summary.total_paid_cents > 0 && summary.total_unpaid_cents > 0) return "partial" as const;
  if (summary.total_paid_cents > 0) return "paid" as const;
  return "unpaid" as const;
}

function getStatusPillClass(status: "paid" | "unpaid" | "partial") {
  if (status === "paid") return "pill ok";
  if (status === "partial") return "pill danger";
  return "pill warn";
}

function getPeriodPillClass(status: "open" | "ready" | "paid") {
  if (status === "paid") return "pill ok";
  if (status === "ready") return "pill danger";
  return "pill warn";
}

export default async function PayBatchDetailPage({ params, searchParams }: PayPeriodDetailPageProps) {
  await requireProfile("admin");
  const { id } = await params;
  const search = (await searchParams) ?? {};
  const data = await getPayBatchDetail(id);

  if (!data.batch) {
    notFound();
  }

  const totalWages = data.summaries.reduce((sum, summary) => sum + summary.total_wages_cents, 0);
  const totalTips = data.summaries.reduce((sum, summary) => sum + summary.total_tips_cents, 0);
  const totalPaid = data.summaries.reduce((sum, summary) => sum + summary.total_paid_cents, 0);
  const totalUnpaid = data.summaries.reduce((sum, summary) => sum + summary.total_unpaid_cents, 0);

  return (
    <AdminPageShell title="Pay Period Detail" subtitle="A clearer view of what is still owed in this period">
      {search.message ? <div className="pill" style={{ marginBottom: 16 }}>{search.message}</div> : null}

      <section className="card period-summary">
        <div className="summary-row">
          <div>
            <div className="eyebrow">Pay Period</div>
            <h2 style={{ margin: "6px 0 0 0" }}>
              {data.batch.start_date} to {data.batch.end_date}
            </h2>
          </div>
          <div className={getPeriodPillClass(data.batch.status)}>
            {data.batch.status === "paid"
              ? "Paid"
              : data.batch.status === "ready"
                ? "Ready to Pay"
                : "Open"}
          </div>
        </div>

        <div className="summary-kpis">
          <div className="summary-kpi">
            <span className="eyebrow">Total Wages</span>
            <strong>{formatCurrencyFromCents(totalWages)}</strong>
          </div>
          <div className="summary-kpi">
            <span className="eyebrow">Total Tips</span>
            <strong>{formatCurrencyFromCents(totalTips)}</strong>
          </div>
          <div className="summary-kpi">
            <span className="eyebrow">Already Paid</span>
            <strong className="status-paid">{formatCurrencyFromCents(totalPaid)}</strong>
          </div>
          <div className="summary-kpi">
            <span className="eyebrow">Still Unpaid</span>
            <strong className="status-unpaid">{formatCurrencyFromCents(totalUnpaid)}</strong>
          </div>
        </div>

        <div className="summary-row">
          <div className="muted">
            {data.batch.status === "paid"
              ? `Payment date ${data.batch.paid_at?.slice(0, 10) ?? "recorded"}`
              : "This period stays unpaid until you mark the whole period Paid."}
          </div>
          <div className="button-row">
            <Link className="btn secondary" href={`/admin/pay/reports/period/${data.batch.id}`}>
              Open printable report
            </Link>
            <PrintButton label="Print this page" />
            {data.batch.status !== "open" ? (
              <form action={updatePayBatchStatus}>
                <input name="period_id" type="hidden" value={data.batch.id} />
                <input name="status" type="hidden" value="open" />
                <AppButton variant="secondary"  type="submit">
                  Move to Open
                </AppButton>
              </form>
            ) : null}
            {data.batch.status !== "ready" ? (
              <form action={updatePayBatchStatus}>
                <input name="period_id" type="hidden" value={data.batch.id} />
                <input name="status" type="hidden" value="ready" />
                <AppButton variant="secondary"  type="submit">
                  Mark Ready
                </AppButton>
              </form>
            ) : null}
            {data.batch.status !== "paid" ? (
              <form action={updatePayBatchStatus}>
                <input name="period_id" type="hidden" value={data.batch.id} />
                <input name="status" type="hidden" value="paid" />
                <AppButton variant="primary"  type="submit">
                  Mark Period Paid
                </AppButton>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Worker Totals</div>
        <h2>At a glance: who is paid and who is still owed</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Wages</th>
                <th>Tips</th>
                <th>Total</th>
                <th>Already Paid</th>
                <th>Still Unpaid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.map((summary) => {
                const workerStatus = getSummaryStatus(summary);

                return (
                  <tr className={workerStatus === "paid" ? "row-paid" : workerStatus === "partial" ? "row-partial" : "row-unpaid"} key={summary.worker.id}>
                    <td>{summary.worker.full_name}</td>
                    <td>{formatCurrencyFromCents(summary.total_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_tips_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_amount_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_paid_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_unpaid_cents)}</td>
                    <td>
                      <span className={getStatusPillClass(workerStatus)}>
                        {workerStatus === "paid" ? "Paid" : workerStatus === "partial" ? "Partial" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="eyebrow">Included Days</div>
          <h2>Time days in this pay period</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Date</th>
                  <th>Wages</th>
                </tr>
              </thead>
              <tbody>
                {data.timeDays.map((day) => (
                  <tr key={day.id}>
                    <td>{day.profile?.full_name ?? day.worker_id}</td>
                    <td>{day.work_date}</td>
                    <td>{formatCurrencyFromCents(day.total_labor_cost_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="eyebrow">Included Tips</div>
          <h2>Tip records in this pay period</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Cash</th>
                  <th>Online</th>
                </tr>
              </thead>
              <tbody>
                {data.tipRecords.map((tip) => (
                  <tr key={tip.id}>
                    <td>{tip.profile?.full_name ?? tip.worker_id}</td>
                    <td>{tip.tip_date}</td>
                    <td>
                      {tip.event_name ??
                        (Array.isArray(tip.shifts)
                          ? tip.shifts?.[0]?.location_name
                          : tip.shifts?.location_name) ??
                        "Tip record"}
                    </td>
                    <td>{formatCurrencyFromCents(tip.cash_tip_cents)}</td>
                    <td>{formatCurrencyFromCents(tip.online_tip_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
