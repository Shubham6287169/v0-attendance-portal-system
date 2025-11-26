import { type NextRequest, NextResponse } from "next/server"
import { createToken } from "@/lib/jwt"
import { isValidEmail } from "@/lib/email-validation"

// Mock user database (in production, use a real database)
const users: any[] = [
  { id: "1", email: "admin@example.com", password: "password123", name: "Admin User", role: "admin" },
  { id: "2", email: "student@example.com", password: "password123", name: "John Doe", role: "student" },
  { id: "3", email: "teacher@example.com", password: "password123", name: "Jane Smith", role: "teacher" },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    const newUser = {
      id: String(users.length + 1),
      email,
      password,
      name,
      role: role || "student",
    }

    users.push(newUser)

    const token = createToken({ id: newUser.id, email: newUser.email, role: newUser.role }, "24h")

    const response = NextResponse.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
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
