import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { describeTrainingStatus, getWorkerTrainingDashboard } from "@/lib/data/training";

function getStatusClass(status: "not_started" | "in_progress" | "completed" | "overdue") {
  if (status === "completed") return "pill ok";
  if (status === "overdue") return "pill danger";
  if (status === "in_progress") return "pill warn";
  return "pill";
}

export default async function WorkerTrainingPage() {
  const { profile } = await requireProfile("worker");
  const data = await getWorkerTrainingDashboard(profile.id);

  const groups = [
    { label: "Required", items: data.required },
    { label: "In Progress", items: data.inProgress },
    { label: "Completed", items: data.completed },
    { label: "Overdue", items: data.overdue }
  ];

  return (
    <AppShell
      title="Worker Training"
      subtitle="Assigned training in one simple place"
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
          <button className="btn secondary" type="submit">
            Sign out
          </button>
        </form>
      }
    >
      <div className="grid two">
        <section className="card metric">
          <span className="eyebrow">Assigned Modules</span>
          <strong>{data.all.length}</strong>
          <span className="muted">{data.required.length} not started · {data.inProgress.length} in progress</span>
        </section>
        <section className="card metric">
          <span className="eyebrow">Compliance</span>
          <strong>{data.completed.length}</strong>
          <span className="muted">{data.overdue.length} overdue · {data.completed.length} completed</span>
        </section>
      </div>

      {groups.map((group) => (
        <section className="card" key={group.label} style={{ marginTop: 16 }}>
          <div className="eyebrow">{group.label}</div>
          <h2>{group.label} modules</h2>
          {group.items.length === 0 ? (
            <p className="muted">No modules in this section right now.</p>
          ) : (
            <ul className="list">
              {group.items.map((item) => (
                <li className="list-item" key={item.assignment.id}>
                  <div className="stack">
                    <div>
                      <strong>{item.module.title}</strong>
                      <div className="muted">{item.module.short_description}</div>
                      <div className="muted">
                        {item.category?.name ?? "General"} · Due {item.assignment.due_date}
                      </div>
                    </div>
                  </div>
                  <div className="stack" style={{ justifyItems: "end" }}>
                    <span className={getStatusClass(item.assignment.status)}>
                      {describeTrainingStatus(item.assignment.status)}
                    </span>
                    <Link href={`/worker/training/${item.assignment.id}`}>Open module</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </AppShell>
  );
}
