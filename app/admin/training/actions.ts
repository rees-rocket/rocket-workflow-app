"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function slugToInt(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function toNullableText(value: FormDataEntryValue | null) {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

export async function saveTrainingCategory(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const categoryId = readText(formData.get("category_id"));
  const payload = {
    name: readText(formData.get("name")),
    description: toNullableText(formData.get("description")),
    sort_order: slugToInt(formData.get("sort_order"), 0),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString()
  };

  if (!payload.name) return;

  if (categoryId) {
    await supabase.from("training_categories").update(payload).eq("id", categoryId);
  } else {
    await supabase.from("training_categories").insert(payload);
  }

  revalidatePath("/admin/training");
}

export async function saveTrainingModule(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const moduleId = readText(formData.get("module_id"));
  const annualRenewal = formData.get("annual_renewal") === "on";
  const passingScorePercent = slugToInt(formData.get("passing_score_percent"), 80);

  const payload = {
    category_id: toNullableText(formData.get("category_id")),
    title: readText(formData.get("title")),
    short_description: readText(formData.get("short_description")),
    learning_objective: toNullableText(formData.get("learning_objective")),
    estimated_duration_minutes: slugToInt(formData.get("estimated_duration_minutes"), 15),
    description: readText(formData.get("description")),
    content_type: readText(formData.get("content_type")) || "text",
    content_text: toNullableText(formData.get("content_text")),
    video_url: toNullableText(formData.get("video_url")),
    annual_renewal: annualRenewal,
    renewal_period_days: annualRenewal ? slugToInt(formData.get("renewal_period_days"), 365) : null,
    passing_score_percent: Math.min(100, Math.max(1, passingScorePercent)),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString()
  };

  if (!payload.title || !payload.short_description || !payload.description) return;

  let savedModuleId = moduleId;
  if (moduleId) {
    await supabase.from("training_modules").update(payload).eq("id", moduleId);
  } else {
    const { data } = await supabase.from("training_modules").insert(payload).select("id").maybeSingle<{ id: string }>();
    savedModuleId = data?.id ?? "";
  }

  if (!savedModuleId) return;

  await supabase.from("training_module_sections").delete().eq("module_id", savedModuleId);
  await supabase
    .from("training_quiz_options")
    .delete()
    .in(
      "question_id",
      ((await supabase.from("training_quiz_questions").select("id").eq("module_id", savedModuleId)).data ?? []).map((row) => row.id)
    );
  await supabase.from("training_quiz_questions").delete().eq("module_id", savedModuleId);

  const sections = Array.from({ length: 3 }, (_, index) => ({
    title: readText(formData.get(`section_${index + 1}_title`)),
    body: readText(formData.get(`section_${index + 1}_body`)),
    sort_order: index
  })).filter((section) => section.title && section.body);

  if (sections.length > 0) {
    await supabase.from("training_module_sections").insert(
      sections.map((section) => ({
        module_id: savedModuleId,
        ...section
      }))
    );
  }

  for (let questionIndex = 1; questionIndex <= 5; questionIndex += 1) {
    const questionText = readText(formData.get(`question_${questionIndex}_text`));
    if (!questionText) continue;

    const { data: question } = await supabase
      .from("training_quiz_questions")
      .insert({
        module_id: savedModuleId,
        question_text: questionText,
        sort_order: questionIndex - 1
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (!question?.id) continue;

    const correctOption = readText(formData.get(`question_${questionIndex}_correct`)) || "1";
    const options = Array.from({ length: 3 }, (_, optionIndex) => ({
      option_text: readText(formData.get(`question_${questionIndex}_option_${optionIndex + 1}`)),
      is_correct: correctOption === String(optionIndex + 1),
      sort_order: optionIndex
    })).filter((option) => option.option_text);

    if (options.length > 0) {
      await supabase.from("training_quiz_options").insert(
        options.map((option) => ({
          question_id: question.id,
          ...option
        }))
      );
    }
  }

  revalidatePath("/admin/training");
  revalidatePath("/admin/workers");
}

export async function saveTrainingAssignment(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const assignmentId = readText(formData.get("assignment_id"));
  const annualRenewal = formData.get("annual_renewal") === "on";
  const completedAt = toNullableText(formData.get("completed_at"));
  const dueDate = readText(formData.get("due_date"));
  const today = new Date().toISOString().slice(0, 10);
  const { data: module } = await supabase
    .from("training_modules")
    .select("annual_renewal, renewal_period_days")
    .eq("id", readText(formData.get("module_id")))
    .maybeSingle<{ annual_renewal: boolean; renewal_period_days: number | null }>();

  const renewalDate =
    annualRenewal || module?.annual_renewal
      ? toNullableText(formData.get("renewal_date")) ??
        (completedAt && module?.renewal_period_days
          ? (() => {
              const date = new Date(completedAt);
              date.setUTCDate(date.getUTCDate() + module.renewal_period_days);
              return date.toISOString().slice(0, 10);
            })()
          : null)
      : null;

  const status =
    completedAt
      ? "completed"
      : dueDate && dueDate < today
        ? "overdue"
        : "not_started";

  const payload = {
    worker_id: readText(formData.get("worker_id")),
    module_id: readText(formData.get("module_id")),
    due_date: dueDate,
    completed_at: completedAt ? new Date(completedAt).toISOString() : null,
    renewal_date: renewalDate,
    status,
    updated_at: new Date().toISOString()
  };

  if (!payload.worker_id || !payload.module_id || !payload.due_date) return;

  if (assignmentId) {
    await supabase.from("training_assignments").update(payload).eq("id", assignmentId);
  } else {
    await supabase.from("training_assignments").upsert(
      {
        ...payload,
        assigned_at: new Date().toISOString(),
        started_at: null,
        current_section_index: 0,
        attempts_count: 0
      },
      { onConflict: "worker_id,module_id" }
    );
  }

  revalidatePath("/admin/training");
  revalidatePath("/admin/workers");
}
