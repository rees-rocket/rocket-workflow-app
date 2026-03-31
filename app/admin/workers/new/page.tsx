import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { createWorker } from "@/app/admin/workers/actions";
import { AppButton } from "@/components/app-button";

type NewWorkerPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function NewWorkerPage({ searchParams }: NewWorkerPageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};

  return (
    <AdminPageShell title="New Worker" subtitle="Create a worker profile in plain English">
      <section className="card stack">
        <div className="eyebrow">Add Worker</div>
        <h2>Set up a worker before they first sign in</h2>
        <p className="muted">
          Save the worker details now. When they sign in with this email later, the account will
          link automatically.
        </p>
        {params.message ? <div className="pill">{params.message}</div> : null}
        <form action={createWorker} className="stack">
          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input name="full_name" required type="text" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" required type="email" />
            </label>
            <label className="field">
              <span>Role</span>
              <select defaultValue="worker" name="role">
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="field">
              <span>Employee type</span>
              <select defaultValue="employee" name="employee_type">
                <option value="employee">Employee</option>
                <option value="contractor">Contractor</option>
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select defaultValue="active" name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="field">
              <span>Default wage</span>
              <input inputMode="decimal" name="wage_rate" placeholder="18.50" type="text" />
            </label>
            <label className="field">
              <span>Travel wage</span>
              <input inputMode="decimal" name="travel_wage_rate" placeholder="Use default if blank" type="text" />
            </label>
            <label className="field">
              <span>Prep wage</span>
              <input inputMode="decimal" name="prep_wage_rate" placeholder="Use default if blank" type="text" />
            </label>
            <label className="field">
              <span>Service wage</span>
              <input inputMode="decimal" name="service_wage_rate" placeholder="Use default if blank" type="text" />
            </label>
            <label className="field" style={{ alignSelf: "end" }}>
              <span>Tip eligible</span>
              <input name="tip_eligible" style={{ width: 20, height: 20 }} type="checkbox" />
            </label>
          </div>
          <label className="field">
            <span>Notes</span>
            <textarea name="notes" rows={4} />
          </label>
          <div className="button-row">
            <AppButton variant="primary"  type="submit">
              Save worker
            </AppButton>
          </div>
        </form>
      </section>
    </AdminPageShell>
  );
}
