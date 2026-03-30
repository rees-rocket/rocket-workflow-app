import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { getCurrentWorkDate } from "@/lib/time";

const WORKER_SESSION_DAY_COOKIE = "rr-worker-session-day";

function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle<{ role: "admin" | "worker"; status: "active" | "inactive" }>();

  if (profile?.role !== "worker") {
    return response;
  }

  const today = getCurrentWorkDate();
  const workerSessionDay = request.cookies.get(WORKER_SESSION_DAY_COOKIE)?.value ?? null;

  if (workerSessionDay && workerSessionDay !== today) {
    const logoutResponse = NextResponse.redirect(
      new URL("/auth/login?message=Please%20sign%20in%20again%20for%20today", request.url)
    );
    const logoutClient = createMiddlewareClient(request, logoutResponse);
    await logoutClient.auth.signOut();
    logoutResponse.cookies.delete(WORKER_SESSION_DAY_COOKIE);
    return logoutResponse;
  }

  if (!workerSessionDay) {
    response.cookies.set(WORKER_SESSION_DAY_COOKIE, today, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
  }

  return response;
}
