import nodemailer from "nodemailer"

const otpStore = new Map<string, { otp: string; timestamp: number }>()

const createTransporter = () => {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASSWORD

  if (!user || !pass) {
    console.error(
      "[Email Service] Missing EMAIL_USER or EMAIL_PASSWORD. Configure these in your Vercel environment variables.",
    )
  }

  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use TLS
    auth: {
      user: user || "",
      pass: pass || "",
    },
  })
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    console.log(`[Email Service] Attempting to send OTP to: ${email}`)

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("[Email Service] Email credentials not configured. Using test mode.")
      otpStore.set(email, { otp, timestamp: Date.now() })
      return true
    }

    const transporter = createTransporter()

    try {
      await transporter.verify()
      console.log("[Email Service] SMTP connection verified")
    } catch (verifyError) {
      console.error("[Email Service] SMTP verification failed:", verifyError)
      return false
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - Attendance Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Attendance Portal</h2>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
            <h3 style="color: #333; margin-bottom: 20px;">Password Reset Request</h3>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              You have requested to reset your password. Use the OTP below to proceed:
            </p>
            <div style="background-color: white; border: 2px solid #667eea; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 5px;">
                ${otp}
              </p>
            </div>
            <p style="color: #999; font-size: 14px; margin: 20px 0;">
              This OTP is valid for 10 minutes. If you did not request this, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
              Do not share this OTP with anyone. We will never ask for your OTP via email or phone.
            </p>
          </div>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`[Email Service] OTP email sent successfully to ${email}. Message ID: ${result.messageId}`)

    // Store for test mode
    otpStore.set(email, { otp, timestamp: Date.now() })

    return true
  } catch (error) {
    console.error("[Email Service] Error sending OTP email:", {
      email,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : typeof error,
    })
    return false
  }
}

export function getOTPForDisplay(email: string): string | null {
  const stored = otpStore.get(email)
  if (stored && Date.now() - stored.timestamp < 10 * 60 * 1000) {
    return stored.otp
  }
  return null
}

export function clearOTPStore(email: string): void {
  otpStore.delete(email)
}
