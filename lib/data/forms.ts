import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, WorkerFormAssignmentRow, WorkerFormRow, WorkerFormSubmissionRow } from "@/lib/types";

export type WorkerAssignedFormCard = {
  assignment: WorkerFormAssignmentRow;
  form: WorkerFormRow;
  submission: WorkerFormSubmissionRow | null;
};

export type EmergencyContactSafetyGuardianSubmission = {
  worker_full_name: string;
  worker_phone: string;
  worker_email: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  safe_work_acknowledged: boolean;
  incident_reporting_acknowledged: boolean;
  is_minor: boolean;
  guardian_full_name: string | null;
  guardian_relationship: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
};

export type IndependentContractorAgreementSubmission = {
  contractor_full_name: string;
  contractor_email: string;
  agreement_effective_date: string;
  is_minor: boolean;
  guardian_full_name: string | null;
};

export type EmployeeHandbookAcknowledgmentSubmission = {
  worker_full_name: string;
  handbook_version: string;
  is_minor: boolean;
  guardian_full_name: string | null;
  guardian_relationship: string | null;
  guardian_phone: string | null;
};

export type WorkerFormParsedSubmission =
  | EmergencyContactSafetyGuardianSubmission
  | IndependentContractorAgreementSubmission
  | EmployeeHandbookAcknowledgmentSubmission;

export type WorkerFormsDashboardData = {
  required: WorkerAssignedFormCard[];
  completed: WorkerAssignedFormCard[];
};

export type AdminFormDetailData = {
  form: (WorkerFormRow & {
    assignmentCount: number;
    completedCount: number;
  }) | null;
};

export type AdminFormAssignmentDetailData = {
  assignment: (WorkerFormAssignmentRow & {
    worker: ProfileRow | null;
    form: WorkerFormRow | null;
    submission: WorkerFormSubmissionRow | null;
    parsedSubmission: WorkerFormParsedSubmission | null;
  }) | null;
};

export type WorkerFormDetailData = {
  assignment: WorkerFormAssignmentRow;
  form: WorkerFormRow;
  submission: WorkerFormSubmissionRow | null;
  parsedSubmission: WorkerFormParsedSubmission | null;
};

export type AdminFormsManagerData = {
  forms: Array<
    WorkerFormRow & {
      assignmentCount: number;
      completedCount: number;
    }
  >;
  workers: ProfileRow[];
  assignments: Array<
    WorkerFormAssignmentRow & {
      worker: ProfileRow | null;
      form: WorkerFormRow | null;
      submission: WorkerFormSubmissionRow | null;
      parsedSubmission: WorkerFormParsedSubmission | null;
    }
  >;
};

function parseSubmissionData(value: string | null): WorkerFormParsedSubmission | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as WorkerFormParsedSubmission;
  } catch {
    return null;
  }
}

export async function getWorkerFormsDashboard(workerId: string): Promise<WorkerFormsDashboardData> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("worker_form_assignments")
    .select(`
      *,
      worker_forms(*),
      worker_form_submissions(*)
    `)
    .eq("worker_id", workerId)
    .order("assigned_at", { ascending: false });

  const cards = ((data as Array<
    WorkerFormAssignmentRow & {
      worker_forms?: WorkerFormRow | WorkerFormRow[] | null;
      worker_form_submissions?: WorkerFormSubmissionRow | WorkerFormSubmissionRow[] | null;
    }
  >) ?? [])
    .map((item) => {
      const form = Array.isArray(item.worker_forms) ? item.worker_forms[0] ?? null : item.worker_forms ?? null;
      if (!form) return null;
      const submission = Array.isArray(item.worker_form_submissions)
        ? item.worker_form_submissions[0] ?? null
        : item.worker_form_submissions ?? null;
      return {
        assignment: item,
        form,
        submission
      };
    })
    .filter(Boolean) as WorkerAssignedFormCard[];

  return {
    required: cards.filter((card) => card.assignment.status === "not_started"),
    completed: cards.filter((card) => card.assignment.status === "completed")
  };
}

export async function getWorkerFormDetail(workerId: string, assignmentId: string): Promise<WorkerFormDetailData | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("worker_form_assignments")
    .select(`
      *,
      worker_forms(*),
      worker_form_submissions(*)
    `)
    .eq("id", assignmentId)
    .eq("worker_id", workerId)
    .maybeSingle<
      WorkerFormAssignmentRow & {
        worker_forms?: WorkerFormRow | WorkerFormRow[] | null;
        worker_form_submissions?: WorkerFormSubmissionRow | WorkerFormSubmissionRow[] | null;
      }
    >();

  if (!data) return null;

  const form = Array.isArray(data.worker_forms) ? data.worker_forms[0] ?? null : data.worker_forms ?? null;
  if (!form) return null;
  const submission = Array.isArray(data.worker_form_submissions)
    ? data.worker_form_submissions[0] ?? null
    : data.worker_form_submissions ?? null;

  return {
    assignment: data,
    form,
    submission,
    parsedSubmission: parseSubmissionData(submission?.submission_data_json ?? null)
  };
}

export async function getAdminFormsManagerData(): Promise<AdminFormsManagerData> {
  const supabase = await createClient();
  const [{ data: forms }, { data: workers }, { data: assignments }] = await Promise.all([
    supabase.from("worker_forms").select("*").order("name").returns<WorkerFormRow[]>(),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("role", "worker")
      .eq("status", "active")
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase
      .from("worker_form_assignments")
      .select(`
        *,
        profiles!worker_form_assignments_worker_id_fkey(*),
        worker_forms(*),
        worker_form_submissions(*)
      `)
      .order("assigned_at", { ascending: false })
  ]);

  const stats = new Map<string, { assigned: number; completed: number }>();
  for (const assignment of (assignments as Array<WorkerFormAssignmentRow>) ?? []) {
    const current = stats.get(assignment.form_id) ?? { assigned: 0, completed: 0 };
    current.assigned += 1;
    if (assignment.status === "completed") current.completed += 1;
    stats.set(assignment.form_id, current);
  }

  return {
    forms: (forms ?? []).map((form) => ({
      ...form,
      assignmentCount: stats.get(form.id)?.assigned ?? 0,
      completedCount: stats.get(form.id)?.completed ?? 0
    })),
    workers: workers ?? [],
    assignments: ((assignments as Array<
      WorkerFormAssignmentRow & {
        profiles?: ProfileRow | ProfileRow[] | null;
        worker_forms?: WorkerFormRow | WorkerFormRow[] | null;
        worker_form_submissions?: WorkerFormSubmissionRow | WorkerFormSubmissionRow[] | null;
      }
    >) ?? []).map((assignment) => ({
      ...assignment,
      worker: Array.isArray(assignment.profiles) ? assignment.profiles[0] ?? null : assignment.profiles ?? null,
      form: Array.isArray(assignment.worker_forms) ? assignment.worker_forms[0] ?? null : assignment.worker_forms ?? null,
      submission: Array.isArray(assignment.worker_form_submissions)
        ? assignment.worker_form_submissions[0] ?? null
        : assignment.worker_form_submissions ?? null,
      parsedSubmission: parseSubmissionData(
        (
          Array.isArray(assignment.worker_form_submissions)
            ? assignment.worker_form_submissions[0] ?? null
            : assignment.worker_form_submissions ?? null
        )?.submission_data_json ?? null
      )
    }))
  };
}

export async function getAdminFormDetail(formId: string): Promise<AdminFormDetailData> {
  const supabase = await createClient();
  const [{ data: form }, { count: assignmentCount }, { count: completedCount }] = await Promise.all([
    supabase.from("worker_forms").select("*").eq("id", formId).maybeSingle<WorkerFormRow>(),
    supabase.from("worker_form_assignments").select("*", { count: "exact", head: true }).eq("form_id", formId),
    supabase
      .from("worker_form_assignments")
      .select("*", { count: "exact", head: true })
      .eq("form_id", formId)
      .eq("status", "completed")
  ]);

  return {
    form: form
      ? {
          ...form,
          assignmentCount: assignmentCount ?? 0,
          completedCount: completedCount ?? 0
        }
      : null
  };
}

export async function getAdminFormAssignmentDetail(assignmentId: string): Promise<AdminFormAssignmentDetailData> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("worker_form_assignments")
    .select(`
      *,
      profiles!worker_form_assignments_worker_id_fkey(*),
      worker_forms(*),
      worker_form_submissions(*)
    `)
    .eq("id", assignmentId)
    .maybeSingle<
      WorkerFormAssignmentRow & {
        profiles?: ProfileRow | ProfileRow[] | null;
        worker_forms?: WorkerFormRow | WorkerFormRow[] | null;
        worker_form_submissions?: WorkerFormSubmissionRow | WorkerFormSubmissionRow[] | null;
      }
    >();

  if (!data) {
    return { assignment: null };
  }

  const submission = Array.isArray(data.worker_form_submissions)
    ? data.worker_form_submissions[0] ?? null
    : data.worker_form_submissions ?? null;

  return {
    assignment: {
      ...data,
      worker: Array.isArray(data.profiles) ? data.profiles[0] ?? null : data.profiles ?? null,
      form: Array.isArray(data.worker_forms) ? data.worker_forms[0] ?? null : data.worker_forms ?? null,
      submission,
      parsedSubmission: parseSubmissionData(submission?.submission_data_json ?? null)
    }
  };
}
