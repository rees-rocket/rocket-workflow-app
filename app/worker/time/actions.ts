"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TimeDayRow, TimeSegmentRow } from "@/lib/types";

export async function submitTimeCorrectionRequest(formData: FormData) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const workDate = String(formData.get("work_date") ?? "");
  const requestType = String(formData.get("request_type") ?? "");
  const requestedChange = String(formData.get("requested_change") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const timeDayId = String(formData.get("time_day_id") ?? "");
  const timeSegmentId = String(formData.get("time_segment_id") ?? "");

  if (!workDate || !requestType || !requestedChange) return;

  let originalValue: TimeDayRow | TimeSegmentRow | null = null;

  if (timeSegmentId) {
    const { data } = await supabase
      .from("time_segments")
      .select("*")
      .eq("id", timeSegmentId)
      .eq("worker_id", profile.id)
      .maybeSingle<TimeSegmentRow>();
    originalValue = data ?? null;
  } else if (timeDayId) {
    const { data } = await supabase
      .from("time_days")
      .select("*")
      .eq("id", timeDayId)
      .eq("worker_id", profile.id)
      .maybeSingle<TimeDayRow>();
    originalValue = data ?? null;
  }

  await supabase.from("time_correction_requests").insert({
    worker_id: profile.id,
    work_date: workDate,
    time_day_id: timeDayId || null,
    time_segment_id: timeSegmentId || null,
    request_type: requestType,
    requested_change: requestedChange,
    reason: reason || null,
    status: "pending",
    original_value_json: originalValue,
    updated_at: new Date().toISOString()
  });

  revalidatePath("/worker/time");
  revalidatePath("/admin/time");
}
