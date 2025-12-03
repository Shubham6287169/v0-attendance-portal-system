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
    console.log("[Forgot Password] Received request")

    const { email } = await request.json()
    console.log("[Forgot Password] Processing email:", email)

    if (!isValidEmail(email)) {
      console.warn("[Forgot Password] Invalid email format:", email)
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    const user = users.find((u) => u.email === email)

    if (!user) {
      console.warn("[Forgot Password] Email not found in database:", email)
      // Don't reveal if email exists (security best practice)
      return NextResponse.json({
        message: "If email exists, OTP will be sent",
        success: true,
      })
    }

    console.log("[Forgot Password] User found:", user.email)

    const otp = generateOTP()
    storeOTP(email, otp)
    console.log("[Forgot Password] OTP generated and stored for:", email)

    console.log("[Forgot Password] Attempting to send OTP email...")
    const emailSent = await sendOTPEmail(email, otp)

    if (!emailSent) {
      console.error("[Forgot Password] Failed to send OTP email to:", email)

      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { message: "Failed to send OTP email. Please try again later.", success: false },
          { status: 500 },
        )
      }

      // In development, still proceed but warn
      console.warn("[Forgot Password] Email sending failed, but proceeding in development mode")
    } else {
      console.log("[Forgot Password] OTP email sent successfully to:", email)
    }

    const displayOTP = getOTPForDisplay(email)

    return NextResponse.json({
      message: `OTP sent successfully to ${email}`,
      success: true,
      ...(process.env.NODE_ENV === "development" && { testOTP: displayOTP }),
    })
  } catch (error) {
    console.error("[Forgot Password] Unhandled error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { message: "Internal server error. Please try again later.", success: false },
      { status: 500 },
    )
  }
}
