import { type NextRequest, NextResponse } from "next/server"
import { isValidEmail } from "@/lib/email-validation"
import { generateOTP, storeOTP } from "@/lib/otp-database"
import { sendOTPEmail, getOTPForDisplay } from "@/lib/email-service"

// Mock user database
const users = [
  { id: "1", email: "admin@example.com", password: "password123", name: "Admin User", role: "admin" },
  { id: "2", email: "student@example.com", password: "password123", name: "Rajesh Kumar", role: "student" },
  { id: "3", email: "teacher@example.com", password: "password123", name: "Jane Smith", role: "teacher" },
]

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    const user = users.find((u) => u.email === email)

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json({
        message: "If email exists, OTP will be sent",
        success: true,
      })
    }

    const otp = generateOTP()
    storeOTP(email, otp)

    const emailSent = await sendOTPEmail(email, otp)

    if (!emailSent && process.env.NODE_ENV === "production") {
      return NextResponse.json({ message: "Failed to send OTP email. Please try again later." }, { status: 500 })
    }

    const displayOTP = getOTPForDisplay(email)

    return NextResponse.json({
      message: "OTP sent to registered email",
      success: true,
      ...(process.env.NODE_ENV === "development" && { testOTP: displayOTP }),
    })
  } catch (error) {
    console.error("[Forgot Password Error]:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
