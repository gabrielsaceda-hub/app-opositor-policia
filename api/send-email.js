import { requireAdmin } from './_lib/auth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }
  const admin = await requireAdmin(request, response)
  if (!admin) return
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    response.status(503).json({ error: 'Email provider is not configured' })
    return
  }
  const { to, subject, html } = request.body ?? {}
  const recipients = [...new Set((Array.isArray(to) ? to : [to]).filter((value) => typeof value === 'string').map((value) => value.trim().toLowerCase()))]
  if (!recipients.length || recipients.length > 100 || recipients.some((value) => !emailPattern.test(value))) {
    response.status(400).json({ error: 'Invalid recipients' })
    return
  }
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 150 || typeof html !== 'string' || !html.trim() || html.length > 20000) {
    response.status(400).json({ error: 'Invalid subject or html' })
    return
  }
  try {
    const results = await Promise.all(recipients.map((recipient) => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [recipient], subject: subject.trim(), html }),
    })))
    const failed = results.filter((item) => !item.ok)
    if (failed.length) {
      response.status(502).json({ error: 'Email provider rejected one or more messages', sent: results.length - failed.length })
      return
    }
    response.status(200).json({ sent: recipients.length, requestedBy: admin.uid })
  } catch {
    response.status(502).json({ error: 'Email provider unavailable' })
  }
}
