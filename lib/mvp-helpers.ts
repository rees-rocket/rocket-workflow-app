import {
  timeDays,
  timeSegments,
  trainingAssignments,
  workerProfiles,
  type TimeDayStatus
} from "@/lib/mvp-data";

export function formatCurrencyFromCents(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value / 100);
}

export function getWorker(workerId: string) {
  return workerProfiles.find((worker) => worker.id === workerId) ?? null;
}

export function getWorkerToday(workerId: string) {
  return timeDays.find((day) => day.workerId === workerId && day.workDate === "2026-03-27") ?? null;
}

export function getWorkerWeekHours(workerId: string) {
  return timeDays
    .filter((day) => day.workerId === workerId)
    .reduce((sum, day) => sum + day.totalPayableHours, 0);
}

export function getWorkerRecentEntries(workerId: string, limit = 8) {
  return timeSegments.filter((segment) => segment.workerId === workerId).slice(0, limit);
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

export function formatHours(value: number | null) {
  if (value === null) {
    return "Pending";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 2)} hrs`;
}

export function getWorkerTrainingState(workerId: string) {
  const assignments = trainingAssignments.filter((assignment) => assignment.workerId === workerId);
  const overdue = assignments.filter(
    (assignment) => assignment.completedAt === null && assignment.dueDate < "2026-03-26"
  ).length;
  const dueSoon = assignments.filter(
    (assignment) =>
      assignment.completedAt === null &&
      assignment.dueDate >= "2026-03-26" &&
      assignment.dueDate <= "2026-04-02"
  ).length;

  return { overdue, dueSoon, total: assignments.length };
}

export function getWorkerOpenSegment(workerId: string) {
  return timeSegments.find((segment) => segment.workerId === workerId && segment.endAt === null) ?? null;
}

export function getWorkerStatus(workerId: string): TimeDayStatus {
  const openSegment = getWorkerOpenSegment(workerId);

  if (!openSegment) {
    return "off_clock";
  }

  return openSegment.segmentType === "break" ? "on_break" : "working";
}

export function getTodayTotals(workerId: string) {
  const today = getWorkerToday(workerId);

  return {
    totalWorkHours: today?.totalWorkHours ?? 0,
    totalBreakHours: today?.totalBreakHours ?? 0,
    totalPayableHours: today?.totalPayableHours ?? 0
  };
}

export function getDaySegments(timeDayId: string) {
  return timeSegments.filter((segment) => segment.timeDayId === timeDayId);
}

export function calculateSegmentHours(startAt: string, endAt: string | null) {
  if (!endAt) {
    return null;
  }

  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const totalMinutes = Math.max(0, Math.round((end - start) / 60000));

  return Math.round((totalMinutes / 60) * 100) / 100;
}

export function formatStatus(status: TimeDayStatus) {
  if (status === "working") {
    return "Clocked In";
  }

  if (status === "on_break") {
    return "On Break";
  }

  return "Clocked Out";
}

export function getStatusTone(status: TimeDayStatus) {
  if (status === "working") {
    return "ok";
  }

  if (status === "on_break") {
    return "warn";
  }

  return "muted";
}

export function getWorkerPrimaryActions(workerId: string) {
  const status = getWorkerStatus(workerId);

  if (status === "working") {
    return ["Start Break", "Clock Out"];
  }

  if (status === "on_break") {
    return ["End Break"];
  }

  return ["Clock In"];
}

export function describeSegment(segmentType: "work" | "break") {
  return segmentType === "work" ? "Worked" : "Break";
}
