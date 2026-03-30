import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/auth/login/actions";
import { saveTrainingAssignment, saveTrainingCategory, saveTrainingModule } from "@/app/admin/training/actions";
import { requireProfile } from "@/lib/auth";
import { describeTrainingStatus, getAdminTrainingManagerData, getTrainingModuleEditorData } from "@/lib/data/training";

type AdminTrainingPageProps = {
  searchParams?: Promise<{
    category?: string;
    module?: string;
    assignment?: string;
  }>;
};

function statusClass(status: "not_started" | "in_progress" | "completed" | "overdue") {
  if (status === "completed") return "pill ok";
  if (status === "overdue") return "pill danger";
  if (status === "in_progress") return "pill warn";
  return "pill";
}

export default async function AdminTrainingPage({ searchParams }: AdminTrainingPageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const data = await getAdminTrainingManagerData();
  const selectedCategory = data.categories.find((category) => category.id === params.category) ?? null;
  const selectedAssignment = data.assignments.find((assignment) => assignment.id === params.assignment) ?? null;
  const selectedModuleEditor = params.module ? await getTrainingModuleEditorData(params.module) : null;

  return (
    <AppShell
      title="Admin Training"
      subtitle="Categories, modules, assignments, and compliance in one place"
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
          <div className="eyebrow">Categories</div>
          <h2>Create categories</h2>
          <form action={saveTrainingCategory} className="stack">
            <input name="category_id" type="hidden" value={selectedCategory?.id ?? ""} />
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input defaultValue={selectedCategory?.name ?? ""} name="name" required type="text" />
              </label>
              <label className="field">
                <span>Sort order</span>
                <input defaultValue={selectedCategory?.sort_order ?? "0"} name="sort_order" type="number" />
              </label>
            </div>
            <label className="field">
              <span>Description</span>
              <textarea defaultValue={selectedCategory?.description ?? ""} name="description" rows={3} />
            </label>
            <label className="field">
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input defaultChecked={selectedCategory ? selectedCategory.is_active : true} name="is_active" type="checkbox" />
                Active category
              </span>
            </label>
            <button className="btn primary" type="submit">
              {selectedCategory ? "Update category" : "Save category"}
            </button>
          </form>

          <ul className="list">
            {data.categories.map((category) => (
              <li className="list-item" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <div className="muted">{category.description ?? "No description"}</div>
                </div>
                <div className="stack" style={{ justifyItems: "end" }}>
                  <div className={`pill ${category.is_active ? "ok" : "warn"}`}>{category.is_active ? "Active" : "Inactive"}</div>
                  <Link href={`/admin/training?category=${category.id}`}>Edit</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card stack">
          <div className="eyebrow">Assignments</div>
          <h2>Assign modules and set due dates</h2>
          <form action={saveTrainingAssignment} className="stack">
            <input name="assignment_id" type="hidden" value={selectedAssignment?.id ?? ""} />
            <div className="form-grid">
              <label className="field">
                <span>Worker</span>
                <select defaultValue={selectedAssignment?.worker_id ?? ""} name="worker_id" required>
                  <option value="">Select worker</option>
                  {data.workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Module</span>
                <select defaultValue={selectedAssignment?.module_id ?? ""} name="module_id" required>
                  <option value="">Select module</option>
                  {data.modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Due date</span>
                <input defaultValue={selectedAssignment?.due_date ?? ""} name="due_date" required type="date" />
              </label>
              <label className="field">
                <span>Renewal date</span>
                <input defaultValue={selectedAssignment?.renewal_date ?? ""} name="renewal_date" type="date" />
              </label>
            </div>
            <label className="field">
              <span>Completed at</span>
              <input
                defaultValue={selectedAssignment?.completed_at ? selectedAssignment.completed_at.slice(0, 16) : ""}
                name="completed_at"
                type="datetime-local"
              />
            </label>
            <button className="btn primary" type="submit">
              {selectedAssignment ? "Update assignment" : "Assign module"}
            </button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Module</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {data.assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.worker?.full_name ?? assignment.worker_id}</td>
                    <td>{assignment.module?.title ?? assignment.module_id}</td>
                    <td>{assignment.due_date}</td>
                    <td>
                      <span className={statusClass(assignment.status)}>{describeTrainingStatus(assignment.status)}</span>
                    </td>
                    <td><Link href={`/admin/training?assignment=${assignment.id}`}>Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card stack" style={{ marginTop: 16 }}>
        <div className="eyebrow">Modules</div>
        <h2>Create or update modules</h2>
        <form action={saveTrainingModule} className="stack">
          <input name="module_id" type="hidden" value={selectedModuleEditor?.module.id ?? ""} />
          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input defaultValue={selectedModuleEditor?.module.title ?? ""} name="title" required type="text" />
            </label>
            <label className="field">
              <span>Category</span>
              <select defaultValue={selectedModuleEditor?.module.category_id ?? ""} name="category_id">
                <option value="">General</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
              <label className="field">
                <span>Estimated duration (minutes)</span>
              <input defaultValue={selectedModuleEditor?.module.estimated_duration_minutes ?? "15"} name="estimated_duration_minutes" type="number" />
              </label>
              <label className="field">
                <span>Passing score (%)</span>
              <input defaultValue={selectedModuleEditor?.module.passing_score_percent ?? "80"} name="passing_score_percent" type="number" />
              </label>
          </div>

          <label className="field">
            <span>Short description</span>
            <input defaultValue={selectedModuleEditor?.module.short_description ?? ""} name="short_description" required type="text" />
          </label>
          <label className="field">
            <span>Learning objective</span>
            <input defaultValue={selectedModuleEditor?.module.learning_objective ?? ""} name="learning_objective" type="text" />
          </label>
          <label className="field">
            <span>Module overview</span>
            <textarea defaultValue={selectedModuleEditor?.module.description ?? ""} name="description" required rows={4} />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Content type</span>
              <select defaultValue={selectedModuleEditor?.module.content_type ?? "text"} name="content_type">
                <option value="text">Text</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label className="field">
              <span>Video URL</span>
              <input defaultValue={selectedModuleEditor?.module.video_url ?? ""} name="video_url" type="text" />
            </label>
          </div>
          <label className="field">
            <span>Intro text content</span>
            <textarea defaultValue={selectedModuleEditor?.module.content_text ?? ""} name="content_text" rows={4} />
          </label>

          <div className="grid three">
            {[1, 2, 3].map((index) => (
              <div className="screen-frame stack" key={index}>
                <strong>Primary topic {index}</strong>
                <label className="field">
                  <span>Section title</span>
                  <input defaultValue={selectedModuleEditor?.sections[index - 1]?.title ?? ""} name={`section_${index}_title`} type="text" />
                </label>
                <label className="field">
                  <span>Section content</span>
                  <textarea defaultValue={selectedModuleEditor?.sections[index - 1]?.body ?? ""} name={`section_${index}_body`} rows={4} />
                </label>
              </div>
            ))}
          </div>

          <div className="grid two">
            {[1, 2, 3, 4, 5].map((questionIndex) => (
              <div className="screen-frame stack" key={questionIndex}>
                <strong>Quiz question {questionIndex}</strong>
                <label className="field">
                  <span>Question</span>
                  <input
                    defaultValue={selectedModuleEditor?.questions[questionIndex - 1]?.question_text ?? ""}
                    name={`question_${questionIndex}_text`}
                    type="text"
                  />
                </label>
                {[1, 2, 3].map((optionIndex) => (
                  <label className="field" key={optionIndex}>
                    <span>Option {optionIndex}</span>
                    <input
                      defaultValue={selectedModuleEditor?.questions[questionIndex - 1]?.options[optionIndex - 1]?.option_text ?? ""}
                      name={`question_${questionIndex}_option_${optionIndex}`}
                      type="text"
                    />
                  </label>
                ))}
                <label className="field">
                  <span>Correct option</span>
                  <select
                    defaultValue={
                      String(
                        Math.max(
                          1,
                          (selectedModuleEditor?.questions[questionIndex - 1]?.options.findIndex((option) => option.is_correct) ?? 0) + 1
                        )
                      )
                    }
                    name={`question_${questionIndex}_correct`}
                  >
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="form-grid">
            <label className="field">
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input defaultChecked={selectedModuleEditor ? selectedModuleEditor.module.is_active : true} name="is_active" type="checkbox" />
                Active module
              </span>
            </label>
            <label className="field">
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input defaultChecked={selectedModuleEditor?.module.annual_renewal ?? false} name="annual_renewal" type="checkbox" />
                Annual renewal required
              </span>
            </label>
            <label className="field">
              <span>Renewal period in days</span>
              <input defaultValue={selectedModuleEditor?.module.renewal_period_days ?? "365"} name="renewal_period_days" type="number" />
            </label>
          </div>
          <button className="btn primary" type="submit">
            {selectedModuleEditor ? "Update module" : "Save module"}
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Module Library</div>
        <h2>Compliance and module structure</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Category</th>
                <th>Sections</th>
                <th>Quiz</th>
                <th>Assignments</th>
                <th>Compliance</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {data.modules.map((module) => (
                <tr key={module.id}>
                  <td>
                    <strong>{module.title}</strong>
                    <div className="muted">{module.short_description}</div>
                  </td>
                  <td>{module.category?.name ?? "General"}</td>
                  <td>{module.sectionCount}</td>
                  <td>{module.quizQuestionCount} questions</td>
                  <td>{module.assignmentCount}</td>
                  <td>{module.completedCount} completed · {module.overdueCount} overdue</td>
                  <td><Link href={`/admin/training?module=${module.id}`}>Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
