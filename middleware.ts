import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Debug: log auth cookies on API POST requests
  if (request.method === "POST" && request.nextUrl.pathname.startsWith("/api/admin")) {
    const allCookies = request.cookies.getAll();
    const authCookies = allCookies.filter((c) => c.name.startsWith("sb-"));
    console.log(
      `[middleware] ${request.method} ${request.nextUrl.pathname} | cookies: ${allCookies.length} total, ${authCookies.length} auth (${authCookies.map((c) => c.name).join(", ") || "NONE"})`
    );
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next internals)
     * - favicon, robots, sitemap, manifest
     * - image files (svg, png, jpg, jpeg, gif, webp, ico)
     * - font files
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
