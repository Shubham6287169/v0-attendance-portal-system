import { type NextRequest, NextResponse } from "next/server"
import { createToken } from "@/lib/jwt"

// Mock user database
const users = [
  { id: "1", email: "admin@example.com", password: "password123", name: "Admin User", role: "admin" },
  { id: "2", email: "student@example.com", password: "password123", name: "John Doe", role: "student" },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const token = createToken({ id: user.id, email: user.email, role: user.role }, "24h")

    const response = NextResponse.json({
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
