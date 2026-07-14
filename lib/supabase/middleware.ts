import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return protectRoute(request, response, false);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims validates the JWT before route access. Do not trust getSession here.
  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims && !error);
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  let mustChangePassword = false;
  if (isAuthenticated && userId) {
    const { data: member } = await supabase
      .from("members")
      .select("must_change_password")
      .eq("auth_user_id", userId)
      .maybeSingle();
    mustChangePassword = Boolean(member?.must_change_password);
  }

  return protectRoute(request, response, isAuthenticated, mustChangePassword);
}

function protectRoute(
  request: NextRequest,
  response: NextResponse,
  isAuthenticated: boolean,
  mustChangePassword = false,
) {
  const pathname = request.nextUrl.pathname;
  const isInitialPasswordRoute = pathname === "/auth/change-initial-password";
  const isInitialPasswordApi = pathname === "/api/auth/change-initial-password";
  const isPublicAuthRoute = pathname === "/login" || pathname === "/auth/callback" || pathname === "/auth/accept-invite" || isInitialPasswordRoute;

  if (!isAuthenticated && !isPublicAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && mustChangePassword && !isInitialPasswordRoute && !isInitialPasswordApi) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "初回パスワード変更を完了してください。" }, { status: 403 });
    }
    const passwordUrl = request.nextUrl.clone();
    passwordUrl.pathname = "/auth/change-initial-password";
    passwordUrl.search = "";
    return NextResponse.redirect(passwordUrl);
  }

  if (isAuthenticated && !mustChangePassword && (pathname === "/login" || isInitialPasswordRoute)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
