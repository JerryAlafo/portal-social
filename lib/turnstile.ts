const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface VerifyTurnstileResult {
  success: boolean
}

export async function verifyTurnstileToken(token: string, remoteIp?: string | null): Promise<boolean> {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_TURNSTILE_SECRET_KEY ||
    ''

  if (!secretKey || !token) {
    return false
  }

  const body = new URLSearchParams()
  body.append('secret', secretKey)
  body.append('response', token)

  if (remoteIp) {
    body.append('remoteip', remoteIp)
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
    })

    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as VerifyTurnstileResult
    return Boolean(data.success)
  } catch {
    return false
  }
}
