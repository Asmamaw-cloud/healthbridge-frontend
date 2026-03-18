import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We can't easily check localStorage here because middleware runs on Edge.
  // Full auth verification is usually done on the client, or via a cookie.
  // Since we are using localStorage + Zustand, redirect protection for the dashboard
  // will be handled in a client-side wrapper component or we check cookies if set.
  // For now, we will let the client handle redirects after hydration, 
  // or we can allow the request through and protect it via a layout guard.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
