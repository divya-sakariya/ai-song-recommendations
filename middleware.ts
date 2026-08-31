import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes behind auth. Extended as Milestone 2 adds /dashboard, /account, etc.
const AUTHENTICATED_PREFIXES = ["/create", "/account"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticatedRoute = AUTHENTICATED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAuthenticatedRoute) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // SEO-01: authenticated app routes must not be indexed.
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/create/:path*", "/account/:path*"],
};
