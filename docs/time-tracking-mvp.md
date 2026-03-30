# Time Tracking MVP

## 1. Time-tracking data model for multi-segment days

Use two related tables:

- `time_days`
  - `id`
  - `worker_id`
  - `work_date`
  - `total_work_minutes`
  - `total_break_minutes`
  - `total_payable_minutes`
  - `status`
  - `created_at`
  - `updated_at`

- `time_segments`
  - `id`
  - `time_day_id`
  - `worker_id`
  - `work_date`
  - `segment_type` = `work | break`
  - `start_at`
  - `end_at` nullable
  - `created_at`
  - `updated_at`
  - `updated_by` nullable

How it works:

- Every clock in creates a new `work` segment.
- Starting a break closes the current `work` segment and creates a new open `break` segment.
- Ending a break closes the `break` segment and creates a new open `work` segment.
- Clocking out closes the current open `work` segment.
- A worker can repeat this many times in one day.

Daily calculations:

- `total_work_minutes`
  - sum of all closed `work` segments for the day
- `total_break_minutes`
  - sum of all closed `break` segments for the day
- `total_payable_minutes`
  - same as `total_work_minutes` for this MVP

Current worker state is derived from the open segment:

- no open segment: `Off the Clock`
- open `work` segment: `Clocked In`
- open `break` segment: `On Break`

## 2. Worker clock-in/out/break UI flow

Main worker dashboard:

- top status card
  - `Off the Clock`, `Clocked In`, or `On Break`
  - current open segment start time
  - today’s totals

Status-based actions:

- if `Off the Clock`
  - show `Clock In`

- if `Clocked In`
  - show `Start Break`
  - show `Clock Out`

- if `On Break`
  - show `End Break`

Recent activity:

- list recent segments in plain English
  - `Worked 8:00 AM to 11:30 AM`
  - `Break 11:30 AM to 12:00 PM`
  - `Worked 12:00 PM to 3:00 PM`

## 3. Admin daily-time-entry view

Admin sees daily summaries first:

- worker
- work date
- status
- total worked
- total break
- total payable

Each day can expand or drill in to segment detail:

- segment type
- start time
- end time
- segment duration

Admin editing:

- select one day
- edit one segment at a time
  - work start/end
  - break start/end
- recalculate daily totals automatically
