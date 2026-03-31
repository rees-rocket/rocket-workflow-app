import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { getAdminTimeData, getWorkerList } from "@/lib/data/time";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { describeBatchPaidStatus, formatMinutesAsHours } from "@/lib/time";

export default async function AdminPage() {
  await requireProfile("admin");
  const [workers, timeData] = await Promise.all([getWorkerList(), getAdminTimeData({})]);
  const activeDays = timeData.days.filter((day) => day.status !== "off_clock").length;
  const paidDays = timeData.days.filter((day) => day.pay_period?.status === "paid").length;

  return (
    <AdminPageShell title="Dashboard" subtitle="Desktop-friendly controls with live data">
      <div className="grid three">
        <section className="card metric">
          <span className="eyebrow">Workers</span>
          <strong>{workers.length}</strong>
          <span className="muted">Active and inactive worker accounts</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Active Days</span>
          <strong>{activeDays}</strong>
          <span className="muted">Workers currently clocked in or on break</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Tracked Days</span>
          <strong>{timeData.days.length}</strong>
          <span className="muted">Live daily records in Supabase</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Paid in Periods</span>
          <strong>{paidDays}</strong>
          <span className="muted">Daily records included in paid batches</span>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Workers</div>
        <h3>Manage status and wage rate</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Wage Rate</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.full_name}</td>
                  <td>{worker.email}</td>
                  <td>{worker.status}</td>
                  <td>{formatCurrencyFromCents(worker.wage_rate_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Recent Daily Totals</div>
        <h3>Live records for payroll review</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Date</th>
                <th>Worked</th>
                <th>Break</th>
                <th>Payable</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {timeData.days.slice(0, 8).map((day) => (
                <tr key={day.id}>
                  <td>{day.profile?.full_name ?? day.worker_id}</td>
                  <td>{day.work_date}</td>
                  <td>{formatMinutesAsHours(day.total_work_minutes)}</td>
                  <td>{formatMinutesAsHours(day.total_break_minutes)}</td>
                  <td>{formatMinutesAsHours(day.total_payable_minutes)}</td>
                  <td>{describeBatchPaidStatus(day.pay_period?.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}
