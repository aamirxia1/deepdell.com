(()=>{
const path=location.pathname;
if(path==='/index.html'||path==='/index.htm'){location.replace('/'+location.search+location.hash);return}
const body=document.body,loader=document.getElementById('site-loader'),progress=document.querySelector('.scroll-progress'),header=document.querySelector('.site-header'),menu=document.querySelector('.menu');
body.classList.remove('light');localStorage.removeItem('deepdell-theme');document.querySelectorAll('.theme-toggle').forEach(el=>el.remove());
const meta=document.querySelector('meta[name="theme-color"]);if(meta)meta.setAttribute('content','#011434');
document.querySelectorAll('.brand img,.footer-brand img').forEach(img=>{img.src='assets/deepdell-lockup.svg';img.alt='DEEPDELL — Deep Technology. Clear Impact.'});
if(!document.querySelector('link[data-tech-css]')){const l=document.createElement('link');l.rel='stylesheet';l.href='tech.css';l.dataset.techCss='1';document.head.appendChild(l)}
const finishLoader=()=>{if(!loader||loader.dataset.done)return;loader.dataset.done='1';loader.classList.add('loader-done');setTimeout(()=>loader.remove(),500)};
window.addEventListener('load',()=>setTimeout(finishLoader,120),{once:true});setTimeout(finishLoader,1800);
menu?.addEventListener('click',()=>{const open=header.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open))});document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>header?.classList.remove('menu-open')));
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=window.matchMedia('(pointer: coarse)').matches;
let ticking=false;const updateScroll=()=>{const y=window.scrollY,max=document.documentElement.scrollHeight-window.innerHeight;if(progress)progress.style.width=`${max>0?Math.min(100,y/max*100):0}%`;header?.classList.toggle('scrolled',y>20);if(!reduce){const scene=document.querySelectorAll('.hero-art,.shopify-visual,.dashboard,.architecture,.contact-panel,.page-hero>div');const vh=innerHeight;scene.forEach(el=>{const r=el.getBoundingClientRect(),d=(r.top+r.height/2-vh/2)/vh;el.style.setProperty('--scroll-tilt',`${Math.max(-5,Math.min(5,-d*7))}deg`);el.style.setProperty('--scroll-depth',`${Math.max(-32,Math.min(32,-d*24))}px`)});const art=document.querySelector('.hero-art');if(art)art.style.setProperty('--scroll-y',`${Math.max(-38,Math.min(18,y*.035))}px`)}ticking=false};addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
const targets=document.querySelectorAll('.service,.ai-grid article,.why-grid article,.steps article,.reveal,.arch-card,.vertical,.engagement,.digital-card,.protocol,.agent-step,.ops-copy,.live-console,.page-card,.agentic-home');if('IntersectionObserver'in window&&!reduce){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -30px'});targets.forEach(el=>{el.classList.add('reveal-item');io.observe(el)})}else targets.forEach(el=>el.classList.add('visible'));
const art=document.querySelector('.hero-art');if(art&&!reduce&&!coarse){const dots=[...art.querySelectorAll('.dot')];art.addEventListener('pointerenter',()=>art.classList.add('is-hovering'));art.addEventListener('pointermove',e=>{const r=art.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;art.style.setProperty('--mx',`${x*16}px`);art.style.setProperty('--my',`${y*12}px`);art.style.setProperty('--rx',`${-y*4}deg`);art.style.setProperty('--ry',`${x*5}deg`);art.style.setProperty('--cursor-x',`${(x+.5)*100}%`);art.style.setProperty('--cursor-y',`${(y+.5)*100}%`);dots.forEach((dot,i)=>{const dx=((i*29)%100)/100-.5,dy=((i*47)%100)/100-.5,p=Math.max(0,1-Math.hypot(x-dx,y-dy)*2.8);dot.style.transform=`translate(${(x-dx)*-18*p}px,${(y-dy)*-18*p}px) scale(${1+p*.35})`;dot.style.boxShadow=p?`0 0 ${14+p*18}px rgba(32,243,251,.75)`:''})});art.addEventListener('pointerleave',()=>{art.classList.remove('is-hovering');['--mx','--my','--rx','--ry'].forEach(v=>art.style.setProperty(v,v.includes('r')?'0deg':'0px'));dots.forEach(d=>{d.style.transform='';d.style.boxShadow=''})});art.addEventListener('pointerdown',()=>{art.classList.remove('hit');void art.offsetWidth;art.classList.add('hit')})}
if(!reduce&&!coarse){document.querySelectorAll('.service,.page-card,.ai-grid article,.why-grid article,.steps article,.arch-card,.engagement,.digital-card,.protocol,.live-console,.agentic-card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--card-rx',`${-y*5}deg`);card.style.setProperty('--card-ry',`${x*6}deg`);card.style.setProperty('--spot-x',`${(x+.5)*100}%`);card.style.setProperty('--spot-y',`${(y+.5)*100}%`)});card.addEventListener('pointerleave',()=>{card.style.setProperty('--card-rx','0deg');card.style.setProperty('--card-ry','0deg')})});document.querySelectorAll('.btn').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`translate(${x*3}px,${y*3}px) translateY(-2px)`});el.addEventListener('pointerleave',()=>el.style.transform='')})}
if(path==='/'||path===''||path==='/index.html'){const intro=document.querySelector('.intro');if(intro&&!document.querySelector('.agentic-home')){const s=document.createElement('section');s.className='section-pad agentic-home';s.innerHTML=`<div class="section-kicker">02 / AGENTIC READINESS</div><div class="agentic-home-grid"><div class="agentic-home-copy"><h2>Can an AI agent <span>actually understand your website?</span></h2><p>Check the public discovery layer of any website. We scan the signals agents and search systems can discover — from robots.txt and sitemaps to UCP, MCP, llms.txt, agent cards and other machine-readable endpoints.</p><div class="agentic-mini-form"><input id="home-agentic-url" type="url" placeholder="https://yourwebsite.com" aria-label="Website URL"><button class="btn primary" id="home-agentic-run">Run agentic check <span>↗</span></button></div><a class="text-link" href="agentic-check.html">Open full Agentic Readiness Checker <span>↗</span></a></div><div class="agentic-preview" aria-label="Agentic checker preview"><div class="preview-window"><div class="preview-bar"><span></span><span></span><span></span><b>AGENTIC READINESS</b></div><div class="preview-body"><div class="preview-url">https://yourwebsite.com</div><div class="preview-line strong">PUBLIC DISCOVERY SCAN</div><div class="preview-checks"><i>✓</i><span>robots.txt</span><b>FOUND</b><i>✓</i><span>sitemap.xml</span><b>FOUND</b><i>✓</i><span>llms.txt</span><b>FOUND</b><i>✓</i><span>/.well-known/ucp</span><b>FOUND</b><i>✓</i><span>/.well-known/agent-card.json</span><b>FOUND</b><i>!</i><span>MCP endpoint</span><b class="muted">CHECK</b></div><div class="preview-score"><strong>86</strong><span>/ 100<br>READINESS</span></div></div></div></div></div><div class="agentic-how"><div><strong>01</strong><span>Enter URL</span><small>Public website address</small></div><b>→</b><div><strong>02</strong><span>Discover</span><small>Protocols & machine files</small></div><b>→</b><div><strong>03</strong><span>Report</span><small>Availability & gaps</small></div><b>→</b><div><strong>04</strong><span>Improve</span><small>DEEPDELL engineering</small></div></div>`;intro.after(s);s.querySelector('#home-agentic-run')?.addEventListener('click',()=>{const u=s.querySelector('#home-agentic-url').value.trim();location.href='agentic-check.html'+(u?'?url='+encodeURIComponent(u):'')})}}
if(path==='/'||path===''){const graph={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':'https://deepdell.com/#organization','name':'DEEPDELL','url':'https://deepdell.com/','logo':'https://deepdell.com/assets/deepdell-lockup.svg','description':'Digital engineering company specialising in Shopify Plus, AI agents, agentic automation, systems integration, data and business intelligence, custom software and digital commerce.','email':'support@deepdell.com','knowsAbout':['Shopify Plus','Shopify','AI agents','Agentic AI','AI automation','Digital commerce','B2B commerce','B2C commerce','Systems integration','GraphQL','React','Next.js','Node.js','TypeScript','PHP','Magento','Python','Data engineering','Business intelligence','Cloud infrastructure','Technical SEO','CRO']},{'@type':'WebSite','@id':'https://deepdell.com/#website','url':'https://deepdell.com/','name':'DEEPDELL','description':'Deep technology. Clear impact. Shopify Plus, AI, automation, data and digital engineering.','publisher':{'@id':'https://deepdell.com/#organization'}},{'@type':'WebPage','@id':'https://deepdell.com/#webpage','url':'https://deepdell.com/','name':'DEEPDELL — Shopify Plus, AI & Digital Engineering','description':'DEEPDELL engineers Shopify Plus commerce platforms, AI agents, agentic automation, business integrations, data systems and custom digital products.','isPartOf':{'@id':'https://deepdell.com/#website'},'about':{'@id':'https://deepdell.com/#organization'}}]};const sc=document.createElement('script');sc.type='application/ld+json';sc.textContent=JSON.stringify(graph);document.head.appendChild(sc)}
const page=location.pathname.split('/').pop()||'';document.querySelectorAll('.nav a').forEach(a=>{if(a.getAttribute('href')===page)a.setAttribute('aria-current','page')});
})();

/* Agentic audit onboarding breakdown — only runs on the public checker. */
(()=>{
if(!document.getElementById('scan-form'))return;
const style=document.createElement('style');style.textContent=`
.agentic-score-breakdown{margin:0 0 24px;padding:24px;border:1px solid rgba(32,243,251,.24);background:linear-gradient(135deg,rgba(32,243,251,.045),rgba(2,28,61,.96));}
.agentic-score-breakdown h3{margin:0 0 18px;font-size:11px;letter-spacing:.14em;font-family:'DM Mono',monospace;color:#20f3fb;text-transform:uppercase}
.agentic-score-rows{display:grid;gap:8px}
.agentic-score-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(137,249,253,.08);font-size:13px}
.agentic-score-row:last-child{border-bottom:0}
.agentic-score-row span{color:#dce9f5}.agentic-score-row strong{font-family:'DM Mono',monospace;color:#89f9fd;font-size:12px}
.agentic-score-total{display:flex;justify-content:space-between;align-items:center;margin-top:15px;padding-top:15px;border-top:1px solid rgba(32,243,251,.22);font-weight:800}.agentic-score-total strong{font-size:18px;color:#fff}.agentic-score-total b{font:700 20px 'DM Mono',monospace;color:#20f3fb}
.agentic-score-help{margin:14px 0 0;color:#7189a3;font-size:11px;line-height:1.65}
@media(max-width:700px){.agentic-score-breakdown{padding:18px}.agentic-score-row{font-size:12px}}
`;document.head.appendChild(style);
const status=document.getElementById('status');
const parseResults=()=>[...status.querySelectorAll('.audit-card')].map(card=>{const group=card.closest('.audit-grid')?.previousElementSibling?.textContent?.trim().toLowerCase()||'';const name=card.querySelector('.audit-top strong')?.textContent?.trim().toLowerCase()||'';const found=card.classList.contains('pass');return{group,name,found}});
const endpoint=(items,names)=>items.filter(x=>names.some(n=>x.name===n)).filter(x=>x.found).length;
const build=()=>{
 if(!status.classList.contains('show')||status.querySelector('.agentic-score-breakdown')||!status.querySelector('.audit-card'))return;
 const items=parseResults();
 const has=(...names)=>endpoint(items,names);
 const core=items.filter(x=>x.group.includes('core'));
 const ai=items.filter(x=>x.group.includes('ai discovery'));
 const docs=items.filter(x=>x.group.includes('agent docs'));
 const wk=items.filter(x=>x.group.includes('well-known'));
 const protocol=items.filter(x=>x.group.includes('protocol'));
 const add=items.filter(x=>x.group.includes('additional'));
 const techMax=20,llmMax=20,machineMax=20,identityMax=20,protocolMax=20;
 let tech=0,llm=0,machine=0,identity=0,proto=0;
 const auditUrl=(status.querySelector('.audit-url')?.textContent||'').trim();
 const title=document.querySelector('title')?.textContent||'';
 tech+=Math.min(3,(location.protocol==='https:'?3:0));
 tech+=Math.min(3,(document.querySelector('meta[name="description"]')?3:0));
 tech+=Math.min(3,(document.querySelector('link[rel="canonical"]')?3:0));
 tech+=Math.min(2,(document.querySelector('h1')?2:0));
 tech+=Math.min(2,(title.length>=20&&title.length<=65?2:0));
 tech+=Math.min(3,(document.querySelector('script[type="application/ld+json"]')?3:0));
 tech+=Math.min(2,(document.querySelector('meta[property="og:title"]')?2:0));
 tech+=Math.min(2,(document.querySelector('html[lang]')?2:0));
 machine+=has('robots.txt')?5:0;
 machine+=has('sitemap.xml')?5:0;
 machine+=has('sitemap index')?2:0;
 machine+=has('security.txt')?1:0;
 machine+=has('sitemap.txt')?1:0;
 machine+=Math.min(3,add.filter(x=>x.found).length>=2?3:add.filter(x=>x.found).length);
 llm+=has('llms.txt')?8:0;
 llm+=has('llms-full.txt')?4:0;
 llm+=has('llms.md')?2:0;
 llm+=has('llms-full.md')?2:0;
 llm+=docs.some(x=>x.found&&/model-context|machine-readable|agent|ai/.test(x.name))?4:0;
 identity+=has('UCP profile')?8:0;
 identity+=has('A2A Agent Card')?8:0;
 identity+=Math.min(4,docs.filter(x=>x.found).length?4:0);
 proto+=has('UCP MCP endpoint')?5:0;
 proto+=has('MCP endpoint')?5:0;
 proto+=has('MCP SSE endpoint')?3:0;
 proto+=has('API MCP endpoint')?3:0;
 proto+=protocol.some(x=>x.found)?4:0;
 const clamp=n=>Math.max(0,Math.min(20,Math.round(n)));
 tech=clamp(tech);machine=clamp(machine);llm=clamp(llm);identity=clamp(identity);proto=clamp(proto);
 const total=tech+machine+llm+identity+proto;
 const box=document.createElement('section');box.className='agentic-score-breakdown';box.innerHTML=`<h3>AGENTIC READINESS</h3><div class="agentic-score-rows"><div class="agentic-score-row"><span>Technical SEO</span><strong>${tech} / ${techMax}</strong></div><div class="agentic-score-row"><span>Machine Discovery</span><strong>${machine} / ${machineMax}</strong></div><div class="agentic-score-row"><span>LLM Readability</span><strong>${llm} / ${llmMax}</strong></div><div class="agentic-score-row"><span>Agent Identity</span><strong>${identity} / ${identityMax}</strong></div><div class="agentic-score-row"><span>Agent Protocols</span><strong>${proto} / ${protocolMax}</strong></div></div><div class="agentic-score-total"><strong>TOTAL</strong><b>${total} / 100</b></div><p class="agentic-score-help">This breakdown explains the audit score by capability area. Endpoint detection means publicly reachable; it does not by itself prove that a protocol is correctly implemented or production-ready.</p>`;
 status.prepend(box);
};
new MutationObserver(()=>setTimeout(build,0)).observe(status,{childList:true,subtree:true});
setTimeout(build,2000);
})();
