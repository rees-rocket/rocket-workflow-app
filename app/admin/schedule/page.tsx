import Link from "next/link";
import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { deleteShift } from "@/app/admin/schedule/actions";
import { getAdminScheduleCalendar, formatRole, formatShiftStatus } from "@/lib/data/schedule";
import { formatTime } from "@/lib/time";
import { AppButton } from "@/components/app-button";

type Props = {
  searchParams?: Promise<{ message?: string; month?: string; date?: string }>;
};

type CalendarCell = {
  key: string;
  isoDate: string | null;
  label: number | null;
  shiftsCount: number;
  workerCount: number;
  hasDraft: boolean;
  hasPublished: boolean;
  isToday: boolean;
};

function buildCalendar(month: string, shiftsByDate: Awaited<ReturnType<typeof getAdminScheduleCalendar>>["shiftsByDate"]) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const lastDay = new Date(year, monthIndex, 0);
  const startOffset = firstDay.getDay();
  const todayIso = new Date().toISOString().slice(0, 10);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({
      key: `blank-${month}-${i}`,
      isoDate: null,
      label: null,
      shiftsCount: 0,
      workerCount: 0,
      hasDraft: false,
      hasPublished: false,
      isToday: false
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const isoDate = new Date(year, monthIndex - 1, day).toISOString().slice(0, 10);
    const summary = shiftsByDate.get(isoDate);
    cells.push({
      key: isoDate,
      isoDate,
      label: day,
      shiftsCount: summary?.shifts.length ?? 0,
      workerCount: summary?.workerIds.size ?? 0,
      hasDraft: summary?.hasDraft ?? false,
      hasPublished: summary?.hasPublished ?? false,
      isToday: isoDate === todayIso
    });
  }

  return {
    title: firstDay.toLocaleString("en-US", { month: "long", year: "numeric" }),
    cells
  };
}

function getMonthNavigation(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const current = new Date(year, monthIndex - 1, 1);
  const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  const today = new Date();

  return {
    previous: `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`,
    next: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    today: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    todayDate: today.toISOString().slice(0, 10)
  };
}

export default async function AdminSchedulePage({ searchParams }: Props) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const today = new Date();
  const month =
    params.month ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const data = await getAdminScheduleCalendar({ month, selectedDate: params.date });
  const calendar = buildCalendar(month, data.shiftsByDate);
  const navigation = getMonthNavigation(month);

  return (
    <AdminPageShell
      actions={
        <div className="button-row">
          <Link className="btn primary" href={`/admin/schedule/new?date=${data.selectedDate}`}>
            Add Shift
          </Link>
        </div>
      }
      subtitle="Monthly calendar with day-by-day schedule detail"
      title="Schedule"
    >
      {params.message ? <div className="pill" style={{ marginBottom: 16 }}>{params.message}</div> : null}

      <section className="card stack">
        <div className="summary-row">
          <div>
            <div className="eyebrow">Monthly Calendar</div>
            <h2 style={{ margin: "6px 0 0 0" }}>{calendar.title}</h2>
          </div>
          <div className="button-row">
            <Link className="btn secondary" href={`/admin/schedule?month=${navigation.previous}`}>
              Previous
            </Link>
            <Link
              className="btn secondary"
              href={`/admin/schedule?month=${navigation.today}&date=${navigation.todayDate}`}
            >
              Today
            </Link>
            <Link className="btn secondary" href={`/admin/schedule?month=${navigation.next}`}>
              Next
            </Link>
          </div>
        </div>

        <div className="admin-calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="admin-calendar-grid">
          {calendar.cells.map((cell) => {
            return cell.isoDate ? (
              <Link
                className={`admin-calendar-day ${cell.isToday ? "today" : ""} ${cell.isoDate === data.selectedDate ? "selected" : ""} ${cell.shiftsCount > 0 ? "has-shifts" : ""}`}
                href={`/admin/schedule?${new URLSearchParams({ month, date: cell.isoDate }).toString()}`}
                key={cell.key}
              >
                <div className="calendar-day-number">{cell.label}</div>
                {cell.shiftsCount > 0 ? (
                  <div className="calendar-day-summary">
                    <span>{cell.shiftsCount} shifts</span>
                    <span>{cell.workerCount} workers</span>
                    <span className="muted">
                      {cell.hasPublished && cell.hasDraft
                        ? "Draft + published"
                        : cell.hasPublished
                          ? "Published"
                          : "Draft"}
                    </span>
                  </div>
                ) : (
                  <div className="muted">No shifts</div>
                )}
              </Link>
            ) : (
              <div className="admin-calendar-day blank" key={cell.key} />
            );
          })}
        </div>
      </section>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="card stack">
          <div className="summary-row">
            <div>
              <div className="eyebrow">Day Detail</div>
              <h2 style={{ margin: "6px 0 0 0" }}>{data.selectedDate}</h2>
            </div>
            <Link className="btn primary" href={`/admin/schedule/new?date=${data.selectedDate}`}>
              Add Shift
            </Link>
          </div>

          {data.selectedDateShifts.length === 0 ? (
            <div className="screen-frame">
              <strong>No shifts scheduled</strong>
              <p className="muted">Choose Add Shift to create work for this day.</p>
            </div>
          ) : (
            <div className="stack">
              {data.selectedDateShifts.map((shift) => (
                <div className="screen-frame stack" key={shift.id}>
                  <div className="summary-row">
                    <div>
                      <strong>{shift.location_name}</strong>
                      <div className="muted">
                        {formatTime(shift.start_at)} to {formatTime(shift.end_at)} · {formatShiftStatus(shift.status)}
                      </div>
                    </div>
                    <div className="button-row">
                      <Link className="btn secondary" href={`/admin/schedule/${shift.id}`}>
                        Edit Shift
                      </Link>
                      <form action={deleteShift}>
                        <input name="shift_id" type="hidden" value={shift.id} />
                        <AppButton variant="secondary"  type="submit">
                          Delete
                        </AppButton>
                      </form>
                    </div>
                  </div>
                  {shift.notes ? <div className="muted">{shift.notes}</div> : null}
                  <div className="stack">
                    <strong>Assigned workers</strong>
                    {(shift.shift_assignments?.length ?? 0) === 0 ? (
                      <div className="muted">No workers assigned yet.</div>
                    ) : (
                      <ul className="list">
                        {shift.shift_assignments?.map((assignment) => (
                          <li className="list-item" key={assignment.id}>
                            <div>
                              <strong>{assignment.profiles?.full_name ?? assignment.worker_id}</strong>
                              <div className="muted">{formatRole(assignment.role)}</div>
                            </div>
                            <Link href={`/admin/schedule/${shift.id}`}>Manage</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="eyebrow">Pending Trades</div>
          <h2>Requests waiting on admin approval</h2>
          {data.pendingTrades.length === 0 ? (
            <p className="muted">No pending trade requests right now.</p>
          ) : (
            <ul className="list">
              {data.pendingTrades.map((trade) => (
                <li className="list-item" key={trade.id}>
                  <div>
                    <strong>{trade.request_type === "trade" ? "Trade request" : "Release request"}</strong>
                    <div className="muted">
                      Requested by {trade.requested_by?.full_name ?? "Worker"}
                      {trade.target?.full_name ? ` for ${trade.target.full_name}` : ""}
                    </div>
                  </div>
                  <div>
                    <Link href={`/admin/schedule/${trade.shift_assignments?.shift_id}`}>Review</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
