/*
  Renders the page from window.PROFILE (profile.json, bundled into data.js by build.cmd).
  To change what the site says, edit profile.json and run build.cmd. You shouldn't need to touch this file.
*/
(() => {
  'use strict';

  const P = window.PROFILE;
  const FILES = window.PROFILE_FILES || {};
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!P) {
    $('#main').innerHTML =
      '<div class="container fallback"><h1>Almost there</h1><p>No <code>data.js</code> found. ' +
      'Double-click <code>build.cmd</code> to generate it from <code>profile.json</code>.</p></div>';
    return;
  }

  /* ---------------------------------------------------------------- helpers */
  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const has = (v) => (Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== '');
  const arr = (v) => (Array.isArray(v) ? v.filter(has) : has(v) ? [v] : []);
  const paras = (v) => arr(v).map((t) => `<p>${esc(t)}</p>`).join('');
  const digits = (phone) => String(phone).replace(/[^\d+]/g, '');
  const lastSegment = (url) => {
    try { return new URL(url).pathname.split('/').filter(Boolean).pop() || ''; } catch { return ''; }
  };
  const hostOf = (url) => {
    try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; }
  };

  // Metrics get a highlighter mark in the web résumé: $12,000 · 1,500 · 18% · 200K+ · 60+ · 3x
  // (whole numbers only — never the "2" in B2B — and never trailing punctuation)
  const METRIC = /(\$\d+(?:,\d{3})*(?:\.\d+)?[KMB]?\+?|\b\d{1,3}(?:,\d{3})+\+?|\b\d+(?:\.\d+)?(?:%|[KMB]\b\+?|\+|x\b))/g;
  const highlight = (text) => esc(text).replace(METRIC, '<b class="metric">$1</b>');
  // Bullet text: metric highlights plus **bold lead-ins** (same markup the formal résumé uses)
  const rich = (text) => highlight(text).replace(/\*\*(.+?)\*\*/g, '<strong class="lead-in">$1</strong>');

  const words = String(P.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = P.firstName || words[0] || '';
  const initials = ((words[0]?.[0] || '') + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();

  if (has(P.theme?.accent)) root.style.setProperty('--accent', P.theme.accent);

  /* ------------------------------------------------------------------ icons */
  // Paths from Lucide (lucide.dev, ISC license).
  const ICONS = {
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrow: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    spark: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.link}</svg>`;

  /* ---------------------------------------------------------------- socials */
  const SOCIAL = {
    linkedin: { label: 'LinkedIn', icon: 'linkedin', handle: (u) => (lastSegment(u) ? 'in/' + lastSegment(u) : 'View profile') },
    handshake: { label: 'Handshake', icon: 'handshake', handle: () => 'View my profile' },
    instagram: { label: 'Instagram', icon: 'instagram', handle: (u) => (lastSegment(u) ? '@' + lastSegment(u) : 'View profile') },
    github: { label: 'GitHub', icon: 'github', handle: (u) => lastSegment(u) || 'View profile' },
  };
  const socials = Object.entries(P.links || {})
    .filter(([, url]) => has(url))
    .map(([key, url]) => {
      const known = SOCIAL[key] || { label: key.charAt(0).toUpperCase() + key.slice(1), icon: 'link', handle: hostOf };
      return { key, url, label: known.label, icon: known.icon, handle: known.handle(url) };
    });

  /* ------------------------------------------------------------- QR codes */
  // The QR library loads in the background so a slow CDN never delays the page itself.
  const QR_LIB = {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
    integrity: 'sha512-ZDSPMa/JM1D+7kdg2x3BsruQ6T/JpJo3jWDWkCZsP+5yVyp1KfESqLI+7RqB5k24F7p2cV7i2YHh/890y6P6Sw==',
  };
  let qrStatus = typeof window.qrcode === 'function' ? 'ready' : 'loading';
  const qrReady = new Promise((resolve) => {
    if (qrStatus === 'ready') return resolve();
    const s = Object.assign(document.createElement('script'), {
      src: QR_LIB.src, integrity: QR_LIB.integrity, crossOrigin: 'anonymous', referrerPolicy: 'no-referrer', async: true,
    });
    s.onload = () => { qrStatus = typeof window.qrcode === 'function' ? 'ready' : 'failed'; resolve(); };
    s.onerror = () => { qrStatus = 'failed'; resolve(); };
    document.head.appendChild(s);
  });

  const pageUrl = () => {
    const isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (!isLocal) return location.origin + location.pathname;
    return has(P.website) ? P.website : '';
  };

  const makeQr = (text) => {
    if (typeof window.qrcode !== 'function' || !text) return null;
    if (window.qrcode.stringToBytesFuncs?.['UTF-8']) window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr;
  };

  const qrSvg = (text, margin = 4) => {
    const qr = makeQr(text);
    if (!qr) return null;
    const n = qr.getModuleCount();
    const size = n + margin * 2;
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c)) continue;
        let run = 1;
        while (c + run < n && qr.isDark(r, c + run)) run++;
        d += `M${c + margin} ${r + margin}h${run}v1h-${run}z`;
        c += run - 1;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code linking to ${esc(text)}"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${d}" fill="#1C1A17"/></svg>`;
  };

  const qrPngBlob = (text, px = 1200) =>
    new Promise((resolve) => {
      const qr = makeQr(text);
      if (!qr) return resolve(null);
      const n = qr.getModuleCount();
      const size = n + 8;
      const scale = Math.max(1, Math.floor(px / size));
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1C1A17';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + 4) * scale, (r + 4) * scale, scale, scale);
      canvas.toBlob(resolve, 'image/png');
    });

  // The QR image for `url`, or a note explaining why there isn't one (yet).
  const qrMarkup = (url, margin) => {
    const svg = url && qrStatus === 'ready' ? qrSvg(url, margin) : null;
    if (svg) return svg;
    const note = !url
      ? 'QR code appears once the site is online (or set "website" in profile.json).'
      : qrStatus === 'loading' ? 'Loading QR code…' : 'QR code unavailable right now. Use Copy link instead.';
    return `<div class="bcard-qr-empty">${esc(note)}</div>`;
  };

  /* -------------------------------------------------------------- sections */
  // About is left out entirely (with its nav links) until it has content; the others renumber.
  const aboutData = P.about || {};
  const aboutChapters = arr(aboutData.chapters).filter((c) => has(c?.text) || has(c?.label));
  const aboutNumbers = arr(aboutData.numbers).filter((n) => has(n?.value));
  const aboutHobbies = arr(aboutData.hobbies).filter((h) => has(h?.name));
  // ("Where I'm headed" renders in the Résumé section, so it doesn't count toward About)
  const hasAbout = aboutChapters.length > 0 || aboutNumbers.length > 0 || aboutHobbies.length > 0 || has(P.photo);
  const sectionOrder = [hasAbout && 'about', 'resume', 'contact'].filter(Boolean);
  const num = (id) => String(sectionOrder.indexOf(id) + 1).padStart(2, '0');

  const sectionHead = (num, label, title, id, lead = '') => `
    <p class="section-num"><b>${num}</b><i></i>${esc(label)}</p>
    <h2 id="${id}">${title}</h2>
    ${has(lead) ? `<p class="lead">${esc(lead)}</p>` : ''}`;

  // The card keeps to the essentials: who you are (name + one line) and how to reach you.
  function renderCard() {
    const url = pageUrl();
    const subtitle = has(P.card?.subtitle) ? P.card.subtitle : P.headline;
    const meta = [
      has(P.phone) && `<span>${icon('phone')}${esc(P.phone)}</span>`,
      has(P.email) && `<span>${icon('mail')}${esc(P.email)}</span>`,
      has(P.location) && `<span>${icon('pin')}${esc(P.location)}</span>`,
    ].filter(Boolean).join('');
    return `
      <div class="bcard-scene">
        <div class="bcard-tilt">
          <button class="bcard" type="button" aria-pressed="false" aria-label="Business card for ${esc(P.name)}. Press to flip and show a QR code.">
            <span class="bcard-face bcard-front">
              <span class="bcard-id">
                <span class="bcard-name">${esc(P.name)}${has(P.pronouns) ? `<span class="bcard-pronouns">${esc(P.pronouns)}</span>` : ''}</span>
                ${has(subtitle) ? `<span class="bcard-role">${esc(subtitle)}</span>` : ''}
              </span>
              <span class="bcard-meta">${meta}</span>
            </span>
            <span class="bcard-face bcard-back">
              <span class="bcard-qr">${qrMarkup(url, 2)}</span>
              <span class="bcard-back-text">
                <strong>Scan to take me with you</strong>
                ${url ? `<span class="url">${esc(url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span>` : ''}
                <span class="hint">Tap to flip back</span>
              </span>
            </span>
          </button>
        </div>
        <p class="bcard-hint">${icon('rotate')}Click me!</p>
      </div>`;
  }

  // "Contact me" dropdown: an icon circle + label for each way to reach you (email, phone, profiles)
  function renderReach() {
    const ways = [
      has(P.email) && { href: `mailto:${P.email}`, icon: 'mail', label: P.email, hint: 'Email' },
      has(P.phone) && { href: `tel:${digits(P.phone)}`, icon: 'phone', label: P.phone, hint: 'Call' },
      ...socials.map((s) => ({ href: s.url, icon: s.icon, label: s.label, external: true })),
    ].filter(Boolean);
    if (!ways.length) return '';
    return `
      <div class="reach">
        <button class="btn reach-toggle" type="button" aria-expanded="false" aria-controls="reach-menu">
          ${icon('message')}Contact me<svg class="icon chev" viewBox="0 0 24 24" aria-hidden="true">${ICONS.chevron}</svg>
        </button>
        <ul class="reach-menu" id="reach-menu" aria-label="Ways to reach ${esc(firstName)}">
          ${ways.map((w, i) => `
            <li style="--i:${i}">
              <a class="reach-item" href="${esc(w.href)}"${w.external ? ' target="_blank" rel="noopener me"' : ''}${w.hint ? ` title="${esc(w.hint)}"` : ''}>
                <span class="reach-circle">${icon(w.icon)}</span>
                <span class="reach-label">${esc(w.label)}</span>
              </a>
            </li>`).join('')}
        </ul>
      </div>`;
  }

  function renderHero() {
    const actions = [
      FILES.vcf && `<a class="btn" href="${esc(FILES.vcf)}">${icon('userPlus')}Save my contact</a>`,
      (FILES.pdf || FILES.docx) && `<button class="btn" type="button" data-resume-open>${icon('file')}My Résumé</button>`,
      renderReach(),
    ].filter(Boolean);
    const items = [
      has(P.status?.text) &&
        `<p class="status${P.status.open === false ? ' is-closed' : ''}"><span class="status-dot" aria-hidden="true"></span>${esc(P.status.text)}</p>`,
      `<h1 class="hero-title">${esc(P.name)}</h1>`,
      has(P.headline) && `<p class="hero-headline">${esc(P.headline)}</p>`,
      has(P.tagline) && `<p class="hero-tagline">${esc(P.tagline)}</p>`,
      actions.length && `<div class="hero-actions">${actions.join('')}</div>`,
    ].filter(Boolean);

    const facts = arr(P.quickFacts);
    return `
      <div class="container">
        <div class="hero-grid">
          <div class="hero-copy">
            ${items.map((html, i) => html.replace(/^<(\w+)/, `<$1 data-reveal style="--d:${i * 70}ms"`)).join('')}
          </div>
          <div class="hero-card" data-reveal style="--d:200ms">${renderCard()}</div>
        </div>
        ${facts.length ? `
          <div class="facts" data-reveal>
            <p class="eyebrow">The 30-second version</p>
            <dl class="facts-grid">
              ${facts.map((f) => `<div class="fact"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}
            </dl>
          </div>` : ''}
      </div>`;
  }

  function renderAbout() {
    const chapters = aboutChapters;
    const numbers = aboutNumbers;
    const hobbies = aboutHobbies;
    const hasSide = has(P.photo) || numbers.length > 0;
    return `
      <div class="container">
        <header class="section-head" data-reveal>
          ${sectionHead(num('about'), 'About me', 'A little about me', 'about-title')}
        </header>
        <div class="about-grid${hasSide ? '' : ' about-grid--single'}">
          <div class="chapters">
            ${chapters.map((c) => `
              <article class="chapter" data-reveal>
                <h3>${esc(c.label)}</h3>
                <div>${paras(c.text)}</div>
              </article>`).join('')}
          </div>
          ${has(P.photo) || numbers.length ? `
            <aside class="about-side" aria-label="By the numbers">
              ${has(P.photo) ? `<figure class="about-photo" data-reveal><img src="${esc(P.photo)}" alt="Photo of ${esc(P.name)}" loading="lazy"></figure>` : ''}
              ${numbers.length ? `
                <p class="eyebrow" data-reveal>By the numbers</p>
                <div class="numbers-grid">
                  ${numbers.map((n, i) => `
                    <div class="num" data-reveal style="--d:${i * 60}ms">
                      <span class="num-value">${esc(n.value)}</span>
                      <span class="num-label">${esc(n.label)}</span>
                    </div>`).join('')}
                </div>` : ''}
            </aside>` : ''}
        </div>
        ${hobbies.length ? `
          <p class="eyebrow subhead" data-reveal>Off the clock</p>
          <div class="hobby-grid">
            ${hobbies.map((h, i) => `
              <div class="hobby" data-reveal style="--d:${i * 60}ms">
                ${has(h.emoji) ? `<span class="hobby-emoji" aria-hidden="true">${esc(h.emoji)}</span>` : ''}
                <h4>${esc(h.name)}</h4>
                ${has(h.detail) ? `<p>${esc(h.detail)}</p>` : ''}
              </div>`).join('')}
          </div>` : ''}
      </div>`;
  }

  // Long entries show the first few bullets; the rest sit behind a "Show N more" toggle.
  const bulletLimit = Math.max(1, Number(P.resume?.webBulletLimit) || 3);
  const bulletList = (bullets) => {
    const items = arr(bullets).map((b) => `<li>${rich(b)}</li>`);
    if (!items.length) return '';
    if (items.length <= bulletLimit + 1) return `<ul class="tl-bullets">${items.join('')}</ul>`;
    const extra = items.length - bulletLimit;
    return `
      <ul class="tl-bullets">${items.slice(0, bulletLimit).join('')}</ul>
      <details class="tl-more">
        <summary><span class="tl-more-open">Show ${extra} more</span><span class="tl-more-close">Show less</span></summary>
        <ul class="tl-bullets">${items.slice(bulletLimit).join('')}</ul>
      </details>`;
  };

  const timeline = (items) => `
    <ol class="timeline">
      ${arr(items).map((x) => `
        <li class="tl-item" data-reveal>
          <span class="tl-dot" aria-hidden="true"></span>
          <article class="tl-card">
            <div class="tl-meta">
              <h4 class="tl-title">${esc(x.title)}</h4>
              ${has(x.dates) ? `<span class="tl-dates">${esc(x.dates)}</span>` : ''}
            </div>
            ${has(x.org) || has(x.location) ? `<p class="tl-org">${[x.org, x.location].filter(has).map(esc).join(' <span aria-hidden="true">·</span> ')}</p>` : ''}
            ${bulletList(x.bullets)}
            ${has(x.tags) ? `<ul class="tags" aria-label="Skills used">${arr(x.tags).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          </article>
        </li>`).join('')}
    </ol>`;

  // Résumé sections, in page order. Titles can be renamed in profile.json → resume.titles.
  const SECTIONS = {
    experience: { title: 'Experience', icon: 'briefcase' },
    projects: { title: 'Projects', icon: 'code' },
    leadership: { title: 'Leadership & activities', icon: 'star' },
    volunteer: { title: 'Volunteer experience', icon: 'heart' },
    education: { title: 'Education', icon: 'cap' },
    skills: { title: 'Skills', icon: 'spark' },
    headed: { title: 'Where I’m headed', icon: 'compass' },
  };
  const sectionTitle = (key) => (has(P.resume?.titles?.[key]) ? P.resume.titles[key] : SECTIONS[key].title);
  const blockTitle = (key) => `<h3 class="block-title">${icon(SECTIONS[key].icon)}${esc(sectionTitle(key))}</h3>`;

  // "Relevant Coursework: …" → bold label. Same rule as build.ps1 (label ≤ 40 raw characters).
  const labeled = (text) => {
    const m = /^([^:]{1,40}):(.*)$/s.exec(String(text));
    return m ? `<b>${esc(m[1])}:</b>${esc(m[2])}` : esc(text);
  };

  const eduCard = (e) => `
    <article class="edu" data-reveal>
      <h4 class="edu-school">${esc(e.school)}</h4>
      <p class="edu-degree">${esc(e.degree)}</p>
      <ul class="badges">
        ${has(e.dates) ? `<li class="badge">${esc(e.dates)}</li>` : ''}
        ${has(e.gpa) ? `<li class="badge">GPA ${esc(e.gpa)}</li>` : ''}
        ${has(e.honors) ? `<li class="badge">${esc(e.honors)}</li>` : ''}
        ${has(e.location) ? `<li class="badge">${esc(e.location)}</li>` : ''}
      </ul>
      ${[...arr(e.details), ...arr(e.webDetails)].length ? `<ul class="edu-details">${[...arr(e.details), ...arr(e.webDetails)].map((d) => `<li>${labeled(d)}</li>`).join('')}</ul>` : ''}
    </article>`;

  // "Where I'm headed" closes the résumé section, after the history that explains it.
  const headedBlock = () => {
    const asp = aboutData.aspirations || {};
    if (!has(asp.text)) return '';
    // Same look as the rest of the section: a block title and a plain card
    return `
      <div class="headed-block">
        ${blockTitle('headed')}
        <div class="headed-card" data-reveal>
          <p>${esc(asp.text)}</p>
          ${has(asp.lookingFor) ? `<ul class="skill-chips" aria-label="What I'm looking for">${arr(asp.lookingFor).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`;
  };

  function renderResume() {
    const r = P.resume || {};
    const resumeCta = FILES.pdf || FILES.docx
      ? `<button class="btn btn-primary btn-lg" type="button" data-resume-open>${icon('file')}My Résumé</button>`
      : '<p class="download-missing">Résumé files haven\'t been generated yet. Run build.cmd.</p>';
    // The website can go deeper than the one-page résumé: webSkills (if present) replaces skills here
    const skillGroups = has(P.webSkills) ? P.webSkills : P.skills;
    return `
      <div class="container">
        <header class="section-head resume-head">
          <div data-reveal>${sectionHead(num('resume'), 'Résumé', 'Experience &amp; education', 'resume-title', r.summary)}</div>
          <div class="resume-cta" data-reveal style="--d:120ms">${resumeCta}</div>
        </header>
        <div class="resume-grid">
          <div class="resume-main">
            ${['experience', 'projects', 'leadership', 'volunteer']
              .filter((key) => has(P[key]))
              .map((key) => blockTitle(key) + timeline(P[key]))
              .join('')}
          </div>
          <aside class="resume-side">
            ${has(P.education) ? blockTitle('education') + arr(P.education).map(eduCard).join('') : ''}
            ${has(skillGroups) ? `
              ${blockTitle('skills')}
              ${arr(skillGroups).map((g) => `
                <div class="skill-group" data-reveal>
                  <h4>${esc(g.group)}</h4>
                  <ul class="skill-chips">${arr(g.items).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
                </div>`).join('')}` : ''}
          </aside>
        </div>
        ${headedBlock()}
      </div>`;
  }

  function renderContact() {
    const tiles = [];
    if (has(P.email)) {
      tiles.push(`
        <div class="tile" data-reveal>
          <span class="tile-icon">${icon('mail')}</span>
          <p class="tile-label">Email</p>
          <a class="tile-value" href="mailto:${esc(P.email)}">${esc(P.email)}</a>
          <div class="tile-actions">
            <a class="chip-btn" href="mailto:${esc(P.email)}">${icon('send')}Write me</a>
            <button class="chip-btn" type="button" data-copy="${esc(P.email)}" data-copy-label="Email">${icon('copy')}Copy</button>
          </div>
        </div>`);
    }
    if (has(P.phone)) {
      tiles.push(`
        <div class="tile" data-reveal style="--d:60ms">
          <span class="tile-icon">${icon('phone')}</span>
          <p class="tile-label">Phone</p>
          <a class="tile-value" href="tel:${esc(digits(P.phone))}">${esc(P.phone)}</a>
          <div class="tile-actions">
            <a class="chip-btn" href="tel:${esc(digits(P.phone))}">${icon('phone')}Call</a>
            <a class="chip-btn" href="sms:${esc(digits(P.phone))}">${icon('message')}Text</a>
            <button class="chip-btn" type="button" data-copy="${esc(P.phone)}" data-copy-label="Phone number">${icon('copy')}Copy</button>
          </div>
        </div>`);
    }
    if (has(P.location)) {
      tiles.push(`
        <div class="tile" data-reveal style="--d:120ms">
          <span class="tile-icon">${icon('pin')}</span>
          <p class="tile-label">Location</p>
          <span class="tile-value">${esc(P.location)}</span>
          ${has(P.locationNote) ? `<p class="tile-note">${esc(P.locationNote)}</p>` : ''}
          <div class="tile-actions">
            <a class="chip-btn" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(P.location)}" target="_blank" rel="noopener">${icon('map')}View map</a>
          </div>
        </div>`);
    }
    return `
      <div class="container">
        <header class="section-head" data-reveal>
          ${sectionHead(num('contact'), 'Contact', 'How to Reach Me', 'contact-title', P.contactNote)}
        </header>
        <div class="contact-grid">${tiles.join('')}</div>
        ${socials.length ? `
          <div class="social-grid">
            ${socials.map((s, i) => `
              <a class="social-card" href="${esc(s.url)}" target="_blank" rel="noopener me" data-reveal style="--d:${i * 60}ms">
                ${icon(s.icon)}
                <span class="social-text"><strong>${esc(s.label)}</strong><span>${esc(s.handle)}</span></span>
                <svg class="icon arrow" viewBox="0 0 24 24" aria-hidden="true">${ICONS.arrow}</svg>
              </a>`).join('')}
          </div>` : ''}
        <div class="contact-cta" data-reveal>
          ${FILES.vcf ? `<a class="btn btn-primary btn-lg" href="${esc(FILES.vcf)}">${icon('userPlus')}Save my contact card</a>` : ''}
          <button class="btn btn-lg" type="button" data-share>${icon('qr')}Share this page</button>
        </div>
      </div>`;
  }

  function renderFooter() {
    return `
      <div class="container footer-inner">
        <span>© ${new Date().getFullYear()} ${esc(P.name)}</span>
        <span class="footer-links">
          <button type="button" data-share>Share</button>
          <a href="#home">Back to top ↑</a>
        </span>
      </div>`;
  }

  /* ------------------------------------------------------------------ mount */
  if (P.sample) {
    $('#sample-banner').innerHTML =
      '<div class="sample-banner">Sample content. Replace it in <code>profile.json</code>, set <code>"sample": false</code>, then run <code>build.cmd</code>.</div>';
  } else if (P.draft) {
    $('#sample-banner').innerHTML =
      '<div class="sample-banner">Draft: review the About text in <code>profile.json</code>, then set <code>"draft": false</code> and run <code>build.cmd</code>.</div>';
  }
  $('#brand').innerHTML = `<span class="brand-mark" aria-hidden="true">${esc(initials)}</span><span class="brand-name">${esc(P.name)}</span>`;
  $('#home').innerHTML = renderHero();
  if (hasAbout) $('#about').innerHTML = renderAbout();
  else [$('#about'), ...$$('[data-nav="about"]')].forEach((el) => el.remove());
  $('#resume').innerHTML = renderResume();
  $('#contact').innerHTML = renderContact();
  $('#footer').innerHTML = renderFooter();
  $$('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });

  /* -------------------------------------------------------------- behaviour */
  const dialog = $('#share-dialog');
  const toastEl = $('#toast');
  let toastTimer;
  // A modal dialog sits in the top layer and makes the rest of the page inert, so while it's open
  // the toast (a live region) lives inside it. It moves in when the dialog opens, not when a message
  // appears, so screen readers already know the region when its text changes.
  const activeHost = () => document.querySelector('dialog[open]') || document.body;
  const toast = (msg) => {
    if (toastEl.parentElement !== activeHost()) activeHost().appendChild(toastEl);   // safety net only
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  };

  const copyText = async (text, label) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Older/in-app browsers: select a hidden textarea inside whatever isn't inert right now
      const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      activeHost().appendChild(ta);
      ta.focus();
      ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    toast(ok ? `${label} copied` : `Couldn't copy. Select it and copy it manually.`);
  };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (btn) copyText(btn.dataset.copy, btn.dataset.copyLabel || 'Text');
  });

  const downloadBlob = (blob, name) => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  // Theme toggle
  const themeBtn = $('[data-theme-toggle]');
  const themeMeta = $('meta[name="theme-color"]');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  const syncTheme = () => {
    const dark = currentTheme() === 'dark';
    themeBtn.innerHTML = icon(dark ? 'sun' : 'moon');
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeMeta?.setAttribute('content', getComputedStyle(document.body).backgroundColor);
  };
  let themeFadeTimer;
  themeBtn.addEventListener('click', () => {
    // Fade the colors into the new theme instead of snapping (skipped for reduced motion)
    if (!reducedMotion) {
      root.classList.add('theme-fade');
      clearTimeout(themeFadeTimer);
      themeFadeTimer = setTimeout(() => root.classList.remove('theme-fade'), 450);
    }
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch { /* private mode */ }
    syncTheme();
  });
  darkQuery.addEventListener?.('change', syncTheme);
  syncTheme();

  // "Contact me" dropdown (a disclosure: the button toggles a list of links)
  const reach = $('.reach');
  if (reach) {
    const reachToggle = $('.reach-toggle', reach);
    const setReach = (open) => {
      reach.classList.toggle('is-open', open);
      reachToggle.setAttribute('aria-expanded', String(open));
    };
    reachToggle.addEventListener('click', () => setReach(!reach.classList.contains('is-open')));
    document.addEventListener('click', (e) => { if (!reach.contains(e.target)) setReach(false); });
    reach.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && reach.classList.contains('is-open')) { setReach(false); reachToggle.focus(); }
    });
    // Keyboard users tabbing past the list close it (mouse clicks on links are handled below)
    reach.addEventListener('focusout', (e) => { if (e.relatedTarget && !reach.contains(e.relatedTarget)) setReach(false); });
    $('.reach-menu', reach).addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(() => setReach(false), 150); });
  }

  // Business card: flip + gentle tilt that follows the mouse
  const card = $('.bcard');
  card?.addEventListener('click', () => card.setAttribute('aria-pressed', String(card.classList.toggle('is-flipped'))));
  const scene = $('.bcard-scene');
  const tilt = $('.bcard-tilt');
  if (scene && tilt && !reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    scene.addEventListener('pointermove', (e) => {
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
      tilt.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    });
    scene.addEventListener('pointerleave', () => {
      tilt.style.setProperty('--rx', '0deg');
      tilt.style.setProperty('--ry', '0deg');
    });
  }

  // Share dialog with a downloadable QR code
  const fileBase = String(P.name || 'my-site').replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-') || 'my-site';
  const fillShare = () => {
    const url = pageUrl();
    $('[data-qr-large]', dialog).innerHTML = qrMarkup(url, 2);
    $('[data-share-url]', dialog).textContent = url || 'Not online yet: publish the site to get its link.';
    $('[data-copy-link]', dialog).disabled = !url;
    $$('[data-dl-png], [data-dl-svg]', dialog).forEach((b) => { b.disabled = !url || qrStatus !== 'ready'; });
    $('[data-native-share]', dialog).hidden = !(url && navigator.share);
  };
  // Popups ease in and out: adding .is-open runs the CSS transition; closing waits for it to finish
  const DIALOG_MS = reducedMotion ? 0 : 230;
  const openDialog = (d) => {
    clearTimeout(d._closeTimer);
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    }
    void d.offsetWidth;   // commit the starting (hidden) styles so the transition actually plays
    d.classList.add('is-open');
  };
  const closeDialog = (d) => {
    if (!d.open || !d.classList.contains('is-open')) return;
    d.classList.remove('is-open');
    d._closeTimer = setTimeout(() => {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }, DIALOG_MS);
  };

  const openShare = () => {
    fillShare();
    openDialog(dialog);
    dialog.appendChild(toastEl);
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-share]')) openShare();
  });
  // Every popup closes on its X, a click on the dimmed backdrop, or Esc, always with the ease-out
  $$('dialog.share').forEach((d) => {
    // Only a press that starts AND ends on the backdrop closes it (not a text drag that ends there)
    let pressedBackdrop = false;
    d.addEventListener('pointerdown', (e) => { pressedBackdrop = e.target === d; });
    d.addEventListener('click', (e) => {
      if ((e.target === d && pressedBackdrop) || e.target.closest('[data-close]')) closeDialog(d);
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(d); });
    d.addEventListener('close', () => {
      d.classList.remove('is-open');
      if (toastEl.parentElement === d) document.body.appendChild(toastEl);
    });
  });

  // Résumé popup: downloads first, then a small blurred thumbnail with a "Preview" button.
  // Only when Preview is pressed does the full-size page image load and the thumbnail grow into it.
  const resumeDialog = $('#resume-dialog');
  const docName = has(P.resume?.nameOnDocument) ? P.resume.nameOnDocument : P.name;
  const fillResume = () => {
    $('[data-resume-actions]', resumeDialog).innerHTML = [
      FILES.pdf && `<a class="btn btn-primary" href="${esc(FILES.pdf)}" download>${icon('download')}Download PDF</a>`,
      FILES.docx && `<a class="btn" href="${esc(FILES.docx)}" download>${icon('download')}Download Word</a>`,
    ].filter(Boolean).join('');
    const area = $('[data-resume-preview]', resumeDialog);
    const fulls = arr(FILES.previews);
    const thumbs = arr(FILES.previewThumbs);
    area.classList.remove('is-expanded', 'is-sharp');
    area.innerHTML = fulls.length
      ? `<div class="rp-page">
           <img class="rp-img" src="${esc(thumbs[0] || fulls[0])}" alt="" width="1275" height="1650" decoding="async">
           <button class="btn rp-open" type="button">${icon('eye')}Preview</button>
         </div>
         <div class="rp-more"></div>`
      : '<p class="resume-preview-empty">A preview isn’t available right now, but both downloads above work.</p>';
  };
  const expandPreview = (area) => {
    const fulls = arr(FILES.previews);
    const img = $('.rp-img', area);
    area.classList.add('is-expanded');
    img.alt = `Preview of ${docName}’s résumé${fulls.length > 1 ? ', page 1' : ''}`;
    if (FILES.pdf) img.title = 'Open full size';
    // Swap in the sharp image once it has loaded, then lift the blur (no flash of a low-res page)
    const full = new Image();
    full.onload = () => { img.src = full.src; area.classList.add('is-sharp'); };
    full.onerror = () => area.classList.add('is-sharp');
    full.src = fulls[0];
    $('.rp-more', area).innerHTML = fulls.slice(1)
      .map((src, i) => `<img src="${esc(src)}" alt="Preview of ${esc(docName)}’s résumé, page ${i + 2}" width="1275" height="1650" loading="lazy">`).join('');
    area.focus({ preventScroll: true });
  };
  resumeDialog?.addEventListener('click', (e) => {
    const area = $('[data-resume-preview]', resumeDialog);
    if (!area || !area.contains(e.target)) return;
    if (!area.classList.contains('is-expanded')) {
      if (e.target.closest('.rp-open, .rp-page')) expandPreview(area);
    } else if (e.target.closest('.rp-img, .rp-more img') && FILES.pdf) {
      window.open(FILES.pdf, '_blank', 'noopener');   // full-size PDF (handy for zooming on a phone)
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-resume-open]') || !resumeDialog) return;
    fillResume();
    openDialog(resumeDialog);
    $('[data-resume-preview]', resumeDialog).scrollTop = 0;
  });

  // Once the QR library arrives, draw the codes that were showing "Loading…"
  qrReady.then(() => {
    const cardQr = $('.bcard-qr');
    if (cardQr) cardQr.innerHTML = qrMarkup(pageUrl(), 2);
    if (dialog.open) fillShare();
  });
  $('[data-copy-link]', dialog).addEventListener('click', () => copyText(pageUrl(), 'Link'));
  $('[data-native-share]', dialog).addEventListener('click', () => {
    navigator.share({ title: document.title, text: P.seoDescription || P.tagline || '', url: pageUrl() }).catch(() => {});
  });
  $('[data-dl-svg]', dialog).addEventListener('click', () => {
    const svg = qrSvg(pageUrl(), 4);
    if (svg) downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${fileBase}-QR.svg`);
  });
  $('[data-dl-png]', dialog).addEventListener('click', async () => {
    const blob = await qrPngBlob(pageUrl());
    if (blob) downloadBlob(blob, `${fileBase}-QR.png`);
  });

  // Top bar border once scrolled
  const topbar = $('#topbar');
  const onScroll = () => topbar.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the section you're reading in the nav + tab bar
  const navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => {
          const on = a.dataset.nav === en.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'about', 'resume', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((el) => spy.observe(el));
  }

  // Fade sections in as they scroll into view
  if (!reducedMotion && 'IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    $$('[data-reveal]').forEach((el) => io.observe(el));
    addEventListener('beforeprint', () => $$('[data-reveal]').forEach((el) => el.classList.add('is-in')));
  }

  // Printing the page should include every bullet, not just the visible ones
  addEventListener('beforeprint', () => $$('details.tl-more').forEach((d) => { d.dataset.wasOpen = String(d.open); d.open = true; }));
  addEventListener('afterprint', () => $$('details.tl-more').forEach((d) => { d.open = d.dataset.wasOpen === 'true'; }));
})();
