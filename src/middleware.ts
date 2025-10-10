import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is trying to access super-admin routes
        if (req.nextUrl.pathname.startsWith('/super-admin')) {
          return token?.role === 'SUPERADMIN';
        }

        // Check if user is trying to access admin routes
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'SUPERADMIN';
        }

        // Check if user is trying to access protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token; // User must be authenticated
        }

        return true; // Allow access to public routes
      }
    }
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
