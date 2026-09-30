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

  // Bullet text: plain, except **bold lead-ins** (same markup the formal résumé uses)
  const rich = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, '<strong class="lead-in">$1</strong>');

  const words = String(P.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = P.firstName || words[0] || '';

  // (Site colors live in styles.css tokens so light and dark mode can each use their own accent)

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
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
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
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.link}</svg>`;

  // Solid marks for the contact circles: the real Gmail, Google Maps, LinkedIn, GitHub and Handshake logos and Apple's
  // phone handset, as silhouettes in the circle's dark brown (currentColor); cut-outs show the light-brown circle
  // (.logo-mark in styles.css). LinkedIn and GitHub are the official marks from Simple Icons (simpleicons.org, CC0);
  // the handset is traced from Apple's Phone app icon; Gmail, the Maps pin and Handshake's H are traced from the brands'
  // own logos. at() scales each one about the centre so they look the same size (about 20-21px across in the 26px mark).
  const svg24 = (inner) => `<svg class="logo-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const at = (k, inner, cy = 12) => `<g transform="translate(12 ${cy}) scale(${k}) translate(-12 -${cy})">${inner}</g>`;
  const BRANDS = {
    gmail: () => svg24(at(.92, '<path fill="currentColor" d="M2 6.3h4.29v12.62a.7.7 0 0 1-.7.7H2.7a.7.7 0 0 1-.7-.7zM17.71 6.3H22v12.62a.7.7 0 0 1-.7.7h-2.89a.7.7 0 0 1-.7-.7z"/><path fill="none" stroke="currentColor" stroke-width="4.11" stroke-linecap="round" stroke-linejoin="round" d="M4.13 6.5 11.96 12.99 19.87 6.5"/>')),
    maps: () => svg24(at(.92, '<path fill="currentColor" fill-rule="evenodd" d="M18.3 15.02C16.9 16.7 13.5 19.6 12.72 21.6C12.5 22.6 11.5 22.6 11.28 21.6C10.5 19.6 7.1 16.7 5.7 15.02A8.23 8.23 0 1 1 18.3 15.02ZM7.6 9.73a4.4 4.4 0 1 0 8.8 0a4.4 4.4 0 1 0 -8.8 0Z"/>')),
    linkedin: () => svg24(at(.77, '<path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>')),
    github: () => svg24(at(.8, '<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>', 12.3)),
    // Handshake: just its slanted H (crossbar rising to the right), without the tile
    handshake: () => svg24(at(1.25, '<path fill="currentColor" d="M9.636 4.3H12.1L10.683 12.462L13.579 9.998L14.564 4.3H17.028L14.356 19.7H11.892L13.132 12.539L10.244 15.003L9.428 19.7H6.964Z"/>')),
    // Apple's handset: its weight sits low-left, so it's nudged up-right a little to look centred
    phone: () => svg24(`<g transform="translate(.6 -.6)">${at(.86, '<path fill="currentColor" d="M3.03 0.08C3.57 -0.08 4.14 -0 4.57 0.39C5.14 0.91 6.76 3.75 7.25 4.58C7.58 5.13 7.98 5.65 7.89 6.34C7.73 7.67 6.25 8.76 6.59 10.17C6.83 11.16 8.73 13.05 9.47 13.81C10.28 14.63 12.63 17 13.59 17.35C15.21 17.93 16.33 16.16 17.87 16.14C18.9 16.13 19.91 17.08 20.75 17.59C21.37 17.97 21.97 18.37 22.59 18.75C24.1 19.68 24.42 20.36 23.43 21.98C23.2 22.34 22.95 22.66 22.63 22.95C20.48 24.98 16.97 23.75 14.7 22.58C10.04 20.18 5.74 16.09 2.83 11.73C2.2 10.79 1.69 9.81 1.16 8.82C-0.37 5.92 -0.88 1.29 3.03 0.08Z"/>')}</g>`),
    // Not linked today; here so an Instagram link added in profile.json gets a solid mark like the rest
    instagram: () => svg24(at(.92, '<path fill="currentColor" fill-rule="evenodd" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.3A2.7 2.7 0 0 0 4.3 7v10A2.7 2.7 0 0 0 7 19.7h10a2.7 2.7 0 0 0 2.7-2.7V7A2.7 2.7 0 0 0 17 4.3ZM12 7a5 5 0 1 1 0 10a5 5 0 1 1 0-10Zm0 2.3a2.7 2.7 0 1 0 0 5.4a2.7 2.7 0 1 0 0-5.4Z"/><circle cx="17.4" cy="6.6" r="1.4" fill="currentColor"/>')),
  };
  // A brand mark when there is one; any other link gets a bold link glyph in the same weight
  const mark = (name) => (BRANDS[name] ? BRANDS[name]()
    : svg24(at(.9, '<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')));

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
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code linking to ${esc(text)}"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${d}" fill="#2A1D15"/></svg>`;
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
      ctx.fillStyle = '#2A1D15';
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
    return `<div class="qr-empty">${esc(note)}</div>`;
  };

  /* -------------------------------------------------------------- sections */
  // About is left out entirely (with its nav links) until it has content; the others renumber.
  const aboutData = P.about || {};
  const aboutChapters = arr(aboutData.chapters).filter((c) => has(c?.text) || has(c?.label));
  const aboutNumbers = arr(aboutData.numbers).filter((n) => has(n?.value));
  const aboutHobbies = arr(aboutData.hobbies).filter((h) => has(h?.name));
  // ("Where I'm headed" renders in the Résumé section, so it doesn't count toward About)
  const hasAbout = aboutChapters.length > 0 || aboutNumbers.length > 0 || aboutHobbies.length > 0 || has(P.photo);

  const sectionHead = (title, id, lead = '') => `
    <h2 id="${id}">${title}</h2>
    ${has(lead) ? `<p class="lead">${esc(lead)}</p>` : ''}`;

  // A button that drops down a short list of links (the "Contact me" menu).
  // Opening it drops in each circle and slides out its label (see .reach in styles.css).
  // Each item: { href, label, icon }, plus optional `attrs` (extra attributes for the link) and `hint` (tooltip).
  const dropdown = ({ id, label, iconName, cls = 'btn btn-primary', menuLabel, items }) => {
    const list = items.filter(Boolean);
    if (!list.length) return '';
    return `
      <div class="reach">
        <button class="${cls} reach-toggle" type="button" aria-expanded="false" aria-controls="${id}">
          ${icon(iconName)}${esc(label)}<svg class="icon chev" viewBox="0 0 24 24" aria-hidden="true">${ICONS.chevron}</svg>
        </button>
        <ul class="reach-menu" id="${id}" aria-label="${esc(menuLabel)}">
          ${list.map((w, i) => `
            <li style="--i:${i}">
              <a class="reach-item" href="${esc(w.href)}"${w.attrs || ''}${w.hint ? ` title="${esc(w.hint)}"` : ''}>
                <span class="reach-circle">${mark(w.icon)}</span>
                <span class="reach-label">${esc(w.label)}</span>
              </a>
            </li>`).join('')}
        </ul>
      </div>`;
  };

  // "Contact me": email, phone, then each profile
  const contactMenu = () => dropdown({
    id: 'reach-menu', label: 'Contact me', iconName: 'message', menuLabel: `Ways to reach ${firstName}`,
    items: [
      has(P.email) && { href: `mailto:${P.email}`, icon: 'gmail', label: P.email, hint: 'Email' },
      has(P.phone) && { href: `tel:${digits(P.phone)}`, icon: 'phone', label: P.phone, hint: 'Call' },
      ...socials.map((s) => ({ href: s.url, icon: s.icon, label: s.label, attrs: ' target="_blank" rel="noopener me"' })),
    ],
  });

  // "My résumé": one tap opens the PDF in a new tab (phones show it in their PDF viewer)
  const resumeLink = (cls) => FILES.pdf
    ? `<a class="${cls}" href="${esc(FILES.pdf)}" target="_blank" rel="noopener">${icon('file')}My résumé</a>`
    : '';

  function renderHero() {
    const actions = [
      FILES.vcf && `<a class="btn btn-primary" href="${esc(FILES.vcf)}">${icon('userPlus')}Save my contact</a>`,
      resumeLink('btn btn-primary'),
      contactMenu(),
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
        <div class="hero-copy">
          ${items.map((html, i) => html.replace(/^<(\w+)/, `<$1 data-reveal style="--d:${i * 70}ms"`)).join('')}
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
          ${sectionHead('Who am I?', 'about-title')}
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

  // Folded list items: each bullet drops in with its card, then its text reveals left to right (--i staggers them)
  const foldItem = (html, i) => `<li style="--i:${i}"><span class="li-text">${html}</span></li>`;
  const bulletList = (bullets) => {
    const items = arr(bullets).map((b, i) => foldItem(rich(b), i));
    return items.length ? `<ul class="tl-bullets">${items.join('')}</ul>` : '';
  };

  // Tap-to-expand cards: each role (and the college card) shows only its summary (title, dates, where, pills) and
  // folds its detail away. The button in the summary's heading is stretched over the whole summary, so tapping
  // anywhere on it opens or closes the detail (setFold under "Folding cards" below; the height animates in styles.css).
  let foldSeq = 0;
  const foldButton = (label, id) =>
    `<button class="fold-toggle" type="button" aria-expanded="false" aria-controls="${id}">${esc(label)}</button>`;
  // head(id) renders the summary (id is '' when there's nothing to fold); detail is the HTML that folds away.
  // pills (skill tags / badges) sit just below the folded detail: under the title while closed, then carried
  // smoothly down to the bottom of the card as the detail grows open above them.
  const fold = (head, detail, pills = '') => {
    if (!detail) return `<div class="fold-head">${head('')}${pills}</div>`;
    const id = `fold-${++foldSeq}`;
    return `
      <div class="fold-head">
        ${head(id)}
        <span class="fold-chev" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24" focusable="false">${ICONS.chevron}</svg></span>
      </div>
      <div class="fold" id="${id}"><div class="fold-inner" hidden="until-found">${detail}</div></div>
      ${pills ? `<div class="fold-pills">${pills}</div>` : ''}`;
  };

  const roleHead = (x, tag, id) => `
    <div class="tl-meta">
      <${tag} class="tl-title">${id ? foldButton(x.title, id) : esc(x.title)}</${tag}>
      ${has(x.dates) ? `<span class="tl-dates">${esc(x.dates)}</span>` : ''}
    </div>`;
  const tagList = (x) =>
    has(x.tags) ? `<ul class="tags" aria-label="Skills used">${arr(x.tags).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  // A role folds its bullets; its skill tags are the pills (under the title while closed, at the bottom once open)
  const roleDetail = (x) => bulletList(x.bullets);

  // Back-to-back roles at the same employer and location share one card under one employer
  // heading (like the formal résumé), so the org line isn't repeated for every role.
  // The group header has no combined date range: each role keeps its own dates.
  const byEmployer = (items) => items.reduce((groups, x) => {
    const prev = groups[groups.length - 1]?.[0];
    const same = prev && has(x.org) && x.org === prev.org && (x.location || '') === (prev.location || '');
    if (same) groups[groups.length - 1].push(x);
    else groups.push([x]);
    return groups;
  }, []);

  const timeline = (items) => `
    <ol class="timeline">
      ${byEmployer(arr(items)).map((g) => `
        <li class="tl-item" data-reveal>
          ${g.length === 1 ? `
            <article class="tl-card${roleDetail(g[0]) ? ' foldable' : ''}">
              ${fold((id) => `
                ${roleHead(g[0], 'h4', id)}
                ${has(g[0].org) || has(g[0].location) ? `<p class="tl-org">${[g[0].org, g[0].location].filter(has).map(esc).join(' <span aria-hidden="true">·</span> ')}</p>` : ''}`,
              roleDetail(g[0]), tagList(g[0]))}
            </article>` : `
            <article class="tl-card tl-group">
              <header class="tl-employer">
                <h4 class="tl-employer-name">${esc(g[0].org)}</h4>
                ${has(g[0].location) ? `<span class="tl-employer-loc">${esc(g[0].location)}</span>` : ''}
              </header>
              ${g.map((x) => `
                <div class="tl-role${roleDetail(x) ? ' foldable' : ''}">
                  ${fold((id) => roleHead(x, 'h5', id), roleDetail(x), tagList(x))}
                </div>`).join('')}
            </article>`}
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

  // "Relevant coursework: …" → bold label. Same rule as build.ps1 (label ≤ 40 raw characters).
  const labeled = (text) => {
    const m = /^([^:]{1,40}):(.*)$/s.exec(String(text));
    return m ? `<b>${esc(m[1])}:</b>${esc(m[2])}` : esc(text);
  };

  // "brief": true (e.g. high school) shows a compact card: school plus one line, no details.
  // A full card shows school, degree and badges; its detail lines (coursework, internships) fold away.
  const eduCard = (e) => {
    if (e.brief) return `
      <article class="edu edu--brief" data-reveal>
        <h4 class="edu-school">${esc(e.school)}</h4>
        <p class="edu-degree">${[e.degree, e.dates, e.honors].filter(has).map(esc).join(' <span aria-hidden="true">·</span> ')}</p>
      </article>`;
    const details = [...arr(e.details), ...arr(e.webDetails)];
    const detail = details.length ? `<ul class="edu-details">${details.map((d, i) => foldItem(labeled(d), i)).join('')}</ul>` : '';
    const badges = [e.dates, has(e.gpa) ? `GPA ${e.gpa}` : '', e.honors, e.location].filter(has);
    return `
      <article class="edu${detail ? ' foldable' : ''}" data-reveal>
        ${fold((id) => `
          <h4 class="edu-school">${id ? foldButton(e.school, id) : esc(e.school)}</h4>
          <p class="edu-degree">${esc(e.degree)}</p>`,
        detail, badges.length ? `<ul class="badges">${badges.map((b) => `<li class="badge">${esc(b)}</li>`).join('')}</ul>` : '')}
      </article>`;
  };

  // "Where I'm headed" follows the history that explains it (last on phones; under Volunteer on desktop).
  const headedBlock = () => {
    const asp = aboutData.aspirations || {};
    if (!has(asp.text)) return '';
    // Same look as the rest of the section: a block title and a plain card
    return `
      <div class="headed-block">
        ${blockTitle('headed')}
        <div class="headed-card" data-reveal>
          <p>${esc(asp.text)}</p>
          ${has(asp.lookingFor) ? `<ul class="skill-list" aria-label="What I'm looking for">${arr(asp.lookingFor).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`;
  };

  function renderResume() {
    const r = P.resume || {};
    const resumeCta = FILES.pdf
      ? resumeLink('btn btn-primary btn-lg')
      : '<p class="download-missing">The résumé PDF hasn\'t been generated yet. Run build.cmd.</p>';
    // The website can go deeper than the one-page résumé: webSkills (if present) replaces skills here
    const skillGroups = has(P.webSkills) ? P.webSkills : P.skills;
    const timelines = (keys) => keys.filter((key) => has(P[key])).map((key) => blockTitle(key) + timeline(P[key])).join('');
    const block = (cls, html) => (html ? `<div class="${cls}">${html}</div>` : '');
    // Desktop: two independent columns (Experience, Volunteer, "Where I'm headed" | Education, Skills), so opening a
    // card never opens a gap in the other column. Phones: the column wrappers dissolve and the blocks reorder to
    // Experience, Education, Skills, Volunteer, "Where I'm headed" (styles.css, .resume-grid).
    return `
      <div class="container">
        <header class="section-head resume-head">
          <div data-reveal>${sectionHead('Experience &amp; education', 'resume-title', r.summary)}</div>
          <div class="resume-cta" data-reveal style="--d:120ms">${resumeCta}</div>
        </header>
        <div class="resume-grid">
          <div class="resume-col">
            ${block('rg-work', timelines(['experience', 'projects']))}
            ${block('rg-later', timelines(['leadership', 'volunteer']))}
            ${block('rg-headed', headedBlock())}
          </div>
          <div class="resume-col">
            ${block('rg-edu', has(P.education) ? blockTitle('education') + arr(P.education).map(eduCard).join('') : '')}
            ${block('rg-skills', has(skillGroups) ? `
              ${blockTitle('skills')}
              <div class="skills-card" data-reveal>
                ${arr(skillGroups).map((g) => `
                  <div class="skill-group">
                    <h4>${esc(g.group)}</h4>
                    <ul class="skill-list">${arr(g.items).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
                  </div>`).join('')}
              </div>` : '')}
          </div>
        </div>
      </div>`;
  }

  // One compact row per way to reach you: the row itself is the main link (email, call, map,
  // profile), with small extra actions (copy, text) at the end, like the "Contact me" menu
  function renderContact() {
    const tel = digits(P.phone || '');
    const copyBtn = (text, what) =>
      `<button class="icon-btn row-btn" type="button" data-copy="${esc(text)}" data-copy-label="${what}" aria-label="Copy ${what.toLowerCase()}" title="Copy">${icon('copy')}</button>`;
    const textBtn = `<a class="icon-btn row-btn" href="sms:${esc(tel)}" aria-label="Send a text" title="Text">${icon('message')}</a>`;
    const rows = [
      has(P.email) && {
        href: `mailto:${P.email}`, icon: 'gmail', value: P.email, label: 'Email',
        actions: copyBtn(P.email, 'Email address'),
      },
      has(P.phone) && {
        href: `tel:${tel}`, icon: 'phone', value: P.phone, label: 'Call or text',
        actions: textBtn + copyBtn(P.phone, 'Phone number'),
      },
      has(P.location) && {
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(P.location)}`,
        icon: 'maps', value: P.location, label: has(P.locationNote) ? P.locationNote : 'Location', external: true,
      },
      ...socials.map((s) => ({ href: s.url, icon: s.icon, value: s.label, label: s.handle, external: true, me: true })),
    ].filter(Boolean);
    return `
      <div class="container">
        <header class="section-head" data-reveal>
          ${sectionHead('How to reach me', 'contact-title', P.contactNote)}
        </header>
        <ul class="contact-list">
          ${rows.map((r, i) => `
            <li class="contact-row" data-reveal style="--d:${i * 40}ms">
              <a class="contact-main" href="${esc(r.href)}"${r.external ? ` target="_blank" rel="noopener${r.me ? ' me' : ''}"` : ''}>
                <span class="contact-circle">${mark(r.icon)}</span>
                <span class="contact-text">
                  <span class="contact-value">${esc(r.value).replace('@', '@<wbr>')}</span>
                  <span class="contact-label">${esc(r.label)}</span>
                </span>
                ${r.external ? `<svg class="icon arrow" viewBox="0 0 24 24" aria-hidden="true">${ICONS.arrow}</svg>` : ''}
              </a>
              ${r.actions ? `<span class="contact-actions">${r.actions}</span>` : ''}
            </li>`).join('')}
        </ul>
        <div class="contact-cta" data-reveal>
          ${FILES.vcf ? `<a class="btn btn-primary btn-lg" href="${esc(FILES.vcf)}">${icon('userPlus')}Save my contact card</a>` : ''}
          <button class="btn btn-primary btn-lg" type="button" data-share>${icon('qr')}Share this page</button>
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
  $('#brand').innerHTML = `<span class="brand-name">${esc(P.name)}</span>`;
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

  // Theme toggle: an icon button on desktop, a switch on phones (its knob shows a sun in light mode, a moon in dark)
  const themeMeta = $('meta[name="theme-color"]');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  const syncTheme = () => {
    const dark = currentTheme() === 'dark';
    $$('[data-theme-toggle="icon"]').forEach((b) => {
      b.innerHTML = icon(dark ? 'sun' : 'moon');
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
    $$('[data-theme-toggle="switch"]').forEach((b) => {
      b.setAttribute('aria-checked', String(dark));
      $('.theme-switch-thumb', b).innerHTML = icon(dark ? 'moon' : 'sun');
    });
    // The phone's browser bar matches the wine top bar
    themeMeta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--hdr').trim() || getComputedStyle(document.body).backgroundColor);
  };
  let themeFadeTimer;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    // Fade the colors into the new theme instead of snapping (skipped for reduced motion)
    if (!reducedMotion) {
      root.classList.add('theme-fade');
      clearTimeout(themeFadeTimer);
      themeFadeTimer = setTimeout(() => root.classList.remove('theme-fade'), 800);
    }
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch { /* private mode */ }
    syncTheme();
  });
  darkQuery.addEventListener?.('change', syncTheme);
  syncTheme();

  // Dropdowns ("Contact me"): a button that toggles a list of links/actions
  $$('.reach').forEach((wrap) => {
    const toggle = $('.reach-toggle', wrap);
    const setOpen = (open) => {
      wrap.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!wrap.classList.contains('is-open')));
    // A tap or click anywhere else closes it. iPhones don't send "click" for taps on plain text or
    // background, so pointerdown covers those.
    const closeIfOutside = (e) => { if (!wrap.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('click', closeIfOutside);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrap.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    // Keyboard users tabbing past the list close it (mouse clicks on items are handled below)
    wrap.addEventListener('focusout', (e) => { if (e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false); });
    // Choosing an item closes the menu; if focus was on that item (keyboard), hand it back to the button
    // so it isn't left on a hidden link (e.g. after "Share / QR code" or a theme switch)
    $('.reach-menu', wrap).addEventListener('click', (e) => {
      if (!e.target.closest('a, button')) return;
      setTimeout(() => {
        const hadFocus = $('.reach-menu', wrap).contains(document.activeElement);
        setOpen(false);
        if (hadFocus) toggle.focus();
      }, 150);
    });
  });

  // Share dialog with a downloadable QR code
  const fileBase = String(P.name || 'my-site').replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-') || 'my-site';
  const fillShare = () => {
    const url = pageUrl();
    $('[data-qr-large]', dialog).innerHTML = qrMarkup(url, 2);
    // The link can wrap after a "/" on narrow phones, never in the middle of a word
    const urlEl = $('[data-share-url]', dialog);
    urlEl.textContent = url ? '' : 'Not online yet: publish the site to get its link.';
    if (url) {
      const parts = url.split('/');
      parts.forEach((p, i) => {
        urlEl.append(p);
        if (i < parts.length - 1) { urlEl.append('/'); if (parts[i + 1]) urlEl.append(document.createElement('wbr')); }
      });
    }
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

  // If the share popup opened before the QR library arrived, draw the code that was "Loading…"
  qrReady.then(() => { if (dialog.open) fillShare(); });
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

  // Highlight the section you're reading in the desktop nav: a cream pill glides to the current tab. It holds a
  // wine copy of the labels, moved the opposite way, so the text under the pill is always wine (styles.css .nav-glide).
  const navLinks = $$('[data-nav]');
  const navEl = navLinks[0]?.parentElement;
  const glide = document.createElement('span');
  const glideLabels = document.createElement('span');
  glide.className = 'nav-glide'; glide.setAttribute('aria-hidden', 'true');
  glideLabels.className = 'nav-glide-labels';
  navLinks.forEach((a) => { const s = document.createElement('span'); s.textContent = a.textContent; glideLabels.append(s); });
  glide.append(glideLabels);
  let pillTab = null;
  const placeGlide = (animate = true) => {
    if (!navEl || !pillTab) return;
    if (!animate) navEl.classList.add('no-glide-anim');
    navLinks.forEach((a, i) => Object.assign(glideLabels.children[i].style, {
      left: `${a.offsetLeft}px`, top: `${a.offsetTop}px`, width: `${a.offsetWidth}px`, height: `${a.offsetHeight}px`,
    }));
    const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = pillTab;
    Object.assign(glide.style, { transform: `translate(${x}px, ${y}px)`, width: `${w}px`, height: `${h}px` });
    glideLabels.style.transform = `translate(${-x}px, ${-y}px)`;
    if (!animate) { void glide.offsetWidth; navEl.classList.remove('no-glide-anim'); }
  };
  if (navEl) { navEl.append(glide); navEl.classList.add('has-glide'); }
  const topbar = $('#topbar');
  const phoneBar = matchMedia('(max-width: 759px)');

  // Phones: the section "wheel" on the left of the bar shows only the current section. As the page scrolls it glides
  // sideways to the new section; swiping it moves the page to whichever section it lands on. It's a scroll-snapping
  // strip of the section names, one per width, set into the bar (styles.css .wheel). Tapping it drops down all the
  // sections, like the "Contact me" menu (it's the toggle of that .reach dropdown).
  const wheel = $('.wheel', topbar);
  const wheelMenu = $('#section-menu');
  const wheelLinks = navLinks.map((a) => {
    const w = document.createElement('span');
    w.className = 'wheel-label'; w.dataset.wheel = a.dataset.nav; w.textContent = a.textContent;
    return w;
  });
  const wheelScroller = document.createElement('div');
  wheelScroller.className = 'wheel-scroller'; wheelScroller.setAttribute('aria-hidden', 'true'); wheelScroller.append(...wheelLinks);
  wheel?.append(wheelScroller);
  if (wheelMenu) wheelMenu.innerHTML = navLinks.map((a, i) => `<li style="--i:${i}"><a class="reach-item" href="${a.getAttribute('href')}" data-go="${a.dataset.nav}"><span class="reach-label">${esc(a.textContent)}</span></a></li>`).join('');
  const wheelItems = wheelMenu ? $$('a[data-go]', wheelMenu) : [];
  let wheelUser = false;      // true once a sideways swipe (and its momentum) is moving the wheel
  let wheelPressed = false;   // finger (or mouse button) still down on the wheel
  let wheelGrabbed = -1;      // the section the wheel showed when the finger went down
  let wheelFrame = 0;
  let wheelSettleTimer;
  const wheelIndex = () => (wheelScroller.clientWidth ? Math.round(wheelScroller.scrollLeft / wheelScroller.clientWidth) : 0);
  const indexOf = (id) => navLinks.findIndex((a) => a.dataset.nav === id);
  // The wheel button names the current section; the menu marks it
  const markWheel = (i) => {
    if (wheel && wheelLinks[i]) wheel.setAttribute('aria-label', `Sections, current: ${wheelLinks[i].textContent}`);
    wheelItems.forEach((w, k) => { if (k === i) w.setAttribute('aria-current', 'true'); else w.removeAttribute('aria-current'); });
  };
  // Glide the wheel to section i (snapping is off while it glides, so the ease isn't fought). A new section
  // arriving mid-glide carries on from the current speed instead of easing in from a stop.
  const WHEEL_MS = reducedMotion ? 0 : 420;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const easeOutCubic = (t) => 1 - (1 - t) ** 3;
  const spinWheel = (i, animate = true) => {
    if (!wheel || i < 0) return;
    const retarget = wheelFrame !== 0;
    cancelAnimationFrame(wheelFrame); wheelFrame = 0;
    markWheel(i);
    const from = wheelScroller.scrollLeft;
    const to = i * wheelScroller.clientWidth;
    if (!animate || !WHEEL_MS || !phoneBar.matches || Math.abs(to - from) < 1) {
      wheelScroller.classList.remove('is-gliding');
      wheelScroller.scrollLeft = to;
      return;
    }
    wheelScroller.classList.add('is-gliding');
    const ease = retarget ? easeOutCubic : easeInOut;
    let start = 0;
    const step = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / WHEEL_MS);
      wheelScroller.scrollLeft = from + (to - from) * ease(t);
      if (t < 1) wheelFrame = requestAnimationFrame(step);
      else { wheelFrame = 0; wheelScroller.classList.remove('is-gliding'); }
    };
    wheelFrame = requestAnimationFrame(step);
  };

  const atTop = () => scrollY < 8;
  let currentId = '';
  let holdUntil = 0;   // while a jump from the wheel is under way, the scroll spy leaves the highlight alone
  const holding = () => performance.now() < holdUntil;
  const inBand = new Set();   // sections crossing the middle of the screen (kept by the scroll spy below)
  const setActive = (id) => {
    navLinks.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    const first = !currentId;
    if (id !== currentId && !wheelUser) spinWheel(indexOf(id), !first);
    currentId = id;
    const next = navLinks.find((a) => a.dataset.nav === id) || null;
    if (next === pillTab) return;
    pillTab = next;
    placeGlide(!first);
  };
  // Put the highlight on whatever the page is actually showing (after a hold ends)
  const resync = () => {
    if (atTop()) setActive('home');
    else if (inBand.size && !inBand.has(currentId)) setActive([...inBand].pop());
  };
  // Tab sizes change with the window and once the fonts load: re-place the pill and the wheel without animating.
  // (iPhones fire resize as their toolbars collapse while scrolling; the width doesn't change, so that's ignored.)
  let lastWidth = innerWidth;
  const replace = (e) => {
    if (e?.type === 'resize' && innerWidth === lastWidth) return;
    lastWidth = innerWidth;
    placeGlide(false);
    if (!wheelUser) spinWheel(indexOf(currentId), false);
  };
  addEventListener('resize', replace);
  phoneBar.addEventListener?.('change', replace);
  document.fonts?.ready.then(() => replace());

  // Jump to a section from the wheel: highlight it right away and hold it there while the page scrolls. The hold ends
  // when the page stops (scrollend) or after 1.6s where scrollend isn't supported, then the highlight re-checks.
  let holdTimer;
  const endHold = () => { holdUntil = 0; clearTimeout(holdTimer); resync(); };
  const jumpTo = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActive(id);
    holdUntil = performance.now() + 1600;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(endHold, 1600);
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  addEventListener('scrollend', () => { if (holdUntil) endHold(); });
  if (wheel) {
    // A swipe: when the wheel comes to rest on a different section than it started on, go there
    const wheelSettled = () => {
      if (!wheelUser || wheelPressed) return;
      wheelUser = false;
      const i = wheelIndex();
      const id = wheelLinks[i]?.dataset.wheel;
      if (id && id !== currentId && i !== wheelGrabbed) jumpTo(id);
      else spinWheel(indexOf(currentId));   // back to the page's section
    };
    const settleSoon = () => { clearTimeout(wheelSettleTimer); wheelSettleTimer = setTimeout(wheelSettled, 160); };
    // The wheel only counts as swiped once it's moved sideways (a vertical drag that starts on it just scrolls the page)
    const takeWheel = () => {
      if (wheelUser) return;
      wheelUser = true;
      if (wheel.parentElement.classList.contains('is-open')) wheel.click();   // a swipe closes the section menu
      cancelAnimationFrame(wheelFrame); wheelFrame = 0;
      wheelScroller.classList.remove('is-gliding');
    };
    // Touch: the finger is down from touchstart to touchend (Chrome fires pointercancel as soon as a touch pans,
    // so pointer events can't tell when the finger lifts)
    let startX = 0, startY = 0;
    wheelScroller.addEventListener('touchstart', (e) => {
      wheelPressed = true; wheelGrabbed = wheelIndex(); clearTimeout(wheelSettleTimer);
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    wheelScroller.addEventListener('touchmove', (e) => {
      const dx = Math.abs(e.touches[0].clientX - startX), dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 6 && dx > dy) takeWheel();
    }, { passive: true });
    for (const ev of ['touchend', 'touchcancel']) {
      wheelScroller.addEventListener(ev, () => { wheelPressed = false; if (wheelUser) settleSoon(); }, { passive: true });
    }
    // Trackpads and mice: only a sideways scroll moves the wheel
    wheelScroller.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (!wheelUser) wheelGrabbed = wheelIndex();
      takeWheel(); settleSoon();
    }, { passive: true });
    wheelScroller.addEventListener('scroll', () => {
      if (!wheelUser) return;
      if (wheelPressed) clearTimeout(wheelSettleTimer);
      else settleSoon();
    }, { passive: true });
    wheelScroller.addEventListener('scrollend', () => { if (wheelUser && !wheelPressed) wheelSettled(); });
    // Tapping the wheel opens the section menu (the .reach dropdown code handles it); choosing a section goes there.
    // Keyboard: Enter or Space opens the menu, the arrow keys go to the previous/next section.
    wheelMenu?.addEventListener('click', (e) => {
      const item = e.target.closest('a[data-go]');
      if (!item) return;
      e.preventDefault();
      jumpTo(item.dataset.go);
    });
    wheel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wheel.click(); return; }
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      const next = step && wheelLinks[indexOf(currentId) + step];
      if (!next) return;
      e.preventDefault();
      jumpTo(next.dataset.wheel);
    });
  }
  // Top bar border once scrolled. At the very top, Home is the current section even on tall
  // screens where the short intro leaves About across the middle of the view.
  const onScroll = () => {
    topbar.classList.toggle('is-scrolled', !atTop());
    if (atTop() && !holding()) setActive('home');
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in window) {
    // Sections currently crossing the middle band. A section entering the band becomes current; when the
    // current one leaves, the one still in the band takes over (on phones the short intro can end inside
    // the band, so About is already there when Home leaves and never "enters" again).
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) inBand.add(en.target.id);
        else inBand.delete(en.target.id);
        if (en.isIntersecting && !holding()) setActive(en.target.id);
      });
      if (holding()) return;
      const current = navLinks.find((a) => a.classList.contains('is-active'))?.dataset.nav;
      if (inBand.size && !inBand.has(current)) setActive([...inBand].pop());
      if (atTop()) setActive('home');
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

  // Folding cards: tapping a summary opens/closes its detail. Closed detail is hidden="until-found": out of the way for
  // keyboard and screen readers, but Ctrl+F and #:~:text= links can still find it, and then open the card
  // (beforematch). Browsers without until-found treat it as plain hidden. Print shows every detail (styles.css).
  const setFold = (btn, open) => {
    const region = document.getElementById(btn.getAttribute('aria-controls'));
    const inner = region.firstElementChild;
    clearTimeout(region._t);
    if (open) {
      inner.removeAttribute('hidden');
      region.removeAttribute('inert');
      void inner.offsetHeight;   // lay out the closed detail first, so it still fades in
    } else {
      region.setAttribute('inert', '');   // inert while it animates shut, then hidden until found
      region._t = setTimeout(() => { inner.setAttribute('hidden', 'until-found'); region.removeAttribute('inert'); }, reducedMotion ? 0 : 450);
    }
    btn.setAttribute('aria-expanded', String(open));
    btn.closest('.foldable')?.classList.toggle('is-open', open);
  };
  document.addEventListener('click', (e) => {
    // The summary's button, or the card's pills (part of the summary while it's closed)
    const btn = e.target.closest('.fold-toggle')
      || e.target.closest('.foldable > .fold-pills')?.parentElement.querySelector(':scope > .fold-head .fold-toggle');
    if (btn) setFold(btn, btn.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('beforematch', (e) => {
    const region = e.target.closest?.('.fold');
    const btn = region && document.querySelector(`.fold-toggle[aria-controls="${region.id}"]`);
    if (btn) setFold(btn, true);
  }, true);
})();
