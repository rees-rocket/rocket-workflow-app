import { createClient } from "@/lib/supabase/server";
import type { PayPeriodRow, ProfileRow, TimeDayRow, TipRecordRow } from "@/lib/types";

const PAY_PERIOD_LENGTH_DAYS = 14;
const PAY_PERIOD_ANCHOR = "2024-01-01";

type PeriodSummary = {
  worker: ProfileRow;
  total_travel_wages_cents: number;
  total_prep_wages_cents: number;
  total_service_wages_cents: number;
  total_wages_cents: number;
  total_cash_tips_cents: number;
  total_online_tips_cents: number;
  total_tips_cents: number;
  total_amount_cents: number;
  total_paid_cents: number;
  total_unpaid_cents: number;
};

type TimeDayWithProfile = TimeDayRow & { profile: ProfileRow | null };
type TipRecordWithRelations = TipRecordRow & {
  profile: ProfileRow | null;
  shifts?: { id: string; location_name: string } | { id: string; location_name: string }[] | null;
};

export async function syncPayPeriods() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [timeMin, timeMax, tipMin, tipMax] = await Promise.all([
    supabase.from("time_days").select("work_date").order("work_date", { ascending: true }).limit(1).maybeSingle<{ work_date: string }>(),
    supabase.from("time_days").select("work_date").order("work_date", { ascending: false }).limit(1).maybeSingle<{ work_date: string }>(),
    supabase.from("tip_records").select("tip_date").order("tip_date", { ascending: true }).limit(1).maybeSingle<{ tip_date: string }>(),
    supabase.from("tip_records").select("tip_date").order("tip_date", { ascending: false }).limit(1).maybeSingle<{ tip_date: string }>()
  ]);

  const knownDates = [
    timeMin.data?.work_date,
    timeMax.data?.work_date,
    tipMin.data?.tip_date,
    tipMax.data?.tip_date,
    today
  ].filter(Boolean) as string[];

  const earliest = knownDates.sort()[0] ?? today;
  const latest = knownDates.sort().at(-1) ?? today;
  const startDate = addDays(getPeriodStart(earliest), -PAY_PERIOD_LENGTH_DAYS * 2);
  const endDate = addDays(getPeriodEnd(latest), PAY_PERIOD_LENGTH_DAYS * 2);

  const periodsToEnsure: Array<Pick<PayPeriodRow, "start_date" | "end_date" | "status">> = [];
  for (let current = startDate; current <= endDate; current = addDays(current, PAY_PERIOD_LENGTH_DAYS)) {
    periodsToEnsure.push({
      start_date: current,
      end_date: addDays(current, PAY_PERIOD_LENGTH_DAYS - 1),
      status: "open"
    });
  }

  if (periodsToEnsure.length > 0) {
    await supabase.from("pay_periods").upsert(periodsToEnsure, {
      onConflict: "start_date,end_date",
      ignoreDuplicates: true
    });
  }

  const { data: periods } = await supabase
    .from("pay_periods")
    .select("*")
    .gte("start_date", startDate)
    .lte("end_date", endDate)
    .order("start_date", { ascending: false })
    .returns<PayPeriodRow[]>();

  for (const period of periods ?? []) {
    await Promise.all([
      supabase
        .from("time_days")
        .update({ pay_period_id: period.id })
        .is("pay_period_id", null)
        .gte("work_date", period.start_date)
        .lte("work_date", period.end_date),
      supabase
        .from("tip_records")
        .update({ pay_period_id: period.id })
        .is("pay_period_id", null)
        .gte("tip_date", period.start_date)
        .lte("tip_date", period.end_date)
    ]);
  }

  return periods ?? [];
}

export async function getPayPeriodForDate(date: string) {
  const periods = await syncPayPeriods();
  return periods.find((period) => period.start_date <= date && period.end_date >= date) ?? null;
}

export async function getPayPeriodOverview(selectedPeriodId?: string) {
  const supabase = await createClient();
  const periods = await syncPayPeriods();
  const orderedPeriods = [...periods].sort((a, b) => b.start_date.localeCompare(a.start_date));
  const today = new Date().toISOString().slice(0, 10);

  const selectedPeriod =
    orderedPeriods.find((period) => period.id === selectedPeriodId) ??
    orderedPeriods.find((period) => period.start_date <= today && period.end_date >= today) ??
    orderedPeriods[0] ??
    null;

  return {
    periods: orderedPeriods,
    selectedPeriod
  };
}

export async function getPayBatchSummary(filters: { payPeriodId?: string }) {
  const supabase = await createClient();
  const { periods, selectedPeriod } = await getPayPeriodOverview(filters.payPeriodId);

  return {
    batches: periods,
    selectedPeriod,
    workers:
      (
        await supabase
          .from("profiles")
          .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
          .eq("role", "worker")
          .order("full_name")
          .returns<ProfileRow[]>()
      ).data ?? []
  };
}

export async function getPayBatchDetail(periodId: string) {
  const supabase = await createClient();
  await syncPayPeriods();

  const [{ data: period }, { data: timeDays }, { data: tipRecords }] = await Promise.all([
    supabase.from("pay_periods").select("*").eq("id", periodId).maybeSingle<PayPeriodRow>(),
    supabase
      .from("time_days")
      .select("*, profiles!time_days_worker_id_fkey(id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes)")
      .eq("pay_period_id", periodId)
      .order("work_date", { ascending: true }),
    supabase
      .from("tip_records")
      .select("*, profiles!tip_records_worker_id_fkey(id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes), shifts(id, location_name)")
      .eq("pay_period_id", periodId)
      .order("tip_date", { ascending: true })
  ]);

  const dayRows = ((timeDays as Array<TimeDayRow & { profiles: ProfileRow | null }>) ?? []).map((day) => ({
    ...day,
    profile: day.profiles
  })) as TimeDayWithProfile[];

  const tipRows =
    ((tipRecords as Array<
      TipRecordRow & {
        profiles: ProfileRow | null;
        shifts?: { id: string; location_name: string } | { id: string; location_name: string }[] | null;
      }
    >) ?? []).map((tip) => ({
      ...tip,
      profile: tip.profiles
    })) as TipRecordWithRelations[];

  const workers = new Map<string, ProfileRow>();
  for (const day of dayRows) {
    if (day.profile) {
      workers.set(day.worker_id, day.profile);
    }
  }
  for (const tip of tipRows) {
    if (tip.profile) {
      workers.set(tip.worker_id, tip.profile);
    }
  }

  const summaries = new Map<string, PeriodSummary>();
  for (const worker of workers.values()) {
    summaries.set(worker.id, {
      worker,
      total_travel_wages_cents: 0,
      total_prep_wages_cents: 0,
      total_service_wages_cents: 0,
      total_wages_cents: 0,
      total_cash_tips_cents: 0,
      total_online_tips_cents: 0,
      total_tips_cents: 0,
      total_amount_cents: 0,
      total_paid_cents: 0,
      total_unpaid_cents: 0
    });
  }

  const isPaidPeriod = period?.status === "paid";

  for (const day of dayRows) {
    const summary = summaries.get(day.worker_id);
    if (!summary) continue;
    summary.total_travel_wages_cents += day.travel_labor_cost_cents;
    summary.total_prep_wages_cents += day.prep_labor_cost_cents;
    summary.total_service_wages_cents += day.service_labor_cost_cents;
    summary.total_wages_cents += day.total_labor_cost_cents;
    summary.total_amount_cents += day.total_labor_cost_cents;
    if (isPaidPeriod) {
      summary.total_paid_cents += day.total_labor_cost_cents;
    } else {
      summary.total_unpaid_cents += day.total_labor_cost_cents;
    }
  }

  for (const tip of tipRows) {
    const summary = summaries.get(tip.worker_id);
    if (!summary) continue;
    const tipTotal = tip.cash_tip_cents + tip.online_tip_cents;
    summary.total_cash_tips_cents += tip.cash_tip_cents;
    summary.total_online_tips_cents += tip.online_tip_cents;
    summary.total_tips_cents += tipTotal;
    summary.total_amount_cents += tipTotal;
    if (isPaidPeriod) {
      summary.total_paid_cents += tipTotal;
    } else {
      summary.total_unpaid_cents += tipTotal;
    }
  }

  return {
    batch: period,
    summaries: Array.from(summaries.values()).sort((a, b) => a.worker.full_name.localeCompare(b.worker.full_name)),
    timeDays: dayRows,
    tipRecords: tipRows
  };
}

function getPeriodStart(dateString: string) {
  const anchor = toUtcDate(PAY_PERIOD_ANCHOR);
  const target = toUtcDate(dateString);
  const diffDays = Math.floor((target.getTime() - anchor.getTime()) / 86400000);
  const offset = Math.floor(diffDays / PAY_PERIOD_LENGTH_DAYS) * PAY_PERIOD_LENGTH_DAYS;
  return formatIsoDate(addDays(PAY_PERIOD_ANCHOR, offset));
}

function getPeriodEnd(dateString: string) {
  return addDays(getPeriodStart(dateString), PAY_PERIOD_LENGTH_DAYS - 1);
}

function addDays(dateString: string, days: number) {
  const date = toUtcDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

function toUtcDate(dateString: string) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function formatIsoDate(date: Date | string) {
  if (typeof date === "string") {
    return date;
  }

  return date.toISOString().slice(0, 10);
}
