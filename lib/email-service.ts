export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // In production, integrate with EmailJS, SendGrid, or similar service
  // For now, we'll log and store the OTP for demo purposes
  console.log(`[Email Service] Sending OTP ${otp} to ${email}`)

  // Mock: Store OTP in localStorage for demo
  if (typeof window !== "undefined") {
    localStorage.setItem(`otp_${email}`, otp)
  }

  return true
}
