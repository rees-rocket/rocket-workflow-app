"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/app-button";
import { ToastProvider, ToastViewport, useToast } from "@/components/toast";
import {
  addTimeSegment,
  deleteTimeSegment,
  reviewTimeCorrectionRequest,
  saveSegmentCorrection
} from "@/app/admin/time/actions";
import { formatCurrencyFromCents } from "@/lib/mvp-helpers";
import { calculateMinutes, describeSegment, describeStatus, formatMinutesAsHours, formatTime } from "@/lib/time";
import type { ProfileRow, TimeCorrectionRequestRow, TimeDayRow, TimeSegmentAuditLogRow, TimeSegmentRow } from "@/lib/types";

type WorkerOption = Pick<ProfileRow, "id" | "full_name">;
type EnrichedDay = TimeDayRow & { profile: ProfileRow | null };
type EnrichedRequest = TimeCorrectionRequestRow & { worker: ProfileRow | null };

type AdminTimeCorrectionsWorkspaceProps = {
  workers: WorkerOption[];
  selectedDay: EnrichedDay | null;
  segments: TimeSegmentRow[];
  audits: TimeSegmentAuditLogRow[];
  correctionRequests: EnrichedRequest[];
  initialWorkerId?: string;
  initialDate?: string;
  initialSegmentId?: string;
  initialRequestId?: string;
};

type SegmentDraft = {
  id: string;
  segmentType: TimeSegmentRow["segment_type"];
  startAt: string;
  endAt: string;
  adminNote: string;
};

const NEW_SEGMENT_ID = "__new_segment__";

function toQueryString(input: { worker?: string; date?: string; segment?: string; request?: string }) {
  const params = new URLSearchParams();
  if (input.worker) params.set("worker", input.worker);
  if (input.date) params.set("date", input.date);
  if (input.segment) params.set("segment", input.segment);
  if (input.request) params.set("request", input.request);
  const value = params.toString();
  return value ? `/admin/time?${value}` : "/admin/time";
}

function shiftDate(date: string, delta: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + delta);
  return value.toISOString().slice(0, 10);
}

function toDateTimeLocalValue(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

function fromDateTimeLocalValue(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function parseJsonValue(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getSegmentDurationMinutes(segment: { start_at: string; end_at: string | null }) {
  if (!segment.end_at) return 0;
  return calculateMinutes(segment.start_at, segment.end_at) ?? 0;
}

function isSuspiciousSegment(segment: { start_at: string; end_at: string | null }) {
  if (!segment.end_at) return true;
  const minutes = getSegmentDurationMinutes(segment);
  return minutes <= 0 || minutes > 16 * 60;
}

function getProfileRateForSegment(profile: ProfileRow | null, segmentType: TimeSegmentRow["segment_type"]) {
  if (!profile || segmentType === "break") return 0;
  if (segmentType === "travel") return profile.travel_wage_rate_cents ?? profile.wage_rate_cents;
  if (segmentType === "prep") return profile.prep_wage_rate_cents ?? profile.wage_rate_cents;
  return profile.service_wage_rate_cents ?? profile.wage_rate_cents;
}

function buildDraftFromSegment(segment: TimeSegmentRow, latestNote: string): SegmentDraft {
  return {
    id: segment.id,
    segmentType: segment.segment_type,
    startAt: toDateTimeLocalValue(segment.start_at),
    endAt: toDateTimeLocalValue(segment.end_at),
    adminNote: latestNote
  };
}

function buildNewDraft(workDate: string): SegmentDraft {
  return {
    id: NEW_SEGMENT_ID,
    segmentType: "service",
    startAt: `${workDate}T09:00`,
    endAt: "",
    adminNote: ""
  };
}

function humanizeAuditLabel(audit: TimeSegmentAuditLogRow) {
  const originalValue = parseJsonValue(audit.original_value_json) as Partial<TimeSegmentRow> | null;
  const nextValue = parseJsonValue(audit.new_value_json) as Partial<TimeSegmentRow> | null;
  const segmentType = nextValue?.segment_type ?? originalValue?.segment_type ?? "service";
  const label = describeSegment(segmentType as TimeSegmentRow["segment_type"]);
  const originalStart = originalValue?.start_at ? formatTime(String(originalValue.start_at)) : null;
  const originalEnd = originalValue?.end_at ? formatTime(String(originalValue.end_at)) : null;
  const nextStart = nextValue?.start_at ? formatTime(String(nextValue.start_at)) : null;
  const nextEnd = nextValue?.end_at ? formatTime(String(nextValue.end_at)) : null;

  if (audit.action_type === "segment_deleted") {
    return `Deleted ${label} segment${originalStart ? `, ${originalStart}` : ""}${originalEnd ? ` to ${originalEnd}` : ""}`;
  }
  if (audit.action_type === "segment_added") {
    return `Added ${label} segment${nextStart ? `, ${nextStart}` : ""}${nextEnd ? ` to ${nextEnd}` : ""}`;
  }
  if (audit.action_type === "segment_updated") {
    if (originalEnd && nextEnd && originalEnd !== nextEnd) {
      return `Edited ${label} segment end time from ${originalEnd} to ${nextEnd}`;
    }
    if (originalStart && nextStart && originalStart !== nextStart) {
      return `Edited ${label} segment start time from ${originalStart} to ${nextStart}`;
    }
    if (originalValue?.segment_type && nextValue?.segment_type && originalValue.segment_type !== nextValue.segment_type) {
      return `Changed segment type from ${describeSegment(originalValue.segment_type as TimeSegmentRow["segment_type"])} to ${describeSegment(nextValue.segment_type as TimeSegmentRow["segment_type"])}`;
    }
    return `Updated ${label} segment`;
  }
  return audit.action_type.replaceAll("_", " ");
}

function DraftSummary({
  currentSegment,
  draft,
  selectedDay
}: {
  currentSegment: TimeSegmentRow | null;
  draft: SegmentDraft | null;
  selectedDay: EnrichedDay | null;
}) {
  if (!draft || !selectedDay) return null;

  const previewStart = fromDateTimeLocalValue(draft.startAt);
  const previewEnd = fromDateTimeLocalValue(draft.endAt);
  const previewMinutes = previewStart && previewEnd ? calculateMinutes(previewStart, previewEnd) ?? 0 : 0;
  const previewRateCents =
    currentSegment?.segment_type === draft.segmentType && currentSegment.wage_rate_cents_used !== null
      ? currentSegment.wage_rate_cents_used
      : getProfileRateForSegment(selectedDay.profile, draft.segmentType);
  const safePreviewRateCents = previewRateCents ?? 0;
  const previewPayCents = draft.segmentType === "break" ? 0 : Math.max(0, Math.round((previewMinutes * safePreviewRateCents) / 60));

  return (
    <div className="detail-summary">
      <div className="detail-row">
        <span>Preview duration</span>
        <strong>{formatMinutesAsHours(previewMinutes)}</strong>
      </div>
      <div className="detail-row">
        <span>Preview rate</span>
        <strong>{draft.segmentType === "break" ? "Not paid" : formatCurrencyFromCents(previewRateCents)}</strong>
      </div>
      <div className="detail-row">
        <span>Preview pay</span>
        <strong>{draft.segmentType === "break" ? "Not paid" : formatCurrencyFromCents(previewPayCents)}</strong>
      </div>
    </div>
  );
}

function WorkspaceContent(props: AdminTimeCorrectionsWorkspaceProps) {
  const {
    workers,
    selectedDay,
    segments,
    audits,
    correctionRequests,
    initialWorkerId,
    initialDate,
    initialSegmentId,
    initialRequestId
  } = props;
  const router = useRouter();
  const { pushToast } = useToast();
  const [workerId, setWorkerId] = useState(initialWorkerId ?? "");
  const [date, setDate] = useState(initialDate ?? "");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(initialSegmentId ?? segments[0]?.id ?? null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(initialRequestId ?? null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SegmentDraft | null>(null);

  useEffect(() => {
    setWorkerId(initialWorkerId ?? "");
    setDate(initialDate ?? "");
    setSelectedSegmentId(initialSegmentId ?? segments[0]?.id ?? null);
    setSelectedRequestId(initialRequestId ?? null);
    setEditingRowId(null);
    setDraft(null);
  }, [initialDate, initialRequestId, initialSegmentId, initialWorkerId, segments]);

  const latestAuditNoteBySegment = useMemo(() => {
    const map = new Map<string, string>();
    for (const audit of audits) {
      if (audit.time_segment_id && audit.note && !map.has(audit.time_segment_id)) {
        map.set(audit.time_segment_id, audit.note);
      }
    }
    return map;
  }, [audits]);

  const requestsForContext = useMemo(() => {
    return correctionRequests.filter((request) => {
      if (selectedDay) {
        return request.worker_id === selectedDay.worker_id && request.work_date === selectedDay.work_date;
      }
      if (workerId && request.worker_id !== workerId) return false;
      if (date && request.work_date !== date) return false;
      return true;
    });
  }, [correctionRequests, date, selectedDay, workerId]);

  const pendingRequests = requestsForContext.filter((request) => request.status === "pending");
  const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const selectedRequest =
    requestsForContext.find((request) => request.id === selectedRequestId) ?? pendingRequests[0] ?? null;

  const rowItems = draft?.id === NEW_SEGMENT_ID
    ? [{ kind: "draft" as const }, ...segments.map((segment) => ({ kind: "segment" as const, segment }))]
    : segments.map((segment) => ({ kind: "segment" as const, segment }));

  function navigate(next: { worker?: string; date?: string; segment?: string; request?: string }) {
    router.replace(toQueryString(next));
  }

  function handleWorkerChange(value: string) {
    setWorkerId(value);
    navigate({ worker: value, date });
  }

  function handleDateChange(value: string) {
    setDate(value);
    navigate({ worker: workerId, date: value });
  }

  function handleStepDay(delta: number) {
    if (!date) return;
    const nextDate = shiftDate(date, delta);
    setDate(nextDate);
    navigate({ worker: workerId, date: nextDate });
  }

  function openEditRow(segment: TimeSegmentRow) {
    setSelectedSegmentId(segment.id);
    setEditingRowId(segment.id);
    setDraft(buildDraftFromSegment(segment, latestAuditNoteBySegment.get(segment.id) ?? ""));
  }

  function openNewRow() {
    if (!selectedDay) return;
    setSelectedRequestId(null);
    setSelectedSegmentId(null);
    setEditingRowId(NEW_SEGMENT_ID);
    setDraft(buildNewDraft(selectedDay.work_date));
  }

  function cancelEditing() {
    setEditingRowId(null);
    setDraft(null);
  }

  function updateDraft(field: keyof SegmentDraft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function isDraftValid() {
    if (!draft || !selectedDay) return false;
    if (!draft.segmentType || !draft.startAt) return false;
    if (draft.endAt && new Date(draft.endAt).getTime() <= new Date(draft.startAt).getTime()) return false;
    return true;
  }

  async function saveDraft() {
    if (!draft || !selectedDay || !isDraftValid()) return;
    const formData = new FormData();
    formData.set("worker_id", selectedDay.worker_id);
    if (draft.id === NEW_SEGMENT_ID) {
      formData.set("time_day_id", selectedDay.id);
      formData.set("work_date", selectedDay.work_date);
      formData.set("segment_type", draft.segmentType);
      formData.set("start_at", draft.startAt);
      formData.set("end_at", draft.endAt);
      formData.set("admin_note", draft.adminNote);
      await addTimeSegment(formData);
      pushToast("Segment added.");
    } else {
      formData.set("segment_id", draft.id);
      formData.set("time_day_id", selectedDay.id);
      formData.set("segment_type", draft.segmentType);
      formData.set("start_at", draft.startAt);
      formData.set("end_at", draft.endAt);
      formData.set("admin_note", draft.adminNote);
      const correctionRequestId =
        selectedRequest?.status === "pending" && selectedRequest.time_segment_id === draft.id
          ? selectedRequest.id
          : "";
      formData.set("correction_request_id", correctionRequestId);
      await saveSegmentCorrection(formData);
      pushToast(correctionRequestId ? "Segment updated and request approved." : "Segment updated.");
    }
    cancelEditing();
    router.refresh();
  }

  async function deleteDraftTarget() {
    if (!selectedDay || !draft || draft.id === NEW_SEGMENT_ID) {
      cancelEditing();
      return;
    }
    if (!window.confirm("Delete this segment? This cannot be undone.")) return;
    const formData = new FormData();
    formData.set("segment_id", draft.id);
    formData.set("time_day_id", selectedDay.id);
    formData.set("worker_id", selectedDay.worker_id);
    formData.set("correction_request_id", selectedRequest?.time_segment_id === draft.id ? selectedRequest.id : "");
    formData.set("admin_note", draft.adminNote);
    await deleteTimeSegment(formData);
    pushToast("Segment deleted.");
    cancelEditing();
    router.refresh();
  }

  async function submitRequestReview(status: "approved" | "denied") {
    if (!selectedRequest) return;
    const formData = new FormData();
    formData.set("request_id", selectedRequest.id);
    formData.set("status", status);
    formData.set("admin_note", draft?.adminNote ?? selectedRequest.admin_note ?? "");
    await reviewTimeCorrectionRequest(formData);
    pushToast(status === "approved" ? "Correction request approved." : "Correction request denied.");
    setSelectedRequestId(null);
    router.refresh();
  }

  const emptySelection = !workerId || !date;

  return (
    <div className="time-workspace">
      <section className="workspace-header card">
        <div className="header-copy">
          <div>
            <p className="eyebrow">Time Corrections</p>
            <h1>Time Corrections</h1>
            <p className="lead-copy">Review, correct, and approve worker time for a single day</p>
          </div>
          <div className="summary-strip">
            <span className="summary-chip">Payable {selectedDay ? formatMinutesAsHours(selectedDay.total_payable_minutes) : "--"}</span>
            <span className="summary-chip">Labor {selectedDay ? formatCurrencyFromCents(selectedDay.total_labor_cost_cents) : "--"}</span>
            <span className="summary-chip">Status {selectedDay ? describeStatus(selectedDay.status) : "--"}</span>
            <span className={`summary-chip${pendingRequests.length > 0 ? " alert" : ""}`}>Requests {pendingRequests.length}</span>
          </div>
        </div>

        <section className="control-card">
          <div className="eyebrow">Choose worker and day</div>
          <div className="header-grid">
            <label className="field">
              <span>Worker</span>
              <select onChange={(event) => handleWorkerChange(event.target.value)} value={workerId}>
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Date</span>
              <input onChange={(event) => handleDateChange(event.target.value)} type="date" value={date} />
            </label>
            <div className="day-nav">
              <AppButton disabled={!date} onClick={() => handleStepDay(-1)} variant="secondary">
                Previous day
              </AppButton>
              <AppButton disabled={!date} onClick={() => handleStepDay(1)} variant="secondary">
                Next day
              </AppButton>
            </div>
          </div>
          {selectedDay?.profile ? (
            <p className="worker-line">
              {selectedDay.profile.full_name} is currently <strong>{describeStatus(selectedDay.status).toLowerCase()}</strong>.
            </p>
          ) : null}
        </section>
      </section>

      {emptySelection ? (
        <section className="card empty-card">
          <h2>Select a worker and date to load day segments.</h2>
        </section>
      ) : (
        <div className="workspace-grid">
          <div className="main-column">
            <section className="card stack">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Day segments</div>
                  <h2>Day segments</h2>
                  <p className="muted-copy">
                    Edit the worker&apos;s day directly. Click any row to correct times, type, or notes.
                  </p>
                </div>
                <AppButton disabled={!selectedDay || editingRowId === NEW_SEGMENT_ID} onClick={openNewRow} variant="secondary">
                  + Add segment
                </AppButton>
              </div>

              {!selectedDay ? (
                <div className="empty-inline">Select a worker and date to load day segments.</div>
              ) : rowItems.length === 0 ? (
                <div className="empty-inline">No segments recorded for this day yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="segments-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Duration</th>
                        <th>Rate</th>
                        <th>Pay</th>
                        <th>Note</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowItems.map((row, index) => {
                        const segment = row.kind === "segment" ? row.segment : null;
                        const rowId = segment?.id ?? NEW_SEGMENT_ID;
                        const isEditing = editingRowId === rowId && draft !== null;
                        const isSelected = selectedSegmentId === rowId || isEditing;
                        const latestNote = segment ? latestAuditNoteBySegment.get(segment.id) ?? "—" : draft?.adminNote ?? "—";
                        const liveSegmentType = isEditing ? draft.segmentType : segment?.segment_type ?? "service";
                        const liveStart = isEditing ? fromDateTimeLocalValue(draft.startAt) : segment?.start_at ?? null;
                        const liveEnd = isEditing ? fromDateTimeLocalValue(draft.endAt) : segment?.end_at ?? null;
                        const liveMinutes =
                          liveStart && liveEnd ? calculateMinutes(liveStart, liveEnd) ?? 0 : segment ? getSegmentDurationMinutes(segment) : 0;
                        const liveRate =
                          liveSegmentType === "break"
                            ? null
                            : isEditing
                              ? getProfileRateForSegment(selectedDay.profile, liveSegmentType)
                              : segment?.wage_rate_cents_used ?? getProfileRateForSegment(selectedDay.profile, liveSegmentType);
                        const livePay = liveRate === null ? null : Math.max(0, Math.round((Math.max(0, liveMinutes) * liveRate) / 60));
                        const warning = isEditing ? !isDraftValid() : segment ? isSuspiciousSegment(segment) : false;

                        return (
                          <tr
                            className={`${isSelected ? "selected" : ""}${warning ? " warning" : ""}`}
                            key={rowId + index}
                            onClick={() => {
                              if (!isEditing && segment) {
                                setSelectedSegmentId(segment.id);
                                if (!selectedRequestId) {
                                  const match = pendingRequests.find((request) => request.time_segment_id === segment.id);
                                  if (match) setSelectedRequestId(match.id);
                                }
                              }
                            }}
                          >
                            <td>
                              {isEditing ? (
                                <select onChange={(event) => updateDraft("segmentType", event.target.value)} value={draft.segmentType}>
                                  <option value="travel">Travel</option>
                                  <option value="prep">Prep</option>
                                  <option value="service">Service</option>
                                  <option value="break">Break</option>
                                </select>
                              ) : (
                                describeSegment(liveSegmentType)
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input onChange={(event) => updateDraft("startAt", event.target.value)} type="datetime-local" value={draft.startAt} />
                              ) : liveStart ? (
                                formatTime(liveStart)
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input onChange={(event) => updateDraft("endAt", event.target.value)} type="datetime-local" value={draft.endAt} />
                              ) : liveEnd ? (
                                formatTime(liveEnd)
                              ) : (
                                "Open"
                              )}
                            </td>
                            <td>{liveEnd ? formatMinutesAsHours(Math.max(0, liveMinutes)) : "Active"}</td>
                            <td>{liveRate === null ? "Not paid" : formatCurrencyFromCents(liveRate)}</td>
                            <td>{livePay === null ? "Not paid" : formatCurrencyFromCents(livePay)}</td>
                            <td className="note-cell">
                              {isEditing ? (
                                <input onChange={(event) => updateDraft("adminNote", event.target.value)} placeholder="Add admin note" type="text" value={draft.adminNote} />
                              ) : (
                                latestNote
                              )}
                            </td>
                            <td>
                              <div className="row-actions">
                                {isEditing ? (
                                  <>
                                    <AppButton disabled={!isDraftValid()} loadingText="Saving..." onClick={saveDraft} variant="primary">
                                      Save
                                    </AppButton>
                                    <AppButton onClick={cancelEditing} variant="secondary">
                                      Cancel
                                    </AppButton>
                                    <AppButton loadingText="Deleting..." onClick={deleteDraftTarget} variant="danger">
                                      Delete
                                    </AppButton>
                                  </>
                                ) : segment ? (
                                  <AppButton onClick={() => openEditRow(segment)} variant="secondary">
                                    Edit
                                  </AppButton>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card stack">
              <div className="eyebrow">Audit trail</div>
              <details>
                <summary>
                  <span>Audit trail</span>
                  <span>{audits.length}</span>
                </summary>
                {audits.length === 0 ? (
                  <p className="empty-inline">No audit entries for this day yet.</p>
                ) : (
                  <ul className="audit-list">
                    {audits.map((audit) => (
                      <li className="audit-item" key={audit.id}>
                        <strong>{humanizeAuditLabel(audit)}</strong>
                        <div className="muted-copy">{audit.acted_at.slice(0, 16).replace("T", " ")}</div>
                        {audit.note ? <div className="muted-copy">{audit.note}</div> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </section>
          </div>

          <aside className="side-column">
            <section className="card stack side-panel">
              <div className="eyebrow">Correction details</div>
              <h2>Correction details</h2>

              {selectedRequest ? (
                <>
                  <div className="request-card">
                    <strong>{selectedRequest.worker?.full_name ?? selectedRequest.worker_id}</strong>
                    <div className="muted-copy">
                      {selectedRequest.work_date} · {selectedRequest.request_type.replaceAll("_", " ")}
                    </div>
                    <div className={`pill ${selectedRequest.status === "pending" ? "warn" : selectedRequest.status === "approved" ? "ok" : "danger"}`}>
                      {selectedRequest.status}
                    </div>
                  </div>

                  <div className="detail-block">
                    <span className="detail-label">Original values</span>
                    <pre>{selectedRequest.original_value_json ?? "No original values saved."}</pre>
                  </div>

                  <div className="detail-block">
                    <span className="detail-label">Requested values</span>
                    <pre>{selectedRequest.requested_change}</pre>
                  </div>

                  <div className="detail-block">
                    <span className="detail-label">Worker note</span>
                    <p>{selectedRequest.reason ?? "No worker note."}</p>
                  </div>

                  <label className="field">
                    <span>Admin note</span>
                    <textarea
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, adminNote: event.target.value }
                            : {
                                id: selectedRequest.time_segment_id ?? NEW_SEGMENT_ID,
                                segmentType: "service",
                                startAt: "",
                                endAt: "",
                                adminNote: event.target.value
                              }
                        )
                      }
                      rows={4}
                      value={draft?.adminNote ?? selectedRequest.admin_note ?? ""}
                    />
                  </label>

                  <div className="button-row stretch">
                    <AppButton loadingText="Approving..." onClick={() => submitRequestReview("approved")} variant="primary">
                      Approve
                    </AppButton>
                    <AppButton loadingText="Denying..." onClick={() => submitRequestReview("denied")} variant="secondary">
                      Deny
                    </AppButton>
                  </div>

                  {selectedRequest.time_segment_id ? (
                    <AppButton
                      onClick={() => {
                        const segment = segments.find((item) => item.id === selectedRequest.time_segment_id);
                        if (segment) {
                          openEditRow(segment);
                          setSelectedRequestId(selectedRequest.id);
                        }
                      }}
                      variant="secondary"
                    >
                      Approve with edits
                    </AppButton>
                  ) : null}
                </>
              ) : editingRowId && draft ? (
                <>
                  <p className="muted-copy">Editing happens inline in the Day segments table. Use this panel as a quick reference while you work.</p>
                  <DraftSummary
                    currentSegment={segments.find((segment) => segment.id === editingRowId) ?? null}
                    draft={draft}
                    selectedDay={selectedDay}
                  />
                </>
              ) : pendingRequests.length > 0 ? (
                <>
                  <p className="muted-copy">Pending requests for this worker and day. Open one to review it in context.</p>
                  <ul className="request-list">
                    {pendingRequests.map((request) => (
                      <li className={`request-item${selectedRequestId === request.id ? " active" : ""}`} key={request.id}>
                        <AppButton className="request-select" onClick={() => setSelectedRequestId(request.id)} variant="secondary">
                          <strong>{request.request_type.replaceAll("_", " ")}</strong>
                          <span>{request.requested_change}</span>
                        </AppButton>
                      </li>
                    ))}
                  </ul>
                </>
              ) : selectedSegment ? (
                <>
                  <p className="muted-copy">Select Edit on a row to make changes inline. This panel shows the current segment context.</p>
                  <div className="detail-summary">
                    <div className="detail-row">
                      <span>Segment</span>
                      <strong>{describeSegment(selectedSegment.segment_type)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Time</span>
                      <strong>{formatTime(selectedSegment.start_at)} to {selectedSegment.end_at ? formatTime(selectedSegment.end_at) : "Open"}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Duration</span>
                      <strong>{selectedSegment.end_at ? formatMinutesAsHours(getSegmentDurationMinutes(selectedSegment)) : "Active"}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Latest note</span>
                      <strong>{latestAuditNoteBySegment.get(selectedSegment.id) ?? "No admin note yet."}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="empty-inline">
                  {selectedDay ? "No correction requests for this day." : "Select a worker and date to load day segments."}
                </p>
              )}
            </section>
          </aside>
        </div>
      )}
      <style jsx>{`
        .time-workspace,
        .main-column,
        .side-column,
        .control-card {
          display: grid;
          gap: 16px;
        }
        .workspace-header {
          position: sticky;
          top: 12px;
          z-index: 5;
          display: grid;
          gap: 16px;
          padding: 18px;
          background: rgba(255, 250, 241, 0.94);
          backdrop-filter: blur(14px);
        }
        .header-copy {
          display: grid;
          gap: 12px;
        }
        .summary-strip,
        .row-actions,
        .day-nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .header-grid,
        .workspace-grid {
          display: grid;
          gap: 16px;
        }
        .header-grid {
          grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 0.8fr) auto;
          align-items: end;
        }
        .workspace-grid {
          grid-template-columns: minmax(0, 1.75fr) minmax(320px, 0.95fr);
          align-items: start;
        }
        .summary-chip {
          display: inline-flex;
          align-items: center;
          padding: 9px 12px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: #fff;
          font-size: 0.92rem;
          font-weight: 700;
        }
        .summary-chip.alert {
          border-color: rgba(183, 121, 31, 0.3);
          background: rgba(183, 121, 31, 0.1);
          color: var(--warn);
        }
        .lead-copy,
        .muted-copy,
        .worker-line {
          margin: 0;
          color: var(--muted);
          line-height: 1.45;
        }
        .section-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .empty-card,
        .empty-inline {
          min-height: 96px;
          display: grid;
          place-items: center;
          text-align: center;
          color: var(--muted);
        }
        .segments-table tr.selected td {
          background: rgba(180, 65, 31, 0.08);
        }
        .segments-table tr.warning td {
          background: rgba(183, 121, 31, 0.12);
        }
        .segments-table td,
        .segments-table th {
          vertical-align: middle;
        }
        .segments-table input,
        .segments-table select {
          width: 100%;
          min-width: 118px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
        }
        .note-cell {
          min-width: 180px;
        }
        .side-panel {
          position: sticky;
          top: 198px;
        }
        .request-card,
        .detail-block,
        .detail-summary,
        .request-item,
        .audit-item {
          display: grid;
          gap: 8px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.84);
        }
        .detail-block pre,
        .detail-block p {
          margin: 0;
          white-space: pre-wrap;
          font: inherit;
        }
        .detail-label {
          color: var(--brand-dark);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .detail-row,
        summary {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .request-list,
        .audit-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .request-item.active {
          border-color: var(--brand);
          box-shadow: 0 10px 24px rgba(180, 65, 31, 0.12);
        }
        .request-select {
          width: 100%;
          text-align: left;
          display: grid;
          gap: 4px;
        }
        details {
          display: grid;
          gap: 14px;
        }
        summary {
          cursor: pointer;
          font-weight: 800;
          color: var(--text);
        }
        h1,
        h2 {
          margin: 0;
          color: var(--text);
        }
        @media (max-width: 980px) {
          .workspace-grid,
          .header-grid {
            grid-template-columns: 1fr;
          }
          .workspace-header,
          .side-panel {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}

export function AdminTimeCorrectionsWorkspace(props: AdminTimeCorrectionsWorkspaceProps) {
  return (
    <ToastProvider>
      <WorkspaceContent {...props} />
      <ToastViewport />
    </ToastProvider>
  );
}
