import { AppShell } from "@/components/app-shell";
import { AdminShiftForm } from "@/components/admin-shift-form";
import { requireProfile } from "@/lib/auth";
import { getShiftDetail, getEffectivePayRate, formatRole, formatShiftStatus } from "@/lib/data/schedule";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { createClient } from "@/lib/supabase/server";
import {
  approveTradeRequest,
  denyTradeRequest,
  updateShift
} from "@/app/admin/schedule/actions";
import { signOut } from "@/app/auth/login/actions";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function ShiftDetailPage({ params, searchParams }: Props) {
  await requireProfile("admin");
  const { id } = await params;
  const supabase = await createClient();
  const [detail, pendingWorkers] = await Promise.all([
    getShiftDetail(id),
    supabase
      .from("pending_worker_profiles")
      .select("id, full_name, email")
      .order("full_name")
  ]);
  const query = (await searchParams) ?? {};

  if (!detail.shift) {
    notFound();
  }

  const shift = detail.shift;

  return (
    <AppShell
      title="Shift Detail"
      subtitle="Manage shift details, assignments, and trade approvals"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/schedule", label: "Schedule" },
        { href: `/admin/schedule/${id}`, label: "Shift" }
      ]}
      actions={
        <form action={signOut}>
          <button className="btn secondary" type="submit">
            Sign out
          </button>
        </form>
      }
    >
      {query.message ? <div className="pill" style={{ marginBottom: 16 }}>{query.message}</div> : null}
      <div className="pill" style={{ marginBottom: 16 }}>{formatShiftStatus(shift.status)}</div>
      {(pendingWorkers.data?.length ?? 0) > 0 ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Pending Workers</div>
          <h2>Not ready for shift assignment yet</h2>
          <p className="muted">
            Pending workers do not appear in assignment dropdowns until they sign in once and move
            from pending setup into a live worker profile.
          </p>
          <div className="muted">
            {pendingWorkers.data?.map((worker) => `${worker.full_name} (${worker.email})`).join(", ")}
          </div>
        </div>
      ) : null}

      <AdminShiftForm
        action={updateShift}
        initialAssignments={detail.assignments}
        shift={shift}
        submitLabel="Save shift"
        workers={detail.workers}
      />

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Assignments</div>
        <h2>Current assigned workers</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Role</th>
                <th>Effective Pay</th>
              </tr>
            </thead>
            <tbody>
              {detail.assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.profiles?.full_name ?? assignment.worker_id}</td>
                  <td>{formatRole(assignment.role)}</td>
                  <td>{formatCurrencyFromCents(getEffectivePayRate(assignment))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Trade Requests</div>
        <h2>Admin approval required</h2>
        {detail.tradeRequests.length === 0 ? (
          <p className="muted">No trade requests for this shift yet.</p>
        ) : (
          <ul className="list">
            {detail.tradeRequests.map((trade) => (
              <li className="list-item" key={trade.id}>
                <div>
                  <strong>{trade.request_type === "trade" ? "Trade request" : "Release request"}</strong>
                  <div className="muted">
                    From {trade.requested_by?.full_name ?? "Worker"}
                    {trade.target?.full_name ? ` to ${trade.target.full_name}` : ""}
                    {trade.reason ? ` · ${trade.reason}` : ""}
                  </div>
                </div>
                <div className="button-row">
                  {trade.status === "pending" ? (
                    <>
                      <form action={approveTradeRequest}>
                        <input name="trade_id" type="hidden" value={trade.id} />
                        <input name="shift_id" type="hidden" value={shift.id} />
                        {!trade.target_worker_id ? (
                          <select defaultValue="" name="replacement_worker_id">
                            <option value="">Choose replacement</option>
                            {detail.workers
                              .filter((worker) => !detail.assignments.some((assignment) => assignment.worker_id === worker.id))
                              .map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                  {worker.full_name}
                                </option>
                              ))}
                          </select>
                        ) : null}
                        <button
                          className="btn primary"
                          type="submit"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={denyTradeRequest}>
                        <input name="trade_id" type="hidden" value={trade.id} />
                        <input name="shift_id" type="hidden" value={shift.id} />
                        <button className="btn secondary" type="submit">
                          Deny
                        </button>
                      </form>
                    </>
                  ) : (
                    <span className="pill">{trade.status}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
