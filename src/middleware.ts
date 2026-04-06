import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  const publicPaths = ["/login", "/setup", "/api/auth", "/api/health"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Twilio webhook endpoints (authenticated via Twilio signature)
  if (pathname.startsWith("/api/channels/phone/")) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Rate limiting for auth endpoint
  if (pathname.startsWith("/api/auth")) {
    const ip = getClientIp(request);
    const rateResult = checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth);

    if (!rateResult.allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      response.headers.set(
        "Retry-After",
        String(Math.ceil((rateResult.resetAt - Date.now()) / 1000))
      );
      return addSecurityHeaders(response);
    }
  }

  if (isPublic) {
    return addSecurityHeaders(NextResponse.next());
  }

  // General API rate limiting
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const rateResult = checkRateLimit(`api:${ip}`, RATE_LIMITS.api);

    if (!rateResult.allowed) {
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      response.headers.set(
        "Retry-After",
        String(Math.ceil((rateResult.resetAt - Date.now()) / 1000))
      );
      return addSecurityHeaders(response);
    }
  }

  // Check for auth token
  const token = request.cookies.get("owly-token")?.value;

  if (!token) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    // Pages redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify JWT structure (basic validation - full verification in route handlers)
  const parts = token.split(".");
  if (parts.length !== 3) {
    if (pathname.startsWith("/api/")) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Invalid token" }, { status: 401 })
      );
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("owly-token");
    return response;
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
