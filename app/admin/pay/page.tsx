import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { saveTipRecord } from "@/app/admin/pay/actions";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getAdminPayData, getDefaultPayRange, type WorkerPaySummary } from "@/lib/data/pay";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import type { ProfileRow, TipRecordRow } from "@/lib/types";

type AdminPayPageProps = {
  searchParams?: Promise<{
    period?: string;
    worker?: string;
    tip?: string;
    message?: string;
  }>;
};

function getStatusLabel(status: WorkerPaySummary["pay_status"]) {
  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  return "Unpaid";
}

function getStatusClass(status: WorkerPaySummary["pay_status"]) {
  if (status === "paid") return "row-paid";
  if (status === "partial") return "row-partial";
  return "row-unpaid";
}

function getStatusPillClass(status: WorkerPaySummary["pay_status"]) {
  if (status === "paid") return "pill ok";
  if (status === "partial") return "pill danger";
  return "pill warn";
}

function getPeriodPillClass(status: "open" | "ready" | "paid") {
  if (status === "paid") return "pill ok";
  if (status === "ready") return "pill danger";
  return "pill warn";
}

export default async function AdminPayPage({ searchParams }: AdminPayPageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const defaults = await getDefaultPayRange();
  const periodId = params.period ?? defaults.payPeriodId ?? undefined;
  const data = await getAdminPayData({
    payPeriodId: periodId,
    workerId: params.worker,
    tipId: params.tip
  });
  const focusedSummary =
    data.selectedWorkerId
      ? data.summaries.find((summary) => summary.worker.id === data.selectedWorkerId) ?? null
      : null;

  return (
    <AppShell
      title="Admin Pay"
      subtitle="Track pay period totals without extra accounting clutter"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/workers", label: "Workers" },
        { href: "/admin/time", label: "Time" },
        { href: "/admin/pay", label: "Pay" },
        { href: "/admin/pay/batches", label: "Periods" },
        { href: "/admin/pay/reports", label: "Reports" },
        { href: "/admin/schedule", label: "Schedule" }
      ]}
      actions={
        <form action={signOut}>
          <button className="btn secondary" type="submit">
            Sign out
          </button>
        </form>
      }
    >
      <section className="card period-summary">
        <div className="summary-row">
          <div>
            <div className="eyebrow">Selected Pay Period</div>
            <h2 style={{ margin: "6px 0 0 0" }}>{data.periodLabel}</h2>
          </div>
          {data.selectedPeriod ? (
            <div className={getPeriodPillClass(data.selectedPeriod.status)}>
              {data.selectedPeriod.status === "paid"
                ? "Paid"
                : data.selectedPeriod.status === "ready"
                  ? "Ready to Pay"
                  : "Open"}
            </div>
          ) : null}
        </div>

        <div className="summary-kpis">
          <div className="summary-kpi">
            <span className="eyebrow">Total Wages</span>
            <strong>{formatCurrencyFromCents(data.totals.total_wages_cents)}</strong>
          </div>
          <div className="summary-kpi">
            <span className="eyebrow">Total Tips</span>
            <strong>{formatCurrencyFromCents(data.totals.total_tips_cents)}</strong>
          </div>
          <div className="summary-kpi">
            <span className="eyebrow">Already Paid</span>
            <strong className="status-paid">{formatCurrencyFromCents(data.totals.total_paid_cents)}</strong>
          </div>
          <div className="summary-kpi">
            <span className="eyebrow">Still Unpaid</span>
            <strong className="status-unpaid">{formatCurrencyFromCents(data.totals.total_unpaid_cents)}</strong>
          </div>
        </div>

        <div className="summary-row">
          <div className="muted">
            {data.selectedPeriod?.status === "paid"
              ? "Everything in this period is treated as paid."
              : "Anything in this period is still unpaid until the period is marked Paid."}
          </div>
          <div className="button-row">
            <Link className="btn secondary" href="/admin/pay/reports">
              Print reports
            </Link>
            <Link className="btn secondary" href="/admin/pay/batches">
              Manage pay periods
            </Link>
          </div>
        </div>
      </section>

      <section className="card stack" style={{ marginTop: 16 }}>
        <div className="eyebrow">View Options</div>
        <h2>Choose a pay period and optional worker focus</h2>
        {params.message ? <div className="pill">{params.message}</div> : null}
        <form className="form-grid" method="get">
          <label className="field">
            <span>Pay period</span>
            <select defaultValue={data.selectedPeriod?.id ?? ""} name="period">
              {data.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.start_date} to {period.end_date} ({period.status})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Worker focus</span>
            <select defaultValue={data.selectedWorkerId ?? ""} name="worker">
              <option value="">All workers</option>
              {data.workers.map((worker: ProfileRow) => (
                <option key={worker.id} value={worker.id}>
                  {worker.full_name}
                </option>
              ))}
            </select>
          </label>
          <div className="field" style={{ alignSelf: "end" }}>
            <button className="btn secondary" type="submit">
              Apply
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Worker Totals</div>
        <h2>Who is still owed money in this pay period</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Wages</th>
                <th>Tips</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Still Unpaid</th>
                <th>Status</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.map((summary) => (
                <tr className={getStatusClass(summary.pay_status)} key={summary.worker.id}>
                  <td>{summary.worker.full_name}</td>
                  <td>{formatCurrencyFromCents(summary.total_wages_cents)}</td>
                  <td>{formatCurrencyFromCents(summary.total_tips_cents)}</td>
                  <td>{formatCurrencyFromCents(summary.total_overall_pay_cents)}</td>
                  <td>{formatCurrencyFromCents(summary.total_paid_amount_cents)}</td>
                  <td>{formatCurrencyFromCents(summary.total_unpaid_amount_cents)}</td>
                  <td>
                    <span className={getStatusPillClass(summary.pay_status)}>{getStatusLabel(summary.pay_status)}</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/pay?${new URLSearchParams({
                        ...(data.selectedPeriod ? { period: data.selectedPeriod.id } : {}),
                        worker: summary.worker.id
                      }).toString()}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card stack">
          <div className="eyebrow">Selected Worker</div>
          <h2>Clear breakdown for the worker you are reviewing</h2>
          {focusedSummary ? (
            <>
              <div className="screen-frame stack">
                <div className="summary-row">
                  <strong>{focusedSummary.worker.full_name}</strong>
                  <span className={getStatusPillClass(focusedSummary.pay_status)}>
                    {getStatusLabel(focusedSummary.pay_status)}
                  </span>
                </div>
                <div className="muted">Travel wages {formatCurrencyFromCents(focusedSummary.total_travel_wages_cents)}</div>
                <div className="muted">Prep wages {formatCurrencyFromCents(focusedSummary.total_prep_wages_cents)}</div>
                <div className="muted">Service wages {formatCurrencyFromCents(focusedSummary.total_service_wages_cents)}</div>
                <div className="muted">Total wages {formatCurrencyFromCents(focusedSummary.total_wages_cents)}</div>
                <div className="muted">Total tips {formatCurrencyFromCents(focusedSummary.total_tips_cents)}</div>
                <div className="muted">Already paid {formatCurrencyFromCents(focusedSummary.total_paid_amount_cents)}</div>
                <div className="muted">Still unpaid {formatCurrencyFromCents(focusedSummary.total_unpaid_amount_cents)}</div>
              </div>

              <section className="stack">
                <div className="eyebrow">Tip Entry</div>
                <h3 style={{ margin: 0 }}>Enter or edit worker tips</h3>
                {data.selectedPeriod ? (
                  <div className="button-row">
                    <Link
                      className="btn secondary"
                      href={`/admin/pay/reports/worker/${focusedSummary.worker.id}?period=${data.selectedPeriod.id}`}
                    >
                      Print this worker period report
                    </Link>
                    <Link
                      className="btn secondary"
                      href={`/admin/pay/reports/annual/${focusedSummary.worker.id}?year=${new Date().getFullYear()}`}
                    >
                      Print annual report
                    </Link>
                  </div>
                ) : null}
                <form action={saveTipRecord} className="stack">
                  <input name="tip_id" type="hidden" value={data.selectedTip?.id ?? ""} />
                  <input name="shift_id" type="hidden" value={data.selectedTip?.shift_id ?? ""} />
                  <input name="pay_period_id" type="hidden" value={data.selectedPeriod?.id ?? ""} />
                  <label className="field">
                    <span>Worker</span>
                    <select defaultValue={data.selectedTip?.worker_id ?? focusedSummary.worker.id} name="worker_id">
                      {data.workers.map((worker: ProfileRow) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.full_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="form-grid">
                    <label className="field">
                      <span>Date</span>
                      <input
                        defaultValue={data.selectedTip?.tip_date ?? data.selectedPeriod?.end_date ?? ""}
                        max={data.selectedPeriod?.end_date ?? undefined}
                        min={data.selectedPeriod?.start_date ?? undefined}
                        name="tip_date"
                        required
                        type="date"
                      />
                    </label>
                    <label className="field">
                      <span>Event or shift</span>
                      <input
                        defaultValue={
                          data.selectedTip?.event_name ??
                          (Array.isArray(data.selectedTip?.shifts)
                            ? data.selectedTip?.shifts?.[0]?.location_name
                            : data.selectedTip?.shifts?.location_name) ??
                          ""
                        }
                        name="event_name"
                        placeholder="Spring festival, catering, lunch rush"
                        type="text"
                      />
                    </label>
                    <label className="field">
                      <span>Cash tips</span>
                      <input
                        defaultValue={data.selectedTip ? (data.selectedTip.cash_tip_cents / 100).toFixed(2) : ""}
                        inputMode="decimal"
                        name="cash_tip"
                        type="text"
                      />
                    </label>
                    <label className="field">
                      <span>Online tips</span>
                      <input
                        defaultValue={data.selectedTip ? (data.selectedTip.online_tip_cents / 100).toFixed(2) : ""}
                        inputMode="decimal"
                        name="online_tip"
                        type="text"
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Notes</span>
                    <textarea defaultValue={data.selectedTip?.notes ?? ""} name="notes" rows={4} />
                  </label>
                  <div className="button-row">
                    <button className="btn primary" type="submit">
                      Save tip record
                    </button>
                    {data.selectedTip && data.selectedPeriod ? (
                      <Link
                        className="btn secondary"
                        href={`/admin/pay?${new URLSearchParams({
                          period: data.selectedPeriod.id,
                          worker: focusedSummary.worker.id
                        }).toString()}`}
                      >
                        New tip entry
                      </Link>
                    ) : null}
                  </div>
                </form>
              </section>
            </>
          ) : (
            <p className="muted">Choose a worker from the table to see a simpler breakdown and tip entry form.</p>
          )}
        </section>

        <section className="card stack">
          <div className="eyebrow">Tip History</div>
          <h2>Recent tip records for the selected worker</h2>
          {data.selectedWorker && data.selectedWorkerId ? (
            <ul className="list">
              {data.selectedWorkerTips.length === 0 ? (
                <li className="list-item">No tip records in this pay period yet.</li>
              ) : (
                data.selectedWorkerTips.map(
                  (tip: TipRecordRow & {
                    shifts?: { id: string; location_name: string } | { id: string; location_name: string }[] | null;
                  }) => (
                    <li className="list-item" key={tip.id}>
                      <div>
                        <strong>{tip.tip_date}</strong>
                        <div className="muted">
                          {tip.event_name ??
                            (Array.isArray(tip.shifts) ? tip.shifts?.[0]?.location_name : tip.shifts?.location_name) ??
                            "Tip record"}
                        </div>
                        {tip.notes ? <div className="muted">{tip.notes}</div> : null}
                      </div>
                      <div className="stack" style={{ justifyItems: "end" }}>
                        <div className="muted">
                          Cash {formatCurrencyFromCents(tip.cash_tip_cents)} · Online{" "}
                          {formatCurrencyFromCents(tip.online_tip_cents)}
                        </div>
                        {data.selectedWorkerId && data.selectedPeriod ? (
                          <Link
                            href={`/admin/pay?${new URLSearchParams({
                              period: data.selectedPeriod.id,
                              worker: data.selectedWorkerId,
                              tip: tip.id
                            }).toString()}`}
                          >
                            Edit
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  )
                )
              )}
            </ul>
          ) : (
            <p className="muted">Choose a worker to see tip history in this pay period.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
