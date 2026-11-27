import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the login session fresh and sends logged-out visitors away from private pages.
// The real security is Row Level Security in the database; this is just convenience.
export async function proxy(request: NextRequest) {
  // If Supabase isn't configured yet, don't crash every page (pages show a clear message).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims() verifies the session token locally and only refreshes it when needed (fast).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;
  const path = request.nextUrl.pathname;
  const isPrivate = path.startsWith("/admin") || path.startsWith("/register") || path.startsWith("/maker") || path.startsWith("/become-a-maker");

  // New / signed-out visitors opening the app go straight to sign-in.
  if (!user && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isPrivate) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|logo.png|about|about.html|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
