import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { formatPayPeriodLabel, getWorkerPayPageData } from "@/lib/data/pay";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { AppButton } from "@/components/app-button";
import { WorkerPageShell } from "@/components/worker-page-shell";

type WorkerPayPageProps = {
  searchParams?: Promise<{ period?: string }>;
};

function getStatusPillClass(status: "paid" | "pending") {
  return status === "paid" ? "pill ok" : "pill warn";
}

export default async function WorkerPayPage({ searchParams }: WorkerPayPageProps) {
  const { profile } = await requireProfile("worker");
  const params = (await searchParams) ?? {};
  const data = await getWorkerPayPageData(profile.id, params.period);

  return (
    <WorkerPageShell title="Pay" subtitle="Quick pay status without the clutter">
      <section className="card metric">
        <span className="eyebrow">Year to Date Pay</span>
        <strong>{formatCurrencyFromCents(data.ytd.total_pay_cents)}</strong>
        <span className="muted">
          Wages {formatCurrencyFromCents(data.ytd.total_wages_cents)} · Tips{" "}
          {formatCurrencyFromCents(data.ytd.total_tips_cents)}
        </span>
      </section>

      <section className="stack" style={{ marginTop: 16 }}>
        <div className="eyebrow">Recent Pay Periods</div>
        <h2 style={{ margin: 0 }}>Your last 3 pay periods</h2>
        {data.cards.length === 0 ? (
          <section className="card stack">
            <p className="muted">No pay periods are available yet.</p>
          </section>
        ) : (
          <div className="grid">
            {data.cards.map((card, index) => {
              const selected = data.selectedCard?.period.id === card.period.id;
              const label =
                index === 0 ? "Current pay period" : index === 1 ? "Last pay period" : "Previous pay period";

              return (
                <Link
                  className={`period-card ${selected ? "selected" : ""}`}
                  href={`/worker/pay?period=${card.period.id}`}
                  key={card.period.id}
                >
                  <div className="summary-row">
                    <div>
                      <div className="eyebrow">{label}</div>
                      <strong>{formatPayPeriodLabel(card.period)}</strong>
                    </div>
                    <span className={getStatusPillClass(card.display_status)}>
                      {card.display_status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <div className="period-amount">{formatCurrencyFromCents(card.summary.total_overall_pay_cents)}</div>
                  <div className="muted">
                    {card.display_status === "paid"
                      ? `Paid ${card.period.paid_at?.slice(0, 10) ?? ""}`
                      : "Not paid yet"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {data.selectedCard ? (
        <section className="card stack" style={{ marginTop: 16 }}>
          <div className="summary-row">
            <div>
              <div className="eyebrow">Selected Period</div>
              <h2 style={{ margin: "6px 0 0 0" }}>{formatPayPeriodLabel(data.selectedCard.period)}</h2>
            </div>
            <span className={getStatusPillClass(data.selectedCard.display_status)}>
              {data.selectedCard.display_status === "paid" ? "Paid" : "Pending"}
            </span>
          </div>

          <div className="summary-kpis">
            <div className="summary-kpi">
              <span className="eyebrow">Travel Wages</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_travel_wages_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Prep Wages</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_prep_wages_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Service Wages</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_service_wages_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Total Wages</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_wages_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Cash Tips</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_cash_tips_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Online Tips</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_online_tips_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Total Tips</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_tips_cents)}</strong>
            </div>
            <div className="summary-kpi">
              <span className="eyebrow">Total Pay</span>
              <strong>{formatCurrencyFromCents(data.selectedCard.summary.total_overall_pay_cents)}</strong>
            </div>
          </div>

          <div className="muted">
            {data.selectedCard.display_status === "paid"
              ? `This pay period was paid on ${data.selectedCard.period.paid_at?.slice(0, 10) ?? "the recorded date"}.`
              : "This pay period is still pending payment."}
          </div>

          <div className="button-row">
            <Link className="btn secondary" href={`/worker/pay/reports/${data.selectedCard.period.id}`}>
              Print this pay period
            </Link>
            <Link className="btn secondary" href={`/worker/pay/reports/annual?year=${new Date().getFullYear()}`}>
              Print annual summary
            </Link>
            <Link className="btn secondary" href="/worker/time">
              View time history
            </Link>
          </div>
        </section>
      ) : (
        <section className="card stack" style={{ marginTop: 16 }}>
          <div className="eyebrow">Print Pay Records</div>
          <h2 style={{ margin: 0 }}>Print options will appear here</h2>
          <p className="muted">
            Printable pay-period and annual summaries become available after your first recorded pay period.
          </p>
          <div className="button-row">
            <AppButton variant="secondary"  disabled type="button">
              Print this pay period
            </AppButton>
            <AppButton variant="secondary"  disabled type="button">
              Print annual summary
            </AppButton>
          </div>
        </section>
      )}
    </WorkerPageShell>
  );
}
