import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const isAuthPage = (pathname: string) =>
  pathname === '/auth/sign-in' ||
  pathname.startsWith('/auth/sign-up') ||
  pathname === '/auth/forgot-password' ||
  pathname === '/auth/reset-password';
const isPublicPath = (pathname: string) =>
  isAuthPage(pathname) || pathname.startsWith('/api/auth');

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // Allow NextAuth API through without redirect logic
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    const isAuthenticated = !!token;

    // Authenticated user on sign-in or sign-up → redirect to app
    if (isAuthenticated && isAuthPage(pathname)) {
      return NextResponse.redirect(new URL('/overview', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Let all API routes through – they return 401 JSON when unauthenticated.
        // Redirecting API requests would return HTML and break fetch().json().
        if (pathname.startsWith('/api')) {
          return true;
        }

        // Public routes: auth pages
        if (isPublicPath(pathname)) {
          return true;
        }

        // Role-based: super-admin
        if (pathname.startsWith('/super-admin')) {
          return token?.role === 'SUPERADMIN';
        }

        // Role-based: admin
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'SUPERADMIN';
        }

        // All other page routes require authentication (/, /overview, /investments, etc.)
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
