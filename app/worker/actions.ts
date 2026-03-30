"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { getPayPeriodForDate } from "@/lib/data/pay-batches";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkDate } from "@/lib/time";
import { findMatchingShiftAssignmentId, recalculateTimeDay } from "@/lib/data/time";
import type { TimeDayRow, TimeSegmentRow } from "@/lib/types";

type PaidStatus = "travel" | "prep" | "service";

async function refreshTimeViews() {
  revalidatePath("/worker");
  revalidatePath("/worker/time");
  revalidatePath("/admin");
  revalidatePath("/admin/time");
}

async function ensureTimeDay(workerId: string, workDate: string, status: PaidStatus) {
  const supabase = await createClient();
  const payPeriod = await getPayPeriodForDate(workDate);
  let { data: timeDay } = await supabase
    .from("time_days")
    .select("*")
    .eq("worker_id", workerId)
    .eq("work_date", workDate)
    .maybeSingle<TimeDayRow>();

  if (!timeDay) {
    const { data: insertedDay } = await supabase
      .from("time_days")
      .insert({
        worker_id: workerId,
        work_date: workDate,
        pay_period_id: payPeriod?.id ?? null,
        total_travel_minutes: 0,
        total_prep_minutes: 0,
        total_service_minutes: 0,
        total_work_minutes: 0,
        total_break_minutes: 0,
        total_payable_minutes: 0,
        status
      })
      .select("*")
      .single<TimeDayRow>();

    timeDay = insertedDay ?? null;
  }

  if (!timeDay) {
    throw new Error("Unable to create a time day.");
  }

  return timeDay;
}

async function clockInWithStatus(status: PaidStatus) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const workDate = getCurrentWorkDate();
  const now = new Date().toISOString();

  const { data: openSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("worker_id", profile.id)
    .is("end_at", null)
    .maybeSingle<TimeSegmentRow>();

  if (openSegment) {
    await refreshTimeViews();
    return;
  }

  const timeDay = await ensureTimeDay(profile.id, workDate, status);
  const shiftAssignmentId = await findMatchingShiftAssignmentId({
    workerId: profile.id,
    workDate,
    segmentType: status,
    at: now
  });

  await supabase.from("time_segments").insert({
    time_day_id: timeDay.id,
    worker_id: profile.id,
    shift_assignment_id: shiftAssignmentId,
    work_date: workDate,
    segment_type: status,
    start_at: now
  });

  await recalculateTimeDay(timeDay.id, profile.id);
  await refreshTimeViews();
}

export async function clockInAsTravel() {
  await clockInWithStatus("travel");
}

export async function clockInAsPrep() {
  await clockInWithStatus("prep");
}

export async function clockInAsService() {
  await clockInWithStatus("service");
}

export async function switchStatus(formData: FormData) {
  const nextStatus = String(formData.get("next_status") ?? "") as PaidStatus;

  if (!["travel", "prep", "service"].includes(nextStatus)) {
    await refreshTimeViews();
    return;
  }

  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: openSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("worker_id", profile.id)
    .is("end_at", null)
    .maybeSingle<TimeSegmentRow>();

  if (!openSegment || openSegment.segment_type === "break" || openSegment.segment_type === nextStatus) {
    await refreshTimeViews();
    return;
  }

  await supabase.from("time_segments").update({ end_at: now }).eq("id", openSegment.id);
  const shiftAssignmentId = await findMatchingShiftAssignmentId({
    workerId: profile.id,
    workDate: openSegment.work_date,
    segmentType: nextStatus,
    at: now
  });
  await supabase.from("time_segments").insert({
    time_day_id: openSegment.time_day_id,
    worker_id: profile.id,
    shift_assignment_id: shiftAssignmentId,
    work_date: openSegment.work_date,
    segment_type: nextStatus,
    start_at: now
  });

  await recalculateTimeDay(openSegment.time_day_id, profile.id);
  await refreshTimeViews();
}

export async function startBreak() {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: openSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("worker_id", profile.id)
    .is("end_at", null)
    .maybeSingle<TimeSegmentRow>();

  if (!openSegment || openSegment.segment_type === "break") {
    await refreshTimeViews();
    return;
  }

  await supabase.from("time_segments").update({ end_at: now }).eq("id", openSegment.id);
  await supabase.from("time_segments").insert({
    time_day_id: openSegment.time_day_id,
    worker_id: profile.id,
    work_date: openSegment.work_date,
    segment_type: "break",
    start_at: now
  });

  await recalculateTimeDay(openSegment.time_day_id, profile.id);
  await refreshTimeViews();
}

export async function endBreak() {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: openBreak } = await supabase
    .from("time_segments")
    .select("*")
    .eq("worker_id", profile.id)
    .eq("segment_type", "break")
    .is("end_at", null)
    .maybeSingle<TimeSegmentRow>();

  if (!openBreak) {
    await refreshTimeViews();
    return;
  }

  const { data: previousPaidSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("time_day_id", openBreak.time_day_id)
    .neq("segment_type", "break")
    .not("end_at", "is", null)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle<TimeSegmentRow>();

  const resumeStatus: PaidStatus =
    previousPaidSegment?.segment_type === "travel" ||
    previousPaidSegment?.segment_type === "prep" ||
    previousPaidSegment?.segment_type === "service"
      ? previousPaidSegment.segment_type
      : "service";

  await supabase.from("time_segments").update({ end_at: now }).eq("id", openBreak.id);
  const shiftAssignmentId = await findMatchingShiftAssignmentId({
    workerId: profile.id,
    workDate: openBreak.work_date,
    segmentType: resumeStatus,
    at: now
  });
  await supabase.from("time_segments").insert({
    time_day_id: openBreak.time_day_id,
    worker_id: profile.id,
    shift_assignment_id: shiftAssignmentId,
    work_date: openBreak.work_date,
    segment_type: resumeStatus,
    start_at: now
  });

  await recalculateTimeDay(openBreak.time_day_id, profile.id);
  await refreshTimeViews();
}

export async function clockOut() {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: openSegment } = await supabase
    .from("time_segments")
    .select("*")
    .eq("worker_id", profile.id)
    .is("end_at", null)
    .maybeSingle<TimeSegmentRow>();

  if (!openSegment || openSegment.segment_type === "break") {
    await refreshTimeViews();
    return;
  }

  await supabase.from("time_segments").update({ end_at: now }).eq("id", openSegment.id);
  await recalculateTimeDay(openSegment.time_day_id, profile.id);
  await refreshTimeViews();
}
