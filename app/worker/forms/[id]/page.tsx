import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { submitWorkerForm } from "@/app/worker/forms/actions";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getWorkerFormDetail } from "@/lib/data/forms";
import { AppButton } from "@/components/app-button";
import {
  CONTRACTOR_ACK_TEXT,
  CONTRACTOR_AGREEMENT_INTRO,
  CONTRACTOR_AGREEMENT_SECTIONS,
  CONTRACTOR_AGREEMENT_TITLE,
  CONTRACTOR_GUARDIAN_TEXT,
  EMPLOYEE_HANDBOOK_ACK_TEXT,
  EMPLOYEE_HANDBOOK_FORM_KEY,
  EMPLOYEE_HANDBOOK_GUARDIAN_TEXT,
  EMPLOYEE_HANDBOOK_SECTIONS,
  EMPLOYEE_HANDBOOK_TITLE,
  EMPLOYEE_HANDBOOK_VERSION,
  EMERGENCY_CONTACT_SAFETY_GUARDIAN_FORM_KEY,
  GUARDIAN_TEXT,
  INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY,
  INCIDENT_REPORTING_TEXT,
  SAFETY_TEXT,
  SAFE_WORK_BEHAVIOR_TEXT,
  W9_FORM_KEY,
  W9_FORM_PDF_PATH,
  WORKER_ACK_TEXT
} from "@/lib/forms-content";

export default async function WorkerFormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireProfile("worker");
  const { id } = await params;
  const data = await getWorkerFormDetail(profile.id, id);

  if (!data) notFound();

  const isEmergencyForm = data.form.form_key === EMERGENCY_CONTACT_SAFETY_GUARDIAN_FORM_KEY;
  const isContractorAgreementForm = data.form.form_key === INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY;
  const isW9Form = data.form.form_key === W9_FORM_KEY;
  const isHandbookForm = data.form.form_key === EMPLOYEE_HANDBOOK_FORM_KEY;
  const emergencySubmission =
    data.parsedSubmission && "emergency_contact_name" in data.parsedSubmission ? data.parsedSubmission : null;
  const handbookSubmission =
    data.parsedSubmission && "handbook_version" in data.parsedSubmission ? data.parsedSubmission : null;

  return (
    <AppShell
      title="Worker Form"
      subtitle="Complete and submit your assigned form"
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
          <AppButton variant="secondary"  type="submit">
            Sign out
          </AppButton>
        </form>
      }
    >
      <section className="card stack">
        <div className="summary-row">
          <div>
            <div className="eyebrow">Assigned Form</div>
            <h2>{data.form.name}</h2>
          </div>
          <span className={data.assignment.status === "completed" ? "pill ok" : "pill warn"}>
            {data.assignment.status === "completed" ? "Completed" : "Not Started"}
          </span>
        </div>
        <p className="muted">{data.form.short_description}</p>

        {data.assignment.status === "completed" && data.submission ? (
          <section className="card stack">
            <div className="eyebrow">Completed Form</div>
            <p className="muted">
              Submitted {data.submission.submitted_at.slice(0, 10)} with worker signature {data.submission.typed_signature}.
            </p>
            {data.submission.guardian_signature ? (
              <p className="muted">Guardian signature included: {data.submission.guardian_signature}</p>
            ) : null}
            {emergencySubmission ? (
              <div className="screen-frame">
                <div className="muted">Emergency contact</div>
                <strong>{emergencySubmission.emergency_contact_name}</strong>
                <div className="muted">
                  {emergencySubmission.emergency_contact_relationship} · {emergencySubmission.emergency_contact_phone}
                </div>
              </div>
            ) : handbookSubmission ? (
              <div className="screen-frame stack">
                <div className="muted">{handbookSubmission.handbook_version}</div>
                <strong>{handbookSubmission.worker_full_name}</strong>
                <div className="muted">Handbook acknowledgment saved.</div>
                {handbookSubmission.is_minor ? (
                  <div className="muted">Guardian included: {handbookSubmission.guardian_full_name ?? "Yes"}</div>
                ) : null}
              </div>
            ) : null}
            <div className="button-row">
              <Link className="btn secondary" href="/worker/forms">
                Back to forms
              </Link>
            </div>
          </section>
        ) : isW9Form ? (
          <section className="stack">
            <div className="eyebrow">Printable Tax Form</div>
            <div className="screen-frame stack">
              <strong>Official IRS Form W-9</strong>
              <p className="muted" style={{ margin: 0 }}>
                This is the exact government PDF. Open it in a new tab to print it and fill it out by hand or with your PDF tools.
              </p>
              <div className="button-row">
                <a className="btn primary" href={W9_FORM_PDF_PATH} rel="noreferrer" target="_blank">
                  Open exact PDF
                </a>
                <a className="btn secondary" download href={W9_FORM_PDF_PATH}>
                  Download PDF
                </a>
              </div>
            </div>
            <section className="pdf-frame">
              <iframe src={W9_FORM_PDF_PATH} title="Form W-9 PDF preview" />
            </section>
            <p className="muted">
              After you print and complete this form, return it to your manager. This form is not submitted digitally through the portal.
            </p>
            <div className="button-row">
              <Link className="btn secondary" href="/worker/forms">
                Back to forms
              </Link>
            </div>
          </section>
        ) : isHandbookForm ? (
          <form action={submitWorkerForm} className="stack">
            <input name="assignment_id" type="hidden" value={data.assignment.id} />
            <input name="form_id" type="hidden" value={data.form.id} />
            <input name="form_key" type="hidden" value={data.form.form_key ?? ""} />
            <input name="handbook_version" type="hidden" value={data.form.version_label ?? EMPLOYEE_HANDBOOK_VERSION} />

            <section className="stack">
              <div className="eyebrow">{data.form.version_label ?? EMPLOYEE_HANDBOOK_VERSION}</div>
              <h3 style={{ margin: 0 }}>{EMPLOYEE_HANDBOOK_TITLE}</h3>
              <div className="document-frame stack">
                {EMPLOYEE_HANDBOOK_SECTIONS.map((section) => (
                  <div key={section.heading} className="stack" style={{ gap: 8 }}>
                    <strong>{section.heading}</strong>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Acknowledgment</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{EMPLOYEE_HANDBOOK_ACK_TEXT}</p>
              </div>
              <label className="field">
                <span>Worker full name</span>
                <input defaultValue={profile.full_name} name="worker_full_name" required type="text" />
              </label>
              <label className="field">
                <span>Are you under 18?</span>
                <select defaultValue="no" name="is_minor">
                  <option value="no">No, I am 18 or older</option>
                  <option value="yes">Yes, I am under 18</option>
                </select>
              </label>
              <label className="field">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input name="acknowledged" required type="checkbox" />
                  {data.form.acknowledgment_label}
                </span>
              </label>
              <div className="signature-block">
                <div className="signature-heading">Worker Signature</div>
                <div className="signature-help">Type your full legal name as your signature.</div>
                <label className="field">
                  <span>Typed full name</span>
                  <input className="signature-input" defaultValue={profile.full_name} name="typed_signature" required type="text" />
                </label>
                <div className="signature-meta">
                  <span className="signature-line">Worker Signature</span>
                  <span className="signature-line">Date submitted automatically</span>
                </div>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Parent / Legal Guardian</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{EMPLOYEE_HANDBOOK_GUARDIAN_TEXT}</p>
              </div>
              <p className="muted">Complete this section only if the worker is under 18.</p>
              <div className="form-grid">
                <label className="field">
                  <span>Parent/Guardian Full Name</span>
                  <input name="guardian_full_name" type="text" />
                </label>
                <label className="field">
                  <span>Relationship</span>
                  <input name="guardian_relationship" type="text" />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input name="guardian_phone" type="tel" />
                </label>
              </div>
              <div className="signature-block">
                <div className="signature-heading">Parent / Guardian Signature</div>
                <div className="signature-help">
                  Required only when the worker is under 18. Type the parent or guardian full name as the signature.
                </div>
                <label className="field">
                  <span>Typed full name</span>
                  <input className="signature-input" name="guardian_signature" type="text" />
                </label>
                <div className="signature-meta">
                  <span className="signature-line">Parent / Guardian Signature</span>
                  <span className="signature-line">Date submitted automatically</span>
                </div>
              </div>
            </section>

            <AppButton variant="primary"  type="submit">
              Submit acknowledgment
            </AppButton>
          </form>
        ) : isEmergencyForm ? (
          <form action={submitWorkerForm} className="stack">
            <input name="assignment_id" type="hidden" value={data.assignment.id} />
            <input name="form_id" type="hidden" value={data.form.id} />
            <input name="form_key" type="hidden" value={data.form.form_key ?? ""} />

            <section className="stack">
              <div className="eyebrow">Section 1</div>
              <h3 style={{ margin: 0 }}>Worker Information</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Full Name</span>
                  <input defaultValue={profile.full_name} name="worker_full_name" required type="text" />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input name="worker_phone" required type="tel" />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input defaultValue={profile.email} name="worker_email" required type="email" />
                </label>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Section 2</div>
              <h3 style={{ margin: 0 }}>Emergency Contact</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Emergency Contact Name</span>
                  <input name="emergency_contact_name" required type="text" />
                </label>
                <label className="field">
                  <span>Relationship</span>
                  <input name="emergency_contact_relationship" required type="text" />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input name="emergency_contact_phone" required type="tel" />
                </label>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Safety Acknowledgment</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{SAFETY_TEXT}</p>
              </div>
              <label className="field">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input name="safe_work_acknowledged" required type="checkbox" />
                  I understand and agree to follow these safety expectations.
                </span>
              </label>
            </section>

            <section className="stack">
              <div className="eyebrow">Safe Work Behavior</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{SAFE_WORK_BEHAVIOR_TEXT}</p>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Injury and Incident Reporting</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{INCIDENT_REPORTING_TEXT}</p>
              </div>
              <label className="field">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input name="incident_reporting_acknowledged" required type="checkbox" />
                  I understand that I must report injuries, accidents, and unsafe conditions immediately.
                </span>
              </label>
            </section>

            <section className="stack">
              <div className="eyebrow">Worker Signature</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{WORKER_ACK_TEXT}</p>
              </div>
              <label className="field">
                <span>Are you under 18?</span>
                <select defaultValue="no" name="is_minor">
                  <option value="no">No, I am 18 or older</option>
                  <option value="yes">Yes, I am under 18</option>
                </select>
              </label>
              <label className="field">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input name="acknowledged" required type="checkbox" />
                  {data.form.acknowledgment_label}
                </span>
              </label>
              <div className="signature-block">
                <div className="signature-heading">Worker Signature</div>
                <div className="signature-help">Type your full legal name as your signature.</div>
                <label className="field">
                  <span>Typed full name</span>
                  <input className="signature-input" defaultValue={profile.full_name} name="typed_signature" required type="text" />
                </label>
                <div className="signature-meta">
                  <span className="signature-line">Signature</span>
                  <span className="signature-line">Date submitted automatically</span>
                </div>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Parent / Legal Guardian</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{GUARDIAN_TEXT}</p>
              </div>
              <p className="muted">
                Complete this section only if the worker is under 18. If you selected "Yes" above, all fields below are required.
              </p>
              <div className="form-grid">
                <label className="field">
                  <span>Parent/Guardian Full Name</span>
                  <input name="guardian_full_name" type="text" />
                </label>
                <label className="field">
                  <span>Relationship to Worker</span>
                  <input name="guardian_relationship" type="text" />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input name="guardian_phone" type="tel" />
                </label>
                <label className="field">
                  <span>Email (optional)</span>
                  <input name="guardian_email" type="email" />
                </label>
              </div>
              <div className="signature-block">
                <div className="signature-heading">Parent / Guardian Signature</div>
                <div className="signature-help">
                  Required only when the worker is under 18. Type the parent or guardian full name as the signature.
                </div>
                <label className="field">
                  <span>Typed full name</span>
                  <input className="signature-input" name="guardian_signature" type="text" />
                </label>
                <div className="signature-meta">
                  <span className="signature-line">Parent / Guardian Signature</span>
                  <span className="signature-line">Date submitted automatically</span>
                </div>
              </div>
            </section>

            <AppButton variant="primary"  type="submit">
              Submit form
            </AppButton>
          </form>
        ) : isContractorAgreementForm ? (
          <form action={submitWorkerForm} className="stack">
            <input name="assignment_id" type="hidden" value={data.assignment.id} />
            <input name="form_id" type="hidden" value={data.form.id} />
            <input name="form_key" type="hidden" value={data.form.form_key ?? ""} />

            <section className="stack">
              <div className="eyebrow">Agreement</div>
              <h3 style={{ margin: 0 }}>{CONTRACTOR_AGREEMENT_TITLE}</h3>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_AGREEMENT_INTRO}</p>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Contractor Details</div>
              <div className="form-grid">
                <label className="field">
                  <span>Contractor full legal name</span>
                  <input defaultValue={profile.full_name} name="contractor_full_name" required type="text" />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input defaultValue={profile.email} name="contractor_email" required type="email" />
                </label>
                <label className="field">
                  <span>Effective date</span>
                  <input defaultValue={new Date().toISOString().slice(0, 10)} name="agreement_effective_date" required type="date" />
                </label>
              </div>
            </section>

            {CONTRACTOR_AGREEMENT_SECTIONS.map((section) => (
              <section key={section.heading} className="stack">
                <div className="eyebrow">{section.heading}</div>
                <div className="screen-frame">
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{section.body}</p>
                </div>
              </section>
            ))}

            <section className="stack">
              <div className="eyebrow">Contractor Signature</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_ACK_TEXT}</p>
              </div>
              <label className="field">
                <span>Are you under 18?</span>
                <select defaultValue="no" name="is_minor">
                  <option value="no">No, I am 18 or older</option>
                  <option value="yes">Yes, I am under 18</option>
                </select>
              </label>
              <label className="field">
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input name="acknowledged" required type="checkbox" />
                  I acknowledge that I have read and agree to this Independent Contractor Agreement.
                </span>
              </label>
              <div className="signature-block">
                <div className="signature-heading">Contractor Signature</div>
                <div className="signature-help">Type your full legal name as your signature.</div>
                <label className="field">
                  <span>Typed full name</span>
                  <input className="signature-input" defaultValue={profile.full_name} name="typed_signature" required type="text" />
                </label>
                <div className="signature-meta">
                  <span className="signature-line">Contractor Signature</span>
                  <span className="signature-line">Date submitted automatically</span>
                </div>
              </div>
            </section>

            <section className="stack">
              <div className="eyebrow">Parent / Legal Guardian</div>
              <div className="screen-frame">
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_GUARDIAN_TEXT}</p>
              </div>
              <p className="muted">Complete this section only if the contractor is under 18.</p>
              <div className="form-grid">
                <label className="field">
                  <span>Parent/Guardian Full Name</span>
                  <input name="guardian_full_name" type="text" />
                </label>
              </div>
              <div className="signature-block">
                <div className="signature-heading">Parent / Guardian Signature</div>
                <div className="signature-help">
                  Required only when the contractor is under 18. Type the parent or guardian full name as the signature.
                </div>
                <label className="field">
                  <span>Typed full name</span>
                  <input className="signature-input" name="guardian_signature" type="text" />
                </label>
                <div className="signature-meta">
                  <span className="signature-line">Parent / Guardian Signature</span>
                  <span className="signature-line">Date submitted automatically</span>
                </div>
              </div>
            </section>

            <AppButton variant="primary"  type="submit">
              Submit agreement
            </AppButton>
          </form>
        ) : (
          <form action={submitWorkerForm} className="stack">
            <input name="assignment_id" type="hidden" value={data.assignment.id} />
            <input name="form_id" type="hidden" value={data.form.id} />
            <input name="form_key" type="hidden" value={data.form.form_key ?? ""} />
            <div className="screen-frame">
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.form.content_text}</p>
            </div>
            <label className="field">
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input name="acknowledged" required type="checkbox" />
                {data.form.acknowledgment_label}
              </span>
            </label>
            <div className="signature-block">
              <div className="signature-heading">Signature</div>
              <div className="signature-help">Type your full legal name as your signature.</div>
              <label className="field">
                <span>Typed full name</span>
                <input className="signature-input" defaultValue={profile.full_name} name="typed_signature" required type="text" />
              </label>
              <div className="signature-meta">
                <span className="signature-line">Signature</span>
                <span className="signature-line">Date submitted automatically</span>
              </div>
            </div>
            <AppButton variant="primary"  type="submit">
              Submit form
            </AppButton>
          </form>
        )}
      </section>
    </AppShell>
  );
}
