import { createClient } from "@/lib/supabase/server";
import { getPayPeriodOverview, syncPayPeriods } from "@/lib/data/pay-batches";
import type { PayPeriodRow, ProfileRow, TipRecordRow } from "@/lib/types";

export type WorkerPaySummary = {
  worker: ProfileRow;
  total_travel_wages_cents: number;
  total_prep_wages_cents: number;
  total_service_wages_cents: number;
  total_wages_cents: number;
  total_paid_wages_cents: number;
  total_unpaid_wages_cents: number;
  total_cash_tips_cents: number;
  total_online_tips_cents: number;
  total_tips_cents: number;
  total_overall_pay_cents: number;
  total_paid_amount_cents: number;
  total_unpaid_amount_cents: number;
  pay_status: "paid" | "unpaid" | "partial";
};

type TipRecordWithShift = TipRecordRow & {
  shifts?: { id: string; location_name: string } | { id: string; location_name: string }[] | null;
};

export type WorkerPayPeriodCard = {
  period: PayPeriodRow;
  summary: WorkerPaySummary;
  display_status: "paid" | "pending";
};

export async function getAdminPayData(filters: {
  payPeriodId?: string;
  workerId?: string;
  tipId?: string;
}) {
  await syncPayPeriods();
  const supabase = await createClient();
  const workerFilter = filters.workerId && filters.workerId !== "all" ? filters.workerId : undefined;
  const { periods, selectedPeriod } = await getPayPeriodOverview(filters.payPeriodId);

  if (!selectedPeriod) {
    return {
      periods,
      selectedPeriod: null,
      periodLabel: "No pay periods yet",
      workers: [],
      summaries: [],
      tipRecords: [],
      selectedWorker: null,
      selectedWorkerId: null,
      selectedTip: null,
      selectedWorkerTips: [],
      totals: {
        total_wages_cents: 0,
        total_tips_cents: 0,
        total_paid_cents: 0,
        total_unpaid_cents: 0
      }
    };
  }

  let timeDaysQuery = supabase
    .from("time_days")
    .select("worker_id, work_date, travel_labor_cost_cents, prep_labor_cost_cents, service_labor_cost_cents, total_labor_cost_cents")
    .eq("pay_period_id", selectedPeriod.id);

  let tipsQuery = supabase
    .from("tip_records")
    .select("*, shifts(id, location_name)")
    .eq("pay_period_id", selectedPeriod.id)
    .order("tip_date", { ascending: false })
    .order("created_at", { ascending: false });

  const workersBaseQuery = supabase
    .from("profiles")
    .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
    .eq("role", "worker")
    .order("full_name");

  if (workerFilter) {
    timeDaysQuery = timeDaysQuery.eq("worker_id", workerFilter);
    tipsQuery = tipsQuery.eq("worker_id", workerFilter);
  }

  const [{ data: workers }, { data: timeDays }, { data: tipRecords }] = await Promise.all([
    (workerFilter ? workersBaseQuery.eq("id", workerFilter) : workersBaseQuery).returns<ProfileRow[]>(),
    timeDaysQuery,
    tipsQuery.returns<TipRecordWithShift[]>()
  ]);

  const tipRows = tipRecords ?? [];
  const summaryByWorker = new Map<string, WorkerPaySummary>();
  const isPaidPeriod = selectedPeriod.status === "paid";

  for (const worker of workers ?? []) {
    summaryByWorker.set(worker.id, {
      worker,
      total_travel_wages_cents: 0,
      total_prep_wages_cents: 0,
      total_service_wages_cents: 0,
      total_wages_cents: 0,
      total_paid_wages_cents: 0,
      total_unpaid_wages_cents: 0,
      total_cash_tips_cents: 0,
      total_online_tips_cents: 0,
      total_tips_cents: 0,
      total_overall_pay_cents: 0,
      total_paid_amount_cents: 0,
      total_unpaid_amount_cents: 0,
      pay_status: "unpaid"
    });
  }

  for (const day of timeDays ?? []) {
    const current = summaryByWorker.get(day.worker_id);
    if (!current) continue;

    current.total_travel_wages_cents += day.travel_labor_cost_cents ?? 0;
    current.total_prep_wages_cents += day.prep_labor_cost_cents ?? 0;
    current.total_service_wages_cents += day.service_labor_cost_cents ?? 0;
    current.total_wages_cents += day.total_labor_cost_cents ?? 0;
    current.total_overall_pay_cents += day.total_labor_cost_cents ?? 0;

    if (isPaidPeriod) {
      current.total_paid_wages_cents += day.total_labor_cost_cents ?? 0;
      current.total_paid_amount_cents += day.total_labor_cost_cents ?? 0;
    } else {
      current.total_unpaid_wages_cents += day.total_labor_cost_cents ?? 0;
      current.total_unpaid_amount_cents += day.total_labor_cost_cents ?? 0;
    }
  }

  for (const tip of tipRows) {
    const current = summaryByWorker.get(tip.worker_id);
    if (!current) continue;

    const tipTotal = tip.cash_tip_cents + tip.online_tip_cents;
    current.total_cash_tips_cents += tip.cash_tip_cents;
    current.total_online_tips_cents += tip.online_tip_cents;
    current.total_tips_cents += tipTotal;
    current.total_overall_pay_cents += tipTotal;

    if (isPaidPeriod) {
      current.total_paid_amount_cents += tipTotal;
    } else {
      current.total_unpaid_amount_cents += tipTotal;
    }
  }

  const summaries: WorkerPaySummary[] = Array.from(summaryByWorker.values())
    .map((summary) => ({
      ...summary,
      pay_status:
        summary.total_paid_amount_cents > 0 && summary.total_unpaid_amount_cents > 0
          ? ("partial" as const)
          : summary.total_paid_amount_cents > 0
            ? ("paid" as const)
            : ("unpaid" as const)
    }))
    .sort((a, b) => a.worker.full_name.localeCompare(b.worker.full_name));

  const selectedWorker =
    workerFilter
      ? (workers ?? []).find((worker: ProfileRow) => worker.id === workerFilter) ?? null
      : workers?.[0] ?? null;
  const selectedWorkerId = workerFilter ?? selectedWorker?.id ?? null;
  const selectedTip =
    (filters.tipId ? tipRows.find((tip: TipRecordWithShift) => tip.id === filters.tipId) : undefined) ??
    (selectedWorkerId ? tipRows.find((tip: TipRecordWithShift) => tip.worker_id === selectedWorkerId) : undefined) ??
    null;
  const selectedWorkerTips = selectedWorkerId
    ? tipRows.filter((tip: TipRecordWithShift) => tip.worker_id === selectedWorkerId)
    : [];

  return {
    periods,
    selectedPeriod,
    periodLabel: formatPayPeriodLabel(selectedPeriod),
    workers: workers ?? [],
    summaries,
    tipRecords: tipRows,
    selectedWorker,
    selectedWorkerId,
    selectedTip,
    selectedWorkerTips,
    totals: {
      total_wages_cents: summaries.reduce((sum, summary) => sum + summary.total_wages_cents, 0),
      total_tips_cents: summaries.reduce((sum, summary) => sum + summary.total_tips_cents, 0),
      total_paid_cents: summaries.reduce((sum, summary) => sum + summary.total_paid_amount_cents, 0),
      total_unpaid_cents: summaries.reduce((sum, summary) => sum + summary.total_unpaid_amount_cents, 0)
    }
  };
}

export async function getWorkerPaySummary(workerId: string, payPeriodId?: string) {
  const data = await getAdminPayData({
    payPeriodId,
    workerId
  });

  return data.summaries[0] ?? null;
}

export async function getWorkerPayPageData(workerId: string, selectedPeriodId?: string) {
  await syncPayPeriods();
  const supabase = await createClient();
  const { periods } = await getPayPeriodOverview();
  const recentPeriods = periods.slice(0, 3);

  const cards: WorkerPayPeriodCard[] = [];

  for (const period of recentPeriods) {
    const summary =
      (await getWorkerPaySummary(workerId, period.id)) ??
      createEmptyWorkerPaySummary({
        id: workerId,
        email: "",
        full_name: "Worker",
        role: "worker",
        employee_type: "employee",
        status: "active",
        wage_rate_cents: null,
        travel_wage_rate_cents: null,
        prep_wage_rate_cents: null,
        service_wage_rate_cents: null,
        tip_eligible: false,
        notes: null
      });

    cards.push({
      period,
      summary,
      display_status: period.status === "paid" ? "paid" : "pending"
    });
  }

  const selectedCard =
    cards.find((card) => card.period.id === selectedPeriodId) ??
    cards[0] ??
    null;

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: ytdDays }, { data: ytdTipRows }] = await Promise.all([
    supabase
      .from("time_days")
      .select("total_labor_cost_cents")
      .eq("worker_id", workerId)
      .gte("work_date", yearStart)
      .lte("work_date", today),
    supabase
      .from("tip_records")
      .select("cash_tip_cents, online_tip_cents")
      .eq("worker_id", workerId)
      .gte("tip_date", yearStart)
      .lte("tip_date", today)
  ]);

  const ytdWages = (ytdDays ?? []).reduce((sum, day) => sum + (day.total_labor_cost_cents ?? 0), 0);
  const ytdTipsTotal = (ytdTipRows ?? []).reduce(
    (sum, tip) => sum + (tip.cash_tip_cents ?? 0) + (tip.online_tip_cents ?? 0),
    0
  );

  return {
    cards,
    selectedCard,
    ytd: {
      total_wages_cents: ytdWages,
      total_tips_cents: ytdTipsTotal,
      total_pay_cents: ytdWages + ytdTipsTotal
    }
  };
}

export async function getDefaultPayRange(today = new Date()) {
  const isoToday = today.toISOString().slice(0, 10);
  const { selectedPeriod } = await getPayPeriodOverview();

  return {
    payPeriodId: selectedPeriod?.id ?? null,
    label: selectedPeriod ? formatPayPeriodLabel(selectedPeriod) : isoToday
  };
}

export function formatPayPeriodLabel(period: Pick<PayPeriodRow, "start_date" | "end_date">) {
  return `${period.start_date} to ${period.end_date}`;
}

function createEmptyWorkerPaySummary(worker: ProfileRow): WorkerPaySummary {
  return {
    worker,
    total_travel_wages_cents: 0,
    total_prep_wages_cents: 0,
    total_service_wages_cents: 0,
    total_wages_cents: 0,
    total_paid_wages_cents: 0,
    total_unpaid_wages_cents: 0,
    total_cash_tips_cents: 0,
    total_online_tips_cents: 0,
    total_tips_cents: 0,
    total_overall_pay_cents: 0,
    total_paid_amount_cents: 0,
    total_unpaid_amount_cents: 0,
    pay_status: "unpaid"
  };
}
