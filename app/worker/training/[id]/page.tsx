import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { advanceTrainingSection, startTrainingModule, submitTrainingQuiz } from "@/app/worker/training/actions";
import { signOut } from "@/app/auth/login/actions";
import { requireProfile } from "@/lib/auth";
import { describeTrainingStatus, getWorkerTrainingModule } from "@/lib/data/training";

type WorkerTrainingDetailPageProps = {
  params: Promise<{ id: string }>;
};

function getStatusClass(status: "not_started" | "in_progress" | "completed" | "overdue") {
  if (status === "completed") return "pill ok";
  if (status === "overdue") return "pill danger";
  if (status === "in_progress") return "pill warn";
  return "pill";
}

export default async function WorkerTrainingDetailPage({ params }: WorkerTrainingDetailPageProps) {
  const { profile } = await requireProfile("worker");
  const { id } = await params;
  const data = await getWorkerTrainingModule(profile.id, id);

  if (!data) {
    notFound();
  }

  return (
    <AppShell
      title="Training Module"
      subtitle="Read the sections, pass the quiz, and complete the module"
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
      <section className="card stack">
        <div className="summary-row">
          <div>
            <div className="eyebrow">{data.category?.name ?? "Training"}</div>
            <h2>{data.module.title}</h2>
          </div>
          <span className={getStatusClass(data.assignment.status)}>
            {describeTrainingStatus(data.assignment.status)}
          </span>
        </div>
        <p className="muted">{data.module.short_description}</p>
        <div className="screen-frame">
          <div className="muted">Learning objective</div>
          <strong>{data.module.learning_objective ?? "Complete the assigned training and pass the quiz."}</strong>
          <div className="muted" style={{ marginTop: 8 }}>
            Estimated duration {data.module.estimated_duration_minutes ?? 15} minutes · Due {data.assignment.due_date}
          </div>
        </div>

        {data.assignment.status === "not_started" ? (
          <form action={startTrainingModule}>
            <input name="assignment_id" type="hidden" value={data.assignment.id} />
            <button className="btn primary" type="submit">
              Start module
            </button>
          </form>
        ) : null}

        {data.assignment.status !== "not_started" && !data.isOnQuiz && data.currentSection ? (
          <section className="stack">
            <div className="eyebrow">
              Section {data.assignment.current_section_index + 1} of {data.sections.length}
            </div>
            <h3 style={{ margin: 0 }}>{data.currentSection.title}</h3>
            <div className="screen-frame">
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.currentSection.body}</p>
            </div>
            <form action={advanceTrainingSection}>
              <input name="assignment_id" type="hidden" value={data.assignment.id} />
              <input name="next_index" type="hidden" value={String(data.assignment.current_section_index + 1)} />
              <button className="btn primary" type="submit">
                {data.assignment.current_section_index + 1 >= data.sections.length ? "Continue to quiz" : "Next section"}
              </button>
            </form>
          </section>
        ) : null}

        {data.assignment.status !== "not_started" && data.isOnQuiz ? (
          <section className="stack">
            <div className="eyebrow">Quiz</div>
            <h3 style={{ margin: 0 }}>
              Score {data.module.passing_score_percent}% or higher to complete this module
            </h3>
            <form action={submitTrainingQuiz} className="stack">
              <input name="assignment_id" type="hidden" value={data.assignment.id} />
              {data.questions.map((question, index) => (
                <div className="screen-frame stack" key={question.id}>
                  <strong>
                    {index + 1}. {question.question_text}
                  </strong>
                  {question.options.map((option) => (
                    <label className="field" key={option.id}>
                      <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input name={`question_${question.id}`} required type="radio" value={option.id} />
                        {option.option_text}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
              {data.assignment.last_score_percent !== null ? (
                <div className="pill">
                  Last score {data.assignment.last_score_percent}% · Attempts {data.assignment.attempts_count}
                </div>
              ) : null}
              <button className="btn primary" type="submit">
                Submit quiz
              </button>
            </form>
          </section>
        ) : null}

        {data.assignment.status === "completed" ? (
          <section className="card">
            <div className="eyebrow">Completed</div>
            <p className="muted">
              Completed {data.assignment.completed_at?.slice(0, 10)}.
              {data.assignment.renewal_date ? ` Renewal due ${data.assignment.renewal_date}.` : ""}
            </p>
            <div className="button-row">
              <Link className="btn secondary" href="/worker/training">
                Back to training
              </Link>
            </div>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
