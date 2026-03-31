import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin-page-shell";
import { PrintButton } from "@/components/print-button";
import { requireProfile } from "@/lib/auth";
import { getPayrollPeriodReport } from "@/lib/data/pay-reports";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";

type PayrollPeriodReportPageProps = {
  params: Promise<{ id: string }>;
};

function getStatusClass(status: "paid" | "partial" | "unpaid") {
  if (status === "paid") return "pill ok";
  if (status === "partial") return "pill danger";
  return "pill warn";
}

export default async function PayrollPeriodReportPage({ params }: PayrollPeriodReportPageProps) {
  await requireProfile("admin");
  const { id } = await params;
  const report = await getPayrollPeriodReport(id);

  if (!report) {
    notFound();
  }

  return (
    <AdminPageShell title="Payroll Period Report" subtitle="Printable payroll report for one pay period">
      <section className="card report-shell">
        <div className="print-toolbar">
          <Link className="btn secondary" href="/admin/pay/reports">
            Back to reports
          </Link>
          <PrintButton />
        </div>

        <div className="report-header">
          <div>
            <div className="eyebrow">Payroll Report</div>
            <h1 style={{ margin: "6px 0 0 0" }}>
              Pay period {report.period.start_date} to {report.period.end_date}
            </h1>
          </div>
          <div className={report.period.status === "paid" ? "pill ok" : report.period.status === "ready" ? "pill danger" : "pill warn"}>
            {report.period.status === "paid" ? "Paid" : report.period.status === "ready" ? "Ready" : "Open"}
          </div>
        </div>

        <div className="report-meta">
          <span>Generated {report.generatedAt.slice(0, 10)}</span>
          <span>
            {report.period.paid_at ? `Paid on ${report.period.paid_at.slice(0, 10)}` : "Payment date not recorded yet"}
          </span>
        </div>

        <div className="report-grid">
          <div className="report-total-card">
            <span className="eyebrow">Total Wages</span>
            <strong>{formatCurrencyFromCents(report.totals.total_wages_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Total Tips</span>
            <strong>{formatCurrencyFromCents(report.totals.total_tips_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Paid</span>
            <strong>{formatCurrencyFromCents(report.totals.total_paid_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Unpaid</span>
            <strong>{formatCurrencyFromCents(report.totals.total_unpaid_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Total Payroll</span>
            <strong>{formatCurrencyFromCents(report.totals.total_amount_cents)}</strong>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Travel Wages</th>
                <th>Prep Wages</th>
                <th>Service Wages</th>
                <th>Total Wages</th>
                <th>Total Tips</th>
                <th>Total Pay</th>
                <th>Paid</th>
                <th>Unpaid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.summaries.map((summary) => {
                const status =
                  summary.total_paid_cents > 0 && summary.total_unpaid_cents > 0
                    ? "partial"
                    : summary.total_paid_cents > 0
                      ? "paid"
                      : "unpaid";

                return (
                  <tr key={summary.worker.id}>
                    <td>{summary.worker.full_name}</td>
                    <td>{formatCurrencyFromCents(summary.total_travel_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_prep_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_service_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_tips_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_amount_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_paid_cents)}</td>
                    <td>{formatCurrencyFromCents(summary.total_unpaid_cents)}</td>
                    <td>
                      <span className={getStatusClass(status)}>
                        {status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}
