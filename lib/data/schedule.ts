import { createClient } from "@/lib/supabase/server";
import type {
  ProfileRow,
  ShiftAssignmentRow,
  ShiftRow,
  ShiftTradeRequestRow
} from "@/lib/types";

type ScheduleShiftWithAssignments = ShiftRow & {
  shift_assignments?: Array<
    ShiftAssignmentRow & {
      profiles?: { id: string; full_name: string; wage_rate_cents: number | null } | null;
    }
  >;
};

export async function getAdminScheduleOverview() {
  const supabase = await createClient();
  const [{ data: shifts }, { data: workers }, { data: pendingTrades }] = await Promise.all([
    supabase
      .from("shifts")
      .select("*, shift_assignments(id, worker_id, role, pay_rate_override_cents, profiles(id, full_name, wage_rate_cents))")
      .order("shift_date", { ascending: false })
      .order("start_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("status", "active")
      .eq("role", "worker")
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase
      .from("shift_trade_requests")
      .select("*, shift_assignments(shift_id), requested_by:profiles!shift_trade_requests_requested_by_worker_id_fkey(full_name), target:profiles!shift_trade_requests_target_worker_id_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
  ]);

  return {
    shifts: shifts ?? [],
    workers: workers ?? [],
    pendingTrades: pendingTrades ?? []
  };
}

export async function getAdminScheduleCalendar(input: { month: string; selectedDate?: string }) {
  const supabase = await createClient();
  const monthStart = new Date(`${input.month}-01T00:00:00`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const startDate = monthStart.toISOString().slice(0, 10);
  const endDate = monthEnd.toISOString().slice(0, 10);

  const [{ data: shifts }, { data: pendingTrades }] = await Promise.all([
    supabase
      .from("shifts")
      .select("*, shift_assignments(id, worker_id, role, pay_rate_override_cents, profiles(id, full_name, wage_rate_cents))")
      .gte("shift_date", startDate)
      .lte("shift_date", endDate)
      .order("shift_date", { ascending: true })
      .order("start_at", { ascending: true }),
    supabase
      .from("shift_trade_requests")
      .select("*, shift_assignments(shift_id), requested_by:profiles!shift_trade_requests_requested_by_worker_id_fkey(full_name), target:profiles!shift_trade_requests_target_worker_id_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
  ]);

  const shiftRows = (shifts ?? []) as ScheduleShiftWithAssignments[];
  const selectedDate = input.selectedDate ?? startDate;
  const selectedDateShifts = shiftRows.filter((shift) => shift.shift_date === selectedDate);
  const shiftsByDate = new Map<
    string,
    {
      shifts: ScheduleShiftWithAssignments[];
      workerIds: Set<string>;
      hasDraft: boolean;
      hasPublished: boolean;
    }
  >();

  for (const shift of shiftRows) {
    const current = shiftsByDate.get(shift.shift_date) ?? {
      shifts: [],
      workerIds: new Set<string>(),
      hasDraft: false,
      hasPublished: false
    };
    current.shifts.push(shift);
    for (const assignment of shift.shift_assignments ?? []) {
      current.workerIds.add(assignment.worker_id);
    }
    if (shift.status === "draft") {
      current.hasDraft = true;
    }
    if (shift.status === "published") {
      current.hasPublished = true;
    }
    shiftsByDate.set(shift.shift_date, current);
  }

  return {
    monthStart: startDate,
    monthEnd: endDate,
    shiftsByDate,
    selectedDate,
    selectedDateShifts,
    pendingTrades: pendingTrades ?? []
  };
}

export async function getShiftDetail(shiftId: string) {
  const supabase = await createClient();
  const [{ data: shift }, { data: assignments }, { data: workers }, { data: tradeRequests }] = await Promise.all([
    supabase.from("shifts").select("*").eq("id", shiftId).maybeSingle<ShiftRow>(),
    supabase
      .from("shift_assignments")
      .select("*, profiles(id, full_name, wage_rate_cents)")
      .eq("shift_id", shiftId)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("status", "active")
      .eq("role", "worker")
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase
      .from("shift_trade_requests")
      .select("*, requested_by:profiles!shift_trade_requests_requested_by_worker_id_fkey(full_name), target:profiles!shift_trade_requests_target_worker_id_fkey(full_name)")
      .in(
        "shift_assignment_id",
        (
          (
            await supabase.from("shift_assignments").select("id").eq("shift_id", shiftId)
          ).data ?? []
        ).map((row) => row.id)
      )
      .order("created_at", { ascending: false })
  ]);

  return {
    shift: shift ?? null,
    assignments: assignments ?? [],
    workers: workers ?? [],
    tradeRequests: tradeRequests ?? []
  };
}

export async function getWorkerSchedule(workerId: string) {
  const supabase = await createClient();
  const [{ data: assignments }, { data: workers }, { data: tradeRequests }] = await Promise.all([
    supabase
      .from("shift_assignments")
      .select("*, shifts(*), profiles(id, full_name, wage_rate_cents)")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("status", "active")
      .eq("role", "worker")
      .neq("id", workerId)
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase
      .from("shift_trade_requests")
      .select("*")
      .eq("requested_by_worker_id", workerId)
      .order("created_at", { ascending: false })
      .returns<ShiftTradeRequestRow[]>()
  ]);

  return {
    assignments: assignments ?? [],
    workers: workers ?? [],
    tradeRequests: tradeRequests ?? []
  };
}

export function getEffectivePayRate(
  assignment: Pick<ShiftAssignmentRow, "pay_rate_override_cents"> & {
    profiles?: { wage_rate_cents?: number | null } | null;
  }
) {
  return assignment.pay_rate_override_cents ?? assignment.profiles?.wage_rate_cents ?? null;
}

export function formatRole(role: string) {
  return role === "service" ? "Service" : "Prep";
}

export function formatShiftStatus(status: string) {
  return status === "published" ? "Published" : "Draft";
}
