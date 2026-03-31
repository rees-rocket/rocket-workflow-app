import { requireProfile } from "@/lib/auth";
import { AppButton } from "@/components/app-button";
import {
  describeSegment,
  describeStatus,
  formatMinutesAsHours,
  formatTime,
  getStatusTone
} from "@/lib/time";
import { getWorkerDashboardData } from "@/lib/data/time";
import { getWorkerSchedule } from "@/lib/data/schedule";
import {
  clockInAsPrep,
  clockInAsService,
  clockInAsTravel,
  clockOut,
  endBreak,
  startBreak,
  switchStatus
} from "@/app/worker/actions";
import { WorkerPageShell } from "@/components/worker-page-shell";

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

function buildMonthCalendar(baseDate: Date, shifts: CalendarShift[]) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const today = new Date();
  const todayIso = toIsoDate(today);
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
    title: baseDate.toLocaleString("en-US", { month: "long", year: "numeric" }),
    days
  };
}

function toIsoDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
}

function formatRole(role: string) {
  return role === "service" ? "Service" : "Prep";
}

export default async function WorkerPage() {
  const { profile } = await requireProfile("worker");
  const [{ todayDay, weekDays, recentSegments }, { assignments }] = await Promise.all([
    getWorkerDashboardData(profile.id),
    getWorkerSchedule(profile.id)
  ]);
  const status = todayDay?.status ?? "off_clock";
  const totalWeekMinutes = weekDays.reduce((sum, day) => sum + day.total_payable_minutes, 0);
  const todayTravelMinutes = todayDay?.total_travel_minutes ?? 0;
  const todayPrepMinutes = todayDay?.total_prep_minutes ?? 0;
  const todayServiceMinutes = todayDay?.total_service_minutes ?? 0;
  const todayBreakMinutes = todayDay?.total_break_minutes ?? 0;
  const todayPayableMinutes = todayDay?.total_payable_minutes ?? 0;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const calendarShifts: CalendarShift[] = assignments.map((assignment) => ({
    id: assignment.id,
    date: assignment.shifts.shift_date,
    startAt: assignment.shifts.start_at,
    endAt: assignment.shifts.end_at,
    location: assignment.shifts.location_name,
    role: assignment.role
  }));

  const currentMonthCalendar = buildMonthCalendar(
    currentMonthStart,
    calendarShifts.filter((shift) => shift.date.startsWith(toIsoDate(currentMonthStart).slice(0, 7)))
  );
  const nextMonthCalendar = buildMonthCalendar(
    nextMonthStart,
    calendarShifts.filter((shift) => shift.date.startsWith(toIsoDate(nextMonthStart).slice(0, 7)))
  );

  return (
    <WorkerPageShell title="Dashboard" subtitle="Mobile-first dashboard for quick daily use">
      <div className="grid two">
        <section className="card status-card">
          <div className="eyebrow">Time Tracking</div>
          <h2>{profile.full_name}</h2>
          <div className={`status-label ${getStatusTone(status)}`}>{describeStatus(status)}</div>
          <div className="screen-frame">
            <strong>
              {status === "travel"
                ? "You are currently in Travel status"
                : status === "prep"
                  ? "You are currently in Prep status"
                  : status === "service" || status === "working"
                    ? "You are currently in Service status"
                    : status === "on_break"
                      ? "You are currently on break"
                      : "You are off the clock"}
            </strong>
            <p className="muted">
              {status === "travel" || status === "prep" || status === "service" || status === "working"
                ? "You can switch status without clocking out, start a break, or clock out."
                : status === "on_break"
                  ? "End your break to return to work."
                  : "Choose the paid status you want to start with."}
            </p>
          </div>
          {status === "off_clock" ? (
            <div className="stack">
              <strong>Clock In</strong>
              <div className="button-row stretch">
                <form action={clockInAsTravel}>
                  <AppButton className="big" variant="primary"  type="submit">
                    Clock In as Travel
                  </AppButton>
                </form>
                <form action={clockInAsPrep}>
                  <AppButton className="big" variant="secondary"  type="submit">
                    Clock In as Prep
                  </AppButton>
                </form>
                <form action={clockInAsService}>
                  <AppButton className="big" variant="secondary"  type="submit">
                    Clock In as Service
                  </AppButton>
                </form>
              </div>
            </div>
          ) : null}

          {status === "travel" || status === "prep" || status === "service" || status === "working" ? (
            <div className="stack">
              <strong>Switch Status</strong>
              <div className="button-row stretch">
                {status !== "travel" ? (
                  <form action={switchStatus}>
                    <input name="next_status" type="hidden" value="travel" />
                    <AppButton className="big" variant="secondary"  type="submit">
                      Switch to Travel
                    </AppButton>
                  </form>
                ) : null}
                {status !== "prep" ? (
                  <form action={switchStatus}>
                    <input name="next_status" type="hidden" value="prep" />
                    <AppButton className="big" variant="secondary"  type="submit">
                      Switch to Prep
                    </AppButton>
                  </form>
                ) : null}
                {status !== "service" && status !== "working" ? (
                  <form action={switchStatus}>
                    <input name="next_status" type="hidden" value="service" />
                    <AppButton className="big" variant="secondary"  type="submit">
                      Switch to Service
                    </AppButton>
                  </form>
                ) : null}
                {status === "working" ? (
                  <form action={switchStatus}>
                    <input name="next_status" type="hidden" value="service" />
                    <AppButton className="big" variant="secondary"  type="submit">
                      Switch to Service
                    </AppButton>
                  </form>
                ) : null}
              </div>
              <strong>Other Actions</strong>
              <div className="button-row stretch">
                <form action={startBreak}>
                  <AppButton className="big" variant="primary"  type="submit">
                    Start Break
                  </AppButton>
                </form>
                <form action={clockOut}>
                  <AppButton className="big" variant="secondary"  type="submit">
                    Clock Out
                  </AppButton>
                </form>
              </div>
            </div>
          ) : null}

          {status === "on_break" ? (
            <div className="button-row stretch">
              <form action={endBreak}>
                <AppButton className="big" variant="primary"  type="submit">
                  End Break
                </AppButton>
              </form>
            </div>
          ) : null}
        </section>

        <section className="grid">
          <article className="card metric">
            <span className="eyebrow">Travel Today</span>
            <strong>{formatMinutesAsHours(todayTravelMinutes)}</strong>
            <span className="muted">Paid travel time</span>
          </article>
          <article className="card metric">
            <span className="eyebrow">Prep Today</span>
            <strong>{formatMinutesAsHours(todayPrepMinutes)}</strong>
            <span className="muted">Prep time today</span>
          </article>
          <article className="card metric">
            <span className="eyebrow">Service Today</span>
            <strong>{formatMinutesAsHours(todayServiceMinutes)}</strong>
            <span className="muted">Service time today</span>
          </article>
          <article className="card metric">
            <span className="eyebrow">Breaks Today</span>
            <strong>{formatMinutesAsHours(todayBreakMinutes)}</strong>
            <span className="muted">Break time today</span>
          </article>
          <article className="card metric">
            <span className="eyebrow">Payable Today</span>
            <strong>{formatMinutesAsHours(todayPayableMinutes)}</strong>
            <span className="muted">Travel, prep, and service combined</span>
          </article>
          <article className="card metric">
            <span className="eyebrow">This Week</span>
            <strong>{formatMinutesAsHours(totalWeekMinutes)}</strong>
            <span className="muted">Payable hours this week</span>
          </article>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="summary-row">
          <div>
            <div className="eyebrow">Schedule Calendar</div>
            <h3 style={{ margin: "6px 0 0 0" }}>Current month and next month</h3>
          </div>
        </div>
        <div className="grid two" style={{ marginTop: 12 }}>
          {[currentMonthCalendar, nextMonthCalendar].map((calendar) => (
            <section className="calendar-card" key={calendar.title}>
              <div className="summary-row">
                <strong>{calendar.title}</strong>
                <span className="muted">
                  {calendar.days.reduce((sum, day) => sum + day.shifts.length, 0)} shifts
                </span>
              </div>
              <div className="calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {calendar.days.map((day) => (
                  <div
                    className={`calendar-day ${day.label === null ? "blank" : ""} ${day.isToday ? "today" : ""}`}
                    key={day.key}
                  >
                    {day.label !== null ? (
                      <>
                        <div className="calendar-day-number">{day.label}</div>
                        <div className="calendar-shifts">
                          {day.shifts.slice(0, 2).map((shift) => (
                            <div className="calendar-shift" key={shift.id}>
                              <strong>{formatTime(shift.startAt)}</strong>
                              <span>{shift.location}</span>
                              <span>{formatRole(shift.role)}</span>
                            </div>
                          ))}
                          {day.shifts.length > 2 ? (
                            <div className="muted">+{day.shifts.length - 2} more</div>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Recent Time Activity</div>
        <h3>Latest travel, prep, service, and break segments</h3>
        <ul className="list">
          {recentSegments.map((segment) => (
            <li className="list-item" key={segment.id}>
              <div>
                <strong>{segment.work_date}</strong>
                <div className="muted">
                  {describeSegment(segment.segment_type)} {formatTime(segment.start_at)} to{" "}
                  {segment.end_at ? formatTime(segment.end_at) : "Now"}
                </div>
              </div>
              <div>
                <span className={`pill ${segment.end_at ? "ok" : "warn"}`}>
                  {segment.end_at
                    ? formatMinutesAsHours(
                        Math.max(
                          0,
                          Math.round(
                            (new Date(segment.end_at).getTime() - new Date(segment.start_at).getTime()) /
                              60000
                          )
                        )
                      )
                    : "In Progress"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </WorkerPageShell>
  );
}
