"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { cookies } from "next/headers";

const WORKER_SESSION_DAY_COOKIE = "rr-worker-session-day";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/auth/login?message=Enter%20your%20email");
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error) {
    redirect(`/auth/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=Check%20your%20email%20for%20your%20magic%20link");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(WORKER_SESSION_DAY_COOKIE);
  redirect("/auth/login");
}

export async function redirectIfSignedIn() {
  const { profile } = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/worker");
  }
}
