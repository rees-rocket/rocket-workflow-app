import type { PayBatchStatus, PayPeriodStatus, ProfileRow, TimeDayRow, TimeSegmentRow } from "@/lib/types";

const APP_TIME_ZONE = "America/Chicago";

export function getCurrentWorkDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function formatMinutesAsHours(minutes: number) {
  return `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 2)} hrs`;
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function describeStatus(status: TimeDayRow["status"]) {
  if (status === "travel") {
    return "Clocked In - Travel";
  }

  if (status === "prep") {
    return "Clocked In - Prep";
  }

  if (status === "service" || status === "working") {
    return "Clocked In - Service";
  }

  if (status === "on_break") {
    return "On Break";
  }

  return "Clocked Out";
}

export function describeSegment(type: TimeSegmentRow["segment_type"]) {
  if (type === "travel") {
    return "Travel";
  }

  if (type === "prep") {
    return "Prep";
  }

  if (type === "service" || type === "work") {
    return "Service";
  }

  return "Break";
}

export function isPaidSegment(type: TimeSegmentRow["segment_type"]) {
  return type !== "break";
}

export function getStatusTone(status: TimeDayRow["status"]) {
  if (status === "travel" || status === "prep" || status === "service" || status === "working") {
    return "ok";
  }

  if (status === "on_break") {
    return "warn";
  }

  return "";
}

export function calculateMinutes(startAt: string, endAt: string | null) {
  if (!endAt) {
    return null;
  }

  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  return Math.max(0, Math.round((end - start) / 60000));
}

export function groupSegmentsByDay(
  days: TimeDayRow[],
  segments: TimeSegmentRow[],
  profiles: ProfileRow[]
) {
  return days.map((day) => ({
    ...day,
    profile: profiles.find((profile) => profile.id === day.worker_id) ?? null,
    segments: segments.filter((segment) => segment.time_day_id === day.id)
  }));
}

export function describePaidStatus(day: Pick<TimeDayRow, "paid_at">) {
  return day.paid_at ? "Paid" : "Unpaid";
}

export function describeBatchPaidStatus(status: PayBatchStatus | PayPeriodStatus | null | undefined) {
  return status === "paid" ? "Paid" : "Unpaid";
}
