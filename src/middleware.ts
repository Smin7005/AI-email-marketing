import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  // API routes are now handled directly in the route handlers with fallback logic
  // to support users without organizations
])

export default clerkMiddleware(async (auth, req) => {
  // Allow Inngest webhooks and dev server to pass through without auth
  if (req.nextUrl.pathname.startsWith('/api/inngest')) {
    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}