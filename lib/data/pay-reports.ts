import { createClient } from "@/lib/supabase/server";
import { getPayPeriodOverview, getPayBatchDetail, syncPayPeriods } from "@/lib/data/pay-batches";
import type { PayPeriodRow, ProfileRow, TimeDayRow, TipRecordRow } from "@/lib/types";

type PeriodRelation = { pay_periods?: PayPeriodRow | PayPeriodRow[] | null };

export type PayrollReportIndexData = {
  periods: PayPeriodRow[];
  selectedPeriod: PayPeriodRow | null;
  workers: ProfileRow[];
  selectedWorker: ProfileRow | null;
  years: number[];
  selectedYear: number;
};

export type PayrollPeriodWorkerReport = {
  period: PayPeriodRow;
  worker: ProfileRow;
  summary: {
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
    status: "paid" | "partial" | "unpaid";
  };
  timeDays: TimeDayRow[];
  tipRecords: TipRecordRow[];
  generatedAt: string;
};

export type PayrollAnnualPeriodRow = {
  period: PayPeriodRow | null;
  label: string;
  total_wages_cents: number;
  total_tips_cents: number;
  total_amount_cents: number;
  total_paid_cents: number;
  total_unpaid_cents: number;
  status: "paid" | "partial" | "unpaid";
};

export type PayrollAnnualWorkerReport = {
  worker: ProfileRow;
  year: number;
  totals: {
    total_travel_wages_cents: number;
    total_prep_wages_cents: number;
    total_service_wages_cents: number;
    total_wages_cents: number;
    total_cash_tips_cents: number;
    total_online_tips_cents: number;
    total_tips_cents: number;
    total_paid_cents: number;
    total_unpaid_cents: number;
    total_amount_cents: number;
  };
  periods: PayrollAnnualPeriodRow[];
  generatedAt: string;
};

export async function getPayrollReportIndexData(filters: {
  payPeriodId?: string;
  workerId?: string;
  year?: number;
} = {}): Promise<PayrollReportIndexData> {
  await syncPayPeriods();
  const supabase = await createClient();
  const [{ periods, selectedPeriod }, { data: workers }, { data: timeDays }, { data: tipRecords }] = await Promise.all([
    getPayPeriodOverview(filters.payPeriodId),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("role", "worker")
      .eq("status", "active")
      .order("full_name")
      .returns<ProfileRow[]>(),
    supabase.from("time_days").select("work_date").order("work_date", { ascending: false }),
    supabase.from("tip_records").select("tip_date").order("tip_date", { ascending: false })
  ]);

  const selectedWorker =
    (workers ?? []).find((worker) => worker.id === filters.workerId) ??
    workers?.[0] ??
    null;

  const years = Array.from(
    new Set(
      [...(timeDays ?? []).map((row) => Number(String(row.work_date).slice(0, 4))), ...(tipRecords ?? []).map((row) => Number(String(row.tip_date).slice(0, 4))), new Date().getFullYear()].filter(
        (value) => Number.isFinite(value)
      )
    )
  ).sort((a, b) => b - a);

  return {
    periods,
    selectedPeriod,
    workers: workers ?? [],
    selectedWorker,
    years,
    selectedYear: filters.year && years.includes(filters.year) ? filters.year : years[0] ?? new Date().getFullYear()
  };
}

export async function getPayrollPeriodReport(periodId: string) {
  const detail = await getPayBatchDetail(periodId);

  if (!detail.batch) {
    return null;
  }

  return {
    period: detail.batch,
    summaries: detail.summaries,
    timeDays: detail.timeDays,
    tipRecords: detail.tipRecords,
    totals: {
      total_wages_cents: detail.summaries.reduce((sum, summary) => sum + summary.total_wages_cents, 0),
      total_tips_cents: detail.summaries.reduce((sum, summary) => sum + summary.total_tips_cents, 0),
      total_paid_cents: detail.summaries.reduce((sum, summary) => sum + summary.total_paid_cents, 0),
      total_unpaid_cents: detail.summaries.reduce((sum, summary) => sum + summary.total_unpaid_cents, 0),
      total_amount_cents: detail.summaries.reduce((sum, summary) => sum + summary.total_amount_cents, 0)
    },
    generatedAt: new Date().toISOString()
  };
}

export async function getPayrollPeriodWorkerReport(workerId: string, periodId: string): Promise<PayrollPeriodWorkerReport | null> {
  const supabase = await createClient();
  const [detail, { data: worker }] = await Promise.all([
    getPayBatchDetail(periodId),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("id", workerId)
      .maybeSingle<ProfileRow>()
  ]);

  if (!detail.batch || !worker) {
    return null;
  }

  const summary =
    detail.summaries.find((item) => item.worker.id === workerId) ??
    {
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
    };

  return {
    period: detail.batch,
    worker,
    summary: {
      ...summary,
      status:
        summary.total_paid_cents > 0 && summary.total_unpaid_cents > 0
          ? "partial"
          : summary.total_paid_cents > 0
            ? "paid"
            : "unpaid"
    },
    timeDays: detail.timeDays.filter((day) => day.worker_id === workerId),
    tipRecords: detail.tipRecords.filter((tip) => tip.worker_id === workerId),
    generatedAt: new Date().toISOString()
  };
}

export async function getPayrollAnnualWorkerReport(workerId: string, year: number): Promise<PayrollAnnualWorkerReport | null> {
  await syncPayPeriods();
  const supabase = await createClient();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const [{ data: worker }, { data: timeDays }, { data: tipRecords }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
      .eq("id", workerId)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("time_days")
      .select("*, pay_periods(id, start_date, end_date, status, paid_at, paid_by, created_at, updated_at)")
      .eq("worker_id", workerId)
      .gte("work_date", startDate)
      .lte("work_date", endDate)
      .order("work_date", { ascending: true }),
    supabase
      .from("tip_records")
      .select("*, pay_periods(id, start_date, end_date, status, paid_at, paid_by, created_at, updated_at)")
      .eq("worker_id", workerId)
      .gte("tip_date", startDate)
      .lte("tip_date", endDate)
      .order("tip_date", { ascending: true })
  ]);

  if (!worker) {
    return null;
  }

  const totals = {
    total_travel_wages_cents: 0,
    total_prep_wages_cents: 0,
    total_service_wages_cents: 0,
    total_wages_cents: 0,
    total_cash_tips_cents: 0,
    total_online_tips_cents: 0,
    total_tips_cents: 0,
    total_paid_cents: 0,
    total_unpaid_cents: 0,
    total_amount_cents: 0
  };

  const periodMap = new Map<string, PayrollAnnualPeriodRow>();

  for (const day of ((timeDays ?? []) as Array<TimeDayRow & PeriodRelation>)) {
    const period = normalizePeriod(day.pay_periods);
    const key = period?.id ?? `unassigned-${day.work_date}`;
    const current =
      periodMap.get(key) ??
      {
        period,
        label: period ? `${period.start_date} to ${period.end_date}` : `Unassigned day ${day.work_date}`,
        total_wages_cents: 0,
        total_tips_cents: 0,
        total_amount_cents: 0,
        total_paid_cents: 0,
        total_unpaid_cents: 0,
        status: "unpaid" as const
      };

    current.total_wages_cents += day.total_labor_cost_cents;
    current.total_amount_cents += day.total_labor_cost_cents;

    totals.total_travel_wages_cents += day.travel_labor_cost_cents;
    totals.total_prep_wages_cents += day.prep_labor_cost_cents;
    totals.total_service_wages_cents += day.service_labor_cost_cents;
    totals.total_wages_cents += day.total_labor_cost_cents;
    totals.total_amount_cents += day.total_labor_cost_cents;

    if (period?.status === "paid") {
      current.total_paid_cents += day.total_labor_cost_cents;
      totals.total_paid_cents += day.total_labor_cost_cents;
    } else {
      current.total_unpaid_cents += day.total_labor_cost_cents;
      totals.total_unpaid_cents += day.total_labor_cost_cents;
    }

    periodMap.set(key, current);
  }

  for (const tip of ((tipRecords ?? []) as Array<TipRecordRow & PeriodRelation>)) {
    const period = normalizePeriod(tip.pay_periods);
    const key = period?.id ?? `unassigned-${tip.tip_date}`;
    const current =
      periodMap.get(key) ??
      {
        period,
        label: period ? `${period.start_date} to ${period.end_date}` : `Unassigned tips ${tip.tip_date}`,
        total_wages_cents: 0,
        total_tips_cents: 0,
        total_amount_cents: 0,
        total_paid_cents: 0,
        total_unpaid_cents: 0,
        status: "unpaid" as const
      };

    const tipTotal = tip.cash_tip_cents + tip.online_tip_cents;
    current.total_tips_cents += tipTotal;
    current.total_amount_cents += tipTotal;

    totals.total_cash_tips_cents += tip.cash_tip_cents;
    totals.total_online_tips_cents += tip.online_tip_cents;
    totals.total_tips_cents += tipTotal;
    totals.total_amount_cents += tipTotal;

    if (period?.status === "paid") {
      current.total_paid_cents += tipTotal;
      totals.total_paid_cents += tipTotal;
    } else {
      current.total_unpaid_cents += tipTotal;
      totals.total_unpaid_cents += tipTotal;
    }

    periodMap.set(key, current);
  }

  const periods = Array.from(periodMap.values())
    .map((period) => ({
      ...period,
      status:
        period.total_paid_cents > 0 && period.total_unpaid_cents > 0
          ? ("partial" as const)
          : period.total_paid_cents > 0
            ? ("paid" as const)
            : ("unpaid" as const)
    }))
    .sort((a, b) => {
      const left = a.period?.start_date ?? a.label;
      const right = b.period?.start_date ?? b.label;
      return right.localeCompare(left);
    });

  return {
    worker,
    year,
    totals,
    periods,
    generatedAt: new Date().toISOString()
  };
}

function normalizePeriod(period: PayPeriodRow | PayPeriodRow[] | null | undefined) {
  if (!period) {
    return null;
  }

  return Array.isArray(period) ? period[0] ?? null : period;
}
