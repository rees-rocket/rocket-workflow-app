import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getPayrollReportIndexData } from "@/lib/data/pay-reports";

type PayrollReportsHomePageProps = {
  searchParams?: Promise<{
    period?: string;
    worker?: string;
    year?: string;
  }>;
};

export default async function PayrollReportsHomePage({ searchParams }: PayrollReportsHomePageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const data = await getPayrollReportIndexData({
    payPeriodId: params.period,
    workerId: params.worker,
    year: params.year ? Number(params.year) : undefined
  });

  const workerPeriodHref =
    data.selectedWorker && data.selectedPeriod
      ? `/admin/pay/reports/worker/${data.selectedWorker.id}?period=${data.selectedPeriod.id}`
      : null;
  const periodHref = data.selectedPeriod ? `/admin/pay/reports/period/${data.selectedPeriod.id}` : null;
  const annualHref = data.selectedWorker
    ? `/admin/pay/reports/annual/${data.selectedWorker.id}?year=${data.selectedYear}`
    : null;

  return (
    <AppShell
      title="Payroll Reports"
      subtitle="Print payroll by worker, by pay period, or for the full year"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/pay", label: "Pay" },
        { href: "/admin/pay/batches", label: "Periods" },
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
      <section className="card stack">
        <div className="eyebrow">Report Filters</div>
        <h2>Choose the worker, pay period, and year you want to print</h2>
        <form className="form-grid" method="get">
          <label className="field">
            <span>Worker</span>
            <select defaultValue={data.selectedWorker?.id ?? ""} name="worker">
              {data.workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pay period</span>
            <select defaultValue={data.selectedPeriod?.id ?? ""} name="period">
              {data.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.start_date} to {period.end_date}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Year</span>
            <select defaultValue={String(data.selectedYear)} name="year">
              {data.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <div className="field" style={{ alignSelf: "end" }}>
            <button className="btn secondary" type="submit">
              Update report links
            </button>
          </div>
        </form>
      </section>

      <section className="grid three" style={{ marginTop: 16 }}>
        <article className="card stack">
          <div className="eyebrow">Per Person</div>
          <h2>Worker pay period report</h2>
          <p className="muted">
            Print one worker&apos;s wages, tips, and pay status for the selected pay period.
          </p>
          <div className="screen-frame">
            <strong>{data.selectedWorker?.full_name ?? "No worker selected"}</strong>
            <div className="muted">
              {data.selectedPeriod ? `${data.selectedPeriod.start_date} to ${data.selectedPeriod.end_date}` : "No pay period selected"}
            </div>
          </div>
          {workerPeriodHref ? (
            <Link className="btn primary" href={workerPeriodHref}>
              Open worker report
            </Link>
          ) : (
            <div className="muted">Choose a worker and pay period first.</div>
          )}
        </article>

        <article className="card stack">
          <div className="eyebrow">Per Pay Period</div>
          <h2>Whole payroll report</h2>
          <p className="muted">
            Print one payroll report for the full selected pay period across all workers.
          </p>
          <div className="screen-frame">
            <strong>
              {data.selectedPeriod ? `${data.selectedPeriod.start_date} to ${data.selectedPeriod.end_date}` : "No pay period selected"}
            </strong>
            <div className="muted">
              {data.selectedPeriod
                ? data.selectedPeriod.status === "paid"
                  ? "Already paid"
                  : data.selectedPeriod.status === "ready"
                    ? "Ready to pay"
                    : "Still open"
                : ""}
            </div>
          </div>
          {periodHref ? (
            <Link className="btn primary" href={periodHref}>
              Open pay period report
            </Link>
          ) : (
            <div className="muted">Choose a pay period first.</div>
          )}
        </article>

        <article className="card stack">
          <div className="eyebrow">Annual</div>
          <h2>Worker annual report</h2>
          <p className="muted">
            Print a worker&apos;s full-year wages, tips, paid totals, and unpaid totals.
          </p>
          <div className="screen-frame">
            <strong>{data.selectedWorker?.full_name ?? "No worker selected"}</strong>
            <div className="muted">Year {data.selectedYear}</div>
          </div>
          {annualHref ? (
            <Link className="btn primary" href={annualHref}>
              Open annual report
            </Link>
          ) : (
            <div className="muted">Choose a worker first.</div>
          )}
        </article>
      </section>
    </AppShell>
  );
}
