const ALLOWED_ORIGIN = 'https://deepdell.com';
const TO = 'support@deepdell.com';
const FROM = 'DEEPDELL Website <leads@support.deepdell.com>';

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const clean = (value, max = 3000) => String(value ?? '').trim().slice(0, max);

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return response({ ok: true });
    if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

    const origin = request.headers.get('Origin');
    if (origin && origin !== ALLOWED_ORIGIN && origin !== 'https://www.deepdell.com') {
      return response({ error: 'Origin not allowed.' }, 403);
    }

    let data;
    try { data = await request.json(); } catch { return response({ error: 'Invalid request.' }, 400); }

    // Honeypot: bots fill this hidden field; silently accept without sending.
    if (clean(data.website_field, 200)) return response({ ok: true });

    const name = clean(data.name, 120);
    const email = clean(data.email, 254);
    const company = clean(data.company, 160);
    const website = clean(data.website, 500);
    const service = clean(data.service, 120);
    const phone = clean(data.phone, 80);
    const message = clean(data.message, 5000);
    const auditUrl = clean(data.audit_url, 1000);

    if (!name || !email || !service || !message) return response({ error: 'Please complete all required fields.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: 'Please enter a valid work email.' }, 400);

    const subject = auditUrl
      ? `New DEEPDELL lead — Agentic audit — ${company || name}`
      : `New DEEPDELL project enquiry — ${company || name}`;

    const html = `<!doctype html><html><body style="margin:0;background:#011434;color:#fff;font-family:Arial,Helvetica,sans-serif;padding:32px"><div style="max-width:680px;margin:auto"><div style="font-size:12px;letter-spacing:2px;color:#20f3fb">DEEPDELL / NEW LEAD</div><h1 style="font-size:28px;margin:12px 0 24px">${esc(name)}${company ? ` <span style="color:#89f9fd">· ${esc(company)}</span>` : ''}</h1><table style="width:100%;border-collapse:collapse"><tr><td style="padding:12px 0;color:#89f9fd;width:150px">EMAIL</td><td style="padding:12px 0">${esc(email)}</td></tr><tr><td style="padding:12px 0;color:#89f9fd">SERVICE</td><td style="padding:12px 0">${esc(service)}</td></tr>${website ? `<tr><td style="padding:12px 0;color:#89f9fd">WEBSITE</td><td style="padding:12px 0">${esc(website)}</td></tr>` : ''}${phone ? `<tr><td style="padding:12px 0;color:#89f9fd">PHONE</td><td style="padding:12px 0">${esc(phone)}</td></tr>` : ''}${auditUrl ? `<tr><td style="padding:12px 0;color:#89f9fd">AUDIT</td><td style="padding:12px 0"><a style="color:#20f3fb" href="${esc(auditUrl)}">${esc(auditUrl)}</a></td></tr>` : ''}</table><div style="margin-top:22px;padding:20px;background:#021c3d;border:1px solid #17446b"><div style="font-size:11px;letter-spacing:1px;color:#89f9fd;margin-bottom:10px">PROJECT DETAILS</div><div style="white-space:pre-wrap;line-height:1.7">${esc(message)}</div></div><p style="color:#7189a3;font-size:12px;margin-top:24px">Reply directly to this email to respond to the lead.</p></div></body></html>`;
    const text = `DEEPDELL NEW LEAD\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || '-'}\nWebsite: ${website || '-'}\nService: ${service}\nPhone: ${phone || '-'}\nAudit URL: ${auditUrl || '-'}\n\nProject details:\n${message}`;

    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: [email], subject, html, text })
    });

    if (!resend.ok) {
      const detail = await resend.text();
      console.error('Resend error', resend.status, detail);
      return response({ error: 'Unable to send your enquiry right now. Please try again or email support@deepdell.com.' }, 502);
    }

    return response({ ok: true });
  }
};
