import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { getAdminTimeData, getAuditLogsForDay, getSegmentsForDay } from "@/lib/data/time";
import { calculateMinutes, describeSegment, describeStatus, formatMinutesAsHours, formatTime } from "@/lib/time";
import { addTimeSegment, deleteTimeSegment, reviewTimeCorrectionRequest, saveSegmentCorrection } from "@/app/admin/time/actions";
import { signOut } from "@/app/auth/login/actions";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";

type AdminTimePageProps = {
  searchParams?: Promise<{
    worker?: string;
    date?: string;
    day?: string;
    segment?: string;
    request?: string;
  }>;
};

export default async function AdminTimePage({ searchParams }: AdminTimePageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const { days, workers, correctionRequests } = await getAdminTimeData({
    workerId: params.worker,
    date: params.date
  });
  const selectedDay = days.find((day) => day.id === params.day) ?? days[0] ?? null;
  const segments = selectedDay ? await getSegmentsForDay(selectedDay.id) : [];
  const audits = selectedDay ? await getAuditLogsForDay(selectedDay.id) : [];
  const selectedSegment = segments.find((segment) => segment.id === params.segment) ?? segments[0] ?? null;
  const selectedRequest = correctionRequests.find((request) => request.id === params.request) ?? correctionRequests[0] ?? null;

  return (
    <AppShell
      title="Admin Time"
      subtitle="Direct time edits plus worker correction requests"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/workers", label: "Workers" },
        { href: "/admin/time", label: "Time" },
        { href: "/admin/pay", label: "Pay" },
        { href: "/admin/pay/batches", label: "Periods" }
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
          <div className="eyebrow">Filters</div>
          <h2>Find worker time fast</h2>
          <form className="form-grid" method="get">
            <label className="field">
              <span>Worker</span>
              <select defaultValue={params.worker ?? ""} name="worker">
                <option value="">All workers</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Date</span>
              <input defaultValue={params.date ?? ""} name="date" type="date" />
            </label>
            <div className="field" style={{ alignSelf: "end" }}>
              <button className="btn secondary" type="submit">
                Apply filters
              </button>
            </div>
          </form>
          <div className="screen-frame">
            <strong>Worker edits are request-only</strong>
            <p className="muted">
              Workers can ask for corrections from their time page. Only admin can directly edit,
              add, or delete segments here.
            </p>
          </div>
        </section>

        <section className="card stack">
          <div className="eyebrow">Edit Segment</div>
          <h2>Correct one segment or approve a request while editing</h2>
          {selectedSegment && selectedDay ? (
            <form action={saveSegmentCorrection} className="stack">
              <input name="segment_id" type="hidden" value={selectedSegment.id} />
              <input name="time_day_id" type="hidden" value={selectedDay.id} />
              <input name="worker_id" type="hidden" value={selectedDay.worker_id} />
              <input name="correction_request_id" type="hidden" value={selectedRequest?.id ?? ""} />
              <div className="pill">
                {selectedDay.profile?.full_name ?? "Worker"} · {describeSegment(selectedSegment.segment_type)}
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Status</span>
                  <select defaultValue={selectedSegment.segment_type} name="segment_type">
                    <option value="travel">Travel</option>
                    <option value="prep">Prep</option>
                    <option value="service">Service</option>
                    <option value="break">Break</option>
                  </select>
                </label>
                <label className="field">
                  <span>Start</span>
                  <input defaultValue={selectedSegment.start_at.slice(0, 16)} name="start_at" type="datetime-local" />
                </label>
                <label className="field">
                  <span>End</span>
                  <input defaultValue={selectedSegment.end_at?.slice(0, 16) ?? ""} name="end_at" type="datetime-local" />
                </label>
              </div>
              <div className="screen-frame">
                <strong>Current segment total</strong>
                <p className="muted">
                  {selectedSegment.end_at
                    ? `${formatMinutesAsHours(calculateMinutes(selectedSegment.start_at, selectedSegment.end_at) ?? 0)} for this ${describeSegment(selectedSegment.segment_type).toLowerCase()} segment.`
                    : "This segment is still open."}
                </p>
                <p className="muted">
                  {selectedSegment.segment_type === "break"
                    ? "Break is separate and unpaid."
                    : `Current rate ${formatCurrencyFromCents(selectedSegment.wage_rate_cents_used)} · Current cost ${formatCurrencyFromCents(selectedSegment.labor_cost_cents)}`}
                </p>
              </div>
              <label className="field">
                <span>Admin note</span>
                <textarea defaultValue={selectedRequest?.admin_note ?? ""} name="admin_note" rows={3} />
              </label>
              <button className="btn primary" type="submit">
                Save segment correction
              </button>
            </form>
          ) : (
            <p className="muted">Choose a day and segment to edit it.</p>
          )}
        </section>
      </div>

      {selectedDay ? (
        <section className="card" style={{ marginTop: 16 }}>
          <div className="eyebrow">Add Missed Segment</div>
          <h2>Add travel, prep, service, or break time</h2>
          <form action={addTimeSegment} className="form-grid">
            <input name="time_day_id" type="hidden" value={selectedDay.id} />
            <input name="worker_id" type="hidden" value={selectedDay.worker_id} />
            <input name="work_date" type="hidden" value={selectedDay.work_date} />
            <label className="field">
              <span>Status</span>
              <select defaultValue="service" name="segment_type">
                <option value="travel">Travel</option>
                <option value="prep">Prep</option>
                <option value="service">Service</option>
                <option value="break">Break</option>
              </select>
            </label>
            <label className="field">
              <span>Start</span>
              <input name="start_at" required type="datetime-local" />
            </label>
            <label className="field">
              <span>End</span>
              <input name="end_at" type="datetime-local" />
            </label>
            <label className="field">
              <span>Admin note</span>
              <input name="admin_note" type="text" />
            </label>
            <div className="field" style={{ alignSelf: "end" }}>
              <button className="btn secondary" type="submit">
                Add segment
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Daily Totals</div>
        <h2>Travel, prep, service, break, and payable time by day</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Date</th>
                <th>Travel</th>
                <th>Prep</th>
                <th>Service</th>
                <th>Break</th>
                <th>Payable</th>
                <th>Total Labor</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.id}>
                  <td>{day.profile?.full_name ?? day.worker_id}</td>
                  <td>{day.work_date}</td>
                  <td>{formatMinutesAsHours(day.total_travel_minutes)}</td>
                  <td>{formatMinutesAsHours(day.total_prep_minutes)}</td>
                  <td>{formatMinutesAsHours(day.total_service_minutes)}</td>
                  <td>{formatMinutesAsHours(day.total_break_minutes)}</td>
                  <td>{formatMinutesAsHours(day.total_payable_minutes)}</td>
                  <td>{formatCurrencyFromCents(day.total_labor_cost_cents)}</td>
                  <td>{describeStatus(day.status)}</td>
                  <td>
                    <Link
                      href={`/admin/time?${new URLSearchParams({
                        ...(params.worker ? { worker: params.worker } : {}),
                        ...(params.date ? { date: params.date } : {}),
                        day: day.id
                      }).toString()}`}
                    >
                      Open day
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Segment Detail</div>
        <h2>Edit or remove incorrect segments</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Rate</th>
                <th>Cost</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment) => (
                <tr key={segment.id}>
                  <td>{describeSegment(segment.segment_type)}</td>
                  <td>{formatTime(segment.start_at)}</td>
                  <td>{segment.end_at ? formatTime(segment.end_at) : "Open"}</td>
                  <td>{segment.end_at ? formatMinutesAsHours(calculateMinutes(segment.start_at, segment.end_at) ?? 0) : "Active"}</td>
                  <td>{segment.segment_type === "break" ? "Not paid" : formatCurrencyFromCents(segment.wage_rate_cents_used)}</td>
                  <td>{segment.segment_type === "break" ? "Not paid" : formatCurrencyFromCents(segment.labor_cost_cents)}</td>
                  <td>
                    <Link
                      href={`/admin/time?${new URLSearchParams({
                        ...(params.worker ? { worker: params.worker } : {}),
                        ...(params.date ? { date: params.date } : {}),
                        ...(selectedDay ? { day: selectedDay.id } : {}),
                        segment: segment.id
                      }).toString()}`}
                    >
                      Edit
                    </Link>
                  </td>
                  <td>
                    {selectedDay ? (
                      <form action={deleteTimeSegment}>
                        <input name="segment_id" type="hidden" value={segment.id} />
                        <input name="time_day_id" type="hidden" value={selectedDay.id} />
                        <input name="worker_id" type="hidden" value={selectedDay.worker_id} />
                        <input name="correction_request_id" type="hidden" value={selectedRequest?.id ?? ""} />
                        <input name="admin_note" type="hidden" value={selectedRequest?.admin_note ?? ""} />
                        <button className="btn secondary" type="submit">
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="eyebrow">Correction Requests</div>
          <h2>Pending review and recent history</h2>
          <ul className="list">
            {correctionRequests.length === 0 ? (
              <li className="list-item">No correction requests yet.</li>
            ) : (
              correctionRequests.map((request) => (
                <li className="list-item" key={request.id}>
                  <div>
                    <strong>{request.worker?.full_name ?? request.worker_id}</strong>
                    <div className="muted">
                      {request.work_date} · {request.request_type.replaceAll("_", " ")}
                    </div>
                    <div className="muted">{request.requested_change}</div>
                    {request.reason ? <div className="muted">{request.reason}</div> : null}
                  </div>
                  <div className="stack" style={{ justifyItems: "end" }}>
                    <span className={`pill ${request.status === "approved" ? "ok" : request.status === "denied" ? "danger" : "warn"}`}>
                      {request.status}
                    </span>
                    <Link href={`/admin/time?request=${request.id}`}>Open</Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="card stack">
          <div className="eyebrow">Request Review</div>
          <h2>Approve or deny the selected request</h2>
          {selectedRequest ? (
            <>
              <div className="screen-frame">
                <strong>{selectedRequest.worker?.full_name ?? selectedRequest.worker_id}</strong>
                <p className="muted">
                  {selectedRequest.work_date} · {selectedRequest.request_type.replaceAll("_", " ")}
                </p>
                <p className="muted">{selectedRequest.requested_change}</p>
              </div>
              <form action={reviewTimeCorrectionRequest} className="stack">
                <input name="request_id" type="hidden" value={selectedRequest.id} />
                <label className="field">
                  <span>Admin note</span>
                  <textarea defaultValue={selectedRequest.admin_note ?? ""} name="admin_note" rows={4} />
                </label>
                <div className="button-row">
                  <button className="btn primary" name="status" type="submit" value="approved">
                    Approve request
                  </button>
                  <button className="btn secondary" name="status" type="submit" value="denied">
                    Deny request
                  </button>
                </div>
                <p className="muted">
                  If the request requires a segment change, make the edit above first and then approve it.
                </p>
              </form>
            </>
          ) : (
            <p className="muted">Choose a correction request to review it.</p>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Audit Trail</div>
        <h2>What changed on the selected day</h2>
        <ul className="list">
          {audits.length === 0 ? (
            <li className="list-item">No audit entries for this day yet.</li>
          ) : (
            audits.map((audit) => (
              <li className="list-item" key={audit.id}>
                <div>
                  <strong>{audit.action_type.replaceAll("_", " ")}</strong>
                  <div className="muted">{audit.acted_at.slice(0, 16).replace("T", " ")}</div>
                  {audit.note ? <div className="muted">{audit.note}</div> : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}
