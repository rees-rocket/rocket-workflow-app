import { createClient } from "@/lib/supabase/server";
import type { PayPeriodRow, PendingWorkerProfileRow, ProfileRow, TimeDayRow, TimeSegmentRow } from "@/lib/types";

export type WorkerListItem = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "worker";
  employee_type: "employee" | "contractor";
  status: "active" | "inactive";
  wage_rate_cents: number | null;
  travel_wage_rate_cents: number | null;
  prep_wage_rate_cents: number | null;
  service_wage_rate_cents: number | null;
  tip_eligible: boolean;
  notes: string | null;
  source: "profile" | "pending";
  trainingSummary: {
    assigned: number;
    completed: number;
    overdue: number;
  };
};

export async function getWorkerManagementList() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: pending }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase
      .from("pending_worker_profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes, created_at, updated_at")
      .order("full_name")
      .returns<PendingWorkerProfileRow[]>(),
    supabase
      .from("training_assignments")
      .select("worker_id, due_date, completed_at")
  ]);

  const byWorker = new Map<string, { assigned: number; completed: number; overdue: number }>();
  const today = new Date().toISOString().slice(0, 10);

  for (const assignment of assignments ?? []) {
    const current = byWorker.get(assignment.worker_id) ?? { assigned: 0, completed: 0, overdue: 0 };
    current.assigned += 1;
    if (assignment.completed_at) {
      current.completed += 1;
    } else if (assignment.due_date < today) {
      current.overdue += 1;
    }
    byWorker.set(assignment.worker_id, current);
  }

  const profileRows: WorkerListItem[] = (profiles ?? []).map((profile) => ({
    ...profile,
    source: "profile",
    trainingSummary: byWorker.get(profile.id) ?? { assigned: 0, completed: 0, overdue: 0 }
  }));

  const pendingRows: WorkerListItem[] = (pending ?? []).map((profile) => ({
    ...profile,
    source: "pending",
    trainingSummary: { assigned: 0, completed: 0, overdue: 0 }
  }));

  return [...profileRows, ...pendingRows].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getWorkerManagementDetail(id: string) {
  const supabase = await createClient();

  if (id.startsWith("pending-")) {
    const pendingId = id.replace("pending-", "");
    const { data: worker } = await supabase
      .from("pending_worker_profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes, created_at, updated_at")
      .eq("id", pendingId)
      .maybeSingle<PendingWorkerProfileRow>();

    return {
      source: "pending" as const,
      worker: worker ?? null,
      trainingAssignments: [],
      timeDays: [],
      timeSegments: []
    };
  }

  const [{ data: worker }, { data: trainingAssignments }, { data: timeDays }, { data: timeSegments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
        .eq("id", id)
        .maybeSingle<ProfileRow>(),
      supabase
        .from("training_assignments")
        .select("id, due_date, completed_at, renewal_date, training_modules(title)")
        .eq("worker_id", id)
        .order("due_date", { ascending: true }),
      supabase
        .from("time_days")
        .select("*, pay_periods(status, paid_at)")
        .eq("worker_id", id)
        .order("work_date", { ascending: false })
        .limit(8)
        .returns<
          Array<
            TimeDayRow & {
              pay_periods: Pick<PayPeriodRow, "status" | "paid_at"> | Pick<PayPeriodRow, "status" | "paid_at">[] | null;
            }
          >
        >(),
      supabase
        .from("time_segments")
        .select("*")
        .eq("worker_id", id)
        .order("start_at", { ascending: false })
        .limit(12)
        .returns<TimeSegmentRow[]>()
    ]);

  return {
    source: "profile" as const,
    worker: worker ?? null,
    trainingAssignments: trainingAssignments ?? [],
    timeDays:
      (timeDays ?? []).map((day) => ({
        ...day,
        pay_period: Array.isArray(day.pay_periods) ? day.pay_periods[0] ?? null : day.pay_periods
      })) ?? [],
    timeSegments: timeSegments ?? []
  };
}
