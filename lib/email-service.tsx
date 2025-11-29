import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Fallback for development/testing
const devOTPStore: Map<string, string> = new Map()

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // Store OTP in development mode for testing
    if (process.env.NODE_ENV === "development") {
      devOTPStore.set(email, otp)
      console.log(`[Development] OTP for ${email}: ${otp}`)
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.")
      return true // Return true to allow testing
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - Attendance Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Attendance Portal account.</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #666;">Your One-Time Password (OTP) is:</p>
            <h1 style="margin: 10px 0; color: #007bff; letter-spacing: 3px;">${otp}</h1>
            <p style="margin: 10px 0; font-size: 12px; color: #666;">This OTP will expire in 10 minutes.</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, please ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Attendance Portal System
          </p>
        </div>
      `,
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
    }

    await transporter.sendMail(mailOptions)
    console.log(`OTP sent successfully to ${email}`)
    return true
  } catch (error) {
    console.error("Error sending OTP email:", error)
    return false
  }
}

export function getOTPForDisplay(email: string): string | null {
  return devOTPStore.get(email) || null
}

export function clearOTPStore() {
  devOTPStore.clear()
}
