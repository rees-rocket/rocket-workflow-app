"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getWorkerTrainingModule } from "@/lib/data/training";

function calculateRenewalDate(completedAtIso: string, renewalPeriodDays: number | null) {
  if (!renewalPeriodDays) return null;
  const date = new Date(completedAtIso);
  date.setUTCDate(date.getUTCDate() + renewalPeriodDays);
  return date.toISOString().slice(0, 10);
}

export async function startTrainingModule(formData: FormData) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  if (!assignmentId) return;

  await supabase
    .from("training_assignments")
    .update({
      started_at: new Date().toISOString(),
      status: "in_progress",
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId)
    .eq("worker_id", profile.id);

  revalidatePath("/worker/training");
  revalidatePath(`/worker/training/${assignmentId}`);
}

export async function advanceTrainingSection(formData: FormData) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const nextIndex = Number(formData.get("next_index") ?? 0);
  if (!assignmentId) return;

  await supabase
    .from("training_assignments")
    .update({
      current_section_index: nextIndex,
      status: "in_progress",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId)
    .eq("worker_id", profile.id);

  revalidatePath("/worker/training");
  revalidatePath(`/worker/training/${assignmentId}`);
}

export async function submitTrainingQuiz(formData: FormData) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  if (!assignmentId) return;

  const moduleData = await getWorkerTrainingModule(profile.id, assignmentId);
  if (!moduleData) return;

  const totalQuestions = moduleData.questions.length;
  const correctAnswers = moduleData.questions.reduce((sum, question) => {
    const chosenOptionId = String(formData.get(`question_${question.id}`) ?? "");
    const correctOption = question.options.find((option) => option.is_correct);
    return sum + (correctOption?.id === chosenOptionId ? 1 : 0);
  }, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = scorePercent >= moduleData.module.passing_score_percent;
  const completedAt = passed ? new Date().toISOString() : null;

  await supabase
    .from("training_assignments")
    .update({
      completed_at: completedAt,
      renewal_date: passed ? calculateRenewalDate(completedAt!, moduleData.module.renewal_period_days) : moduleData.assignment.renewal_date,
      status: passed ? "completed" : "in_progress",
      last_score_percent: scorePercent,
      attempts_count: (moduleData.assignment.attempts_count ?? 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId)
    .eq("worker_id", profile.id);

  revalidatePath("/worker/training");
  revalidatePath(`/worker/training/${assignmentId}`);
}
