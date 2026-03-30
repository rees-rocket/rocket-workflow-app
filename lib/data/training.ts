import { createClient } from "@/lib/supabase/server";
import type {
  ProfileRow,
  TrainingAssignmentRow,
  TrainingCategoryRow,
  TrainingModuleRow,
  TrainingModuleSectionRow,
  TrainingQuizOptionRow,
  TrainingQuizQuestionRow
} from "@/lib/types";

function normalizedAssignmentStatus(
  assignment: Pick<TrainingAssignmentRow, "status" | "completed_at" | "due_date">
): TrainingAssignmentRow["status"] {
  if (assignment.completed_at) return "completed";
  const today = new Date().toISOString().slice(0, 10);
  if (assignment.due_date < today) return "overdue";
  return assignment.status === "in_progress" ? "in_progress" : "not_started";
}

export type WorkerTrainingCard = {
  assignment: TrainingAssignmentRow;
  module: TrainingModuleRow;
  category: TrainingCategoryRow | null;
};

export type WorkerTrainingDashboardData = {
  required: WorkerTrainingCard[];
  inProgress: WorkerTrainingCard[];
  completed: WorkerTrainingCard[];
  overdue: WorkerTrainingCard[];
  all: WorkerTrainingCard[];
};

export type WorkerTrainingModuleData = {
  assignment: TrainingAssignmentRow;
  module: TrainingModuleRow;
  category: TrainingCategoryRow | null;
  sections: TrainingModuleSectionRow[];
  questions: Array<
    TrainingQuizQuestionRow & {
      options: TrainingQuizOptionRow[];
    }
  >;
  currentSection: TrainingModuleSectionRow | null;
  isOnQuiz: boolean;
};

export type AdminTrainingManagerData = {
  categories: TrainingCategoryRow[];
  modules: Array<
    TrainingModuleRow & {
      category: TrainingCategoryRow | null;
      sectionCount: number;
      quizQuestionCount: number;
      assignmentCount: number;
      overdueCount: number;
      completedCount: number;
    }
  >;
  workers: ProfileRow[];
  assignments: Array<
    TrainingAssignmentRow & {
      worker: ProfileRow | null;
      module: TrainingModuleRow | null;
      category: TrainingCategoryRow | null;
    }
  >;
};

export type TrainingModuleEditorData = {
  module: TrainingModuleRow;
  sections: TrainingModuleSectionRow[];
  questions: Array<
    TrainingQuizQuestionRow & {
      options: TrainingQuizOptionRow[];
    }
  >;
};

type TrainingModuleWithCategory = TrainingModuleRow & {
  training_categories?: TrainingCategoryRow | TrainingCategoryRow[] | null;
};

export async function getWorkerTrainingDashboard(workerId: string): Promise<WorkerTrainingDashboardData> {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("training_assignments")
    .select(`
      *,
      training_modules(
        *,
        training_categories(*)
      )
    `)
    .eq("worker_id", workerId)
    .order("due_date", { ascending: true });

  const cards = ((assignments as Array<TrainingAssignmentRow & { training_modules?: TrainingModuleWithCategory | TrainingModuleWithCategory[] | null }>) ?? [])
    .map((item) => {
      const module = Array.isArray(item.training_modules) ? item.training_modules[0] ?? null : item.training_modules ?? null;
      if (!module) return null;
      const category = Array.isArray(module.training_categories)
        ? module.training_categories[0] ?? null
        : module.training_categories ?? null;

      return {
        assignment: {
          ...item,
          status: normalizedAssignmentStatus(item)
        },
        module,
        category
      };
    })
    .filter(Boolean) as WorkerTrainingCard[];

  return {
    required: cards.filter((card) => card.assignment.status === "not_started"),
    inProgress: cards.filter((card) => card.assignment.status === "in_progress"),
    completed: cards.filter((card) => card.assignment.status === "completed"),
    overdue: cards.filter((card) => card.assignment.status === "overdue"),
    all: cards
  };
}

export async function getWorkerTrainingModule(workerId: string, assignmentId: string): Promise<WorkerTrainingModuleData | null> {
  const supabase = await createClient();
  const { data: assignmentRow } = await supabase
    .from("training_assignments")
    .select(`
      *,
      training_modules(
        *,
        training_categories(*)
      )
    `)
    .eq("id", assignmentId)
    .eq("worker_id", workerId)
    .maybeSingle<TrainingAssignmentRow & { training_modules?: TrainingModuleWithCategory | TrainingModuleWithCategory[] | null }>();

  if (!assignmentRow) {
    return null;
  }

  const module = Array.isArray(assignmentRow.training_modules)
    ? assignmentRow.training_modules[0] ?? null
    : assignmentRow.training_modules ?? null;

  if (!module) {
    return null;
  }

  const category = Array.isArray(module.training_categories)
    ? module.training_categories[0] ?? null
    : module.training_categories ?? null;

  const [{ data: sections }, { data: questionRows }] = await Promise.all([
    supabase
      .from("training_module_sections")
      .select("*")
      .eq("module_id", module.id)
      .order("sort_order", { ascending: true })
      .returns<TrainingModuleSectionRow[]>(),
    supabase
      .from("training_quiz_questions")
      .select("*")
      .eq("module_id", module.id)
      .order("sort_order", { ascending: true })
      .returns<TrainingQuizQuestionRow[]>()
  ]);

  const questionIds = (questionRows ?? []).map((row) => row.id);
  const { data: optionRows } =
    questionIds.length > 0
      ? await supabase
          .from("training_quiz_options")
          .select("*")
          .in("question_id", questionIds)
          .order("sort_order", { ascending: true })
          .returns<TrainingQuizOptionRow[]>()
      : { data: [] as TrainingQuizOptionRow[] };

  const optionMap = new Map<string, TrainingQuizOptionRow[]>();
  for (const option of optionRows ?? []) {
    const current = optionMap.get(option.question_id) ?? [];
    current.push(option);
    optionMap.set(option.question_id, current);
  }

  const questions = (questionRows ?? []).map((question) => ({
    ...question,
    options: optionMap.get(question.id) ?? []
  }));

  const currentSection = (sections ?? [])[assignmentRow.current_section_index] ?? null;
  const isOnQuiz = (sections ?? []).length > 0 && assignmentRow.current_section_index >= (sections ?? []).length;

  return {
    assignment: {
      ...assignmentRow,
      status: normalizedAssignmentStatus(assignmentRow)
    },
    module,
    category,
    sections: sections ?? [],
    questions,
    currentSection,
    isOnQuiz
  };
}

export async function getAdminTrainingManagerData(): Promise<AdminTrainingManagerData> {
  const supabase = await createClient();
  const [{ data: categories }, { data: modules }, { data: workers }, { data: assignments }, { data: sections }, { data: questions }] =
    await Promise.all([
      supabase.from("training_categories").select("*").order("sort_order").order("name").returns<TrainingCategoryRow[]>(),
      supabase
        .from("training_modules")
        .select("*, training_categories(*)")
        .order("title")
        .returns<TrainingModuleWithCategory[]>(),
      supabase
        .from("profiles")
        .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
        .eq("role", "worker")
        .eq("status", "active")
        .order("full_name")
        .returns<ProfileRow[]>(),
      supabase
        .from("training_assignments")
        .select(`
          *,
          profiles!training_assignments_worker_id_fkey(*),
          training_modules(
            *,
            training_categories(*)
          )
        `)
        .order("due_date", { ascending: true }),
      supabase.from("training_module_sections").select("id, module_id"),
      supabase.from("training_quiz_questions").select("id, module_id")
    ]);

  const sectionCounts = new Map<string, number>();
  for (const section of sections ?? []) {
    sectionCounts.set(section.module_id, (sectionCounts.get(section.module_id) ?? 0) + 1);
  }

  const questionCounts = new Map<string, number>();
  for (const question of questions ?? []) {
    questionCounts.set(question.module_id, (questionCounts.get(question.module_id) ?? 0) + 1);
  }

  const assignmentCounts = new Map<string, { total: number; overdue: number; completed: number }>();
  for (const assignment of (assignments as Array<TrainingAssignmentRow & { training_modules?: TrainingModuleWithCategory | TrainingModuleWithCategory[] | null }>) ?? []) {
    const current = assignmentCounts.get(assignment.module_id) ?? { total: 0, overdue: 0, completed: 0 };
    const status = normalizedAssignmentStatus(assignment);
    current.total += 1;
    if (status === "overdue") current.overdue += 1;
    if (status === "completed") current.completed += 1;
    assignmentCounts.set(assignment.module_id, current);
  }

  return {
    categories: categories ?? [],
    modules: (modules ?? []).map((module) => {
      const category = Array.isArray(module.training_categories)
        ? module.training_categories[0] ?? null
        : module.training_categories ?? null;
      const assignmentSummary = assignmentCounts.get(module.id) ?? { total: 0, overdue: 0, completed: 0 };
      return {
        ...module,
        category,
        sectionCount: sectionCounts.get(module.id) ?? 0,
        quizQuestionCount: questionCounts.get(module.id) ?? 0,
        assignmentCount: assignmentSummary.total,
        overdueCount: assignmentSummary.overdue,
        completedCount: assignmentSummary.completed
      };
    }),
    workers: workers ?? [],
    assignments: ((assignments as Array<
      TrainingAssignmentRow & {
        profiles?: ProfileRow | ProfileRow[] | null;
        training_modules?: TrainingModuleWithCategory | TrainingModuleWithCategory[] | null;
      }
    >) ?? []).map((assignment) => {
      const worker = Array.isArray(assignment.profiles) ? assignment.profiles[0] ?? null : assignment.profiles ?? null;
      const module = Array.isArray(assignment.training_modules)
        ? assignment.training_modules[0] ?? null
        : assignment.training_modules ?? null;
      const category = module
        ? Array.isArray(module.training_categories)
          ? module.training_categories[0] ?? null
          : module.training_categories ?? null
        : null;
      return {
        ...assignment,
        status: normalizedAssignmentStatus(assignment),
        worker,
        module,
        category
      };
    })
  };
}

export async function getTrainingModuleEditorData(moduleId: string): Promise<TrainingModuleEditorData | null> {
  const supabase = await createClient();
  const { data: module } = await supabase
    .from("training_modules")
    .select("*")
    .eq("id", moduleId)
    .maybeSingle<TrainingModuleRow>();

  if (!module) return null;

  const [{ data: sections }, { data: questions }, { data: options }] = await Promise.all([
    supabase
      .from("training_module_sections")
      .select("*")
      .eq("module_id", moduleId)
      .order("sort_order", { ascending: true })
      .returns<TrainingModuleSectionRow[]>(),
    supabase
      .from("training_quiz_questions")
      .select("*")
      .eq("module_id", moduleId)
      .order("sort_order", { ascending: true })
      .returns<TrainingQuizQuestionRow[]>(),
    supabase
      .from("training_quiz_options")
      .select("*")
      .order("sort_order", { ascending: true })
      .returns<TrainingQuizOptionRow[]>()
  ]);

  const optionsByQuestion = new Map<string, TrainingQuizOptionRow[]>();
  for (const option of options ?? []) {
    const current = optionsByQuestion.get(option.question_id) ?? [];
    current.push(option);
    optionsByQuestion.set(option.question_id, current);
  }

  return {
    module,
    sections: sections ?? [],
    questions: (questions ?? []).map((question) => ({
      ...question,
      options: optionsByQuestion.get(question.id) ?? []
    }))
  };
}

export function describeTrainingStatus(status: TrainingAssignmentRow["status"]) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  if (status === "overdue") return "Overdue";
  return "Not Started";
}
