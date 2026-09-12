// Compositor de emails: individual, masivo a filtrados y plantillas.
// Encola en Firestore `mail` (Trigger Email extension). Soporta Markdown básico.
import { useMemo, useState } from 'react'
import { EMAIL_TEMPLATES, markdownToHtml, queueBulkEmails, queueEmail } from '../../services/admin/adminService'

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500'

function EmailComposer({ users, presetRecipient = null }) {
  const [mode, setMode] = useState(presetRecipient ? 'individual' : 'masivo')
  const [to, setTo] = useState(presetRecipient?.email ?? '')
  const [onlyWithEmail, setOnlyWithEmail] = useState(true)
  const [templateKey, setTemplateKey] = useState('plan')
  const [subject, setSubject] = useState(EMAIL_TEMPLATES.plan.subject)
  const [body, setBody] = useState(EMAIL_TEMPLATES.plan.html.replace(/<[^>]+>/g, ''))
  const [useHtml, setUseHtml] = useState(false)
  const [status, setStatus] = useState('')

  const bulkRecipients = useMemo(
    () => users.map((u) => u.email).filter((e) => e && (!onlyWithEmail || true)),
    [users, onlyWithEmail],
  )

  const applyTemplate = (key) => {
    setTemplateKey(key)
    setSubject(EMAIL_TEMPLATES[key].subject)
    setBody(EMAIL_TEMPLATES[key].html.replace(/<[^>]+>/g, ''))
    setUseHtml(false)
  }

  const onSend = async () => {
    setStatus('Encolando…')
    try {
      const html = useHtml ? body : markdownToHtml(body)
      if (mode === 'individual') {
        if (!to) { setStatus('Indica un email destinatario.'); return }
        await queueEmail({ to, subject, html, template: templateKey })
        setStatus(`Email individual encolado para ${to}.`)
      } else {
        const count = await queueBulkEmails({ recipients: bulkRecipients, subject, html, template: templateKey })
        setStatus(`Newsletter encolada para ${count} destinatarios.`)
      }
    } catch {
      setStatus('No se pudo encolar el email. Revisa permisos de admin.')
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === 'individual' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`} onClick={() => setMode('individual')}>Individual</button>
        <button type="button" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === 'masivo' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`} onClick={() => setMode('masivo')}>Masivo / Newsletter</button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {Object.entries(EMAIL_TEMPLATES).map(([key, t]) => (
          <button key={key} type="button" className={`rounded-xl px-3 py-2 text-sm font-bold ${templateKey === key ? 'bg-brand-50 text-brand-900' : 'bg-slate-50'}`} onClick={() => applyTemplate(key)}>
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'individual' ? (
        <input className={inputClass} placeholder="Email destinatario" value={to} onChange={(e) => setTo(e.target.value)} />
      ) : (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyWithEmail} onChange={(e) => setOnlyWithEmail(e.target.checked)} />
          Solo usuarios con email ({bulkRecipients.length} destinatarios)
        </label>
      )}

      <input className={inputClass} placeholder="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className={inputClass} rows="6" placeholder="Escribe en texto o Markdown…" value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={useHtml} onChange={(e) => setUseHtml(e.target.checked)} />
        Enviar como HTML directo (sin convertir Markdown)
      </label>

      <button type="button" className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white" onClick={onSend}>
        Encolar envío
      </button>
      {status ? <p className="text-sm font-semibold text-slate-600">{status}</p> : null}
      <p className="text-xs text-slate-500">Requiere la extensión Firebase “Trigger Email” sobre la colección `mail`, o el endpoint /api/send-email con Resend/SendGrid.</p>
    </div>
  )
}

export default EmailComposer
