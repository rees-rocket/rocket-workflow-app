import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/auth/login/actions";
import { assignWorkerForm, saveWorkerForm } from "@/app/admin/forms/actions";
import { isOnboardingForm } from "@/lib/forms-content";
import { WorkerFormPreview } from "@/lib/forms-preview";
import { requireProfile } from "@/lib/auth";
import { getAdminFormsManagerData } from "@/lib/data/forms";

type AdminFormsPageProps = {
  searchParams?: Promise<{ form?: string; assignment?: string }>;
};

export default async function AdminFormsPage({ searchParams }: AdminFormsPageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const data = await getAdminFormsManagerData();
  const selectedForm = data.forms.find((form) => form.id === params.form) ?? null;
  const selectedAssignment = data.assignments.find((assignment) => assignment.id === params.assignment) ?? null;
  const selectedEmergencySubmission =
    selectedAssignment?.parsedSubmission && "emergency_contact_name" in selectedAssignment.parsedSubmission
      ? selectedAssignment.parsedSubmission
      : null;
  const selectedHandbookSubmission =
    selectedAssignment?.parsedSubmission && "handbook_version" in selectedAssignment.parsedSubmission
      ? selectedAssignment.parsedSubmission
      : null;

  return (
    <AppShell
      title="Admin Forms"
      subtitle="Create, assign, and track worker forms"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/workers", label: "Workers" },
        { href: "/admin/time", label: "Time" },
        { href: "/admin/pay", label: "Pay" },
        { href: "/admin/training", label: "Training" },
        { href: "/admin/forms", label: "Forms" }
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
          <div className="eyebrow">Form Builder</div>
          <h2>Create or edit forms</h2>
          <form action={saveWorkerForm} className="stack">
            <input name="form_id" type="hidden" value={selectedForm?.id ?? ""} />
            <label className="field">
              <span>Name</span>
              <input defaultValue={selectedForm?.name ?? ""} name="name" required type="text" />
            </label>
            <label className="field">
              <span>Version label</span>
              <input defaultValue={selectedForm?.version_label ?? ""} name="version_label" type="text" />
            </label>
            <label className="field">
              <span>Short description</span>
              <input defaultValue={selectedForm?.short_description ?? ""} name="short_description" required type="text" />
            </label>
            <label className="field">
              <span>Form content</span>
              <textarea defaultValue={selectedForm?.content_text ?? ""} name="content_text" required rows={8} />
            </label>
            <label className="field">
              <span>Acknowledgment text</span>
              <input
                defaultValue={selectedForm?.acknowledgment_label ?? "I acknowledge and agree to this form."}
                name="acknowledgment_label"
                required
                type="text"
              />
            </label>
            <label className="field">
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input defaultChecked={selectedForm ? selectedForm.is_active : true} name="is_active" type="checkbox" />
                Active form
              </span>
            </label>
            <button className="btn primary" type="submit">
              {selectedForm ? "Update form" : "Save form"}
            </button>
          </form>
        </section>

        <section className="card stack">
          <div className="eyebrow">Assign Forms</div>
          <h2>Assign a form to a worker</h2>
          <form action={assignWorkerForm} className="stack">
            <label className="field">
              <span>Worker</span>
              <select name="worker_id" required>
                <option value="">Select worker</option>
                {data.workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Form</span>
              <select defaultValue={selectedForm?.id ?? ""} name="form_id" required>
                <option value="">Select form</option>
                {data.forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary" type="submit">
              Assign form
            </button>
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Forms</div>
        <h2>Active and inactive forms</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Form</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {data.forms.map((form) => (
                <tr key={form.id}>
                  <td>
                    <strong>{form.name}</strong>
                    <div className="muted">{form.short_description}</div>
                    {form.version_label ? <div className="muted">{form.version_label}</div> : null}
                    {isOnboardingForm(form.form_key) ? <div className="pill">Required for onboarding</div> : null}
                  </td>
                  <td>
                    <span className={form.is_active ? "pill ok" : "pill warn"}>
                      {form.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{form.assignmentCount}</td>
                  <td>{form.completedCount}</td>
                  <td>
                    <div className="button-row">
                      <Link href={`/admin/forms?form=${form.id}`}>Edit</Link>
                      <Link href={`/admin/forms/${form.id}`}>Preview</Link>
                      <Link href={`/admin/forms/${form.id}/print`}>Print</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Form Preview</div>
        <h2>Read the full form from the admin side</h2>
        {selectedForm ? (
          <div className="stack">
            <div className="summary-row">
              <div>
                <strong>{selectedForm.name}</strong>
                <div className="muted">{selectedForm.short_description}</div>
                {selectedForm.version_label ? <div className="muted">{selectedForm.version_label}</div> : null}
                {isOnboardingForm(selectedForm.form_key) ? <div className="pill">Required for onboarding</div> : null}
              </div>
              <span className={selectedForm.is_active ? "pill ok" : "pill warn"}>
                {selectedForm.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <WorkerFormPreview form={selectedForm} />
          </div>
        ) : (
          <p className="muted">Choose a form from the table above to read the full form content here.</p>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Completion Tracking</div>
        <h2>Workers and assigned forms</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Form</th>
                <th>Status</th>
                <th>Guardian</th>
                <th>Submitted</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {data.assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.worker?.full_name ?? assignment.worker_id}</td>
                  <td>
                    {assignment.form?.name ?? assignment.form_id}
                    {assignment.form?.version_label ? <div className="muted">{assignment.form.version_label}</div> : null}
                    {isOnboardingForm(assignment.form?.form_key) ? <div className="pill">Required for onboarding</div> : null}
                  </td>
                  <td>
                    <span className={assignment.status === "completed" ? "pill ok" : "pill warn"}>
                      {assignment.status === "completed" ? "Completed" : "Not Started"}
                    </span>
                  </td>
                  <td>{assignment.submission?.guardian_signature ? "Included" : "No guardian signature"}</td>
                  <td>{assignment.submission?.submitted_at?.slice(0, 10) ?? "Not submitted"}</td>
                  <td>
                    <div className="button-row">
                      <Link href={`/admin/forms?assignment=${assignment.id}`}>View</Link>
                      {assignment.submission ? <Link href={`/admin/forms/submissions/${assignment.id}/print`}>Print</Link> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Submission Detail</div>
        <h2>View submitted form details</h2>
        {selectedAssignment?.submission ? (
          <div className="grid two">
            <div className="screen-frame stack">
              <strong>{selectedAssignment.worker?.full_name ?? selectedAssignment.worker_id}</strong>
              <div className="muted">{selectedAssignment.form?.name ?? selectedAssignment.form_id}</div>
              {selectedAssignment.form?.version_label ? <div className="muted">{selectedAssignment.form.version_label}</div> : null}
              <div className="muted">Submitted {selectedAssignment.submission.submitted_at.slice(0, 10)}</div>
              <div className="muted">Worker signature: {selectedAssignment.submission.typed_signature}</div>
              <div className="muted">Guardian signature: {selectedAssignment.submission.guardian_signature ?? "Not included"}</div>
              <div className="button-row">
                <Link className="btn secondary" href={`/admin/forms/submissions/${selectedAssignment.id}/print`}>
                  Print completed form
                </Link>
              </div>
            </div>
            <div className="screen-frame stack">
              {selectedEmergencySubmission ? (
                <>
                  <strong>Emergency Contact</strong>
                  <div className="muted">{selectedEmergencySubmission.emergency_contact_name ?? "No contact name"}</div>
                  <div className="muted">
                    {selectedEmergencySubmission.emergency_contact_relationship ?? "No relationship"} ·{" "}
                    {selectedEmergencySubmission.emergency_contact_phone ?? "No phone"}
                  </div>
                  {selectedEmergencySubmission.is_minor ? (
                    <>
                      <strong style={{ marginTop: 8 }}>Guardian Details</strong>
                      <div className="muted">{selectedEmergencySubmission.guardian_full_name ?? "No guardian name"}</div>
                      <div className="muted">
                        {selectedEmergencySubmission.guardian_relationship ?? "No relationship"} ·{" "}
                        {selectedEmergencySubmission.guardian_phone ?? "No phone"}
                      </div>
                      <div className="muted">{selectedEmergencySubmission.guardian_email ?? "No guardian email"}</div>
                    </>
                  ) : (
                    <div className="muted">Worker marked themselves as 18 or older.</div>
                  )}
                </>
              ) : selectedHandbookSubmission ? (
                <>
                  <strong>Handbook Acknowledgment</strong>
                  <div className="muted">Signed version: {selectedHandbookSubmission.handbook_version}</div>
                  <div className="muted">Worker: {selectedHandbookSubmission.worker_full_name}</div>
                  {selectedHandbookSubmission.is_minor ? (
                    <>
                      <strong style={{ marginTop: 8 }}>Guardian Details</strong>
                      <div className="muted">{selectedHandbookSubmission.guardian_full_name ?? "No guardian name"}</div>
                      <div className="muted">
                        {selectedHandbookSubmission.guardian_relationship ?? "No relationship"} ·{" "}
                        {selectedHandbookSubmission.guardian_phone ?? "No phone"}
                      </div>
                    </>
                  ) : (
                    <div className="muted">Worker marked themselves as 18 or older.</div>
                  )}
                </>
              ) : (
                <div className="muted">This form does not have extra structured details to display here.</div>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">Choose a submitted assignment to view its details.</p>
        )}
      </section>
    </AppShell>
  );
}
