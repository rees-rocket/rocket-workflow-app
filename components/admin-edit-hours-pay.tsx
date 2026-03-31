"use client";

import { useState } from "react";
import { AppButton } from "@/components/app-button";
import { ToastProvider, ToastViewport, useToast } from "@/components/toast";

type AdminEditHoursPayValues = {
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number | "";
  hourlyRate: number | "";
  overtimeMultiplier: number | "";
  notes: string;
};

type AdminEditHoursPayPayload = AdminEditHoursPayValues & {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
};

type AdminEditHoursPayProps = {
  initialValues?: Partial<AdminEditHoursPayValues>;
  onCancel?: () => void;
  onDelete?: (values: AdminEditHoursPayValues) => void;
  onSave?: (payload: AdminEditHoursPayPayload) => void;
};

const DEFAULT_VALUES: AdminEditHoursPayValues = {
  employeeName: "John Smith",
  date: "2026-03-30",
  clockIn: "08:00",
  clockOut: "17:00",
  breakMinutes: 30,
  hourlyRate: 18.5,
  overtimeMultiplier: 1.5,
  notes: ""
};

function toMinutes(value: string) {
  if (!value || !value.includes(":")) return null;

  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function formatHours(value: number) {
  return value.toFixed(2);
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function calculateWorkedHours(clockIn: string, clockOut: string, breakMinutes: number | "") {
  const startMinutes = toMinutes(clockIn);
  const endMinutes = toMinutes(clockOut);
  const safeBreakMinutes = Math.max(Number(breakMinutes || 0), 0);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return 0;
  }

  const workedMinutes = endMinutes - startMinutes - safeBreakMinutes;
  if (workedMinutes <= 0) return 0;

  return roundToTwo(workedMinutes / 60);
}

function calculatePay(totalHours: number, hourlyRate: number | "", overtimeMultiplier: number | "") {
  const safeRate = Math.max(Number(hourlyRate || 0), 0);
  const safeMultiplier = Math.max(Number(overtimeMultiplier || 1.5), 1);
  const regularHours = roundToTwo(Math.min(totalHours, 8));
  const overtimeHours = roundToTwo(Math.max(totalHours - 8, 0));
  const regularPay = regularHours * safeRate;
  const overtimePay = overtimeHours * safeRate * safeMultiplier;

  return {
    regularHours,
    overtimeHours,
    grossPay: roundToTwo(regularPay + overtimePay)
  };
}

export default function AdminEditHoursPay({
  initialValues,
  onCancel,
  onDelete,
  onSave
}: AdminEditHoursPayProps) {
  return (
    <ToastProvider>
      <AdminEditHoursPayContent
        initialValues={initialValues}
        onCancel={onCancel}
        onDelete={onDelete}
        onSave={onSave}
      />
      <ToastViewport />
    </ToastProvider>
  );
}

function AdminEditHoursPayContent({
  initialValues,
  onCancel,
  onDelete,
  onSave
}: AdminEditHoursPayProps) {
  const defaultValues = { ...DEFAULT_VALUES, ...initialValues };
  const [form, setForm] = useState<AdminEditHoursPayValues>(defaultValues);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const { pushToast } = useToast();

  const totalHours = calculateWorkedHours(form.clockIn, form.clockOut, form.breakMinutes);
  const paySummary = calculatePay(totalHours, form.hourlyRate, form.overtimeMultiplier);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "breakMinutes" || name === "hourlyRate" || name === "overtimeMultiplier"
          ? value === ""
            ? ""
            : Number(value)
          : value
    }));
  }

  function handleReset(showToast = true) {
    setForm(defaultValues);
    if (showToast) {
      pushToast("Changes reset to the starting values.", { tone: "info" });
    }
  }

  function delay(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function handleCancel() {
    if (onCancel) {
      await Promise.resolve(onCancel());
      pushToast("Edit canceled.", { tone: "info" });
      return;
    }

    handleReset(false);
    pushToast("Edit canceled.", { tone: "info" });
  }

  async function handleSave() {
    const payload: AdminEditHoursPayPayload = {
      ...form,
      totalHours,
      regularHours: paySummary.regularHours,
      overtimeHours: paySummary.overtimeHours,
      grossPay: paySummary.grossPay
    };

    if (onSave) {
      await Promise.resolve(onSave(payload));
      pushToast("Changes saved successfully.");
      return;
    }

    await delay(800);
    pushToast("Changes saved successfully.");
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this time entry? This cannot be undone.");
    if (!confirmed) return;

    if (onDelete) {
      await Promise.resolve(onDelete(form));
      pushToast("Entry deleted.");
      return;
    }

    await delay(800);
    pushToast("Entry deleted.");
  }

  const timeRangeIsInvalid =
    Boolean(form.clockIn) && Boolean(form.clockOut) && toMinutes(form.clockOut)! <= toMinutes(form.clockIn)!;

  return (
    <div className="time-pay-screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Admin Time Entry</p>
          <h1>Edit employee time and pay</h1>
          <p className="screen-copy">
            Update hours, review overtime, and confirm gross pay before saving.
          </p>
        </div>
        <div className="header-summary-card">
          <span>Total Hours</span>
          <strong>{formatHours(totalHours)}</strong>
          <small>Gross Pay {formatMoney(paySummary.grossPay)}</small>
        </div>
      </div>

      <form
        className="screen-stack"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className="panel-grid">
          <section className="panel-card" aria-labelledby="hours-panel-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Left Panel</p>
                <h2 id="hours-panel-title">Hours</h2>
              </div>
              <div className="panel-chip">Live totals</div>
            </div>

            <label className="field">
              <span>Employee Name</span>
              <input
                name="employeeName"
                onChange={updateField}
                placeholder="Employee name"
                type="text"
                value={form.employeeName}
              />
            </label>

            <label className="field">
              <span>Date</span>
              <input name="date" onChange={updateField} type="date" value={form.date} />
            </label>

            <div className="inline-grid">
              <label className="field">
                <span>Clock In</span>
                <input name="clockIn" onChange={updateField} type="time" value={form.clockIn} />
              </label>

              <label className="field">
                <span>Clock Out</span>
                <input name="clockOut" onChange={updateField} type="time" value={form.clockOut} />
              </label>
            </div>

            <label className="field">
              <span>Break Minutes</span>
              <input
                min="0"
                name="breakMinutes"
                onChange={updateField}
                placeholder="0"
                type="number"
                value={form.breakMinutes}
              />
            </label>

            <div className="stats-card">
              <div className="stat-row">
                <span>Total Hours</span>
                <strong>{formatHours(totalHours)}</strong>
              </div>
              <div className="stat-row">
                <span>Overtime Hours</span>
                <strong>{formatHours(paySummary.overtimeHours)}</strong>
              </div>
            </div>

            <label className="field">
              <span>Total Hours</span>
              <input readOnly type="text" value={formatHours(totalHours)} />
            </label>

            <label className="field">
              <span>Overtime Hours</span>
              <input readOnly type="text" value={formatHours(paySummary.overtimeHours)} />
            </label>

            <p className={`helper-text${timeRangeIsInvalid ? " warning" : ""}`}>
              {timeRangeIsInvalid
                ? "Clock Out must be later than Clock In."
                : "Hours update automatically when time or break values change."}
            </p>
          </section>

          <section className="panel-card" aria-labelledby="pay-panel-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Right Panel</p>
                <h2 id="pay-panel-title">Pay</h2>
              </div>
              <div className="panel-chip accent">Auto pay</div>
            </div>

            <label className="field">
              <span>Hourly Rate</span>
              <input
                min="0"
                name="hourlyRate"
                onChange={updateField}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={form.hourlyRate}
              />
            </label>

            <label className="field">
              <span>Regular Hours</span>
              <input readOnly type="text" value={formatHours(paySummary.regularHours)} />
            </label>

            <label className="field">
              <span>Overtime Hours</span>
              <input readOnly type="text" value={formatHours(paySummary.overtimeHours)} />
            </label>

            <label className="field">
              <span>Overtime Multiplier</span>
              <input
                min="1"
                name="overtimeMultiplier"
                onChange={updateField}
                step="0.1"
                type="number"
                value={form.overtimeMultiplier}
              />
            </label>

            <label className="field">
              <span>Gross Pay</span>
              <input readOnly type="text" value={formatMoney(paySummary.grossPay)} />
            </label>

            <label className="field">
              <span>Notes</span>
              <textarea
                name="notes"
                onChange={updateField}
                placeholder="Add a short note for this change"
                rows={5}
                value={form.notes}
              />
            </label>
          </section>
        </div>

        <section className="action-card">
          <div className="action-copy">
            <h3>Review actions</h3>
            <p>Regular hours stay at 8 or less. Overtime hours and gross pay update live.</p>
          </div>

          <label className="sound-toggle">
            <input
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
              type="checkbox"
            />
            <span>Sound feedback</span>
            <small>Off by default</small>
          </label>

          <div className="action-grid">
            <AppButton onClick={() => handleReset()} soundEnabled={soundEnabled} variant="secondary">
              Reset Changes
            </AppButton>
            <AppButton
              loadingText="Canceling..."
              onClick={handleCancel}
              soundEnabled={soundEnabled}
              variant="secondary"
            >
              Cancel
            </AppButton>
            <AppButton
              loadingText="Saving..."
              onClick={handleSave}
              soundEnabled={soundEnabled}
              variant="primary"
            >
              Save Changes
            </AppButton>
            <AppButton
              loadingText="Deleting..."
              onClick={handleDelete}
              soundEnabled={soundEnabled}
              variant="danger"
            >
              Delete Entry
            </AppButton>
          </div>
        </section>
      </form>

      <style jsx>{`
        .time-pay-screen {
          display: grid;
          gap: 20px;
        }

        .screen-stack {
          display: grid;
          gap: 18px;
        }

        .screen-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .eyebrow,
        .panel-kicker {
          margin: 0 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.74rem;
          font-weight: 800;
          color: #7f2c14;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 0.98;
          letter-spacing: -0.04em;
          color: #1f1a14;
        }

        h2 {
          font-size: 1.55rem;
          color: #1f1a14;
        }

        h3 {
          font-size: 1.1rem;
          color: #1f1a14;
        }

        .screen-copy,
        .action-copy p,
        .helper-text {
          color: #6b6258;
          line-height: 1.5;
        }

        .header-summary-card,
        .panel-card,
        .action-card {
          border: 1px solid #dfd5c6;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 16px 34px rgba(57, 37, 18, 0.08);
        }

        .header-summary-card {
          min-width: 200px;
          display: grid;
          gap: 8px;
          padding: 18px 20px;
          background: linear-gradient(180deg, #fff4e8 0%, #ffffff 100%);
        }

        .header-summary-card span,
        .header-summary-card small {
          color: #6b6258;
        }

        .header-summary-card strong {
          font-size: 2rem;
          line-height: 1;
          color: #7f2c14;
        }

        .panel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .panel-card {
          display: grid;
          gap: 14px;
          padding: 20px;
        }

        .panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }

        .panel-chip {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid #e6dacb;
          background: #fff8f0;
          color: #7f2c14;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .panel-chip.accent {
          background: #f4efe4;
          color: #1f1a14;
        }

        .inline-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 7px;
        }

        .field span {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1f1a14;
        }

        .field input,
        .field textarea {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid #d8cdbd;
          background: #ffffff;
          color: #1f1a14;
          font-size: 1rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }

        .field input[readonly],
        .field textarea[readonly] {
          background: #f6f1e9;
          color: #473a2c;
        }

        .field textarea {
          resize: vertical;
          min-height: 132px;
        }

        .field input:focus,
        .field textarea:focus {
          outline: none;
          border-color: #b4411f;
          box-shadow: 0 0 0 4px rgba(180, 65, 31, 0.12);
        }

        .stats-card {
          display: grid;
          gap: 10px;
          padding: 14px 16px;
          border: 1px solid #eadfce;
          border-radius: 18px;
          background: linear-gradient(180deg, #fffaf4 0%, #f8f1e7 100%);
        }

        .stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #6b6258;
        }

        .stat-row strong {
          color: #1f1a14;
          font-size: 1.15rem;
        }

        .helper-text.warning {
          color: #a3342b;
          font-weight: 700;
        }

        .action-card {
          display: grid;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(180deg, rgba(255, 249, 241, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%);
        }

        .sound-toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          color: #6b6258;
          font-weight: 700;
        }

        .sound-toggle input {
          width: 18px;
          height: 18px;
          accent-color: #b4411f;
        }

        .sound-toggle small {
          color: #8a7f73;
          font-size: 0.86rem;
          font-weight: 600;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 900px) {
          .panel-grid,
          .action-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .time-pay-screen {
            gap: 16px;
          }

          .panel-card,
          .action-card,
          .header-summary-card {
            padding: 16px;
            border-radius: 18px;
          }

          .inline-grid {
            grid-template-columns: 1fr;
          }

          .field input,
          .field textarea {
            padding: 13px 14px;
          }
        }
      `}</style>
    </div>
  );
}
