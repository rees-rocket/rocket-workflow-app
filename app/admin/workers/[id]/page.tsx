import Link from "next/link";
import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { getDefaultPayRange, getWorkerPaySummary } from "@/lib/data/pay";
import { getWorkerManagementDetail } from "@/lib/data/workers";
import { AppButton } from "@/components/app-button";
import {
  calculateMinutes,
  describeBatchPaidStatus,
  describeSegment,
  describeStatus,
  formatMinutesAsHours,
  formatTime
} from "@/lib/time";
import { sendWorkerInvite, updateWorker } from "@/app/admin/workers/actions";
import { notFound } from "next/navigation";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";

type WorkerDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function WorkerDetailPage({ params, searchParams }: WorkerDetailPageProps) {
  await requireProfile("admin");
  const { id } = await params;
  const search = (await searchParams) ?? {};
  const detail = await getWorkerManagementDetail(id);

  if (!detail.worker) {
    notFound();
  }

  const trainingAssigned = detail.trainingAssignments.length;
  const trainingCompleted = detail.trainingAssignments.filter((item) => item.completed_at).length;
  const trainingOverdue = detail.trainingAssignments.filter(
    (item) => !item.completed_at && item.due_date < new Date().toISOString().slice(0, 10)
  ).length;
  const currentPeriod = await getDefaultPayRange();
  const paySummary =
    detail.source === "profile"
      ? await getWorkerPaySummary(detail.worker.id, currentPeriod.payPeriodId ?? undefined)
      : null;

  return (
    <AdminPageShell
      actions={
        <form action={sendWorkerInvite}>
          <input name="email" type="hidden" value={detail.worker.email} />
          <input
            name="return_to"
            type="hidden"
            value={`/admin/workers/${detail.source === "pending" ? `pending-${detail.worker.id}` : detail.worker.id}`}
          />
          <AppButton type="submit" variant="secondary">
            {detail.source === "pending" ? "Send invite email" : "Re-send sign-in email"}
          </AppButton>
        </form>
      }
      title="Worker Detail"
      subtitle="Practical worker management"
    >
      <div className="grid three">
        <section className="card metric">
          <span className="eyebrow">Status</span>
          <strong>{detail.worker.status}</strong>
          <span className="muted">{detail.source === "pending" ? "Pending first sign-in" : "Live account"}</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Default Wage</span>
          <strong>{formatCurrencyFromCents(detail.worker.wage_rate_cents)}</strong>
          <span className="muted">{detail.worker.tip_eligible ? "Tip eligible" : "Not tip eligible"}</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Training</span>
          <strong>{trainingAssigned}</strong>
          <span className="muted">
            {trainingCompleted} completed, {trainingOverdue} overdue
          </span>
        </section>
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card stack">
          <div className="eyebrow">Profile Details</div>
          <h2>Edit worker</h2>
          {search.message ? <div className="pill">{search.message}</div> : null}
          <form action={updateWorker} className="stack">
            <input name="source" type="hidden" value={detail.source} />
            <input name="worker_id" type="hidden" value={detail.worker.id} />
            <div className="form-grid">
              <label className="field">
                <span>Full name</span>
                <input defaultValue={detail.worker.full_name} name="full_name" required type="text" />
              </label>
              <label className="field">
                <span>Email</span>
                <input defaultValue={detail.worker.email} name="email" required type="email" />
              </label>
              <label className="field">
                <span>Role</span>
                <select defaultValue={detail.worker.role} name="role">
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="field">
                <span>Employee type</span>
                <select defaultValue={detail.worker.employee_type} name="employee_type">
                  <option value="employee">Employee</option>
                  <option value="contractor">Contractor</option>
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select defaultValue={detail.worker.status} name="status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="field">
                <span>Default wage</span>
                <input
                  defaultValue={
                    detail.worker.wage_rate_cents !== null ? (detail.worker.wage_rate_cents / 100).toFixed(2) : ""
                  }
                  inputMode="decimal"
                  name="wage_rate"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Travel wage</span>
                <input
                  defaultValue={
                    detail.worker.travel_wage_rate_cents !== null
                      ? (detail.worker.travel_wage_rate_cents / 100).toFixed(2)
                      : ""
                  }
                  inputMode="decimal"
                  name="travel_wage_rate"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Prep wage</span>
                <input
                  defaultValue={
                    detail.worker.prep_wage_rate_cents !== null
                      ? (detail.worker.prep_wage_rate_cents / 100).toFixed(2)
                      : ""
                  }
                  inputMode="decimal"
                  name="prep_wage_rate"
                  type="text"
                />
              </label>
              <label className="field">
                <span>Service wage</span>
                <input
                  defaultValue={
                    detail.worker.service_wage_rate_cents !== null
                      ? (detail.worker.service_wage_rate_cents / 100).toFixed(2)
                      : ""
                  }
                  inputMode="decimal"
                  name="service_wage_rate"
                  type="text"
                />
              </label>
              <label className="field" style={{ alignSelf: "end" }}>
                <span>Tip eligible</span>
                <input
                  defaultChecked={detail.worker.tip_eligible}
                  name="tip_eligible"
                  style={{ width: 20, height: 20 }}
                  type="checkbox"
                />
              </label>
            </div>
            <label className="field">
              <span>Notes</span>
              <textarea defaultValue={detail.worker.notes ?? ""} name="notes" rows={5} />
            </label>
            <div className="button-row">
              <AppButton variant="primary"  type="submit">
                Save changes
              </AppButton>
            </div>
          </form>
          <div className="screen-frame">
            <strong>Wage fallback order</strong>
            <p className="muted">
              Assignment override first when a paid segment is linked to a shift assignment, then the
              worker&apos;s status wage, then the worker default wage.
            </p>
          </div>
        </section>

        <section className="stack">
          {detail.source === "profile" ? (
            <section className="card">
              <div className="eyebrow">Pay Summary</div>
              <h2>Current pay period wages and tips</h2>
              {paySummary ? (
                <div className="stack">
                  <div className="muted">{currentPeriod.label}</div>
                  <div className="screen-frame">
                    <strong>Total wages {formatCurrencyFromCents(paySummary.total_wages_cents)}</strong>
                    <p className="muted">
                      Paid amount {formatCurrencyFromCents(paySummary.total_paid_amount_cents)} · Unpaid amount{" "}
                      {formatCurrencyFromCents(paySummary.total_unpaid_amount_cents)}
                    </p>
                    <p className="muted">
                      Cash tips {formatCurrencyFromCents(paySummary.total_cash_tips_cents)} · Online tips{" "}
                      {formatCurrencyFromCents(paySummary.total_online_tips_cents)}
                    </p>
                    <p className="muted">
                      Total tips {formatCurrencyFromCents(paySummary.total_tips_cents)} · Overall pay{" "}
                      {formatCurrencyFromCents(paySummary.total_overall_pay_cents)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/pay?${new URLSearchParams({
                      ...(currentPeriod.payPeriodId ? { period: currentPeriod.payPeriodId } : {}),
                      worker: detail.worker.id
                    }).toString()}`}
                  >
                    Open pay tracking
                  </Link>
                </div>
              ) : (
                <p className="muted">No pay data in the selected pay period yet.</p>
              )}
            </section>
          ) : null}

          <section className="card">
            <div className="eyebrow">Training</div>
            <h2>Assignments and status</h2>
            {detail.trainingAssignments.length === 0 ? (
              <p className="muted">No training assigned yet.</p>
            ) : (
              <ul className="list">
                {detail.trainingAssignments.map((assignment) => (
                  <li className="list-item" key={assignment.id}>
                    <div>
                      <strong>
                        {(
                          Array.isArray((assignment as { training_modules?: Array<{ title?: string }> }).training_modules)
                            ? (assignment as { training_modules?: Array<{ title?: string }> }).training_modules?.[0]?.title
                            : (assignment as { training_modules?: { title?: string } }).training_modules?.title
                        ) ?? "Training module"}
                      </strong>
                      <div className="muted">Due {assignment.due_date}</div>
                    </div>
                    <div className="pill">
                      {assignment.completed_at
                        ? "Completed"
                        : assignment.due_date < new Date().toISOString().slice(0, 10)
                          ? "Overdue"
                          : "Assigned"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Recent Time Days</div>
        <h2>Latest daily totals</h2>
        {detail.timeDays.length === 0 ? (
          <p className="muted">No time entries yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Travel</th>
                  <th>Prep</th>
                  <th>Service</th>
                  <th>Worked</th>
                  <th>Break</th>
                  <th>Payable</th>
                  <th>Labor Cost</th>
                  <th>Period Status</th>
                  <th>Period Paid At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.timeDays.map((day) => (
                  <tr key={day.id}>
                    <td>{day.work_date}</td>
                    <td>{formatMinutesAsHours(day.total_travel_minutes)}</td>
                    <td>{formatMinutesAsHours(day.total_prep_minutes)}</td>
                    <td>{formatMinutesAsHours(day.total_service_minutes)}</td>
                    <td>{formatMinutesAsHours(day.total_work_minutes)}</td>
                    <td>{formatMinutesAsHours(day.total_break_minutes)}</td>
                    <td>{formatMinutesAsHours(day.total_payable_minutes)}</td>
                    <td>{formatCurrencyFromCents(day.total_labor_cost_cents)}</td>
                    <td>{describeBatchPaidStatus(day.pay_period?.status)}</td>
                    <td>{day.pay_period?.paid_at ? day.pay_period.paid_at.slice(0, 10) : "Not paid yet"}</td>
                    <td>{describeStatus(day.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Recent Time Segments</div>
        <h2>Latest work and break activity</h2>
        {detail.timeSegments.length === 0 ? (
          <p className="muted">No time segments yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Rate</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {detail.timeSegments.map((segment) => (
                  <tr key={segment.id}>
                    <td>{segment.work_date}</td>
                    <td>{describeSegment(segment.segment_type)}</td>
                    <td>{formatTime(segment.start_at)}</td>
                    <td>{segment.end_at ? formatTime(segment.end_at) : "Open"}</td>
                    <td>
                      {segment.end_at
                        ? formatMinutesAsHours(calculateMinutes(segment.start_at, segment.end_at) ?? 0)
                        : "Active"}
                    </td>
                    <td>{segment.segment_type === "break" ? "Not paid" : formatCurrencyFromCents(segment.wage_rate_cents_used)}</td>
                    <td>{segment.segment_type === "break" ? "Not paid" : formatCurrencyFromCents(segment.labor_cost_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
