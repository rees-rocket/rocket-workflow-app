import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getPayrollAnnualWorkerReport } from "@/lib/data/pay-reports";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { AppButton } from "@/components/app-button";

type WorkerAnnualPayPrintPageProps = {
  searchParams?: Promise<{ year?: string }>;
};

function getStatusClass(status: "paid" | "partial" | "unpaid") {
  if (status === "paid") return "pill ok";
  if (status === "partial") return "pill danger";
  return "pill warn";
}

export default async function WorkerAnnualPayPrintPage({ searchParams }: WorkerAnnualPayPrintPageProps) {
  const { profile } = await requireProfile("worker");
  const params = (await searchParams) ?? {};
  const year = Number(params.year ?? new Date().getFullYear());
  const report = await getPayrollAnnualWorkerReport(profile.id, year);

  if (!report) {
    return null;
  }

  return (
    <AppShell
      title="Annual Pay Report"
      subtitle="Printable annual pay summary"
      nav={[
        { href: "/worker", label: "Dashboard" },
        { href: "/worker/pay", label: "Pay" },
        { href: "/worker/time", label: "Time" },
        { href: "/worker/schedule", label: "Schedule" }
      ]}
      actions={
        <form action={signOut}>
          <AppButton variant="secondary"  type="submit">
            Sign out
          </AppButton>
        </form>
      }
    >
      <section className="card report-shell">
        <div className="print-toolbar">
          <Link className="btn secondary" href="/worker/pay">
            Back to pay
          </Link>
          <PrintButton />
        </div>

        <div className="report-header">
          <div>
            <div className="eyebrow">My Annual Pay Report</div>
            <h1 style={{ margin: "6px 0 0 0" }}>
              {profile.full_name} · {report.year}
            </h1>
          </div>
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.periods.length === 0 ? (
                <tr>
                  <td colSpan={5}>No pay recorded for {report.year} yet.</td>
                </tr>
              ) : (
                report.periods.map((period) => (
                  <tr key={`${period.label}-${period.total_amount_cents}`}>
                    <td>{period.label}</td>
                    <td>{formatCurrencyFromCents(period.total_wages_cents)}</td>
                    <td>{formatCurrencyFromCents(period.total_tips_cents)}</td>
                    <td>{formatCurrencyFromCents(period.total_amount_cents)}</td>
                    <td>
                      <span className={getStatusClass(period.status)}>
                        {period.status === "paid" ? "Paid" : period.status === "partial" ? "Partial" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
