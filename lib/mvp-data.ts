export type AppRole = "admin" | "worker";

export type WorkerStatus = "active" | "inactive";

export type WorkerProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  status: WorkerStatus;
  wageRateCents: number | null;
};

export type TimeDayStatus = "off_clock" | "working" | "on_break";

export type TimeDay = {
  id: string;
  workerId: string;
  workerName: string;
  workDate: string;
  totalWorkHours: number;
  totalBreakHours: number;
  totalPayableHours: number;
  status: TimeDayStatus;
};

export type TimeSegment = {
  id: string;
  timeDayId: string;
  workerId: string;
  workerName: string;
  workDate: string;
  segmentType: "work" | "break";
  startAt: string;
  endAt: string | null;
};

export type TrainingModule = {
  id: string;
  title: string;
  description: string;
  contentType: "text" | "video";
  contentValue: string;
  annualRenewal: boolean;
};

export type TrainingAssignment = {
  id: string;
  workerId: string;
  moduleId: string;
  moduleTitle: string;
  dueDate: string;
  completedAt: string | null;
  renewalDate: string | null;
};

export const workerProfiles: WorkerProfile[] = [
  {
    id: "wrk_1",
    email: "ashley@rocketribs.com",
    fullName: "Ashley Cole",
    role: "worker",
    status: "active",
    wageRateCents: 1800
  },
  {
    id: "wrk_2",
    email: "marco@rocketribs.com",
    fullName: "Marco Diaz",
    role: "worker",
    status: "active",
    wageRateCents: 1750
  },
  {
    id: "adm_1",
    email: "owner@rocketribs.com",
    fullName: "Owner Admin",
    role: "admin",
    status: "active",
    wageRateCents: null
  }
];

export const timeDays: TimeDay[] = [
  {
    id: "td_1",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-24",
    totalWorkHours: 7,
    totalBreakHours: 0.5,
    totalPayableHours: 7,
    status: "off_clock"
  },
  {
    id: "td_2",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-27",
    totalWorkHours: 3.5,
    totalBreakHours: 0.25,
    totalPayableHours: 3.5,
    status: "on_break"
  },
  {
    id: "td_3",
    workerId: "wrk_2",
    workerName: "Marco Diaz",
    workDate: "2026-03-25",
    totalWorkHours: 6.75,
    totalBreakHours: 0.25,
    totalPayableHours: 6.75,
    status: "off_clock"
  },
  {
    id: "td_4",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-23",
    totalWorkHours: 6,
    totalBreakHours: 0.5,
    totalPayableHours: 6,
    status: "off_clock"
  }
];

export const timeSegments: TimeSegment[] = [
  {
    id: "ts_1",
    timeDayId: "td_1",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-24",
    segmentType: "work",
    startAt: "2026-03-24T09:00:00",
    endAt: "2026-03-24T12:00:00"
  },
  {
    id: "ts_2",
    timeDayId: "td_1",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-24",
    segmentType: "break",
    startAt: "2026-03-24T12:00:00",
    endAt: "2026-03-24T12:30:00"
  },
  {
    id: "ts_3",
    timeDayId: "td_1",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-24",
    segmentType: "work",
    startAt: "2026-03-24T12:30:00",
    endAt: "2026-03-24T16:30:00"
  },
  {
    id: "ts_4",
    timeDayId: "td_2",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-27",
    segmentType: "work",
    startAt: "2026-03-27T08:00:00",
    endAt: "2026-03-27T10:30:00"
  },
  {
    id: "ts_5",
    timeDayId: "td_2",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-27",
    segmentType: "break",
    startAt: "2026-03-27T10:30:00",
    endAt: "2026-03-27T10:45:00"
  },
  {
    id: "ts_6",
    timeDayId: "td_2",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-27",
    segmentType: "work",
    startAt: "2026-03-27T10:45:00",
    endAt: "2026-03-27T11:45:00"
  },
  {
    id: "ts_7",
    timeDayId: "td_2",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-27",
    segmentType: "break",
    startAt: "2026-03-27T11:45:00",
    endAt: null
  },
  {
    id: "ts_8",
    timeDayId: "td_3",
    workerId: "wrk_2",
    workerName: "Marco Diaz",
    workDate: "2026-03-25",
    segmentType: "work",
    startAt: "2026-03-25T11:00:00",
    endAt: "2026-03-25T14:00:00"
  },
  {
    id: "ts_9",
    timeDayId: "td_3",
    workerId: "wrk_2",
    workerName: "Marco Diaz",
    workDate: "2026-03-25",
    segmentType: "break",
    startAt: "2026-03-25T14:00:00",
    endAt: "2026-03-25T14:15:00"
  },
  {
    id: "ts_10",
    timeDayId: "td_3",
    workerId: "wrk_2",
    workerName: "Marco Diaz",
    workDate: "2026-03-25",
    segmentType: "work",
    startAt: "2026-03-25T14:15:00",
    endAt: "2026-03-25T18:00:00"
  },
  {
    id: "ts_11",
    timeDayId: "td_4",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-23",
    segmentType: "work",
    startAt: "2026-03-23T08:30:00",
    endAt: "2026-03-23T11:30:00"
  },
  {
    id: "ts_12",
    timeDayId: "td_4",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-23",
    segmentType: "break",
    startAt: "2026-03-23T11:30:00",
    endAt: "2026-03-23T12:00:00"
  },
  {
    id: "ts_13",
    timeDayId: "td_4",
    workerId: "wrk_1",
    workerName: "Ashley Cole",
    workDate: "2026-03-23",
    segmentType: "work",
    startAt: "2026-03-23T12:00:00",
    endAt: "2026-03-23T15:00:00"
  }
];

export const trainingModules: TrainingModule[] = [
  {
    id: "tm_1",
    title: "Food Safety Basics",
    description: "Quick refresher on safe handling, temps, and sanitation.",
    contentType: "video",
    contentValue: "https://example.com/video/food-safety",
    annualRenewal: true
  },
  {
    id: "tm_2",
    title: "Opening Checklist",
    description: "Simple text checklist for starting the day cleanly.",
    contentType: "text",
    contentValue: "Unlock, inspect station, prep sanitizer buckets, verify cold holds.",
    annualRenewal: false
  }
];

export const trainingAssignments: TrainingAssignment[] = [
  {
    id: "ta_1",
    workerId: "wrk_1",
    moduleId: "tm_1",
    moduleTitle: "Food Safety Basics",
    dueDate: "2026-04-02",
    completedAt: null,
    renewalDate: "2027-04-02"
  },
  {
    id: "ta_2",
    workerId: "wrk_1",
    moduleId: "tm_2",
    moduleTitle: "Opening Checklist",
    dueDate: "2026-03-20",
    completedAt: "2026-03-19",
    renewalDate: null
  },
  {
    id: "ta_3",
    workerId: "wrk_2",
    moduleId: "tm_1",
    moduleTitle: "Food Safety Basics",
    dueDate: "2026-03-22",
    completedAt: null,
    renewalDate: "2027-03-22"
  }
];
