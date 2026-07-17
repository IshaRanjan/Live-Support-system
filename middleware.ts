import { NextRequest, NextResponse } from 'next/server';

// Lightweight, Edge-runtime-safe check: just confirms the session cookie is
// present so unauthenticated visitors bounce to /support/login immediately,
// without a round trip to a page that would redirect anyway.
//
// This is NOT the security boundary — cookie signature + expiry are
// verified server-side in app/support/dashboard/layout.tsx (Node runtime,
// where lib/support/agent-session.ts can use Node's crypto module). Treat
// this middleware as a UX shortcut, not the auth check.
export function middleware(request: NextRequest) {
  const hasSessionCookie = request.cookies.has('support_session');

  if (!hasSessionCookie) {
    const loginUrl = new URL('/support/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/support/dashboard/:path*'],
};
