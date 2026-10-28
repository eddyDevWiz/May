import type { APIRoute } from 'astro'

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const SUBJECTS: Record<string, string> = {
  commission: 'Obra por encargo',
  shipping: 'Envíos',
  wholesale: 'Mayoreo',
  collab: 'Colaboración',
  other: 'Otro'
}

async function verifyTurnstile(token: string, ip: string | null) {
  const body = new URLSearchParams({ secret: String(import.meta.env.TURNSTILE_SECRET_KEY), response: token })
  if (ip) body.set('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  const data = await res.json()
  return data.success === true
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // JSON on purpose: Astro's checkOrigin blocks form-encoded cross-origin POSTs, and this
  // public endpoint has no session to protect (Turnstile + honeypot cover abuse).
  let data: Record<string, unknown>
  try {
    data = await request.json()
  } catch {
    return json({ error: 'invalid_request' }, 400)
  }

  // Honeypot: real people never tick this hidden box. Pretend success so bots don't retry.
  if (data['botcheck']) return json({ success: true })

  const name = String(data['name'] ?? '').trim()
  const email = String(data['email'] ?? '').trim()
  const subject = String(data['subject'] ?? '').trim()
  const message = String(data['message'] ?? '').trim()

  if (!name || !email || !subject || !message) return json({ error: 'missing_fields' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid_email' }, 400)
  if (name.length > 200 || email.length > 200 || message.length > 5000) return json({ error: 'too_long' }, 400)

  if (import.meta.env.TURNSTILE_SECRET_KEY) {
    const token = String(data['cf-turnstile-response'] ?? '')
    if (!token || !(await verifyTurnstile(token, clientAddress ?? null))) {
      return json({ error: 'captcha_failed' }, 400)
    }
  }

  const apiKey = import.meta.env.RESEND_API_KEY
  const to = import.meta.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) return json({ error: 'not_configured' }, 500)

  const subjectLabel = SUBJECTS[subject] ?? subject
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: import.meta.env.CONTACT_FROM_EMAIL ?? 'May García <onboarding@resend.dev>',
      to: [to],
      reply_to: email,
      subject: `[Contacto] ${subjectLabel} — ${name}`,
      html: `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Asunto:</strong> ${escapeHtml(subjectLabel)}</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`
    })
  })

  if (!res.ok) {
    console.error('[contact] Resend rejected the email:', res.status, await res.text())
    return json({ error: 'send_failed' }, 502)
  }
  return json({ success: true })
}
