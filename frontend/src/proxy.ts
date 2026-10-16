import { type NextRequest, NextResponse } from "next/server";

import { findUserById } from "@/lib/auth/users";

const LOGIN_PATH = "/giris";

// İyimser kontrol: yalnızca cookie'ye bakar. Asıl kontrol sayfalarda requireUser() ile yapılır.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const user = findUserById(req.cookies.get("session")?.value);
  const isLoginPage = pathname === LOGIN_PATH;

  if (!user && !isLoginPage) {
    const url = new URL(LOGIN_PATH, req.nextUrl);
    if (pathname !== "/") url.searchParams.set("from", pathname + search);
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
