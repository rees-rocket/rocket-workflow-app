export type AppRole = "admin" | "worker";
export type EmployeeType = "employee" | "contractor";
export type AssignmentRole = "service" | "prep";
export type ShiftStatus = "draft" | "published";
export type TradeRequestType = "trade" | "release";
export type TradeRequestStatus = "pending" | "approved" | "denied" | "cancelled";
export type PayBatchStatus = "draft" | "finalized" | "paid";
export type PayPeriodStatus = "open" | "ready" | "paid";
export type TrainingContentType = "text" | "video";
export type TrainingAssignmentStatus = "not_started" | "in_progress" | "completed" | "overdue";
export type TimeCorrectionRequestStatus = "pending" | "approved" | "denied";
export type WorkerFormStatus = "not_started" | "completed";

export type PayPeriodRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: PayPeriodStatus;
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PayBatchRow = {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  status: PayBatchStatus;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TipRecordRow = {
  id: string;
  worker_id: string;
  tip_date: string;
  pay_batch_id: string | null;
  pay_period_id: string | null;
  shift_id: string | null;
  event_name: string | null;
  cash_tip_cents: number;
  online_tip_cents: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  employee_type: EmployeeType;
  status: "active" | "inactive";
  wage_rate_cents: number | null;
  travel_wage_rate_cents: number | null;
  prep_wage_rate_cents: number | null;
  service_wage_rate_cents: number | null;
  tip_eligible: boolean;
  notes: string | null;
};

export type PendingWorkerProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  employee_type: EmployeeType;
  status: "active" | "inactive";
  wage_rate_cents: number | null;
  travel_wage_rate_cents: number | null;
  prep_wage_rate_cents: number | null;
  service_wage_rate_cents: number | null;
  tip_eligible: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TimeDayRow = {
  id: string;
  worker_id: string;
  work_date: string;
  pay_batch_id: string | null;
  pay_period_id: string | null;
  total_travel_minutes: number;
  total_prep_minutes: number;
  total_service_minutes: number;
  total_work_minutes: number;
  total_break_minutes: number;
  total_payable_minutes: number;
  travel_labor_cost_cents: number;
  prep_labor_cost_cents: number;
  service_labor_cost_cents: number;
  total_labor_cost_cents: number;
  paid_at: string | null;
  paid_by: string | null;
  paid_labor_cost_cents: number | null;
  status: "off_clock" | "travel" | "prep" | "service" | "on_break" | "working";
  created_at: string;
  updated_at: string;
};

export type TimeSegmentRow = {
  id: string;
  time_day_id: string;
  worker_id: string;
  shift_assignment_id: string | null;
  work_date: string;
  segment_type: "travel" | "prep" | "service" | "break" | "work";
  start_at: string;
  end_at: string | null;
  wage_rate_cents_used: number | null;
  labor_cost_cents: number | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type ShiftRow = {
  id: string;
  shift_date: string;
  location_name: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  status: ShiftStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ShiftAssignmentRow = {
  id: string;
  shift_id: string;
  worker_id: string;
  role: AssignmentRole;
  pay_rate_override_cents: number | null;
  created_at: string;
  updated_at: string;
};

export type ShiftTradeRequestRow = {
  id: string;
  shift_assignment_id: string;
  requested_by_worker_id: string;
  target_worker_id: string | null;
  request_type: TradeRequestType;
  reason: string | null;
  status: TradeRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type TrainingCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TrainingModuleRow = {
  id: string;
  category_id: string | null;
  title: string;
  short_description: string;
  learning_objective: string | null;
  estimated_duration_minutes: number | null;
  description: string;
  content_type: TrainingContentType;
  content_text: string | null;
  video_url: string | null;
  annual_renewal: boolean;
  renewal_period_days: number | null;
  passing_score_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TrainingModuleSectionRow = {
  id: string;
  module_id: string;
  title: string;
  body: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TrainingQuizQuestionRow = {
  id: string;
  module_id: string;
  question_text: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TrainingQuizOptionRow = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TrainingAssignmentRow = {
  id: string;
  worker_id: string;
  module_id: string;
  assigned_at: string;
  due_date: string;
  started_at: string | null;
  completed_at: string | null;
  renewal_date: string | null;
  status: TrainingAssignmentStatus;
  current_section_index: number;
  last_score_percent: number | null;
  attempts_count: number;
  created_at: string;
  updated_at: string;
};

export type TimeCorrectionRequestRow = {
  id: string;
  worker_id: string;
  work_date: string;
  time_day_id: string | null;
  time_segment_id: string | null;
  request_type: string;
  requested_change: string;
  reason: string | null;
  status: TimeCorrectionRequestStatus;
  admin_note: string | null;
  original_value_json: string | null;
  reviewed_value_json: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TimeSegmentAuditLogRow = {
  id: string;
  time_day_id: string;
  time_segment_id: string | null;
  correction_request_id: string | null;
  action_type: string;
  original_value_json: string | null;
  new_value_json: string | null;
  note: string | null;
  acted_by: string | null;
  acted_at: string;
};

export type WorkerFormRow = {
  id: string;
  form_key: string | null;
  version_label: string | null;
  name: string;
  short_description: string;
  content_text: string;
  acknowledgment_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkerFormAssignmentRow = {
  id: string;
  worker_id: string;
  form_id: string;
  assigned_at: string;
  status: WorkerFormStatus;
  created_at: string;
  updated_at: string;
};

export type WorkerFormSubmissionRow = {
  id: string;
  assignment_id: string;
  worker_id: string;
  form_id: string;
  submission_data_json: string | null;
  is_minor: boolean;
  acknowledged: boolean;
  typed_signature: string;
  worker_signed_at: string;
  guardian_signature: string | null;
  guardian_signed_at: string | null;
  submitted_at: string;
  created_at: string;
};
