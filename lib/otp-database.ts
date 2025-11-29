export interface OTPRecord {
  email: string
  otp: string
  createdAt: number
  expiresAt: number
  attempts: number
}

let otpDatabase: OTPRecord[] = []

const OTP_VALIDITY = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 5

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeOTP(email: string, otp: string) {
  const now = Date.now()
  // Remove old OTP for this email
  otpDatabase = otpDatabase.filter((o) => o.email !== email)

  otpDatabase.push({
    email,
    otp,
    createdAt: now,
    expiresAt: now + OTP_VALIDITY,
    attempts: 0,
  })
}

export function verifyOTP(email: string, otp: string): { valid: boolean; message: string } {
  const record = otpDatabase.find((o) => o.email === email)

  if (!record) {
    return { valid: false, message: "No OTP found for this email" }
  }

  if (Date.now() > record.expiresAt) {
    otpDatabase = otpDatabase.filter((o) => o.email !== email)
    return { valid: false, message: "OTP expired" }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpDatabase = otpDatabase.filter((o) => o.email !== email)
    return { valid: false, message: "Too many attempts. Request new OTP" }
  }

  record.attempts++

  if (record.otp === otp) {
    otpDatabase = otpDatabase.filter((o) => o.email !== email)
    return { valid: true, message: "OTP verified" }
  }

  return { valid: false, message: "Invalid OTP" }
}

export function clearOTP(email: string) {
  otpDatabase = otpDatabase.filter((o) => o.email !== email)
}
