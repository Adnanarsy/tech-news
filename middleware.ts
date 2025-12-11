import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Simple in-memory rate limiter (per-process). Suitable for dev and small deployments.
// For production, replace with a distributed store (Redis) and robust algorithms.
type Bucket = { count: number; resetAt: number };
const buckets: Map<string, Bucket> = new Map();

function getClientIp(req: NextRequest): string {
  // Prefer x-forwarded-for if present; fall back to req.ip or remote address
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  // @ts-ignore - NextRequest may provide ip in some environments
  return (req as any).ip || "unknown";
}

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }
  if (b.count < limit) {
    b.count += 1;
    return { allowed: true, remaining: limit - b.count, resetAt: b.resetAt };
  }
  return { allowed: false, remaining: 0, resetAt: b.resetAt };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Prepare default security headers (Phase 9)
  const securityHeaders: Record<string, string> = {
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), gyroscope=(), magnetometer=()",
    // Use CSP Report-Only to avoid breaking dev; tighten in production as needed
    "Content-Security-Policy-Report-Only": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "connect-src 'self' https:",
      "font-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  };
  // Basic rate limiting for auth and privileged APIs
  const ip = getClientIp(req);
  // Limit sign-in/auth routes (credentials attempts, callbacks)
  if (pathname.startsWith("/api/auth")) {
    // Increased limit for development and session checks
    const limit = process.env.NODE_ENV === "production" ? 10 : 60;
    const { allowed, remaining, resetAt } = rateLimit(`auth:${ip}`, limit, 10 * 60 * 1000); // 60 per 10 minutes in dev, 10 in prod
    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)).toString(),
          "RateLimit-Remaining": remaining.toString(),
          ...securityHeaders,
        },
      });
    }
  }
  // Limit admin/trainer/phe APIs
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/trainer") || pathname.startsWith("/api/phe")) {
    const { allowed, remaining, resetAt } = rateLimit(`priv:${ip}`, 120, 60 * 1000); // 120 per minute
    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)).toString(),
          "RateLimit-Remaining": remaining.toString(),
          ...securityHeaders,
        },
      });
    }
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/admin")) {
    if (!token || (token as any).role !== "admin") {
      const url = new URL("/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      const res = NextResponse.redirect(url);
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
  } else if (pathname.startsWith("/trainer")) {
    const role = (token as any)?.role as string | undefined;
    if (!token || (role !== "trainer" && role !== "admin")) {
      const url = new URL("/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      const res = NextResponse.redirect(url);
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
  }
  const res = NextResponse.next();
  Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  // Apply to role-gated pages and to selected APIs for rate limiting/auth protections
  matcher: [
    "/admin/:path*",
    "/trainer/:path*",
    "/api/admin/:path*",
    "/api/trainer/:path*",
    "/api/phe/:path*",
    "/api/auth/:path*",
  ],
};
