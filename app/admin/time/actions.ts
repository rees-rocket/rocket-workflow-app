"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logTimeSegmentAudit, recalculateTimeDay } from "@/lib/data/time";
import type { TimeCorrectionRequestRow, TimeDayRow, TimeSegmentRow } from "@/lib/types";

export async function saveSegmentCorrection(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const segmentId = String(formData.get("segment_id") ?? "");
  const timeDayId = String(formData.get("time_day_id") ?? "");
  const workerId = String(formData.get("worker_id") ?? "");
  const segmentType = String(formData.get("segment_type") ?? "");
  const correctionRequestId = String(formData.get("correction_request_id") ?? "");
  const adminNote = String(formData.get("admin_note") ?? "");
  const startAt = String(formData.get("start_at") ?? "");
  const endAtRaw = String(formData.get("end_at") ?? "");

  if (!segmentId || !timeDayId || !workerId || !startAt || !segmentType) {
    return;
  }

  const { data: existingSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("id", segmentId)
    .maybeSingle<TimeSegmentRow>();

  if (!existingSegment) {
    return;
  }

  const nextValue = {
    start_at: new Date(startAt).toISOString(),
    end_at: endAtRaw ? new Date(endAtRaw).toISOString() : null,
    segment_type: segmentType
  };

  await supabase
    .from("time_segments")
    .update(nextValue)
    .eq("id", segmentId);

  await logTimeSegmentAudit({
    timeDayId,
    timeSegmentId: segmentId,
    correctionRequestId: correctionRequestId || null,
    actionType: "segment_updated",
    originalValue: existingSegment,
    newValue: nextValue,
    note: adminNote || null,
    actedBy: profile.id
  });

  if (correctionRequestId) {
    await markCorrectionRequestReviewed({
      supabase,
      requestId: correctionRequestId,
      status: "approved",
      adminNote,
      reviewedBy: profile.id,
      reviewedValue: nextValue
    });
  }

  await recalculateTimeDay(timeDayId, workerId);
  revalidatePath("/admin");
  revalidatePath("/admin/time");
  revalidatePath("/worker");
  revalidatePath("/worker/time");
}

export async function markTimeDayPaid(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const timeDayId = String(formData.get("time_day_id") ?? "");

  if (!timeDayId) {
    return;
  }

  const { data: timeDay } = await supabase
    .from("time_days")
    .select("*")
    .eq("id", timeDayId)
    .maybeSingle<TimeDayRow>();

  if (!timeDay || timeDay.status !== "off_clock") {
    return;
  }

  await supabase
    .from("time_days")
    .update({
      paid_at: new Date().toISOString(),
      paid_by: profile.id,
      paid_labor_cost_cents: timeDay.total_labor_cost_cents
    })
    .eq("id", timeDayId);

  revalidatePath("/admin");
  revalidatePath("/admin/time");
  revalidatePath("/admin/workers");
  revalidatePath(`/admin/workers/${timeDay.worker_id}`);
  revalidatePath("/worker/time");
}

export async function markTimeDayUnpaid(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const timeDayId = String(formData.get("time_day_id") ?? "");

  if (!timeDayId) {
    return;
  }

  const { data: timeDay } = await supabase
    .from("time_days")
    .select("worker_id")
    .eq("id", timeDayId)
    .maybeSingle<{ worker_id: string }>();

  await supabase
    .from("time_days")
    .update({
      paid_at: null,
      paid_by: null,
      paid_labor_cost_cents: null
    })
    .eq("id", timeDayId);

  revalidatePath("/admin");
  revalidatePath("/admin/time");
  revalidatePath("/admin/workers");
  if (timeDay) {
    revalidatePath(`/admin/workers/${timeDay.worker_id}`);
  }
  revalidatePath("/worker/time");
}

export async function addTimeSegment(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const timeDayId = String(formData.get("time_day_id") ?? "");
  const workerId = String(formData.get("worker_id") ?? "");
  const workDate = String(formData.get("work_date") ?? "");
  const segmentType = String(formData.get("segment_type") ?? "");
  const startAt = String(formData.get("start_at") ?? "");
  const endAtRaw = String(formData.get("end_at") ?? "");
  const adminNote = String(formData.get("admin_note") ?? "");

  if (!timeDayId || !workerId || !workDate || !segmentType || !startAt) return;

  const newSegment = {
    time_day_id: timeDayId,
    worker_id: workerId,
    work_date: workDate,
    segment_type: segmentType,
    start_at: new Date(startAt).toISOString(),
    end_at: endAtRaw ? new Date(endAtRaw).toISOString() : null,
    updated_by: profile.id
  };

  const { data: inserted } = await supabase.from("time_segments").insert(newSegment).select("*").maybeSingle<TimeSegmentRow>();

  await logTimeSegmentAudit({
    timeDayId,
    timeSegmentId: inserted?.id ?? null,
    actionType: "segment_added",
    originalValue: null,
    newValue: newSegment,
    note: adminNote || null,
    actedBy: profile.id
  });

  await recalculateTimeDay(timeDayId, workerId);
  revalidatePath("/admin/time");
}

export async function deleteTimeSegment(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const segmentId = String(formData.get("segment_id") ?? "");
  const timeDayId = String(formData.get("time_day_id") ?? "");
  const workerId = String(formData.get("worker_id") ?? "");
  const correctionRequestId = String(formData.get("correction_request_id") ?? "");
  const adminNote = String(formData.get("admin_note") ?? "");

  if (!segmentId || !timeDayId || !workerId) return;

  const { data: existingSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("id", segmentId)
    .maybeSingle<TimeSegmentRow>();

  if (!existingSegment) return;

  await supabase.from("time_segments").delete().eq("id", segmentId);

  await logTimeSegmentAudit({
    timeDayId,
    timeSegmentId: segmentId,
    correctionRequestId: correctionRequestId || null,
    actionType: "segment_deleted",
    originalValue: existingSegment,
    newValue: null,
    note: adminNote || null,
    actedBy: profile.id
  });

  if (correctionRequestId) {
    await markCorrectionRequestReviewed({
      supabase,
      requestId: correctionRequestId,
      status: "approved",
      adminNote,
      reviewedBy: profile.id,
      reviewedValue: null
    });
  }

  await recalculateTimeDay(timeDayId, workerId);
  revalidatePath("/admin/time");
  revalidatePath("/worker/time");
}

export async function reviewTimeCorrectionRequest(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("admin_note") ?? "");

  if (!requestId || !["approved", "denied"].includes(status)) return;

  await markCorrectionRequestReviewed({
    supabase,
    requestId,
    status: status as TimeCorrectionRequestRow["status"],
    adminNote,
    reviewedBy: profile.id,
    reviewedValue: null
  });

  revalidatePath("/admin/time");
  revalidatePath("/worker/time");
}

async function markCorrectionRequestReviewed(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  requestId: string;
  status: TimeCorrectionRequestRow["status"];
  adminNote: string;
  reviewedBy: string;
  reviewedValue: unknown;
}) {
  await input.supabase
    .from("time_correction_requests")
    .update({
      status: input.status,
      admin_note: input.adminNote || null,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      reviewed_value_json: input.reviewedValue,
      updated_at: new Date().toISOString()
    })
    .eq("id", input.requestId);
}
