import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { describeBatchPaidStatus, describeSegment, formatMinutesAsHours } from "@/lib/time";
import { getWorkerTimeData, getSegmentsForDay } from "@/lib/data/time";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { submitTimeCorrectionRequest } from "@/app/worker/time/actions";
import { signOut } from "@/app/auth/login/actions";

export default async function WorkerTimePage() {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const { days, correctionRequests } = await getWorkerTimeData(profile.id);
  const latestDay = days[0] ?? null;
  const segments = latestDay ? await getSegmentsForDay(latestDay.id) : [];

  return (
    <AppShell
      title="Worker Time"
      subtitle="Daily time history and correction requests"
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
          <button className="btn secondary" type="submit">
            Sign out
          </button>
        </form>
      }
    >
      <div className="grid two">
        <section className="card stack">
          <div className="eyebrow">Recent Days</div>
          <h2>Daily totals</h2>
          <ul className="list">
            {days.map((day) => (
              <li className="list-item" key={day.id}>
                <div>
                  <strong>{day.work_date}</strong>
                  <div className="muted">
                    Travel {formatMinutesAsHours(day.total_travel_minutes)} · Prep{" "}
                    {formatMinutesAsHours(day.total_prep_minutes)} · Service{" "}
                    {formatMinutesAsHours(day.total_service_minutes)} · Break{" "}
                    {formatMinutesAsHours(day.total_break_minutes)}
                  </div>
                  <div className="muted">
                    {describeBatchPaidStatus(day.pay_period?.status)} · Labor{" "}
                    {formatCurrencyFromCents(day.total_labor_cost_cents)}
                  </div>
                </div>
                <div className="pill">{formatMinutesAsHours(day.total_payable_minutes)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card stack">
          <div className="eyebrow">Request Correction</div>
          <h2>Ask admin to review a time issue</h2>
          <form action={submitTimeCorrectionRequest} className="stack">
            <div className="form-grid">
              <label className="field">
                <span>Date</span>
                <select defaultValue={latestDay?.work_date ?? ""} name="work_date" required>
                  <option value="">Select a day</option>
                  {days.map((day) => (
                    <option key={day.id} value={day.work_date}>
                      {day.work_date}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Request type</span>
                <select defaultValue="missed_clock_in" name="request_type">
                  <option value="missed_clock_in">Missed clock in</option>
                  <option value="missed_clock_out">Missed clock out</option>
                  <option value="wrong_break_time">Wrong break time</option>
                  <option value="wrong_status">Wrong status</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="field">
                <span>Related day</span>
                <select defaultValue={latestDay?.id ?? ""} name="time_day_id">
                  <option value="">No day selected</option>
                  {days.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.work_date}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Related segment</span>
                <select defaultValue="" name="time_segment_id">
                  <option value="">No segment selected</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {describeSegment(segment.segment_type)} {segment.start_at.slice(11, 16)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Requested change</span>
              <textarea
                name="requested_change"
                placeholder="Example: I missed my 8:00 AM clock in and actually started in Travel at 7:45 AM."
                required
                rows={4}
              />
            </label>
            <label className="field">
              <span>Reason or note</span>
              <textarea name="reason" rows={3} />
            </label>
            <button className="btn primary" type="submit">
              Send correction request
            </button>
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">My Requests</div>
        <h2>Pending, approved, and denied corrections</h2>
        <ul className="list">
          {correctionRequests.length === 0 ? (
            <li className="list-item">No correction requests yet.</li>
          ) : (
            correctionRequests.map((request) => (
              <li className="list-item" key={request.id}>
                <div>
                  <strong>{request.work_date}</strong>
                  <div className="muted">{request.request_type.replaceAll("_", " ")}</div>
                  <div className="muted">{request.requested_change}</div>
                  {request.admin_note ? <div className="muted">Admin note: {request.admin_note}</div> : null}
                </div>
                <div className={`pill ${request.status === "approved" ? "ok" : request.status === "denied" ? "danger" : "warn"}`}>
                  {request.status}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}
