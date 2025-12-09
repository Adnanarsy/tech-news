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
  // Basic rate limiting for auth and privileged APIs
  const ip = getClientIp(req);
  // Limit sign-in/auth routes (credentials attempts, callbacks)
  if (pathname.startsWith("/api/auth")) {
    const { allowed, remaining, resetAt } = rateLimit(`auth:${ip}`, 10, 10 * 60 * 1000); // 10 per 10 minutes
    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)).toString(),
          "RateLimit-Remaining": remaining.toString(),
        },
      });
    }
  }
  // Limit admin/trainer APIs
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/trainer")) {
    const { allowed, remaining, resetAt } = rateLimit(`priv:${ip}`, 120, 60 * 1000); // 120 per minute
    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)).toString(),
          "RateLimit-Remaining": remaining.toString(),
        },
      });
    }
  }
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/admin")) {
    if (!token || (token as any).role !== "admin") {
      const url = new URL("/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } else if (pathname.startsWith("/trainer")) {
    const role = (token as any)?.role as string | undefined;
    if (!token || (role !== "trainer" && role !== "admin")) {
      const url = new URL("/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  // Apply to role-gated pages and to selected APIs for rate limiting/auth protections
  matcher: [
    "/admin/:path*",
    "/trainer/:path*",
    "/api/admin/:path*",
    "/api/trainer/:path*",
    "/api/auth/:path*",
  ],
};
