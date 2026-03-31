import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { getWorkerFormsDashboard } from "@/lib/data/forms";
import { isOnboardingForm } from "@/lib/forms-content";
import { AppButton } from "@/components/app-button";

function statusClass(status: "not_started" | "completed") {
  return status === "completed" ? "pill ok" : "pill warn";
}

export default async function WorkerFormsPage() {
  const { profile } = await requireProfile("worker");
  const data = await getWorkerFormsDashboard(profile.id);

  const sections = [
    { label: "Required Forms", items: data.required, action: "Start" },
    { label: "Completed Forms", items: data.completed, action: "View" }
  ] as const;

  return (
    <AppShell
      title="Worker Forms"
      subtitle="Assigned forms in one simple place"
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
      <div className="grid two">
        <section className="card metric">
          <span className="eyebrow">Required Forms</span>
          <strong>{data.required.length}</strong>
          <span className="muted">Forms waiting on your completion</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Completed Forms</span>
          <strong>{data.completed.length}</strong>
          <span className="muted">Submitted forms you can review</span>
        </section>
      </div>

      {sections.map((section) => (
        <section className="card" key={section.label} style={{ marginTop: 16 }}>
          <div className="eyebrow">{section.label}</div>
          <h2>{section.label}</h2>
          {section.items.length === 0 ? (
            <p className="muted">No forms in this section right now.</p>
          ) : (
            <div className="grid">
              {section.items.map((item) => (
                <article className="period-card" key={item.assignment.id}>
                  <div className="summary-row">
                    <div>
                      <strong>{item.form.name}</strong>
                      <div className="muted">{item.form.short_description}</div>
                      {isOnboardingForm(item.form.form_key) ? <div className="pill">Required for onboarding</div> : null}
                    </div>
                    <span className={statusClass(item.assignment.status)}>
                      {item.assignment.status === "completed" ? "Completed" : "Not Started"}
                    </span>
                  </div>
                  <div className="button-row">
                    <Link className="btn secondary" href={`/worker/forms/${item.assignment.id}`}>
                      {section.action}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </AppShell>
  );
}
