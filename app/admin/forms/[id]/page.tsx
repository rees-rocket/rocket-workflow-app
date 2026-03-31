import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/admin-page-shell";
import { requireProfile } from "@/lib/auth";
import { getAdminFormDetail } from "@/lib/data/forms";
import { WorkerFormPreview } from "@/lib/forms-preview";

export default async function AdminFormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile("admin");
  const { id } = await params;
  const data = await getAdminFormDetail(id);

  if (!data.form) notFound();

  return (
    <AdminPageShell title="Form Preview" subtitle="Read the full form before assigning or printing it">
      <section className="card stack">
        <div className="summary-row">
          <div>
            <div className="eyebrow">Form Preview</div>
            <h2>{data.form.name}</h2>
            <p className="muted">{data.form.short_description}</p>
          </div>
          <span className={data.form.is_active ? "pill ok" : "pill warn"}>
            {data.form.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="summary-kpis">
          <div className="summary-kpi">
            <span className="muted">Assigned</span>
            <strong>{data.form.assignmentCount}</strong>
          </div>
          <div className="summary-kpi">
            <span className="muted">Completed</span>
            <strong>{data.form.completedCount}</strong>
          </div>
        </div>

        <div className="button-row">
          <Link className="btn secondary" href="/admin/forms">
            Back to forms
          </Link>
          <Link className="btn primary" href={`/admin/forms/${data.form.id}/print`}>
            Print or save as PDF
          </Link>
        </div>

        <WorkerFormPreview form={data.form} />
      </section>
    </AdminPageShell>
  );
}
