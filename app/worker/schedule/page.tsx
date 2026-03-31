import { requireProfile } from "@/lib/auth";
import { getWorkerSchedule, getEffectivePayRate, formatRole, formatShiftStatus } from "@/lib/data/schedule";
import { formatTime } from "@/lib/time";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { submitTradeRequest } from "@/app/worker/schedule/actions";
import { AppButton } from "@/components/app-button";
import { WorkerPageShell } from "@/components/worker-page-shell";
import Link from "next/link";

type Props = {
  searchParams?: Promise<{ message?: string; month?: string }>;
};

type CalendarShift = {
  id: string;
  date: string;
  startAt: string;
  endAt: string;
  location: string;
  role: string;
};

type CalendarDay = {
  key: string;
  label: number | null;
  isoDate: string | null;
  shifts: CalendarShift[];
  isToday: boolean;
};

function toIsoDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
}

function buildMonthCalendar(baseDate: Date, shifts: CalendarShift[]) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const todayIso = toIsoDate(new Date());
  const shiftMap = new Map<string, CalendarShift[]>();

  for (const shift of shifts) {
    const current = shiftMap.get(shift.date) ?? [];
    current.push(shift);
    shiftMap.set(shift.date, current);
  }

  const days: CalendarDay[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    days.push({
      key: `blank-${year}-${month}-${i}`,
      label: null,
      isoDate: null,
      shifts: [],
      isToday: false
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const isoDate = toIsoDate(new Date(year, month, day));
    days.push({
      key: isoDate,
      label: day,
      isoDate,
      shifts: (shiftMap.get(isoDate) ?? []).sort((a, b) => a.startAt.localeCompare(b.startAt)),
      isToday: isoDate === todayIso
    });
  }

  return {
    monthParam: `${year}-${String(month + 1).padStart(2, "0")}`,
    title: baseDate.toLocaleString("en-US", { month: "long", year: "numeric" }),
    days
  };
}

export default async function WorkerSchedulePage({ searchParams }: Props) {
  const { profile } = await requireProfile("worker");
  const { assignments, workers, tradeRequests } = await getWorkerSchedule(profile.id);
  const params = (await searchParams) ?? {};
  const monthSource = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : toIsoDate(new Date()).slice(0, 7);
  const monthStart = new Date(`${monthSource}-01T00:00:00`);
  const previousMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const calendarShifts: CalendarShift[] = assignments.map((assignment) => ({
    id: assignment.id,
    date: assignment.shifts.shift_date,
    startAt: assignment.shifts.start_at,
    endAt: assignment.shifts.end_at,
    location: assignment.shifts.location_name,
    role: assignment.role
  }));

  const monthCalendar = buildMonthCalendar(
    monthStart,
    calendarShifts.filter((shift) => shift.date.startsWith(monthSource))
  );

  return (
    <WorkerPageShell title="Schedule" subtitle="Your assigned shifts">
      {params.message ? <div className="pill" style={{ marginBottom: 16 }}>{params.message}</div> : null}
      <section className="card">
        <div className="summary-row">
          <div>
            <div className="eyebrow">Monthly Calendar</div>
            <h2 style={{ margin: "6px 0 0 0" }}>{monthCalendar.title}</h2>
          </div>
          <div className="button-row">
            <Link className="btn secondary" href={`/worker/schedule?month=${toIsoDate(previousMonth).slice(0, 7)}`}>
              Previous month
            </Link>
            <Link className="btn secondary" href={`/worker/schedule?month=${toIsoDate(nextMonth).slice(0, 7)}`}>
              Next month
            </Link>
          </div>
        </div>
        <div className="calendar-weekdays" style={{ marginTop: 12 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="calendar-grid" style={{ marginTop: 10 }}>
          {monthCalendar.days.map((day) => (
            <div
              className={`calendar-day ${day.label === null ? "blank" : ""} ${day.isToday ? "today" : ""}`}
              key={day.key}
            >
              {day.label !== null ? (
                <>
                  <div className="calendar-day-number">{day.label}</div>
                  <div className="calendar-shifts">
                    {day.shifts.length === 0 ? (
                      <span className="muted">No shift</span>
                    ) : (
                      day.shifts.map((shift) => (
                        <div className="calendar-shift" key={shift.id}>
                          <strong>{formatTime(shift.startAt)}</strong>
                          <span>{shift.location}</span>
                          <span>{formatRole(shift.role)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
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
    </WorkerPageShell>
  );
}
