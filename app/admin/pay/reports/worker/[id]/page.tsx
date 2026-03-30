import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getDefaultPayRange } from "@/lib/data/pay";
import { getPayrollPeriodWorkerReport } from "@/lib/data/pay-reports";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";

type WorkerPayrollReportPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ period?: string }>;
};

export default async function WorkerPayrollReportPage({ params, searchParams }: WorkerPayrollReportPageProps) {
  await requireProfile("admin");
  const { id } = await params;
  const search = (await searchParams) ?? {};
  const defaults = await getDefaultPayRange();
  const periodId = search.period ?? defaults.payPeriodId ?? undefined;

  if (!periodId) {
    notFound();
  }

  const report = await getPayrollPeriodWorkerReport(id, periodId);

  if (!report) {
    notFound();
  }

  return (
    <AppShell
      title="Worker Payroll Report"
      subtitle="Printable pay-period report for one worker"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/pay", label: "Pay" },
        { href: "/admin/pay/reports", label: "Reports" }
      ]}
      actions={
        <form action={signOut}>
          <button className="btn secondary" type="submit">
            Sign out
          </button>
        </form>
      }
    >
      <section className="card report-shell">
        <div className="print-toolbar">
          <Link className="btn secondary" href="/admin/pay/reports">
            Back to reports
          </Link>
          <PrintButton />
        </div>

        <div className="report-header">
          <div>
            <div className="eyebrow">Worker Payroll Report</div>
            <h1 style={{ margin: "6px 0 0 0" }}>{report.worker.full_name}</h1>
            <div className="muted">
              {report.period.start_date} to {report.period.end_date}
            </div>
          </div>
          <div className={report.summary.status === "paid" ? "pill ok" : report.summary.status === "partial" ? "pill danger" : "pill warn"}>
            {report.summary.status === "paid" ? "Paid" : report.summary.status === "partial" ? "Partial" : "Unpaid"}
          </div>
        </div>

        <div className="report-meta">
          <span>{report.worker.email}</span>
          <span>
            {report.period.paid_at ? `Paid on ${report.period.paid_at.slice(0, 10)}` : "Not paid yet"}
          </span>
        </div>

        <div className="report-grid">
          <div className="report-total-card">
            <span className="eyebrow">Travel Wages</span>
            <strong>{formatCurrencyFromCents(report.summary.total_travel_wages_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Prep Wages</span>
            <strong>{formatCurrencyFromCents(report.summary.total_prep_wages_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Service Wages</span>
            <strong>{formatCurrencyFromCents(report.summary.total_service_wages_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Total Wages</span>
            <strong>{formatCurrencyFromCents(report.summary.total_wages_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Total Tips</span>
            <strong>{formatCurrencyFromCents(report.summary.total_tips_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Total Pay</span>
            <strong>{formatCurrencyFromCents(report.summary.total_amount_cents)}</strong>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 20 }}>
          <section className="card">
            <div className="eyebrow">Wage Breakdown</div>
            <h2>Wages and payment status</h2>
            <div className="report-breakdown">
              <div><span>Travel wages</span><strong>{formatCurrencyFromCents(report.summary.total_travel_wages_cents)}</strong></div>
              <div><span>Prep wages</span><strong>{formatCurrencyFromCents(report.summary.total_prep_wages_cents)}</strong></div>
              <div><span>Service wages</span><strong>{formatCurrencyFromCents(report.summary.total_service_wages_cents)}</strong></div>
              <div><span>Total wages</span><strong>{formatCurrencyFromCents(report.summary.total_wages_cents)}</strong></div>
              <div><span>Already paid</span><strong>{formatCurrencyFromCents(report.summary.total_paid_cents)}</strong></div>
              <div><span>Still unpaid</span><strong>{formatCurrencyFromCents(report.summary.total_unpaid_cents)}</strong></div>
            </div>
          </section>

          <section className="card">
            <div className="eyebrow">Tip Breakdown</div>
            <h2>Cash and online tips</h2>
            <div className="report-breakdown">
              <div><span>Cash tips</span><strong>{formatCurrencyFromCents(report.summary.total_cash_tips_cents)}</strong></div>
              <div><span>Online tips</span><strong>{formatCurrencyFromCents(report.summary.total_online_tips_cents)}</strong></div>
              <div><span>Total tips</span><strong>{formatCurrencyFromCents(report.summary.total_tips_cents)}</strong></div>
              <div><span>Total pay</span><strong>{formatCurrencyFromCents(report.summary.total_amount_cents)}</strong></div>
            </div>
          </section>
        </div>

        <div className="grid two" style={{ marginTop: 20 }}>
          <section className="card">
            <div className="eyebrow">Included Work Days</div>
            <h2>Labor days in this pay period</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Travel</th>
                    <th>Prep</th>
                    <th>Service</th>
                    <th>Total Wages</th>
                  </tr>
                </thead>
                <tbody>
                  {report.timeDays.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No work days recorded in this pay period.</td>
                    </tr>
                  ) : (
                    report.timeDays.map((day) => (
                      <tr key={day.id}>
                        <td>{day.work_date}</td>
                        <td>{formatCurrencyFromCents(day.travel_labor_cost_cents)}</td>
                        <td>{formatCurrencyFromCents(day.prep_labor_cost_cents)}</td>
                        <td>{formatCurrencyFromCents(day.service_labor_cost_cents)}</td>
                        <td>{formatCurrencyFromCents(day.total_labor_cost_cents)}</td>
                      </tr>
                    ))
                  )}
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
                    <th>Date</th>
                    <th>Event</th>
                    <th>Cash</th>
                    <th>Online</th>
                  </tr>
                </thead>
                <tbody>
                  {report.tipRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No tip records in this pay period.</td>
                    </tr>
                  ) : (
                    report.tipRecords.map((tip) => (
                      <tr key={tip.id}>
                        <td>{tip.tip_date}</td>
                        <td>{tip.event_name ?? "Tip record"}</td>
                        <td>{formatCurrencyFromCents(tip.cash_tip_cents)}</td>
                        <td>{formatCurrencyFromCents(tip.online_tip_cents)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
