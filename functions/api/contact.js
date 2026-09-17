const ALLOWED_ORIGIN = 'https://deepdell.com';
const TO_EMAIL = 'support@deepdell.com';
const FROM_EMAIL = 'DEEPDELL <support@deepdell.com>';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const json = (body, status = 200, origin = ALLOWED_ORIGIN) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || ALLOWED_ORIGIN;
  return json({ ok: true }, 200, origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN);
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== ALLOWED_ORIGIN) return json({ error: 'Origin not allowed.' }, 403);

  if (!env.RESEND_API_KEY) return json({ error: 'Email service is not configured.' }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  // Honeypot for basic bot filtering.
  if (String(data.website_field || '').trim()) return json({ ok: true });

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const company = String(data.company || '').trim();
  const website = String(data.website || '').trim();
  const service = String(data.service || '').trim();
  const phone = String(data.phone || '').trim();
  const message = String(data.message || '').trim();
  const auditUrl = String(data.audit_url || '').trim();

  if (!name || !email || !service || !message) return json({ error: 'Please complete all required fields.' }, 400);
  if (name.length > 120 || company.length > 160 || service.length > 100 || phone.length > 60 || message.length > 5000) return json({ error: 'One or more fields are too long.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid work email.' }, 400);
  if (website && !/^https?:\/\//i.test(website)) return json({ error: 'Website must start with http:// or https://.' }, 400);
  if (auditUrl && !/^https?:\/\//i.test(auditUrl)) return json({ error: 'Invalid audit URL.' }, 400);

  const subject = auditUrl
    ? `New Agentic Website Lead — ${auditUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}`
    : `New DEEPDELL Project Enquiry — ${service}`;

  const html = `<!doctype html><html><body style="margin:0;background:#011434;color:#dce9f5;font-family:Arial,Helvetica,sans-serif;padding:32px"><div style="max-width:680px;margin:auto;border:1px solid #16345b;background:#021c3d"><div style="padding:28px;border-bottom:1px solid #16345b"><div style="font-size:12px;letter-spacing:3px;color:#20f3fb;font-weight:bold">DEEPDELL / NEW ENQUIRY</div><h1 style="margin:14px 0 0;color:#fff;font-size:26px">${escapeHtml(service)}</h1></div><div style="padding:28px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;color:#89f9fd;width:150px">Name</td><td style="padding:8px 0;color:#fff">${escapeHtml(name)}</td></tr><tr><td style="padding:8px 0;color:#89f9fd">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}" style="color:#20f3fb">${escapeHtml(email)}</a></td></tr><tr><td style="padding:8px 0;color:#89f9fd">Company</td><td style="padding:8px 0;color:#fff">${escapeHtml(company || '—')}</td></tr><tr><td style="padding:8px 0;color:#89f9fd">Website</td><td style="padding:8px 0;color:#fff">${escapeHtml(website || '—')}</td></tr><tr><td style="padding:8px 0;color:#89f9fd">Phone / WhatsApp</td><td style="padding:8px 0;color:#fff">${escapeHtml(phone || '—')}</td></tr>${auditUrl ? `<tr><td style="padding:8px 0;color:#89f9fd">Agentic audit</td><td style="padding:8px 0"><a href="${escapeHtml(auditUrl)}" style="color:#20f3fb">${escapeHtml(auditUrl)}</a></td></tr>` : ''}</table><div style="margin-top:26px;padding-top:22px;border-top:1px solid #16345b"><div style="font-size:11px;letter-spacing:2px;color:#89f9fd">PROJECT DETAILS</div><p style="white-space:pre-wrap;line-height:1.7;color:#fff">${escapeHtml(message)}</p></div></div><div style="padding:18px 28px;border-top:1px solid #16345b;color:#7189a3;font-size:11px">Submitted from deepdell.com</div></div></body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      reply_to: email,
      subject,
      html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Resend error:', detail);
    return json({ error: 'The email could not be sent. Please try again or email support@deepdell.com.' }, 502);
  }

  return json({ ok: true });
}
