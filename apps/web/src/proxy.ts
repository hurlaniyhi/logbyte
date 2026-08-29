import { NextRequest, NextResponse } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";

const protectedPrefixes = ["/dashboard"];
const authRoutes = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedPrefixes.some((prefix) => path.startsWith(prefix));
  const isAuthRoute = authRoutes.includes(path);

  const session = await decryptSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard/logs", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
