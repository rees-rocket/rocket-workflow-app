import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { getWorkerSchedule, getEffectivePayRate, formatRole, formatShiftStatus } from "@/lib/data/schedule";
import { formatTime } from "@/lib/time";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { submitTradeRequest } from "@/app/worker/schedule/actions";
import { signOut } from "@/app/auth/login/actions";
import { AppButton } from "@/components/app-button";

type Props = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function WorkerSchedulePage({ searchParams }: Props) {
  const { profile } = await requireProfile("worker");
  const { assignments, workers, tradeRequests } = await getWorkerSchedule(profile.id);
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      title="Worker Schedule"
      subtitle="Your assigned shifts"
      nav={[
        { href: "/worker", label: "Dashboard" },
        { href: "/worker/pay", label: "Pay" },
        { href: "/worker/time", label: "Time" },
        { href: "/worker/schedule", label: "Schedule" },
        { href: "/worker/training", label: "Training" },
        { href: "/worker/forms", label: "Forms" }
      ]}
      actions={
        <form action={signOut}>
          <AppButton variant="secondary"  type="submit">Sign out</AppButton>
        </form>
      }
    >
      {params.message ? <div className="pill" style={{ marginBottom: 16 }}>{params.message}</div> : null}
      <section className="card">
        <div className="eyebrow">Assigned Shifts</div>
        <h2>What you are scheduled for</h2>
        {assignments.length === 0 ? (
          <p className="muted">No shifts assigned yet.</p>
        ) : (
          <ul className="list">
            {assignments.map((assignment) => (
              <li className="list-item" key={assignment.id}>
                <div className="stack">
                  <div>
                    <strong>{assignment.shifts?.shift_date}</strong>
                    <div className="muted">
                      {formatTime(assignment.shifts.start_at)} to {formatTime(assignment.shifts.end_at)} · {assignment.shifts.location_name}
                    </div>
                    <div className="muted">
                      {formatRole(assignment.role)} · {formatShiftStatus(assignment.shifts.status)}
                      {assignment.shifts.notes ? ` · ${assignment.shifts.notes}` : ""}
                    </div>
                  </div>
                  <div className="pill">
                    {getEffectivePayRate(assignment) === null
                      ? "Pay rate not set"
                      : `Pay rate: ${formatCurrencyFromCents(getEffectivePayRate(assignment))}/hr`}
                  </div>
                </div>
                <form action={submitTradeRequest} className="stack" style={{ minWidth: 260 }}>
                  <input name="shift_assignment_id" type="hidden" value={assignment.id} />
                  <div className="form-grid">
                    <label className="field">
                      <span>Request</span>
                      <select defaultValue="trade" name="request_type">
                        <option value="trade">Trade</option>
                        <option value="release">Release</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Target worker</span>
                      <select defaultValue="" name="target_worker_id">
                        <option value="">No target selected</option>
                        {workers.map((worker) => (
                          <option key={worker.id} value={worker.id}>{worker.full_name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>Reason</span>
                    <input name="reason" type="text" />
                  </label>
                  <div className="button-row">
                    <AppButton variant="primary"  type="submit">Send request</AppButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">My Requests</div>
        <h2>Trade and release requests</h2>
        {tradeRequests.length === 0 ? (
          <p className="muted">No requests yet.</p>
        ) : (
          <ul className="list">
            {tradeRequests.map((request) => (
              <li className="list-item" key={request.id}>
                <div>
                  <strong>{request.request_type === "trade" ? "Trade" : "Release"}</strong>
                  <div className="muted">{request.reason ?? "No reason added"}</div>
                </div>
                <div className="pill">{request.status}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
