import { Resend } from 'resend'
import { NextResponse } from 'next/server'

interface ContactPayload {
  name: string
  email: string
  msg: string
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body' },
      { status: 400 },
    )
  }

  const raw = (body ?? {}) as Partial<ContactPayload>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  const msg = typeof raw.msg === 'string' ? raw.msg.trim() : ''

  if (!name || !email || !msg) {
    return NextResponse.json(
      { ok: false, error: 'Name, email and message are required' },
      { status: 400 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      { ok: false, error: 'Contact service is not configured' },
      { status: 500 },
    )
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Arcade Vault contact — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${msg}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p>${escapeHtml(msg).replace(/\n/g, '<br>')}</p>`,
    })

    if (error) {
      return NextResponse.json(
        { ok: false, error: 'Failed to send message' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to send message' },
      { status: 500 },
    )
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
