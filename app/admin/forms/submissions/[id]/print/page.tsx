import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireProfile } from "@/lib/auth";
import { getAdminFormAssignmentDetail } from "@/lib/data/forms";
import { WorkerFormSubmissionPreview } from "@/lib/forms-preview";

export default async function AdminCompletedFormPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile("admin");
  const { id } = await params;
  const data = await getAdminFormAssignmentDetail(id);

  if (!data.assignment?.form || !data.assignment.submission) notFound();

  const { assignment } = data;
  const form = assignment.form!;
  const submission = assignment.submission!;

  return (
    <main className="shell report-shell">
      <div className="print-toolbar">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">Completed Form</div>
          <h1 style={{ margin: 0 }}>{form.name}</h1>
          <div className="muted">{assignment.worker?.full_name ?? assignment.worker_id}</div>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href="/admin/forms">
            Back to forms
          </Link>
          <PrintButton label="Print completed form" />
        </div>
      </div>

      <section className="card stack">
        <div className="report-meta">
          <span>Submitted: {submission.submitted_at.slice(0, 10)}</span>
          <span>Status: {assignment.status === "completed" ? "Completed" : "Not Started"}</span>
          <span>Guardian included: {submission.guardian_signature ? "Yes" : "No"}</span>
        </div>
        <WorkerFormSubmissionPreview
          form={form}
          workerName={assignment.worker?.full_name ?? assignment.worker_id}
          submission={assignment.parsedSubmission}
          workerSignature={submission.typed_signature}
          workerSignedAt={submission.worker_signed_at}
          guardianSignature={submission.guardian_signature}
          guardianSignedAt={submission.guardian_signed_at}
        />
      </section>
    </main>
  );
}
