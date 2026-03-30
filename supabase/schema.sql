do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role' and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('admin', 'worker');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'worker_status' and n.nspname = 'public'
  ) then
    create type public.worker_status as enum ('active', 'inactive');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'employee_type' and n.nspname = 'public'
  ) then
    create type public.employee_type as enum ('employee', 'contractor');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'training_content_type' and n.nspname = 'public'
  ) then
    create type public.training_content_type as enum ('text', 'video');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'reminder_type' and n.nspname = 'public'
  ) then
    create type public.reminder_type as enum ('due_soon', 'overdue');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'time_day_status' and n.nspname = 'public'
  ) then
    create type public.time_day_status as enum ('off_clock', 'working', 'on_break');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'time_segment_type' and n.nspname = 'public'
  ) then
    create type public.time_segment_type as enum ('work', 'break');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'shift_status' and n.nspname = 'public'
  ) then
    create type public.shift_status as enum ('draft', 'published');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'assignment_role' and n.nspname = 'public'
  ) then
    create type public.assignment_role as enum ('service', 'prep');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'trade_request_type' and n.nspname = 'public'
  ) then
    create type public.trade_request_type as enum ('trade', 'release');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'trade_request_status' and n.nspname = 'public'
  ) then
    create type public.trade_request_status as enum ('pending', 'approved', 'denied', 'cancelled');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pay_batch_status' and n.nspname = 'public'
  ) then
    create type public.pay_batch_status as enum ('draft', 'finalized', 'paid');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'pay_period_status' and n.nspname = 'public'
  ) then
    create type public.pay_period_status as enum ('open', 'ready', 'paid');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'training_assignment_status' and n.nspname = 'public'
  ) then
    create type public.training_assignment_status as enum ('not_started', 'in_progress', 'completed', 'overdue');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'time_correction_request_status' and n.nspname = 'public'
  ) then
    create type public.time_correction_request_status as enum ('pending', 'approved', 'denied');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'worker_form_status' and n.nspname = 'public'
  ) then
    create type public.worker_form_status as enum ('not_started', 'completed');
  end if;
end $$;

create table if not exists public.training_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role app_role not null default 'worker',
  employee_type employee_type not null default 'employee',
  status worker_status not null default 'active',
  wage_rate_cents integer,
  travel_wage_rate_cents integer,
  prep_wage_rate_cents integer,
  service_wage_rate_cents integer,
  tip_eligible boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pay_batches (
  id uuid primary key default gen_random_uuid(),
  batch_name text not null,
  start_date date not null,
  end_date date not null,
  status pay_batch_status not null default 'draft',
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pay_periods (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  status pay_period_status not null default 'open',
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (start_date, end_date)
);

create table if not exists public.pending_worker_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role app_role not null default 'worker',
  employee_type employee_type not null default 'employee',
  status worker_status not null default 'active',
  wage_rate_cents integer,
  travel_wage_rate_cents integer,
  prep_wage_rate_cents integer,
  service_wage_rate_cents integer,
  tip_eligible boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_days (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  pay_batch_id uuid references public.pay_batches(id) on delete set null,
  pay_period_id uuid references public.pay_periods(id) on delete set null,
  total_travel_minutes integer not null default 0,
  total_prep_minutes integer not null default 0,
  total_service_minutes integer not null default 0,
  total_work_minutes integer not null default 0,
  total_break_minutes integer not null default 0,
  total_payable_minutes integer not null default 0,
  travel_labor_cost_cents integer not null default 0,
  prep_labor_cost_cents integer not null default 0,
  service_labor_cost_cents integer not null default 0,
  total_labor_cost_cents integer not null default 0,
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  paid_labor_cost_cents integer,
  status time_day_status not null default 'off_clock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, work_date)
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.training_categories(id) on delete set null,
  title text not null,
  short_description text,
  learning_objective text,
  estimated_duration_minutes integer,
  description text not null,
  content_type training_content_type not null,
  content_text text,
  video_url text,
  annual_renewal boolean not null default false,
  renewal_period_days integer,
  passing_score_percent integer not null default 80,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint training_content_check check (
    (content_type = 'text' and content_text is not null and video_url is null)
    or
    (content_type = 'video' and video_url is not null)
  )
);

create table if not exists public.training_assignments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  due_date date not null,
  started_at timestamptz,
  completed_at timestamptz,
  renewal_date date,
  status training_assignment_status not null default 'not_started',
  current_section_index integer not null default 0,
  last_score_percent integer,
  attempts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, module_id)
);

create table if not exists public.training_module_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  question_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.training_quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_reminder_log (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  training_assignment_id uuid not null references public.training_assignments(id) on delete cascade,
  reminder_type reminder_type not null,
  sent_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  shift_date date not null,
  location_name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  status shift_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  role assignment_role not null,
  pay_rate_override_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, worker_id)
);

create table if not exists public.time_segments (
  id uuid primary key default gen_random_uuid(),
  time_day_id uuid not null references public.time_days(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  shift_assignment_id uuid references public.shift_assignments(id) on delete set null,
  work_date date not null,
  segment_type time_segment_type not null,
  start_at timestamptz not null,
  end_at timestamptz,
  wage_rate_cents_used integer,
  labor_cost_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table if not exists public.shift_trade_requests (
  id uuid primary key default gen_random_uuid(),
  shift_assignment_id uuid not null references public.shift_assignments(id) on delete cascade,
  requested_by_worker_id uuid not null references public.profiles(id) on delete cascade,
  target_worker_id uuid references public.profiles(id),
  request_type trade_request_type not null,
  reason text,
  status trade_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tip_records (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  tip_date date not null,
  pay_batch_id uuid references public.pay_batches(id) on delete set null,
  pay_period_id uuid references public.pay_periods(id) on delete set null,
  shift_id uuid references public.shifts(id) on delete set null,
  event_name text,
  cash_tip_cents integer not null default 0,
  online_tip_cents integer not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worker_forms (
  id uuid primary key default gen_random_uuid(),
  form_key text unique,
  version_label text,
  name text not null,
  short_description text not null,
  content_text text not null,
  acknowledgment_label text not null default 'I acknowledge and agree to this form.',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.worker_forms
  add column if not exists version_label text;

create table if not exists public.worker_form_assignments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  form_id uuid not null references public.worker_forms(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  status public.worker_form_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, form_id)
);

create table if not exists public.worker_form_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.worker_form_assignments(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  form_id uuid not null references public.worker_forms(id) on delete cascade,
  submission_data_json jsonb,
  is_minor boolean not null default false,
  acknowledged boolean not null default false,
  typed_signature text not null,
  worker_signed_at timestamptz not null default now(),
  guardian_signature text,
  guardian_signed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.time_correction_requests (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  time_day_id uuid references public.time_days(id) on delete set null,
  time_segment_id uuid references public.time_segments(id) on delete set null,
  request_type text not null,
  requested_change text not null,
  reason text,
  status public.time_correction_request_status not null default 'pending',
  admin_note text,
  original_value_json jsonb,
  reviewed_value_json jsonb,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_segment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  time_day_id uuid not null references public.time_days(id) on delete cascade,
  time_segment_id uuid references public.time_segments(id) on delete set null,
  correction_request_id uuid references public.time_correction_requests(id) on delete set null,
  action_type text not null,
  original_value_json jsonb,
  new_value_json jsonb,
  note text,
  acted_by uuid references public.profiles(id),
  acted_at timestamptz not null default now()
);

create index if not exists idx_time_days_worker_date
  on public.time_days (worker_id, work_date desc);
create index if not exists idx_time_days_pay_batch
  on public.time_days (pay_batch_id);
create index if not exists idx_time_days_pay_period
  on public.time_days (pay_period_id);

create index if not exists idx_time_segments_day
  on public.time_segments (time_day_id, start_at asc);
create index if not exists idx_time_segments_shift_assignment
  on public.time_segments (shift_assignment_id);
create index if not exists idx_worker_form_assignments_worker
  on public.worker_form_assignments (worker_id, status, assigned_at desc);
create index if not exists idx_worker_form_assignments_form
  on public.worker_form_assignments (form_id, assigned_at desc);
create index if not exists idx_worker_forms_form_key
  on public.worker_forms (form_key);
create index if not exists idx_worker_form_submissions_worker
  on public.worker_form_submissions (worker_id, submitted_at desc);
create index if not exists idx_time_correction_requests_worker
  on public.time_correction_requests (worker_id, work_date desc);
create index if not exists idx_time_correction_requests_status
  on public.time_correction_requests (status, created_at desc);
create index if not exists idx_time_segment_audit_logs_day
  on public.time_segment_audit_logs (time_day_id, acted_at desc);

create index if not exists idx_training_assignments_due_date
  on public.training_assignments (due_date);
create index if not exists idx_training_assignments_status
  on public.training_assignments (status, due_date);
create index if not exists idx_training_modules_category
  on public.training_modules (category_id, is_active);
create index if not exists idx_training_sections_module
  on public.training_module_sections (module_id, sort_order);
create index if not exists idx_training_questions_module
  on public.training_quiz_questions (module_id, sort_order);
create index if not exists idx_training_options_question
  on public.training_quiz_options (question_id, sort_order);
create index if not exists idx_shifts_date
  on public.shifts (shift_date desc, start_at asc);
create index if not exists idx_shift_assignments_worker
  on public.shift_assignments (worker_id, shift_id);
create index if not exists idx_shift_trade_requests_status
  on public.shift_trade_requests (status, created_at desc);
create index if not exists idx_tip_records_worker_date
  on public.tip_records (worker_id, tip_date desc);
create index if not exists idx_tip_records_pay_batch
  on public.tip_records (pay_batch_id);
create index if not exists idx_tip_records_pay_period
  on public.tip_records (pay_period_id);
create index if not exists idx_pay_batches_status
  on public.pay_batches (status, end_date desc, created_at desc);
create index if not exists idx_pay_periods_status
  on public.pay_periods (status, end_date desc, created_at desc);

alter type public.time_day_status add value if not exists 'travel';
alter type public.time_day_status add value if not exists 'prep';
alter type public.time_day_status add value if not exists 'service';
alter type public.time_segment_type add value if not exists 'travel';
alter type public.time_segment_type add value if not exists 'prep';
alter type public.time_segment_type add value if not exists 'service';

alter table public.time_days add column if not exists total_travel_minutes integer not null default 0;
alter table public.time_days add column if not exists pay_batch_id uuid references public.pay_batches(id) on delete set null;
alter table public.time_days add column if not exists pay_period_id uuid references public.pay_periods(id) on delete set null;
alter table public.time_days add column if not exists total_prep_minutes integer not null default 0;
alter table public.time_days add column if not exists total_service_minutes integer not null default 0;
alter table public.time_days add column if not exists travel_labor_cost_cents integer not null default 0;
alter table public.time_days add column if not exists prep_labor_cost_cents integer not null default 0;
alter table public.time_days add column if not exists service_labor_cost_cents integer not null default 0;
alter table public.time_days add column if not exists total_labor_cost_cents integer not null default 0;
alter table public.time_days add column if not exists paid_at timestamptz;
alter table public.time_days add column if not exists paid_by uuid references public.profiles(id);
alter table public.time_days add column if not exists paid_labor_cost_cents integer;
alter table public.time_segments add column if not exists wage_rate_cents_used integer;
alter table public.time_segments add column if not exists labor_cost_cents integer;
alter table public.time_segments add column if not exists shift_assignment_id uuid references public.shift_assignments(id) on delete set null;
alter table public.profiles add column if not exists travel_wage_rate_cents integer;
alter table public.profiles add column if not exists prep_wage_rate_cents integer;
alter table public.profiles add column if not exists service_wage_rate_cents integer;
alter table public.pending_worker_profiles add column if not exists travel_wage_rate_cents integer;
alter table public.pending_worker_profiles add column if not exists prep_wage_rate_cents integer;
alter table public.pending_worker_profiles add column if not exists service_wage_rate_cents integer;
alter table public.tip_records add column if not exists pay_batch_id uuid references public.pay_batches(id) on delete set null;
alter table public.tip_records add column if not exists pay_period_id uuid references public.pay_periods(id) on delete set null;
alter table public.training_modules add column if not exists category_id uuid references public.training_categories(id) on delete set null;
alter table public.training_modules add column if not exists short_description text;
alter table public.training_modules add column if not exists learning_objective text;
alter table public.training_modules add column if not exists estimated_duration_minutes integer;
alter table public.training_modules add column if not exists renewal_period_days integer;
alter table public.training_modules add column if not exists passing_score_percent integer not null default 80;
alter table public.training_modules add column if not exists updated_at timestamptz not null default now();
alter table public.training_assignments add column if not exists started_at timestamptz;
alter table public.training_assignments add column if not exists status training_assignment_status not null default 'not_started';
alter table public.training_assignments add column if not exists current_section_index integer not null default 0;
alter table public.training_assignments add column if not exists last_score_percent integer;
alter table public.training_assignments add column if not exists attempts_count integer not null default 0;
alter table public.training_assignments add column if not exists created_at timestamptz not null default now();
alter table public.training_assignments add column if not exists updated_at timestamptz not null default now();

update public.time_segments
set segment_type = 'service'
where segment_type = 'work';

update public.time_days
set status = 'service'
where status = 'working';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    employee_type,
    status,
    wage_rate_cents,
    travel_wage_rate_cents,
    prep_wage_rate_cents,
    service_wage_rate_cents,
    tip_eligible,
    notes
  )
  values (
    new.id,
    new.email,
    coalesce(
      (select full_name from public.pending_worker_profiles where email = new.email),
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      (select role from public.pending_worker_profiles where email = new.email),
      coalesce((new.raw_user_meta_data->>'role')::app_role, 'worker')
    ),
    coalesce(
      (select employee_type from public.pending_worker_profiles where email = new.email),
      'employee'::employee_type
    ),
    coalesce(
      (select status from public.pending_worker_profiles where email = new.email),
      'active'::worker_status
    ),
    (select wage_rate_cents from public.pending_worker_profiles where email = new.email),
    (select travel_wage_rate_cents from public.pending_worker_profiles where email = new.email),
    (select prep_wage_rate_cents from public.pending_worker_profiles where email = new.email),
    (select service_wage_rate_cents from public.pending_worker_profiles where email = new.email),
    coalesce(
      (select tip_eligible from public.pending_worker_profiles where email = new.email),
      false
    ),
    (select notes from public.pending_worker_profiles where email = new.email)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name;

  delete from public.pending_worker_profiles
  where email = new.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'admin'
      and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.pending_worker_profiles enable row level security;
alter table public.time_days enable row level security;
alter table public.time_segments enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_assignments enable row level security;
alter table public.training_categories enable row level security;
alter table public.training_module_sections enable row level security;
alter table public.training_quiz_questions enable row level security;
alter table public.training_quiz_options enable row level security;
alter table public.email_reminder_log enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.shift_trade_requests enable row level security;
alter table public.tip_records enable row level security;
alter table public.pay_batches enable row level security;
alter table public.pay_periods enable row level security;
alter table public.time_correction_requests enable row level security;
alter table public.time_segment_audit_logs enable row level security;
alter table public.worker_forms enable row level security;
alter table public.worker_form_assignments enable row level security;
alter table public.worker_form_submissions enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "pending_profiles_select_admin" on public.pending_worker_profiles;
create policy "pending_profiles_select_admin"
  on public.pending_worker_profiles
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "pending_profiles_insert_admin" on public.pending_worker_profiles;
create policy "pending_profiles_insert_admin"
  on public.pending_worker_profiles
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "pending_profiles_update_admin" on public.pending_worker_profiles;
create policy "pending_profiles_update_admin"
  on public.pending_worker_profiles
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "time_days_select_self_or_admin" on public.time_days;
create policy "time_days_select_self_or_admin"
  on public.time_days
  for select
  using (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_days_insert_self_or_admin" on public.time_days;
create policy "time_days_insert_self_or_admin"
  on public.time_days
  for insert
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_days_update_self_or_admin" on public.time_days;
create policy "time_days_update_self_or_admin"
  on public.time_days
  for update
  using (auth.uid() = worker_id or public.is_admin(auth.uid()))
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_segments_select_self_or_admin" on public.time_segments;
create policy "time_segments_select_self_or_admin"
  on public.time_segments
  for select
  using (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_segments_insert_self_or_admin" on public.time_segments;
create policy "time_segments_insert_self_or_admin"
  on public.time_segments
  for insert
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_segments_update_self_or_admin" on public.time_segments;
create policy "time_segments_update_self_or_admin"
  on public.time_segments
  for update
  using (auth.uid() = worker_id or public.is_admin(auth.uid()))
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_correction_requests_select_self_or_admin" on public.time_correction_requests;
create policy "time_correction_requests_select_self_or_admin"
  on public.time_correction_requests
  for select
  using (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_correction_requests_insert_self_or_admin" on public.time_correction_requests;
create policy "time_correction_requests_insert_self_or_admin"
  on public.time_correction_requests
  for insert
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "time_correction_requests_update_admin" on public.time_correction_requests;
create policy "time_correction_requests_update_admin"
  on public.time_correction_requests
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "time_segment_audit_logs_select_self_or_admin" on public.time_segment_audit_logs;
create policy "time_segment_audit_logs_select_self_or_admin"
  on public.time_segment_audit_logs
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.time_days
      where time_days.id = time_segment_audit_logs.time_day_id
        and time_days.worker_id = auth.uid()
    )
  );

drop policy if exists "time_segment_audit_logs_insert_admin" on public.time_segment_audit_logs;
create policy "time_segment_audit_logs_insert_admin"
  on public.time_segment_audit_logs
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "worker_forms_select_self_or_admin" on public.worker_forms;
create policy "worker_forms_select_self_or_admin"
  on public.worker_forms
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.worker_form_assignments
      where worker_form_assignments.form_id = worker_forms.id
        and worker_form_assignments.worker_id = auth.uid()
    )
  );

drop policy if exists "worker_forms_insert_admin" on public.worker_forms;
create policy "worker_forms_insert_admin"
  on public.worker_forms
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "worker_forms_update_admin" on public.worker_forms;
create policy "worker_forms_update_admin"
  on public.worker_forms
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "worker_form_assignments_select_self_or_admin" on public.worker_form_assignments;
create policy "worker_form_assignments_select_self_or_admin"
  on public.worker_form_assignments
  for select
  using (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "worker_form_assignments_insert_admin" on public.worker_form_assignments;
create policy "worker_form_assignments_insert_admin"
  on public.worker_form_assignments
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "worker_form_assignments_update_self_or_admin" on public.worker_form_assignments;
create policy "worker_form_assignments_update_self_or_admin"
  on public.worker_form_assignments
  for update
  using (auth.uid() = worker_id or public.is_admin(auth.uid()))
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "worker_form_submissions_select_self_or_admin" on public.worker_form_submissions;
create policy "worker_form_submissions_select_self_or_admin"
  on public.worker_form_submissions
  for select
  using (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "worker_form_submissions_insert_self_or_admin" on public.worker_form_submissions;
create policy "worker_form_submissions_insert_self_or_admin"
  on public.worker_form_submissions
  for insert
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

insert into public.worker_forms (
  form_key,
  version_label,
  name,
  short_description,
  content_text,
  acknowledgment_label,
  is_active
)
values (
  'emergency-contact-safety-guardian',
  null,
  'Emergency Contact, Safety & Guardian Acknowledgment',
  'Emergency contact details, safety acknowledgment, and guardian consent for workers under 18.',
  'Emergency Contact, Safety & Guardian Acknowledgment',
  'I acknowledge that I have read and understand the safety expectations outlined above.',
  true
)
on conflict (form_key) do update
set
  version_label = excluded.version_label,
  name = excluded.name,
  short_description = excluded.short_description,
  content_text = excluded.content_text,
  acknowledgment_label = excluded.acknowledgment_label,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.worker_forms (
  form_key,
  version_label,
  name,
  short_description,
  content_text,
  acknowledgment_label,
  is_active
)
values (
  'w9-form',
  null,
  'IRS Form W-9',
  'Exact government W-9 PDF for printing and completion.',
  'Official IRS Form W-9 PDF',
  'I understand this form must be printed and completed outside the portal.',
  true
)
on conflict (form_key) do update
set
  version_label = excluded.version_label,
  name = excluded.name,
  short_description = excluded.short_description,
  content_text = excluded.content_text,
  acknowledgment_label = excluded.acknowledgment_label,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.worker_forms (
  form_key,
  version_label,
  name,
  short_description,
  content_text,
  acknowledgment_label,
  is_active
)
values (
  'independent-contractor-agreement',
  null,
  'Independent Contractor Agreement',
  'Independent contractor terms, signature, and guardian acknowledgment for minors.',
  'INDEPENDENT CONTRACTOR AGREEMENT',
  'I acknowledge that I have read and agree to this Independent Contractor Agreement.',
  true
)
on conflict (form_key) do update
set
  version_label = excluded.version_label,
  name = excluded.name,
  short_description = excluded.short_description,
  content_text = excluded.content_text,
  acknowledgment_label = excluded.acknowledgment_label,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.worker_forms (
  form_key,
  version_label,
  name,
  short_description,
  content_text,
  acknowledgment_label,
  is_active
)
values (
  'employee-handbook-acknowledgment',
  'Employee Handbook v1 - 2026',
  'Employee Handbook Acknowledgment',
  'Review the employee handbook and sign the acknowledgment.',
  'Rocket Ribs & BBQ Employee Handbook (Field Operations)',
  'I acknowledge that I have read and agree to follow the current Employee Handbook.',
  true
)
on conflict (form_key) do update
set
  version_label = excluded.version_label,
  name = excluded.name,
  short_description = excluded.short_description,
  content_text = excluded.content_text,
  acknowledgment_label = excluded.acknowledgment_label,
  is_active = excluded.is_active,
  updated_at = now();

drop policy if exists "training_categories_select_self_or_admin" on public.training_categories;
create policy "training_categories_select_self_or_admin"
  on public.training_categories
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.training_modules
      join public.training_assignments on training_assignments.module_id = training_modules.id
      where training_modules.category_id = training_categories.id
        and training_assignments.worker_id = auth.uid()
    )
  );

drop policy if exists "training_categories_insert_admin" on public.training_categories;
create policy "training_categories_insert_admin"
  on public.training_categories
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_categories_update_admin" on public.training_categories;
create policy "training_categories_update_admin"
  on public.training_categories
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_modules_select_self_or_admin" on public.training_modules;
create policy "training_modules_select_self_or_admin"
  on public.training_modules
  for select
  using (public.is_admin(auth.uid()) or exists (
    select 1
    from public.training_assignments
    where training_assignments.module_id = training_modules.id
      and training_assignments.worker_id = auth.uid()
  ));

drop policy if exists "training_modules_insert_admin" on public.training_modules;
create policy "training_modules_insert_admin"
  on public.training_modules
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_modules_update_admin" on public.training_modules;
create policy "training_modules_update_admin"
  on public.training_modules
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_assignments_select_self_or_admin" on public.training_assignments;
create policy "training_assignments_select_self_or_admin"
  on public.training_assignments
  for select
  using (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "training_assignments_insert_admin" on public.training_assignments;
create policy "training_assignments_insert_admin"
  on public.training_assignments
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_assignments_update_self_or_admin" on public.training_assignments;
create policy "training_assignments_update_self_or_admin"
  on public.training_assignments
  for update
  using (auth.uid() = worker_id or public.is_admin(auth.uid()))
  with check (auth.uid() = worker_id or public.is_admin(auth.uid()));

drop policy if exists "training_sections_select_self_or_admin" on public.training_module_sections;
create policy "training_sections_select_self_or_admin"
  on public.training_module_sections
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.training_assignments
      where training_assignments.module_id = training_module_sections.module_id
        and training_assignments.worker_id = auth.uid()
    )
  );

drop policy if exists "training_sections_insert_admin" on public.training_module_sections;
create policy "training_sections_insert_admin"
  on public.training_module_sections
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_sections_update_admin" on public.training_module_sections;
create policy "training_sections_update_admin"
  on public.training_module_sections
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_questions_select_self_or_admin" on public.training_quiz_questions;
create policy "training_questions_select_self_or_admin"
  on public.training_quiz_questions
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.training_assignments
      where training_assignments.module_id = training_quiz_questions.module_id
        and training_assignments.worker_id = auth.uid()
    )
  );

drop policy if exists "training_questions_insert_admin" on public.training_quiz_questions;
create policy "training_questions_insert_admin"
  on public.training_quiz_questions
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_questions_update_admin" on public.training_quiz_questions;
create policy "training_questions_update_admin"
  on public.training_quiz_questions
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_options_select_self_or_admin" on public.training_quiz_options;
create policy "training_options_select_self_or_admin"
  on public.training_quiz_options
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.training_quiz_questions
      join public.training_assignments on training_assignments.module_id = training_quiz_questions.module_id
      where training_quiz_questions.id = training_quiz_options.question_id
        and training_assignments.worker_id = auth.uid()
    )
  );

drop policy if exists "training_options_insert_admin" on public.training_quiz_options;
create policy "training_options_insert_admin"
  on public.training_quiz_options
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "training_options_update_admin" on public.training_quiz_options;
create policy "training_options_update_admin"
  on public.training_quiz_options
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "shifts_select_self_or_admin" on public.shifts;
create policy "shifts_select_self_or_admin"
  on public.shifts
  for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1
      from public.shift_assignments
      where shift_assignments.shift_id = shifts.id
        and shift_assignments.worker_id = auth.uid()
    )
  );

drop policy if exists "shifts_insert_admin" on public.shifts;
create policy "shifts_insert_admin"
  on public.shifts
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "shifts_update_admin" on public.shifts;
create policy "shifts_update_admin"
  on public.shifts
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "shift_assignments_select_self_or_admin" on public.shift_assignments;
create policy "shift_assignments_select_self_or_admin"
  on public.shift_assignments
  for select
  using (public.is_admin(auth.uid()) or worker_id = auth.uid());

drop policy if exists "shift_assignments_insert_admin" on public.shift_assignments;
create policy "shift_assignments_insert_admin"
  on public.shift_assignments
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "shift_assignments_update_admin" on public.shift_assignments;
create policy "shift_assignments_update_admin"
  on public.shift_assignments
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "shift_trade_requests_select_self_or_admin" on public.shift_trade_requests;
create policy "shift_trade_requests_select_self_or_admin"
  on public.shift_trade_requests
  for select
  using (
    public.is_admin(auth.uid())
    or requested_by_worker_id = auth.uid()
    or target_worker_id = auth.uid()
  );

drop policy if exists "shift_trade_requests_insert_worker_or_admin" on public.shift_trade_requests;
create policy "shift_trade_requests_insert_worker_or_admin"
  on public.shift_trade_requests
  for insert
  with check (
    public.is_admin(auth.uid()) or requested_by_worker_id = auth.uid()
  );

drop policy if exists "shift_trade_requests_update_admin" on public.shift_trade_requests;
create policy "shift_trade_requests_update_admin"
  on public.shift_trade_requests
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "tip_records_select_admin" on public.tip_records;
create policy "tip_records_select_admin"
  on public.tip_records
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "tip_records_insert_admin" on public.tip_records;
create policy "tip_records_insert_admin"
  on public.tip_records
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "tip_records_update_admin" on public.tip_records;
create policy "tip_records_update_admin"
  on public.tip_records
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "pay_batches_select_admin" on public.pay_batches;
create policy "pay_batches_select_admin"
  on public.pay_batches
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "pay_batches_insert_admin" on public.pay_batches;
create policy "pay_batches_insert_admin"
  on public.pay_batches
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "pay_batches_update_admin" on public.pay_batches;
create policy "pay_batches_update_admin"
  on public.pay_batches
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "pay_periods_select_admin" on public.pay_periods;
create policy "pay_periods_select_admin"
  on public.pay_periods
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "pay_periods_insert_admin" on public.pay_periods;
create policy "pay_periods_insert_admin"
  on public.pay_periods
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "pay_periods_update_admin" on public.pay_periods;
create policy "pay_periods_update_admin"
  on public.pay_periods
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
