import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Header interno com o e-mail do usuário já VALIDADO pelo middleware.
 * Permite ao layout do admin não repetir supabase.auth.getUser() (uma ida à
 * API do Supabase Auth) a cada navegação. É sempre removido do request
 * recebido antes de ser definido, então o cliente não consegue forjá-lo.
 */
export const VERIFIED_USER_HEADER = "x-nps-verified-user";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(VERIFIED_USER_HEADER);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const refreshedCookies: { name: string; value: string; options?: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            refreshedCookies.push({ name, value, options });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminArea && !isLoginPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  // Cookies renovados no getUser() precisam chegar aos Server Components.
  if (refreshedCookies.length > 0) {
    requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
  }
  if (user?.email) {
    requestHeaders.set(VERIFIED_USER_HEADER, encodeURIComponent(user.email));
  }
  // Reconstrói a resposta já com o header e com os cookies renovados pelo getUser().
  response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  refreshedCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
