// Vercel API Route opcional para envío vía Resend (o SendGrid).
// Recomendado SOLO si no usas la extensión Firebase "Trigger Email".
// Producción: verifica el ID token de Firebase del llamante y comprueba rol admin
// con Admin SDK antes de enviar. Este ejemplo exige una clave compartida mínima
// (ADMIN_API_KEY) para no dejar un relay abierto, y el proveedor real vía env.
//
// Env vars:
//   RESEND_API_KEY=... (o SENDGRID_API_KEY)
//   EMAIL_FROM="App Opositor Policía <no-reply@tudominio.com>"
//   ADMIN_API_KEY=clave-larga-aleatoria (el dashboard la envía en header x-admin-key)
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey || request.headers['x-admin-key'] !== adminKey) {
    response.status(403).json({ error: 'Forbidden' })
    return
  }

  const { to, subject, html } = request.body ?? {}
  if (!to || !subject || !html) {
    response.status(400).json({ error: 'Missing to/subject/html' })
    return
  }

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'App Opositor Policía <no-reply@example.com>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        response.status(502).json({ error: `Resend error: ${msg}` })
        return
      }
      response.status(200).json({ sent: true, provider: 'resend' })
      return
    }

    response.status(500).json({ error: 'No email provider configured (RESEND_API_KEY)' })
  } catch (err) {
    response.status(500).json({ error: String(err?.message ?? err) })
  }
}
