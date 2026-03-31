import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin-page-shell";
import { PrintButton } from "@/components/print-button";
import { requireProfile } from "@/lib/auth";
import { getPayrollAnnualWorkerReport } from "@/lib/data/pay-reports";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";

type AnnualPayrollReportPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ year?: string }>;
};

function getStatusClass(status: "paid" | "partial" | "unpaid") {
  if (status === "paid") return "pill ok";
  if (status === "partial") return "pill danger";
  return "pill warn";
}

export default async function AnnualPayrollReportPage({ params, searchParams }: AnnualPayrollReportPageProps) {
  await requireProfile("admin");
  const { id } = await params;
  const search = (await searchParams) ?? {};
  const year = Number(search.year ?? new Date().getFullYear());
  const report = await getPayrollAnnualWorkerReport(id, year);

  if (!report) {
    notFound();
  }

  return (
    <AdminPageShell title="Annual Payroll Report" subtitle="Printable annual payroll report for one worker">
      <section className="card report-shell">
        <div className="print-toolbar">
          <Link className="btn secondary" href="/admin/pay/reports">
            Back to reports
          </Link>
          <PrintButton />
        </div>

        <div className="report-header">
          <div>
            <div className="eyebrow">Annual Payroll Report</div>
            <h1 style={{ margin: "6px 0 0 0" }}>
              {report.worker.full_name} · {report.year}
            </h1>
          </div>
        </div>

        <div className="report-meta">
          <span>{report.worker.email}</span>
          <span>Generated {report.generatedAt.slice(0, 10)}</span>
        </div>

        <div className="report-grid">
          <div className="report-total-card">
            <span className="eyebrow">Total Wages</span>
            <strong>{formatCurrencyFromCents(report.totals.total_wages_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Cash Tips</span>
            <strong>{formatCurrencyFromCents(report.totals.total_cash_tips_cents)}</strong>
          </div>
          <div className="report-total-card">
            <span className="eyebrow">Online Tips</span>
            <strong>{formatCurrencyFromCents(report.totals.total_online_tips_cents)}</strong>
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
            <span className="eyebrow">Annual Total</span>
            <strong>{formatCurrencyFromCents(report.totals.total_amount_cents)}</strong>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 20 }}>
          <table>
            <thead>
              <tr>
                <th>Pay Period</th>
                <th>Wages</th>
                <th>Tips</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Unpaid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.periods.length === 0 ? (
                <tr>
                  <td colSpan={7}>No wages or tips were recorded for this worker in {report.year}.</td>
                </tr>
              ) : (
                report.periods.map((period) => (
                  <tr key={`${period.label}-${period.total_amount_cents}`}>
                    <td>{period.label}</td>
                    <td>{formatCurrencyFromCents(period.total_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(period.total_tips_cents)}</td>
                    <td>{formatCurrencyFromCents(period.total_amount_cents)}</td>
                    <td>{formatCurrencyFromCents(period.total_paid_cents)}</td>
                    <td>{formatCurrencyFromCents(period.total_unpaid_cents)}</td>
                    <td>
                      <span className={getStatusClass(period.status)}>
                        {period.status === "paid" ? "Paid" : period.status === "partial" ? "Partial" : "Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}
