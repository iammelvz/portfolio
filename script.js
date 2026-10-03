const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

// ─── Scroll-triggered fade-in ────────────────────────────────────────
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
  { threshold: 0.12 }
);
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ─── Nav shadow + timeline draw on scroll ────────────────────────────
const nav = document.querySelector('nav');
const timeline = document.querySelector('.timeline');
function onScroll() {
  nav.style.boxShadow = window.scrollY > 20 ? '0 4px 32px rgba(0,0,0,0.3)' : 'none';
  const r = timeline.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
  timeline.style.setProperty('--progress', p);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ─── Hero: rotating "ship --layer" line ──────────────────────────────
(async function typeRoles() {
  const el = document.getElementById('typed');
  const words = ['React interfaces', 'React Native apps', 'NestJS & Spring APIs', 'event-driven pipelines', 'PostgreSQL schemas', 'the whole stack'];
  if (reduceMotion) { el.textContent = words.at(-1); return; }
  for (let i = 0; ; i = (i + 1) % words.length) {
    for (const ch of words[i]) { el.textContent += ch; await sleep(55); }
    await sleep(1600);
    while (el.textContent) { el.textContent = el.textContent.slice(0, -1); await sleep(25); }
    await sleep(250);
  }
})();

// ─── Hero: count-up stats ────────────────────────────────────────────
const statObserver = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  statObserver.unobserve(e.target);
  const target = +e.target.dataset.count, t0 = performance.now(), dur = reduceMotion ? 0 : 1200;
  (function tick(t) {
    const k = dur ? Math.min(1, Math.max(0, (t - t0) / dur)) : 1;
    e.target.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => statObserver.observe(el));

// ─── Hero: live code window (frontend → backend → database) ──────────
const snippets = [
  { status: '✓ Rendered · Next.js · 0 type errors', html:
`<k>export function</k> <f>OrderCard</f>({ order }) {
  <k>const</k> { data } = <f>useQuery</f>([<s>'eta'</s>, order.id], fetchEta);
  <k>return</k> (
    <t>&lt;Card</t> <a>className</a>=<s>"rounded-2xl p-4"</s><t>&gt;</t>
      <t>&lt;Status</t> <a>value</a>={order.status} <t>/&gt;</t>
      <t>&lt;p&gt;</t>Arrives {data?.eta ?? <s>'…'</s>}<t>&lt;/p&gt;</t>
    <t>&lt;/Card&gt;</t>
  );
}` },
  { status: '✓ 201 Created · order.created published', html:
`<d>@Controller</d>(<s>'orders'</s>)
<k>export class</k> <f>OrdersController</f> {
  <k>constructor</k>(<k>private readonly</k> pubsub: <f>PubSubService</f>) {}

  <d>@Post</d>()
  <k>async</k> <f>create</f>(<d>@Body</d>() dto: <f>CreateOrderDto</f>) {
    <k>const</k> order = <k>await</k> <k>this</k>.orders.<f>save</f>(dto);
    <k>await</k> <k>this</k>.pubsub.<f>publish</f>(<s>'order.created'</s>, order);
    <k>return</k> order;
  }
}` },
  { status: '✓ Migration applied · capacity check live', html:
`<k>CREATE TABLE</k> <f>warehouse_capacity</f> (
  warehouse_id <t>TEXT</t> <k>NOT NULL</k>,
  day          <t>DATE</t> <k>NOT NULL</k>,
  capacity     <t>INT</t>  <k>CHECK</k> (capacity &gt;= <n>0</n>),
  booked       <t>INT</t>  <k>DEFAULT</k> <n>0</n>,
  <k>PRIMARY KEY</k> (warehouse_id, day)
);

<k>CREATE TABLE</k> <f>non_working_days</f> (
  warehouse_id <t>TEXT</t>, day <t>DATE</t>,
  kind <t>TEXT</t> <k>CHECK</k> (kind <k>IN</k> (<s>'public'</s>, <s>'recurring'</s>, <s>'adhoc'</s>))
);` },
];

(function codeWindow() {
  const code = document.getElementById('dw-code');
  const status = document.getElementById('dw-status');
  const tabs = document.querySelectorAll('.dw-tab');
  const layers = document.querySelectorAll('.dw-layer');
  let run = 0;

  // Flatten highlighted HTML into [className, text] tokens so it can be typed char by char
  function tokens(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    return [...tpl.content.childNodes].map(n => [n.nodeType === 1 ? 'c-' + n.tagName.toLowerCase() : '', n.textContent]);
  }

  async function show(i) {
    const id = ++run;
    tabs.forEach((t, j) => t.classList.toggle('active', j === i));
    layers.forEach((l, j) => l.classList.toggle('active', j === i));
    code.textContent = '';
    status.textContent = 'compiling…';
    status.parentElement.classList.remove('ok');
    for (const [cls, text] of tokens(snippets[i].html)) {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      code.appendChild(span);
      if (reduceMotion) { span.textContent = text; continue; }
      for (const ch of text) {
        if (id !== run) return false;
        span.textContent += ch;
        await sleep(ch === '\n' ? 60 : 14);
      }
    }
    status.textContent = snippets[i].status;
    status.parentElement.classList.add('ok');
    await sleep(2600);
    return id === run;
  }

  async function loop(i) {
    while (await show(i)) i = (i + 1) % snippets.length;
  }

  tabs.forEach(t => t.addEventListener('click', () => loop(+t.dataset.i)));
  if (reduceMotion) show(0); else loop(0);
})();

// ─── "One request, every layer" flow animation ───────────────────────
(function requestFlow() {
  const flow = document.getElementById('flow');
  const wrap = document.getElementById('flow-nodes');
  const packet = document.getElementById('packet');
  const log = document.getElementById('flow-log');
  const btn = document.getElementById('flow-btn');
  const bar = document.getElementById('deploy-bar');
  const deployText = document.getElementById('deploy-text');
  const node = name => wrap.querySelector(`[data-node="${name}"]`);
  let running = false, deployed = false, orderNo = 10482;

  function centre(el) {
    const a = el.getBoundingClientRect(), b = wrap.getBoundingClientRect();
    return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2];
  }

  async function travel(from, to, cls = '') {
    packet.className = 'packet show ' + cls;
    const [x1, y1] = centre(node(from)), [x2, y2] = centre(node(to));
    if (reduceMotion) return;
    await packet.animate(
      [{ transform: `translate(${x1}px, ${y1}px)` }, { transform: `translate(${x2}px, ${y2}px)` }],
      { duration: 650, easing: 'cubic-bezier(.6,.05,.3,1)', fill: 'forwards' }
    ).finished;
  }

  function line(tag, text, cls = '') {
    const row = document.createElement('div');
    row.className = 'fcon-row ' + cls;
    const ms = String(Math.floor(performance.now()) % 100000).padStart(5, '0');
    row.innerHTML = `<span class="ts">${ms}</span><span class="tag tag-${tag}">${tag}</span><span></span>`;
    row.lastChild.textContent = text;
    log.appendChild(row);
    while (log.children.length > 10) log.firstChild.remove();
  }

  function activate(name) {
    wrap.querySelectorAll('.flow-node').forEach(n => n.classList.toggle('active', n.dataset.node === name));
  }

  async function deploy() {
    deployText.textContent = 'deploying…';
    for (let p = 0; p <= 100; p += 4) { bar.style.width = p + '%'; await sleep(30); }
    deployText.textContent = '✓ revision live';
  }

  async function play() {
    if (running) return;
    running = true; btn.disabled = true;
    const id = ++orderNo;
    log.innerHTML = '';
    if (!deployed) { deployed = true; await deploy(); }

    activate('ui');      line('ui', `checkout → GET /delivery-promise?postcode=2000`); await sleep(500);
    await travel('ui', 'api');
    activate('api');     line('api', `courier capacity Thu ✓ · warehouse SYD-01 capacity 412/600 ✓`); await sleep(400);
                         line('api', `non-working day? public ✗ · recurring ✗ · adhoc ✗`); await sleep(400);
                         line('api', `200 OK · deliver Thu–Fri`, 'ok'); await sleep(300);
    activate('ui');      line('ui', `place order #${id}`); await sleep(300);
    await travel('ui', 'api');
    await travel('api', 'events', 'evt');
    activate('events');  line('pubsub', `publish order.created → capacity, courier, comms`); await sleep(450);
    await travel('events', 'data', 'evt');
    activate('data');    line('db', `UPDATE warehouse_capacity SET booked = booked + 1`); await sleep(400);
    await travel('data', 'ui', 'back');
    activate('ui');      line('ui', `✓ Order confirmed · arrives Thu–Fri · ${140 + Math.floor(Math.random() * 60)}ms round trip`, 'ok');
    packet.className = 'packet';
    await sleep(900);
    activate(null);
    running = false; btn.disabled = false;
  }

  btn.addEventListener('click', play);
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { obs.disconnect(); setTimeout(play, 400); }
  }, { threshold: 0.4 }).observe(flow);
})();

// ─── Cursor spotlight on cards ───────────────────────────────────────
document.querySelectorAll('.skill-card, .project-card, .flow-node').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
