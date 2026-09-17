const ALLOWED_ORIGINS = new Set(['https://deepdell.com', 'https://www.deepdell.com']);
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX = { name: 120, email: 254, company: 160, website: 500, service: 120, phone: 60, message: 5000, audit_url: 500 };

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://deepdell.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function response(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) }
  });
}

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (url.pathname !== '/contact' || request.method !== 'POST') return response({ error: 'Not found' }, 404, origin);
    if (origin && !ALLOWED_ORIGINS.has(origin)) return response({ error: 'Origin not allowed.' }, 403, origin);

    let data;
    try { data = await request.json(); } catch { return response({ error: 'Invalid request.' }, 400, origin); }

    // Honeypot: silently accept bots without sending an email.
    if (clean(data.website_field, 200)) return response({ ok: true }, 200, origin);

    const lead = {
      name: clean(data.name, MAX.name),
      email: clean(data.email, MAX.email),
      company: clean(data.company, MAX.company),
      website: clean(data.website, MAX.website),
      service: clean(data.service, MAX.service),
      phone: clean(data.phone, MAX.phone),
      message: clean(data.message, MAX.message),
      audit_url: clean(data.audit_url, MAX.audit_url)
    };

    if (!lead.name || !lead.email || !lead.service || !lead.message || !validEmail(lead.email)) {
      return response({ error: 'Please complete the required fields with a valid work email.' }, 422, origin);
    }

    const subject = `New DEEPDELL lead — ${lead.service}${lead.company ? ` — ${lead.company}` : ''}`;
    const text = [
      'NEW DEEPDELL WEBSITE LEAD', '',
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `Company: ${lead.company || '—'}`,
      `Website: ${lead.website || '—'}`,
      `Service: ${lead.service}`,
      `Phone / WhatsApp: ${lead.phone || '—'}`,
      `Agentic audit: ${lead.audit_url || '—'}`,
      '', 'PROJECT DETAILS', lead.message
    ].join('\n');

    const html = `<!doctype html><html><body style="margin:0;background:#011434;color:#fff;font-family:Arial,Helvetica,sans-serif"><div style="max-width:680px;margin:0 auto;padding:36px 24px"><p style="font-size:11px;letter-spacing:2px;color:#20f3fb">DEEPDELL / NEW WEBSITE LEAD</p><h1 style="font-size:28px;margin:0 0 24px">${esc(lead.name)} submitted an enquiry</h1><table style="width:100%;border-collapse:collapse;color:#dce9f5"><tr><td style="padding:10px 0;color:#89f9fd">EMAIL</td><td>${esc(lead.email)}</td></tr><tr><td style="padding:10px 0;color:#89f9fd">COMPANY</td><td>${esc(lead.company || '—')}</td></tr><tr><td style="padding:10px 0;color:#89f9fd">WEBSITE</td><td>${esc(lead.website || '—')}</td></tr><tr><td style="padding:10px 0;color:#89f9fd">SERVICE</td><td>${esc(lead.service)}</td></tr><tr><td style="padding:10px 0;color:#89f9fd">PHONE</td><td>${esc(lead.phone || '—')}</td></tr><tr><td style="padding:10px 0;color:#89f9fd">AUDIT</td><td>${lead.audit_url ? `<a href="${esc(lead.audit_url)}" style="color:#20f3fb">${esc(lead.audit_url)}</a>` : '—'}</td></tr></table><h2 style="font-size:15px;margin:30px 0 10px;color:#20f3fb">PROJECT DETAILS</h2><div style="white-space:pre-wrap;line-height:1.7;color:#dce9f5;border-top:1px solid #16395d;padding-top:18px">${esc(lead.message)}</div></div></body></html>`;

    const resend = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'DEEPDELL Website <noreply@support.deepdell.com>',
        to: ['support@deepdell.com'],
        reply_to: [lead.email],
        subject,
        text,
        html
      })
    });

    if (!resend.ok) {
      const details = await resend.text();
      console.error('Resend error', details);
      return response({ error: 'Unable to send your enquiry right now. Please try again.' }, 502, origin);
    }

    return response({ ok: true }, 200, origin);
  }
};
