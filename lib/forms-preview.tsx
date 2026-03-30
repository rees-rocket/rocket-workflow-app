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
  INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY,
  GUARDIAN_TEXT,
  INCIDENT_REPORTING_TEXT,
  SAFETY_TEXT,
  SAFE_WORK_BEHAVIOR_TEXT,
  W9_FORM_KEY,
  W9_FORM_PDF_PATH,
  WORKER_ACK_TEXT
} from "@/lib/forms-content";
import type { WorkerFormRow } from "@/lib/types";
import type {
  EmployeeHandbookAcknowledgmentSubmission,
  EmergencyContactSafetyGuardianSubmission,
  IndependentContractorAgreementSubmission,
  WorkerFormParsedSubmission
} from "@/lib/data/forms";

function isEmergencySubmission(
  submission: WorkerFormParsedSubmission | null
): submission is EmergencyContactSafetyGuardianSubmission {
  return Boolean(submission && "emergency_contact_name" in submission);
}

function isContractorSubmission(
  submission: WorkerFormParsedSubmission | null
): submission is IndependentContractorAgreementSubmission {
  return Boolean(submission && "agreement_effective_date" in submission);
}

function isHandbookSubmission(
  submission: WorkerFormParsedSubmission | null
): submission is EmployeeHandbookAcknowledgmentSubmission {
  return Boolean(submission && "handbook_version" in submission);
}

export function WorkerFormPreview({ form }: { form: WorkerFormRow }) {
  const isEmergencyForm = form.form_key === EMERGENCY_CONTACT_SAFETY_GUARDIAN_FORM_KEY;
  const isContractorForm = form.form_key === INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY;
  const isW9Form = form.form_key === W9_FORM_KEY;
  const isHandbookForm = form.form_key === EMPLOYEE_HANDBOOK_FORM_KEY;

  if (isW9Form) {
    return (
      <div className="stack">
        <section className="screen-frame stack">
          <div className="eyebrow">Government Form</div>
          <strong>Official IRS Form W-9</strong>
          <p className="muted" style={{ margin: 0 }}>
            This uses the exact PDF form provided. Open it in a new tab to print or save it without altering the government form.
          </p>
          <div className="button-row">
            <a className="btn secondary" href={W9_FORM_PDF_PATH} rel="noreferrer" target="_blank">
              Open exact PDF
            </a>
            <a className="btn secondary" download href={W9_FORM_PDF_PATH}>
              Download PDF
            </a>
          </div>
        </section>
        <section className="pdf-frame">
          <iframe src={W9_FORM_PDF_PATH} title="Form W-9 PDF preview" />
        </section>
      </div>
    );
  }

  if (isHandbookForm) {
    return (
      <div className="stack">
        <section className="screen-frame stack">
          <div className="eyebrow">{form.version_label ?? EMPLOYEE_HANDBOOK_VERSION}</div>
          <strong>{EMPLOYEE_HANDBOOK_TITLE}</strong>
        </section>
        <section className="document-frame stack">
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
        </section>
        <section className="screen-frame stack">
          <div className="eyebrow">Acknowledgment</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{EMPLOYEE_HANDBOOK_ACK_TEXT}</p>
          <div className="signature-block preview">
            <div className="signature-heading">Worker Signature</div>
            <div className="signature-help">Typed full legal name</div>
            <div className="signature-meta">
              <span className="signature-line">Worker Signature</span>
              <span className="signature-line">Date</span>
            </div>
          </div>
        </section>
        <section className="screen-frame stack">
          <div className="eyebrow">Guardian for Minor Worker</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{EMPLOYEE_HANDBOOK_GUARDIAN_TEXT}</p>
          <div className="signature-block preview">
            <div className="signature-heading">Parent / Guardian Signature</div>
            <div className="signature-help">Typed full legal name</div>
            <div className="signature-meta">
              <span className="signature-line">Parent / Guardian Signature</span>
              <span className="signature-line">Date</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!isEmergencyForm && !isContractorForm) {
    return (
      <div className="screen-frame stack">
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{form.content_text}</p>
        <div className="muted">Acknowledgment text: {form.acknowledgment_label}</div>
      </div>
    );
  }

  if (isContractorForm) {
    return (
      <div className="stack">
        <section className="screen-frame stack">
          <div className="eyebrow">Agreement</div>
          <strong>{CONTRACTOR_AGREEMENT_TITLE}</strong>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_AGREEMENT_INTRO}</p>
        </section>

        <section className="screen-frame stack">
          <div className="eyebrow">Contractor Details</div>
          <strong>Contractor Information</strong>
          <div className="muted">Full legal name, email, and effective date</div>
        </section>

        {CONTRACTOR_AGREEMENT_SECTIONS.map((section) => (
          <section key={section.heading} className="screen-frame stack">
            <div className="eyebrow">{section.heading}</div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{section.body}</p>
          </section>
        ))}

        <section className="screen-frame stack">
          <div className="eyebrow">Contractor Acknowledgment and Signature</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_ACK_TEXT}</p>
          <div className="signature-block preview">
            <div className="signature-heading">Contractor Signature</div>
            <div className="signature-help">Typed full legal name</div>
            <div className="signature-meta">
              <span className="signature-line">Contractor Signature</span>
              <span className="signature-line">Date</span>
            </div>
          </div>
        </section>

        <section className="screen-frame stack">
          <div className="eyebrow">Guardian for Minor Contractor</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_GUARDIAN_TEXT}</p>
          <div className="signature-block preview">
            <div className="signature-heading">Parent / Guardian Signature</div>
            <div className="signature-help">Typed full legal name</div>
            <div className="signature-meta">
              <span className="signature-line">Parent / Guardian Signature</span>
              <span className="signature-line">Date</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="screen-frame stack">
        <div className="eyebrow">Section 1</div>
        <strong>Worker Information</strong>
        <div className="muted">Full Name, Phone Number, Email</div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Section 2</div>
        <strong>Emergency Contact</strong>
        <div className="muted">Emergency Contact Name, Relationship, Phone Number</div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Safety Acknowledgment</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{SAFETY_TEXT}</p>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Safe Work Behavior</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{SAFE_WORK_BEHAVIOR_TEXT}</p>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Injury and Incident Reporting</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{INCIDENT_REPORTING_TEXT}</p>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Worker Acknowledgment and Signature</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{WORKER_ACK_TEXT}</p>
        <div className="signature-block preview">
          <div className="signature-heading">Worker Signature</div>
          <div className="signature-help">Typed full legal name</div>
          <div className="signature-meta">
            <span className="signature-line">Worker Signature</span>
            <span className="signature-line">Date</span>
          </div>
        </div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Parent / Legal Guardian for Minors</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{GUARDIAN_TEXT}</p>
        <div className="muted">
          Required only if the worker marks themselves as under 18. Includes guardian full name, relationship, phone
          number, optional email, signature, and date.
        </div>
        <div className="signature-block preview">
          <div className="signature-heading">Parent / Guardian Signature</div>
          <div className="signature-help">Typed full legal name</div>
          <div className="signature-meta">
            <span className="signature-line">Parent / Guardian Signature</span>
            <span className="signature-line">Date</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function WorkerFormSubmissionPreview({
  form,
  workerName,
  submission,
  workerSignature,
  workerSignedAt,
  guardianSignature,
  guardianSignedAt
}: {
  form: WorkerFormRow;
  workerName: string;
  submission: WorkerFormParsedSubmission | null;
  workerSignature: string;
  workerSignedAt: string;
  guardianSignature: string | null;
  guardianSignedAt: string | null;
}) {
  const isEmergencyForm = form.form_key === EMERGENCY_CONTACT_SAFETY_GUARDIAN_FORM_KEY;

  if (form.form_key === INDEPENDENT_CONTRACTOR_AGREEMENT_FORM_KEY && isContractorSubmission(submission)) {
    return (
      <div className="stack">
        <section className="screen-frame stack">
          <div className="eyebrow">Agreement</div>
          <strong>{CONTRACTOR_AGREEMENT_TITLE}</strong>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_AGREEMENT_INTRO}</p>
        </section>

        <section className="screen-frame stack">
          <div className="eyebrow">Contractor Details</div>
          <div>{submission.contractor_full_name || workerName}</div>
          <div className="muted">{submission.contractor_email}</div>
          <div className="muted">Effective date: {submission.agreement_effective_date}</div>
        </section>

        {CONTRACTOR_AGREEMENT_SECTIONS.map((section) => (
          <section key={section.heading} className="screen-frame stack">
            <div className="eyebrow">{section.heading}</div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{section.body}</p>
          </section>
        ))}

        <section className="screen-frame stack">
          <div className="eyebrow">Contractor Acknowledgment and Signature</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_ACK_TEXT}</p>
          <div className="signature-block preview">
            <div className="signature-heading">Contractor Signature</div>
            <div className="signature-help">{workerSignature}</div>
            <div className="signature-meta">
              <span className="signature-line">Signed {workerSignedAt.slice(0, 10)}</span>
            </div>
          </div>
        </section>

        {submission.is_minor ? (
          <section className="screen-frame stack">
            <div className="eyebrow">Guardian for Minor Contractor</div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{CONTRACTOR_GUARDIAN_TEXT}</p>
            <div>{submission.guardian_full_name ?? "No guardian name"}</div>
            <div className="signature-block preview">
              <div className="signature-heading">Parent / Guardian Signature</div>
              <div className="signature-help">{guardianSignature ?? "No signature"}</div>
              <div className="signature-meta">
                <span className="signature-line">
                  {guardianSignedAt ? `Signed ${guardianSignedAt.slice(0, 10)}` : "No signed date"}
                </span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  if (form.form_key === W9_FORM_KEY) {
    return (
      <div className="stack">
        <section className="screen-frame stack">
          <div className="eyebrow">Government Form</div>
          <strong>Official IRS Form W-9</strong>
          <p className="muted" style={{ margin: 0 }}>
            This record uses the exact government PDF. Print the document from the PDF view and keep the completed copy with your records.
          </p>
          <div className="button-row">
            <a className="btn secondary" href={W9_FORM_PDF_PATH} rel="noreferrer" target="_blank">
              Open exact PDF
            </a>
            <a className="btn secondary" download href={W9_FORM_PDF_PATH}>
              Download PDF
            </a>
          </div>
        </section>
        <section className="pdf-frame">
          <iframe src={W9_FORM_PDF_PATH} title="Form W-9 PDF preview" />
        </section>
      </div>
    );
  }

  if (form.form_key === EMPLOYEE_HANDBOOK_FORM_KEY && isHandbookSubmission(submission)) {
    return (
      <div className="stack">
        <section className="screen-frame stack">
          <div className="eyebrow">{submission.handbook_version}</div>
          <strong>{EMPLOYEE_HANDBOOK_TITLE}</strong>
          <div className="muted">{submission.worker_full_name || workerName}</div>
        </section>
        <section className="document-frame stack">
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
        </section>
        <section className="screen-frame stack">
          <div className="eyebrow">Acknowledgment</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{EMPLOYEE_HANDBOOK_ACK_TEXT}</p>
          <div className="signature-block preview">
            <div className="signature-heading">Worker Signature</div>
            <div className="signature-help">{workerSignature}</div>
            <div className="signature-meta">
              <span className="signature-line">Signed {workerSignedAt.slice(0, 10)}</span>
            </div>
          </div>
        </section>
        {submission.is_minor ? (
          <section className="screen-frame stack">
            <div className="eyebrow">Guardian for Minor Worker</div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{EMPLOYEE_HANDBOOK_GUARDIAN_TEXT}</p>
            <div>{submission.guardian_full_name ?? "No guardian name"}</div>
            <div className="muted">{submission.guardian_relationship ?? "No relationship"}</div>
            <div className="muted">{submission.guardian_phone ?? "No phone"}</div>
            <div className="signature-block preview">
              <div className="signature-heading">Parent / Guardian Signature</div>
              <div className="signature-help">{guardianSignature ?? "No signature"}</div>
              <div className="signature-meta">
                <span className="signature-line">
                  {guardianSignedAt ? `Signed ${guardianSignedAt.slice(0, 10)}` : "No signed date"}
                </span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  if (!isEmergencyForm || !isEmergencySubmission(submission)) {
    return (
      <div className="stack">
        <div className="screen-frame">
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{form.content_text}</p>
        </div>
        <div className="signature-block preview">
          <div className="signature-heading">Worker Signature</div>
          <div className="signature-help">{workerSignature}</div>
          <div className="signature-meta">
            <span className="signature-line">Signed {workerSignedAt.slice(0, 10)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="screen-frame stack">
        <div className="eyebrow">Section 1</div>
        <strong>Worker Information</strong>
        <div>{submission.worker_full_name || workerName}</div>
        <div className="muted">{submission.worker_phone}</div>
        <div className="muted">{submission.worker_email}</div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Section 2</div>
        <strong>Emergency Contact</strong>
        <div>{submission.emergency_contact_name}</div>
        <div className="muted">{submission.emergency_contact_relationship}</div>
        <div className="muted">{submission.emergency_contact_phone}</div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Safety Acknowledgment</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{SAFETY_TEXT}</p>
        <div className="muted">
          Worker acknowledgment: {submission.safe_work_acknowledged ? "Accepted" : "Not accepted"}
        </div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Safe Work Behavior</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{SAFE_WORK_BEHAVIOR_TEXT}</p>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Injury and Incident Reporting</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{INCIDENT_REPORTING_TEXT}</p>
        <div className="muted">
          Worker acknowledgment: {submission.incident_reporting_acknowledged ? "Accepted" : "Not accepted"}
        </div>
      </section>

      <section className="screen-frame stack">
        <div className="eyebrow">Worker Acknowledgment and Signature</div>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{WORKER_ACK_TEXT}</p>
        <div className="signature-block preview">
          <div className="signature-heading">Worker Signature</div>
          <div className="signature-help">{workerSignature}</div>
          <div className="signature-meta">
            <span className="signature-line">Signed {workerSignedAt.slice(0, 10)}</span>
          </div>
        </div>
      </section>

      {submission.is_minor ? (
        <section className="screen-frame stack">
          <div className="eyebrow">Parent / Legal Guardian for Minors</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{GUARDIAN_TEXT}</p>
          <div>{submission.guardian_full_name ?? "No guardian name"}</div>
          <div className="muted">{submission.guardian_relationship ?? "No relationship"}</div>
          <div className="muted">{submission.guardian_phone ?? "No phone"}</div>
          <div className="muted">{submission.guardian_email ?? "No guardian email"}</div>
          <div className="signature-block preview">
            <div className="signature-heading">Parent / Guardian Signature</div>
            <div className="signature-help">{guardianSignature ?? "No signature"}</div>
            <div className="signature-meta">
              <span className="signature-line">
                {guardianSignedAt ? `Signed ${guardianSignedAt.slice(0, 10)}` : "No signed date"}
              </span>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
