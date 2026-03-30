import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireProfile } from "@/lib/auth";
import { getAdminFormDetail } from "@/lib/data/forms";
import { WorkerFormPreview } from "@/lib/forms-preview";

export default async function AdminFormPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile("admin");
  const { id } = await params;
  const data = await getAdminFormDetail(id);

  if (!data.form) notFound();

  return (
    <main className="shell report-shell">
      <div className="print-toolbar">
        <div className="stack" style={{ gap: 4 }}>
          <div className="eyebrow">Printable Form</div>
          <h1 style={{ margin: 0 }}>{data.form.name}</h1>
          <div className="muted">{data.form.short_description}</div>
        </div>
        <div className="button-row">
          <Link className="btn secondary" href={`/admin/forms/${data.form.id}`}>
            Back to preview
          </Link>
          <PrintButton label="Print form" />
        </div>
      </div>

      <section className="card stack">
        <div className="report-meta">
          <span>Status: {data.form.is_active ? "Active" : "Inactive"}</span>
          <span>Assigned: {data.form.assignmentCount}</span>
          <span>Completed: {data.form.completedCount}</span>
        </div>
        <WorkerFormPreview form={data.form} />
      </section>
    </main>
  );
}
