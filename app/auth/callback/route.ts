import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { getCurrentWorkDate } from "@/lib/time";

const WORKER_SESSION_DAY_COOKIE = "rr-worker-session-day";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.redirect(new URL(next, requestUrl.origin));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")
          ?.split(/;\s*/)
          .filter(Boolean)
          .map((cookie) => {
            const [name, ...rest] = cookie.split("=");
            return {
              name,
              value: rest.join("=")
            };
          }) ?? [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: "admin" | "worker" }>();

    if (profile?.role === "worker") {
      response.cookies.set(WORKER_SESSION_DAY_COOKIE, getCurrentWorkDate(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    } else {
      response.cookies.delete(WORKER_SESSION_DAY_COOKIE);
    }
  }

  return response;
}
