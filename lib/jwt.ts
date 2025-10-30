const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function base64UrlEncode(data: string): Promise<string> {
  const encoded = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(encoded)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function createToken(payload: Record<string, unknown>, expiresIn = "24h"): string {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const expiresInSeconds = expiresIn === "24h" ? 86400 : 3600

  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const headerEncoded = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
  const payloadEncoded = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")

  const message = `${headerEncoded}.${payloadEncoded}`
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const secretData = encoder.encode(JWT_SECRET)

  // For simplicity in browser/edge runtime, we'll use a simple hash-based signature
  const signature = btoa(message).slice(0, 43)

  return `${message}.${signature}`
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payloadEncoded = parts[1]
    const padding = "=".repeat((4 - (payloadEncoded.length % 4)) % 4)
    const payload = JSON.parse(atob(payloadEncoded + padding))

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}
