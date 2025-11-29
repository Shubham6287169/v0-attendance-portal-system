const otpDisplay: { [key: string]: string } = {}

export function storeOTPForDisplay(email: string, otp: string) {
  otpDisplay[email] = otp
}

export function getOTPForDisplay(email: string): string | null {
  return otpDisplay[email] || null
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // For development/testing: Store OTP so it can be displayed in UI
  storeOTPForDisplay(email, otp)

  // Log to console for testing
  console.log(`[Email Service] OTP for ${email}: ${otp}`)
  console.log(`[Email Service] OTP is valid for 10 minutes`)

  // In production, integrate with email service like:
  // - SendGrid: https://sendgrid.com
  // - EmailJS: https://www.emailjs.com
  // - AWS SES: https://aws.amazon.com/ses/
  // - Mailgun: https://www.mailgun.com

  // Example production code (uncomment and configure):
  // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{ to: [{ email }] }],
  //     from: { email: 'noreply@attendanceportal.com' },
  //     subject: 'Your Password Reset OTP',
  //     content: [{
  //       type: 'text/html',
  //       value: `<h2>Your OTP is: ${otp}</h2><p>Valid for 10 minutes</p>`
  //     }]
  //   })
  // })
  // return response.ok

  return true
}

export function clearOTPDisplay(email: string) {
  delete otpDisplay[email]
}
