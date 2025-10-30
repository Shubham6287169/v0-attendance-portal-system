import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value

  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/student") ||
    request.nextUrl.pathname.startsWith("/teacher")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/teacher/:path*"],
}
