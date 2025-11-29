import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/otp-database"
import { createToken } from "@/lib/jwt"

// Mock user database
const users = [
  { id: "1", email: "admin@example.com", password: "password123", name: "Admin User", role: "admin" },
  { id: "2", email: "student@example.com", password: "password123", name: "John Doe", role: "student" },
  { id: "3", email: "teacher@example.com", password: "password123", name: "Jane Smith", role: "teacher" },
]

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json()

    const result = verifyOTP(email, otp)

    if (!result.valid) {
      return NextResponse.json({ message: result.message }, { status: 400 })
    }

    const user = users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    ;(user as any).password = newPassword

    const token = createToken({ id: user.id, email: user.email, role: user.role }, "24h")

    const response = NextResponse.json({
      message: "Password reset successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
    })

    return response
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
