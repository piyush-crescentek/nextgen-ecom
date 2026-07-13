import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TESTING_KITS_SLUG, ALL_TEST_KITS_SLUG } from '@/lib/constants';
import { APEX_ORIGIN, WWW_HOST } from '@/lib/seo-redirects';

function normalizeHostname(raw: string): string {
  const value = raw.split(',')[0].trim().toLowerCase();
  if (!value) return '';
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    return end === -1 ? value : value.slice(1, end);
  }
  return value.split(':')[0];
}

/** Prefer X-Forwarded-Host — reverse proxies often rewrite Host to the apex domain. */
function getRequestHostname(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-host');
  const host = request.headers.get('host') ?? '';
  return normalizeHostname(forwarded ?? host);
}

function withPathnameHeader(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export function middleware(request: NextRequest) {
  if (getRequestHostname(request) === WWW_HOST) {
    const target = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      APEX_ORIGIN,
    );
    return NextResponse.redirect(target, 301);
  }

  // Check if the user is accessing a protected route
  if (request.nextUrl.pathname.startsWith('/profile')) {
    // We cannot access localStorage in middleware, so we rely on cookies.
    // However, our current store implementation uses localStorage.
    // For a robust middleware implementation, we should also store the token in a cookie.

    // BUT, the user asked for a middleware "for profile without logfin can enter the login page".
    // This implies client-side protection or a cookie-based approach.
    // Since we only implemented localStorage persistence in Zustand, the middleware (running on edge/server) 
    // CANNOT see the token unless we sync it to cookies.

    // OPTION 1: Sync Zustand to Cookies (Complex for this step)
    // OPTION 2: Client-side protection (Easier, but user asked for middleware)
    // OPTION 3: Check for a cookie that might be set.

    // Let's implement a basic check. If we want true server-side protection, we need to set a cookie on login.
    // For now, I will assume we might have a cookie, or I will add logic to set one.
    // IF NOT, this middleware will be limited. 

    // WAIT: "create one middleware for proifle without logfin can enter the login page"
    // This phrasing is slightly ambiguous. "without login can enter the login page"
    // It likely means: If trying to access profile without login, redirect to login page.

    // Since we are using Zustand (client-side), standard Next.js middleware can't read it.
    // I will implement a client-side protection wrapper component OR
    // I will update the AuthStore to ALSO set a cookie, so the middleware works.

    // Let's check for a cookie named 'auth-token' or similar.
    // If not present, redirect to /auth.

    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/my-account';
      return NextResponse.redirect(url);
    }
  }

  if (request.nextUrl.pathname === `/${TESTING_KITS_SLUG}` || request.nextUrl.pathname === `/${ALL_TEST_KITS_SLUG}`) {
    return NextResponse.redirect(new URL(`/${TESTING_KITS_SLUG}/categories`, request.url));
  }

  // For every request that reaches here, pass the request pathname through to
  // server components via a custom request header. This lets the root layout
  // make route-aware decisions (e.g. skip site-wide JSON-LD on product pages)
  // without having to mount per-route layouts.
  return withPathnameHeader(request);
}

export const config = {
  // Run on every request except Next.js internals and static assets, so the
  // pathname header is available to server components on all pages while
  // existing profile/testing-kits handlers still match their own subpaths.
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|static|images|.*\\..*).*)',
  ],
};
