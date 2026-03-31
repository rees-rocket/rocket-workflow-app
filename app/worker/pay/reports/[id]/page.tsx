import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getPayrollPeriodWorkerReport } from "@/lib/data/pay-reports";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { AppButton } from "@/components/app-button";

type WorkerPayPeriodPrintPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkerPayPeriodPrintPage({ params }: WorkerPayPeriodPrintPageProps) {
  const { profile } = await requireProfile("worker");
  const { id } = await params;
  const report = await getPayrollPeriodWorkerReport(profile.id, id);

  if (!report) {
    notFound();
  }

  return (
    <AppShell
      title="Pay Period Report"
      subtitle="Printable copy of your pay period"
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
          <Link className="btn secondary" href={`/worker/pay?period=${report.period.id}`}>
            Back to pay
          </Link>
          <PrintButton />
        </div>

        <div className="report-header">
          <div>
            <div className="eyebrow">My Pay Period Report</div>
            <h1 style={{ margin: "6px 0 0 0" }}>
              {report.period.start_date} to {report.period.end_date}
            </h1>
          </div>
          <div className={report.summary.status === "paid" ? "pill ok" : report.summary.status === "partial" ? "pill danger" : "pill warn"}>
            {report.summary.status === "paid" ? "Paid" : report.summary.status === "partial" ? "Partial" : "Pending"}
          </div>
        </div>

        <div className="report-meta">
          <span>{profile.full_name}</span>
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
            <div className="eyebrow">Pay Breakdown</div>
            <h2>Wages and paid status</h2>
            <div className="report-breakdown">
              <div><span>Travel wages</span><strong>{formatCurrencyFromCents(report.summary.total_travel_wages_cents)}</strong></div>
              <div><span>Prep wages</span><strong>{formatCurrencyFromCents(report.summary.total_prep_wages_cents)}</strong></div>
              <div><span>Service wages</span><strong>{formatCurrencyFromCents(report.summary.total_service_wages_cents)}</strong></div>
              <div><span>Total wages</span><strong>{formatCurrencyFromCents(report.summary.total_wages_cents)}</strong></div>
              <div><span>Total paid</span><strong>{formatCurrencyFromCents(report.summary.total_paid_cents)}</strong></div>
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
      </section>
    </AppShell>
  );
}
