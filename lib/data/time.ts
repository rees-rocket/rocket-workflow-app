import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkDate } from "@/lib/time";
import type {
  PayPeriodRow,
  ProfileRow,
  TimeCorrectionRequestRow,
  TimeDayRow,
  TimeSegmentAuditLogRow,
  TimeSegmentRow
} from "@/lib/types";

type PaidSegmentType = "travel" | "prep" | "service";

type ShiftAssignmentRateRow = {
  id: string;
  worker_id: string;
  role: "service" | "prep";
  pay_rate_override_cents: number | null;
  shifts:
    | {
        id: string;
        shift_date: string;
        start_at: string;
        end_at: string;
        status: "draft" | "published";
      }
    | {
        id: string;
        shift_date: string;
        start_at: string;
        end_at: string;
        status: "draft" | "published";
      }[]
    | null;
};

export async function getWorkerDashboardData(workerId: string) {
  const supabase = await createClient();
  const today = getCurrentWorkDate();

  const [{ data: profile }, { data: todayDay }, { data: weekDays }, { data: recentSegments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
        .eq("id", workerId)
        .single<ProfileRow>(),
      supabase
        .from("time_days")
        .select("*")
        .eq("worker_id", workerId)
        .eq("work_date", today)
        .maybeSingle<TimeDayRow>(),
      supabase
        .from("time_days")
        .select("*")
        .eq("worker_id", workerId)
        .gte("work_date", getWeekStart(today))
        .order("work_date", { ascending: false })
        .returns<TimeDayRow[]>(),
      supabase
        .from("time_segments")
        .select("*")
        .eq("worker_id", workerId)
        .order("start_at", { ascending: false })
        .limit(8)
        .returns<TimeSegmentRow[]>()
    ]);

  return {
    profile: profile ?? null,
    todayDay: todayDay ?? null,
    weekDays: weekDays ?? [],
    recentSegments: recentSegments ?? []
  };
}

export async function getAdminTimeData(filters: { workerId?: string; date?: string }) {
  const supabase = await createClient();

  let daysQuery = supabase
    .from("time_days")
    .select("*, profiles!time_days_worker_id_fkey(id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes), pay_periods(status, paid_at)")
    .order("work_date", { ascending: false });

  if (filters.workerId) {
    daysQuery = daysQuery.eq("worker_id", filters.workerId);
  }

  if (filters.date) {
    daysQuery = daysQuery.eq("work_date", filters.date);
  }

  const [{ data: days }, { data: workers }, { data: requests }] = await Promise.all([
    daysQuery,
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("role", "worker")
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase
      .from("time_correction_requests")
      .select("*, profiles!time_correction_requests_worker_id_fkey(id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes)")
      .order("created_at", { ascending: false })
  ]);

  return {
    days:
      (days as Array<
        TimeDayRow & {
          profiles: ProfileRow | null;
          pay_periods: Pick<PayPeriodRow, "status" | "paid_at"> | Pick<PayPeriodRow, "status" | "paid_at">[] | null;
        }
      >)?.map((day) => ({
        ...day,
        profile: day.profiles,
        pay_period: Array.isArray(day.pay_periods) ? day.pay_periods[0] ?? null : day.pay_periods
      })) ?? [],
    workers: workers ?? [],
    correctionRequests:
      ((requests as Array<TimeCorrectionRequestRow & { profiles: ProfileRow | null }>) ?? []).map((request) => ({
        ...request,
        worker: request.profiles
      }))
  };
}

export async function getWorkerTimeData(workerId: string) {
  const supabase = await createClient();
  const [{ data: days }, { data: requests }] = await Promise.all([
    supabase
      .from("time_days")
      .select("*, pay_periods(status, paid_at)")
      .eq("worker_id", workerId)
      .order("work_date", { ascending: false }),
    supabase
      .from("time_correction_requests")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false })
      .returns<TimeCorrectionRequestRow[]>()
  ]);

  return {
    days: (days ?? []).map((day) => ({
      ...day,
      pay_period: Array.isArray(day.pay_periods) ? day.pay_periods[0] ?? null : day.pay_periods
    })),
    correctionRequests: requests ?? []
  };
}

export async function getSegmentsForDay(dayId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_segments")
    .select("*")
    .eq("time_day_id", dayId)
    .order("start_at", { ascending: true })
    .returns<TimeSegmentRow[]>();

  return data ?? [];
}

export async function getAuditLogsForDay(dayId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_segment_audit_logs")
    .select("*")
    .eq("time_day_id", dayId)
    .order("acted_at", { ascending: false })
    .returns<TimeSegmentAuditLogRow[]>();

  return data ?? [];
}

export async function getWorkerList() {
  const supabase = await createClient();
  const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("role", "worker")
      .order("full_name")
    .returns<ProfileRow[]>();

  return data ?? [];
}

export async function recalculateTimeDay(timeDayId: string, workerId: string) {
  const supabase = await createClient();
  const [{ data: segments }, { data: profile }] = await Promise.all([
    supabase
      .from("time_segments")
      .select("*")
      .eq("time_day_id", timeDayId)
      .order("start_at", { ascending: true })
      .returns<TimeSegmentRow[]>(),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("id", workerId)
      .maybeSingle<ProfileRow>()
  ]);

  const safeSegments = segments ?? [];
  const shiftAssignmentIds = safeSegments.flatMap((segment) =>
    segment.shift_assignment_id ? [segment.shift_assignment_id] : []
  );
  const { data: assignmentRows } =
    shiftAssignmentIds.length > 0
      ? await supabase
          .from("shift_assignments")
          .select("id, worker_id, role, pay_rate_override_cents, shifts!inner(id, shift_date, start_at, end_at, status)")
          .in("id", Array.from(new Set(shiftAssignmentIds)))
          .returns<ShiftAssignmentRateRow[]>()
      : { data: [] as ShiftAssignmentRateRow[] };
  const assignmentMap = new Map(
    (assignmentRows ?? []).map((assignment) => [
      assignment.id,
      {
        pay_rate_override_cents: assignment.pay_rate_override_cents,
        role: assignment.role
      }
    ])
  );

  if (!profile) {
    return;
  }

  const segmentUpdates = safeSegments.map((segment) => {
    const normalizedType = normalizePaidSegmentType(segment.segment_type);
    const minutes = minutesForSegment(segment.start_at, segment.end_at);
    const wageRateCentsUsed =
      normalizedType === null
        ? null
        : resolveSegmentWageRate({
            profile,
            segmentType: normalizedType,
            shiftAssignment: segment.shift_assignment_id
              ? assignmentMap.get(segment.shift_assignment_id) ?? null
              : null
          });
    const laborCostCents =
      normalizedType === null || segment.end_at === null || wageRateCentsUsed === null
        ? null
        : Math.round((minutes * wageRateCentsUsed) / 60);

    return {
      segment,
      minutes,
      wageRateCentsUsed,
      laborCostCents
    };
  });

  await Promise.all(
    segmentUpdates.map(({ segment, wageRateCentsUsed, laborCostCents }) =>
      supabase
        .from("time_segments")
        .update({
          wage_rate_cents_used: wageRateCentsUsed,
          labor_cost_cents: laborCostCents
        })
        .eq("id", segment.id)
    )
  );

  const totalTravelMinutes = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) === "travel")
    .reduce((sum, { minutes }) => sum + minutes, 0);
  const totalPrepMinutes = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) === "prep")
    .reduce((sum, { minutes }) => sum + minutes, 0);
  const totalServiceMinutes = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) === "service")
    .reduce((sum, { minutes }) => sum + minutes, 0);
  const totalWorkMinutes = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) !== null)
    .reduce((sum, { minutes }) => sum + minutes, 0);
  const totalBreakMinutes = segmentUpdates
    .filter(({ segment }) => segment.segment_type === "break")
    .reduce((sum, { minutes }) => sum + minutes, 0);
  const totalTravelLaborCostCents = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) === "travel")
    .reduce((sum, { laborCostCents }) => sum + (laborCostCents ?? 0), 0);
  const totalPrepLaborCostCents = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) === "prep")
    .reduce((sum, { laborCostCents }) => sum + (laborCostCents ?? 0), 0);
  const totalServiceLaborCostCents = segmentUpdates
    .filter(({ segment }) => normalizePaidSegmentType(segment.segment_type) === "service")
    .reduce((sum, { laborCostCents }) => sum + (laborCostCents ?? 0), 0);
  const openSegment = safeSegments.find((segment) => segment.end_at === null) ?? null;
  const status: TimeDayRow["status"] =
    openSegment?.segment_type === "break"
      ? "on_break"
      : openSegment?.segment_type === "travel"
        ? "travel"
        : openSegment?.segment_type === "prep"
          ? "prep"
          : openSegment?.segment_type === "service" || openSegment?.segment_type === "work"
            ? "service"
        : "off_clock";

  await supabase
    .from("time_days")
    .update({
      total_travel_minutes: totalTravelMinutes,
      total_prep_minutes: totalPrepMinutes,
      total_service_minutes: totalServiceMinutes,
      total_work_minutes: totalWorkMinutes,
      total_break_minutes: totalBreakMinutes,
      total_payable_minutes: totalWorkMinutes,
      travel_labor_cost_cents: totalTravelLaborCostCents,
      prep_labor_cost_cents: totalPrepLaborCostCents,
      service_labor_cost_cents: totalServiceLaborCostCents,
      total_labor_cost_cents:
        totalTravelLaborCostCents + totalPrepLaborCostCents + totalServiceLaborCostCents,
      status
    })
    .eq("id", timeDayId)
    .eq("worker_id", workerId);
}

export async function logTimeSegmentAudit(input: {
  timeDayId: string;
  timeSegmentId: string | null;
  correctionRequestId?: string | null;
  actionType: string;
  originalValue: unknown;
  newValue: unknown;
  note?: string | null;
  actedBy?: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("time_segment_audit_logs").insert({
    time_day_id: input.timeDayId,
    time_segment_id: input.timeSegmentId,
    correction_request_id: input.correctionRequestId ?? null,
    action_type: input.actionType,
    original_value_json: input.originalValue,
    new_value_json: input.newValue,
    note: input.note ?? null,
    acted_by: input.actedBy ?? null
  });
}

export async function findMatchingShiftAssignmentId(input: {
  workerId: string;
  workDate: string;
  segmentType: PaidSegmentType;
  at: string;
}) {
  if (input.segmentType === "travel") {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("shift_assignments")
    .select("id, worker_id, role, pay_rate_override_cents, shifts!inner(id, shift_date, start_at, end_at, status)")
    .eq("worker_id", input.workerId)
    .eq("role", input.segmentType)
    .returns<ShiftAssignmentRateRow[]>();

  const targetTime = new Date(input.at).getTime();
  const candidates = (data ?? []).filter((assignment) => {
    const shift = Array.isArray(assignment.shifts) ? assignment.shifts[0] : assignment.shifts;
    if (!shift || shift.status !== "published" || shift.shift_date !== input.workDate) {
      return false;
    }

    return true;
  });

  const overlapping = candidates.filter((assignment) => {
    const shift = Array.isArray(assignment.shifts) ? assignment.shifts[0] : assignment.shifts;
    if (!shift) {
      return false;
    }

    return targetTime >= new Date(shift.start_at).getTime() && targetTime <= new Date(shift.end_at).getTime();
  });

  if (overlapping.length === 1) {
    return overlapping[0].id;
  }

  if (candidates.length === 1) {
    return candidates[0].id;
  }

  return null;
}

function normalizePaidSegmentType(segmentType: TimeSegmentRow["segment_type"]): PaidSegmentType | null {
  if (segmentType === "travel" || segmentType === "prep" || segmentType === "service") {
    return segmentType;
  }

  if (segmentType === "work") {
    return "service";
  }

  return null;
}

function resolveSegmentWageRate(input: {
  profile: ProfileRow;
  segmentType: PaidSegmentType;
  shiftAssignment: { pay_rate_override_cents: number | null; role: "service" | "prep" } | null;
}) {
  if (input.shiftAssignment?.pay_rate_override_cents !== null && input.shiftAssignment?.pay_rate_override_cents !== undefined) {
    return input.shiftAssignment.pay_rate_override_cents;
  }

  if (input.segmentType === "travel" && input.profile.travel_wage_rate_cents !== null) {
    return input.profile.travel_wage_rate_cents;
  }

  if (input.segmentType === "prep" && input.profile.prep_wage_rate_cents !== null) {
    return input.profile.prep_wage_rate_cents;
  }

  if (input.segmentType === "service" && input.profile.service_wage_rate_cents !== null) {
    return input.profile.service_wage_rate_cents;
  }

  return input.profile.wage_rate_cents;
}

function minutesForSegment(startAt: string, endAt: string | null) {
  if (!endAt) {
    return 0;
  }

  return Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000));
}

function getWeekStart(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);

  return date.toISOString().slice(0, 10);
}
