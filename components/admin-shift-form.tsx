"use client";

import { useState } from "react";
import { AppButton } from "@/components/app-button";
import { getHalfHourOptions, getTimeValueFromIso } from "@/lib/schedule-form";
import type { ProfileRow, ShiftAssignmentRow, ShiftRow } from "@/lib/types";

type AssignmentRowState = {
  clientId: string;
  assignmentId?: string;
  workerId: string;
  role: "service" | "prep";
  payRateOverride: string;
};

type AdminShiftFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  shift?: ShiftRow | null;
  initialDate?: string;
  workers: ProfileRow[];
  initialAssignments?: Array<
    Pick<ShiftAssignmentRow, "id" | "worker_id" | "role" | "pay_rate_override_cents">
  >;
};

function createBlankAssignment(workers: ProfileRow[], clientId: string): AssignmentRowState {
  return {
    clientId,
    workerId: workers[0]?.id ?? "",
    role: "service",
    payRateOverride: ""
  };
}

export function AdminShiftForm({
  action,
  submitLabel,
  shift,
  initialDate,
  workers,
  initialAssignments = []
}: AdminShiftFormProps) {
  const [assignments, setAssignments] = useState<AssignmentRowState[]>(
    initialAssignments.length > 0
      ? initialAssignments.map((assignment, index) => ({
          clientId: `existing-${assignment.id}-${index}`,
          assignmentId: assignment.id,
          workerId: assignment.worker_id,
          role: assignment.role,
          payRateOverride:
            assignment.pay_rate_override_cents !== null
              ? (assignment.pay_rate_override_cents / 100).toFixed(2)
              : ""
        }))
      : [createBlankAssignment(workers, "new-0")]
  );

  const timeOptions = getHalfHourOptions();

  return (
    <form action={action} className="stack">
      {shift ? <input name="shift_id" type="hidden" value={shift.id} /> : null}
      <section className="card stack">
        <div className="eyebrow">Shift Details</div>
        <h2>{shift ? "Edit shift" : "Create shift"}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Date</span>
            <input defaultValue={shift?.shift_date ?? initialDate ?? ""} name="shift_date" required type="date" />
          </label>
          <label className="field">
            <span>Location / event name</span>
            <input defaultValue={shift?.location_name ?? ""} name="location_name" required type="text" />
          </label>
          <label className="field">
            <span>Start Time</span>
            <select defaultValue={getTimeValueFromIso(shift?.start_at)} name="start_time" required>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>End Time</span>
            <select defaultValue={getTimeValueFromIso(shift?.end_at)} name="end_time" required>
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select defaultValue={shift?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea defaultValue={shift?.notes ?? ""} name="notes" rows={4} />
        </label>
      </section>

      <section className="card stack">
        <div className="eyebrow">Assigned Workers</div>
        <h2>Workers on this shift</h2>
        {assignments.map((assignment, index) => (
          <div className="assignment-row" key={assignment.clientId}>
            <input name="assignment_id" type="hidden" value={assignment.assignmentId ?? ""} />
            <div className="form-grid">
              <label className="field">
                <span>Worker</span>
                <select
                  name="assignment_worker_id"
                  onChange={(event) => {
                    const value = event.target.value;
                    setAssignments((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, workerId: value } : row
                      )
                    );
                  }}
                  value={assignment.workerId}
                >
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  name="assignment_role"
                  onChange={(event) => {
                    const value = event.target.value as "service" | "prep";
                    setAssignments((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, role: value } : row
                      )
                    );
                  }}
                  value={assignment.role}
                >
                  <option value="service">Service</option>
                  <option value="prep">Prep</option>
                </select>
              </label>
              <label className="field">
                <span>Pay Override</span>
                <input
                  inputMode="decimal"
                  name="assignment_pay_rate_override"
                  onChange={(event) => {
                    const value = event.target.value;
                    setAssignments((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, payRateOverride: value } : row
                      )
                    );
                  }}
                  placeholder="Use default wage if blank"
                  type="text"
                  value={assignment.payRateOverride}
                />
              </label>
            </div>
            <div className="button-row">
              <AppButton
                variant="secondary"
                onClick={() => {
                  setAssignments((current) =>
                    current.length === 1
                      ? current
                      : current.filter((row) => row.clientId !== assignment.clientId)
                  );
                }}
                type="button"
              >
                Remove assignment
              </AppButton>
            </div>
          </div>
        ))}
        <div className="button-row">
          <AppButton
            variant="secondary"
            onClick={() => {
              setAssignments((current) => [
                ...current,
                createBlankAssignment(workers, `new-${Date.now()}-${current.length}`)
              ]);
            }}
            type="button"
          >
            Add Worker
          </AppButton>
        </div>
      </section>

      <div className="button-row">
        <AppButton type="submit" variant="primary">
          {submitLabel}
        </AppButton>
      </div>
    </form>
  );
}
