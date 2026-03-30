# Rocket Ribs Workforce MVP Plan

## 1. Simplified data model

Recommended MVP tables:

- `profiles`
  - `id` uuid, same as auth user id
  - `email`
  - `full_name`
  - `role` enum: `admin | worker`
  - `status` enum: `active | inactive`
  - `wage_rate_cents` nullable
  - `created_at`
  - `updated_at`

- `time_entries`
  - `id` uuid
  - `worker_id` references `profiles.id`
  - `work_date`
  - `start_at`
  - `end_at` nullable
  - `total_minutes` nullable
  - `created_at`
  - `updated_at`
  - `updated_by` nullable, references `profiles.id`

- `training_modules`
  - `id` uuid
  - `title`
  - `description`
  - `content_type` enum: `text | video`
  - `content_text` nullable
  - `video_url` nullable
  - `annual_renewal` boolean
  - `is_active`
  - `created_at`

- `training_assignments`
  - `id` uuid
  - `worker_id` references `profiles.id`
  - `module_id` references `training_modules.id`
  - `assigned_at`
  - `due_date`
  - `completed_at` nullable
  - `renewal_date` nullable

- `email_reminder_log`
  - `id` uuid
  - `worker_id`
  - `training_assignment_id`
  - `reminder_type` enum: `due_soon | overdue`
  - `sent_at`

Use Supabase Auth for magic-link login so passwords are not part of the app domain model.

## 2. Minimal screen layout

### Worker screens

- `/auth/login`
  - email field
  - send magic link button

- `/worker`
  - top card with clock in/out action
  - week hours summary
  - training status indicator
  - short list of assigned training

- `/worker/time`
  - recent entries
  - current open entry status

- `/worker/training/[id]`
  - title
  - description
  - text content or embedded video
  - mark complete button

### Admin screens

- `/admin`
  - summary cards
  - quick counts for workers, open time entries, due training

- `/admin/workers`
  - worker list
  - status toggle
  - wage rate edit

- `/admin/time`
  - all time entries
  - filters by worker/date
  - edit entry action

- `/admin/training`
  - module list
  - create module
  - assign module

## 3. User flow for clock in/out

### Worker flow

1. Worker opens app from home screen.
2. If not signed in, they request a magic link and return through email.
3. Dashboard checks for an open `time_entries` record where `end_at` is null.
4. If no open entry exists, show one primary button: `Clock in`.
5. On clock in:
   - create `time_entries` row
   - set `worker_id`
   - set `work_date`
   - set `start_at = now`
   - leave `end_at` and `total_minutes` null
6. Dashboard updates immediately to show:
   - `Clock out` button
   - live or simple running-state indicator
7. On clock out:
   - update the open row
   - set `end_at = now`
   - calculate `total_minutes`
8. Dashboard refreshes and moves the entry into recent history.

### Admin flow

1. Admin opens `/admin/time`.
2. Admin reviews all entries.
3. If correction is needed, admin edits start/end values.
4. App recalculates total minutes and stores `updated_by`.

## 4. Practical MVP decisions

- Keep roles to `admin` and `worker` only.
- Avoid schedules, trades, and tips in the first release.
- Keep worker navigation extremely shallow.
- Use email reminders only for training in the first release.
- Require online connectivity for clock actions in v1 to avoid sync conflicts.
