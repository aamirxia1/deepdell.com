const ALLOWED_ORIGIN = 'https://deepdell.com';
const TO = 'support@deepdell.com';
const FROM = 'DEEPDELL Website <leads@support.deepdell.com>';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const clean = (value, max = 3000) => String(value ?? '').trim().slice(0, max);

function response(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Cache-Control': 'no-store',
      ...extra
    }
  });
}

function validPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('Please enter a valid public website URL.'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only HTTP and HTTPS websites can be audited.');
  if (u.username || u.password) throw new Error('Authenticated URLs cannot be audited.');
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Only standard HTTP/HTTPS ports are supported.');
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1' || h === '0.0.0.0' || h === '::1' || h.endsWith('.local')) throw new Error('Please enter a public website accessible from the Internet.');
  if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(h)) throw new Error('Private network addresses cannot be audited.');
  return u;
}

async function verifyTurnstile(request, env, token, action) {
  if (!env.TURNSTILE_SECRET) return { configured: false, success: true };
  if (!token || token.length > 2048) return { configured: true, success: false };
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') || ''
    });
    const r = await fetch(TURNSTILE_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await r.json();
    const hostOk = !result.hostname || ['deepdell.com', 'www.deepdell.com'].includes(String(result.hostname).toLowerCase());
    const actionOk = !result.action || result.action === action;
    return { configured: true, success: !!result.success && hostOk && actionOk };
  } catch {
    return { configured: true, success: false };
  }
}

const checks = [
  ['Core','robots.txt','/robots.txt',true],['Core','sitemap.xml','/sitemap.xml',true],['Core','sitemap index','/sitemap_index.xml',false],
  ['AI discovery','llms.txt','/llms.txt',true],['AI discovery','llms-full.txt','/llms-full.txt',false],['AI discovery','llms.md','/llms.md',false],['AI discovery','llms-full.md','/llms-full.md',false],
  ['Agent docs','agent.md','/agent.md',false],['Agent docs','agents.md','/agents.md',false],['Agent docs','agent.json','/agent.json',false],['Agent docs','agents.json','/agents.json',false],['Agent docs','ai.txt','/ai.txt',false],['Agent docs','ai.md','/ai.md',false],['Agent docs','ai.json','/ai.json',false],['Agent docs','model-context.md','/model-context.md',false],['Agent docs','machine-readable.md','/machine-readable.md',false],
  ['Well-known','UCP profile','/.well-known/ucp',true],['Well-known','A2A Agent Card','/.well-known/agent-card.json',true],['Well-known','AI plugin manifest','/.well-known/ai-plugin.json',false],['Well-known','OIDC configuration','/.well-known/openid-configuration',false],['Well-known','OAuth authorization server','/.well-known/oauth-authorization-server',false],
  ['Protocol','UCP MCP endpoint','/ucp/mcp',false],['Protocol','MCP endpoint','/mcp',false],['Protocol','MCP SSE endpoint','/sse',false],['Protocol','API MCP endpoint','/api/mcp',false],
  ['Additional','security.txt','/security.txt',false],['Additional','humans.txt','/humans.txt',false],['Additional','sitemap.txt','/sitemap.txt',false],['Additional','ai-agent.md','/ai-agent.md',false],['Additional','agentic.md','/agentic.md',false],['Additional','agentic.json','/agentic.json',false]
];

async function fetchPublic(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store', headers: { 'User-Agent': 'DEEPDELL-Agentic-Audit/1.0' }, signal: controller.signal });
    const text = r.status >= 200 && r.status < 400 ? (await r.text()).slice(0, 800000) : '';
    return { status: r.status, ok: r.ok, text, finalUrl: r.url || url };
  } catch { return { status: 0, ok: false, text: '', finalUrl: url }; }
  finally { clearTimeout(timer); }
}

function stripHtml(html) { return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim(); }
function meta(html, name, attr='name') { const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${name}["']`, 'i'); const m=html.match(re); return m ? (m[1]||m[2]||'') : ''; }
function linkHref(html, rel) { const m=html.match(new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']|<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["']`, 'i')); return m ? (m[1]||m[2]||'') : ''; }
function title(html) { const m=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return m ? stripHtml(m[1]) : ''; }
function count(html, tag) { return (html.match(new RegExp(`<${tag}(?:\s|>)`, 'gi'))||[]).length; }
function hasLd(html) { return /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html); }
function validJson(text) { try { JSON.parse(text); return true; } catch { return false; } }

async function audit(request, env, body) {
  const verification = await verifyTurnstile(request, env, body.turnstile, 'agentic-audit');
  if (!verification.success) return response({ error: 'Security verification failed. Please complete the verification and try again.' }, 403);
  const u = validPublicUrl(body.url);
  const base = `${u.protocol}//${u.host}`;
  const home = await fetchPublic(u.href, 4500);
  if (!home.ok || !home.text) return response({ error: 'The public website could not be fetched. Make sure the URL is publicly accessible over HTTPS without login, VPN or IP restriction.' }, 422);
  const html = home.text;
  const canonicalRaw = linkHref(html,'canonical');
  let canonical = false; try { canonical = !!canonicalRaw && new URL(canonicalRaw, u.href).href.replace(/\/$/,'') === u.href.replace(/\/$/,''); } catch {}
  const lang = (html.match(/<html[^>]+lang=["']([^"']+)/i)||[])[1] || '';
  const titleText = title(html), desc = meta(html,'description'), og = !!meta(html,'og:title','property');
  const bodyText = stripHtml(html), h1 = count(html,'h1') > 0, headings = count(html,'h1')+count(html,'h2')+count(html,'h3'), links = count(html,'a');
  const schema = hasLd(html);
  const results = [];
  for (let i=0;i<checks.length;i+=5) {
    const batch = checks.slice(i,i+5);
    const out = await Promise.all(batch.map(async ([group,name,path,standard]) => {
      const r = await fetchPublic(base+path, 3000);
      let found = r.ok && r.status >= 200 && r.status < 300 && !!r.text.trim();
      if ((name === 'UCP profile' || name === 'A2A Agent Card') && found) found = validJson(r.text);
      if (name.includes('MCP endpoint') && [400,401,403,405,406].includes(r.status)) found = true;
      return { group, name, path, standard, found, status:r.status };
    }));
    results.push(...out);
  }
  const found = n => results.find(x=>x.name===n)?.found;
  const seo = [u.protocol==='https:', home.status>=200&&home.status<400, canonical, titleText.length>=20&&titleText.length<=65, desc.length>=70&&desc.length<=170, !!lang, og, schema, h1&&bodyText.length>=500&&headings>=3].filter(Boolean).length;
  const machine = [found('robots.txt'),found('sitemap.xml'),found('sitemap index'),found('security.txt'),found('sitemap.txt')].filter(Boolean).length + Math.min(3,results.filter(x=>x.group==='Additional'&&x.found).length);
  const llm = [found('llms.txt'),found('llms-full.txt'),found('llms.md'),found('llms-full.md'),results.some(x=>x.group==='Agent docs'&&x.found)].filter(Boolean).reduce((a,_,i)=>a+[8,4,2,2,4][i],0);
  const identity = (found('UCP profile')?8:0)+(found('A2A Agent Card')?8:0)+Math.min(4,results.filter(x=>x.group==='Agent docs'&&x.found).length);
  const protocols = (found('UCP MCP endpoint')?5:0)+(found('MCP endpoint')?5:0)+(found('MCP SSE endpoint')?3:0)+(found('API MCP endpoint')?3:0)+(results.some(x=>x.group==='Protocol'&&x.found)?4:0);
  const clamp = n => Math.max(0,Math.min(20,Math.round(n)));
  return response({ ok:true, base:u.href.replace(/\/$/,''), mode:'server', homepage:{status:home.status,finalUrl:home.finalUrl,title:titleText,description:desc,canonical:canonicalRaw,canonicalPass:canonical,lang,og,structuredData:schema,h1,headings,links,textLength:bodyText.length}, results, categories:{technicalSeo:clamp(seo*20/9),machineDiscovery:clamp(machine*20/8),llmReadability:clamp(llm),agentIdentity:clamp(identity),agentProtocols:clamp(protocols)}, captchaConfigured:verification.configured });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return response({ ok:true });
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/config') return response({ turnstileSiteKey: env.TURNSTILE_SITE_KEY || '', captchaConfigured: !!env.TURNSTILE_SECRET });
    if (request.method === 'POST' && url.pathname === '/api/audit') {
      let body; try { body=await request.json(); } catch { return response({error:'Invalid request.'},400); }
      return audit(request,env,body);
    }
    if (url.pathname !== '/api/contact') return response({error:'Not found.'},404);
    if (request.method !== 'POST') return response({ error:'Method not allowed.' },405);
    const origin=request.headers.get('Origin');
    if(origin && origin!==ALLOWED_ORIGIN && origin!=='https://www.deepdell.com') return response({error:'Origin not allowed.'},403);
    let data; try{data=await request.json()}catch{return response({error:'Invalid request.'},400)}
    const verification=await verifyTurnstile(request,env,data.turnstile,'contact');
    if(!verification.success)return response({error:'Security verification failed. Please complete the verification and try again.'},403);
    if(clean(data.website_field,200))return response({ok:true});
    const name=clean(data.name,120),email=clean(data.email,254),company=clean(data.company,160),website=clean(data.website,500),service=clean(data.service,120),phone=clean(data.phone,80),message=clean(data.message,5000),auditUrl=clean(data.audit_url,1000);
    if(!name||!email||!service||!message)return response({error:'Please complete all required fields.'},400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return response({error:'Please enter a valid work email.'},400);
    const subject=auditUrl?`New DEEPDELL lead — Agentic audit — ${company||name}`:`New DEEPDELL project enquiry — ${company||name}`;
    const html=`<!doctype html><html><body style="margin:0;background:#011434;color:#fff;font-family:Arial,Helvetica,sans-serif;padding:32px"><div style="max-width:680px;margin:auto"><div style="font-size:12px;letter-spacing:2px;color:#20f3fb">DEEPDELL / NEW LEAD</div><h1 style="font-size:28px;margin:12px 0 24px">${esc(name)}${company?` <span style="color:#89f9fd">· ${esc(company)}</span>`:''}</h1><table style="width:100%;border-collapse:collapse"><tr><td style="padding:12px 0;color:#89f9fd;width:150px">EMAIL</td><td style="padding:12px 0">${esc(email)}</td></tr><tr><td style="padding:12px 0;color:#89f9fd">SERVICE</td><td style="padding:12px 0">${esc(service)}</td></tr>${website?`<tr><td style="padding:12px 0;color:#89f9fd">WEBSITE</td><td style="padding:12px 0">${esc(website)}</td></tr>`:''}${phone?`<tr><td style="padding:12px 0;color:#89f9fd">PHONE</td><td style="padding:12px 0">${esc(phone)}</td></tr>`:''}${auditUrl?`<tr><td style="padding:12px 0;color:#89f9fd">AUDIT</td><td style="padding:12px 0"><a style="color:#20f3fb" href="${esc(auditUrl)}">${esc(auditUrl)}</a></td></tr>`:''}</table><div style="margin-top:22px;padding:20px;background:#021c3d;border:1px solid #17446b"><div style="font-size:11px;letter-spacing:1px;color:#89f9fd;margin-bottom:10px">PROJECT DETAILS</div><div style="white-space:pre-wrap;line-height:1.7">${esc(message)}</div></div><p style="color:#7189a3;font-size:12px;margin-top:24px">Reply directly to this email to respond to the lead.</p></div></body></html>`;
    const text=`DEEPDELL NEW LEAD\n\nName: ${name}\nEmail: ${email}\nCompany: ${company||'-'}\nWebsite: ${website||'-'}\nService: ${service}\nPhone: ${phone||'-'}\nAudit URL: ${auditUrl||'-'}\n\nProject details:\n${message}`;
    const resend=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:FROM,to:[TO],reply_to:[email],subject,html,text})});
    if(!resend.ok){console.error('Resend error',resend.status,await resend.text());return response({error:'Unable to send your enquiry right now. Please try again or email support@deepdell.com.'},502)}
    return response({ok:true});
  }
};