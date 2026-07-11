// ============================================================
// TAPLINK — PUBLIC PROFILE JS (Supabase Integrated)
// Renders card, QR code, vCard download
// ============================================================
import { getCard, saveCard, downloadVCard, showToast, escapeHtml, sanitizeUrl } from './main.js';


const TEMPLATES = [
  { name: 'Neon',     gradient: 'linear-gradient(135deg,#00ff88,#004d2c)' },
  { name: 'Midnight', gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)' },
  { name: 'Aurora',   gradient: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' },
  { name: 'Frost',    gradient: 'linear-gradient(135deg,#0ea5e9,#0369a1)' },
  { name: 'Ember',    gradient: 'linear-gradient(135deg,#f97316,#dc2626)' },
  { name: 'Minimal',  gradient: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)' },
];

const SOCIAL_META = {
  facebook:  { label: 'Facebook',  icon: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>', fill: 'currentColor', color: '#1877f2' },
  instagram: { label: 'Instagram', icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>', fill: 'none', color: '#e1306c' },
  linkedin:  { label: 'LinkedIn',  icon: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>', fill: 'currentColor', color: '#0a66c2' },
  tiktok:    { label: 'TikTok',    icon: '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z"/>', fill: 'currentColor', color: '#ffffff' },
  telegram:  { label: 'Telegram',  icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.19c-.06-.05-.14-.03-.2-.02-.08.02-1.3.83-3.67 2.42-.35.24-.66.35-.95.35-.31-.01-.91-.18-1.36-.32-.55-.18-1.03-.27-1-.57.02-.16.36-.32 1.02-.48 3.99-1.74 6.65-2.89 7.99-3.44 3.81-1.6 4.6-1.87 5.11-1.88.11 0 .37.03.54.16.14.11.18.26.2.39.02.11.04.36.02.55z"/>', fill: 'currentColor', color: '#0088cc' },
  twitter:   { label: 'X',         icon: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>', fill: 'currentColor', color: '#ffffff' },
  youtube:   { label: 'YouTube',   icon: '<path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>', fill: 'currentColor', color: '#ff0000' },
  whatsapp:  { label: 'WhatsApp',  icon: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>', fill: 'currentColor', color: '#25d366' },
};

// ── Load & Render ─────────────────────────────────────────
async function loadAndRenderProfile() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const root = document.getElementById('profileRoot');

  if (!id) { renderNotFound(root); return; }

  // 1. Stale-While-Revalidate Caching for Instant Taps
  const cacheKey = `card_cache_${id}`;
  let cachedData = null;
  try {
    cachedData = localStorage.getItem(cacheKey);
  } catch (e) {
    console.warn('localStorage is disabled or unavailable:', e);
  }
  let hasRenderedCache = false;

  if (cachedData) {
    try {
      const cachedCard = JSON.parse(cachedData);
      renderProfile(root, cachedCard);
      // Set page meta immediately from cache
      document.getElementById('pageTitle').textContent = `${cachedCard.name || 'Digital Card'} — Taplink`;
      const descEl = document.getElementById('pageDesc');
      if (descEl) {
        descEl.content = `${cachedCard.title || ''} ${cachedCard.company ? 'at ' + cachedCard.company : ''} — View digital business card on Taplink.`;
      }
      hasRenderedCache = true;
    } catch (e) {
      console.warn('Failed to parse cached card:', e);
    }
  }

  // 2. Fetch fresh data from Supabase
  const card = await getCard(id);
  if (!card) {
    if (!hasRenderedCache) {
      renderNotFound(root);
    }
    return;
  }

  // Cache the fresh card data
  try {
    localStorage.setItem(cacheKey, JSON.stringify(card));
  } catch (e) {
    console.warn('Failed to write to localStorage:', e);
  }

  // 3. Render fresh data (updates the UI with any changes)
  renderProfile(root, card);

  // ✅ Set page meta
  document.getElementById('pageTitle').textContent = `${card.name || 'Digital Card'} — Taplink`;
  const descEl = document.getElementById('pageDesc');
  if (descEl) descEl.content = `${card.title || ''} ${card.company ? 'at ' + card.company : ''} — View digital business card on Taplink.`;

  // (View tracking via saveCard removed because it causes auth errors for anonymous visitors)
}


function renderProfile(root, card) {
  const tpl = TEMPLATES[card.template || 0];
  const accent = card.design?.accent || '#00ff88';
  const btnText = card.design?.btnText || '#030d06';
  const font = card.design?.font || 'Space Grotesk';
  const coverStyle = card.cover
    ? `background-image:url('${card.cover}');background-size:cover;background-position:center`
    : `background:${tpl.gradient}`;

  const avatarContent = card.avatar
    ? `<img src="${card.avatar}" alt="${card.name || 'Avatar'}">`
    : `<span style="color:${accent}">${(card.name || '?')[0]?.toUpperCase() || 'U'}</span>`;

  const hasSocials = card.social && Object.values(card.social).some(v => v);
  const hasLinks = card.links && card.links.length > 0;
  const pageUrl = location.href;

  root.innerHTML = `
    <div class="profile-page">
      <div class="profile-card" style="font-family:'${font}',sans-serif">

        <!-- Cover -->
        <div class="profile-cover" style="${coverStyle}">
          <div class="cover-actions">
            <button class="cover-action-btn" id="openQrHeaderBtn" title="QR Code">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button class="cover-action-btn" id="copyLinkHeaderBtn" title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
        </div>

        <!-- Avatar -->
        <div class="profile-avatar-wrap">
          <div class="profile-avatar" style="color:${accent};box-shadow:0 0 24px ${accent}40">
            ${avatarContent}
          </div>
        </div>

        <!-- Info -->
        <div class="profile-info">
          <h1 class="profile-name">${escapeHtml(card.name) || 'Unknown'}</h1>
          ${card.title ? `<p class="profile-title">${escapeHtml(card.title)}</p>` : ''}
          ${card.company ? `
            <span class="profile-company-badge" style="background:${accent}18;color:${accent};border:1px solid ${accent}35">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              ${escapeHtml(card.company)}
            </span>` : ''}
          ${card.bio ? `<p class="profile-bio">${escapeHtml(card.bio)}</p>` : ''}
        </div>

        <!-- Save Contact — PRIMARY CTA -->
        <div class="save-contact-section">
          <button class="save-contact-btn" id="saveContactBtn"
            style="background:linear-gradient(135deg,${accent},${accent}cc);color:${btnText};box-shadow:0 0 28px ${accent}55">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Contact
          </button>
        </div>

        <!-- Contact Buttons -->
        ${(card.phone || card.email || card.website) ? `
          <div class="profile-actions">
            ${card.phone ? `
              <a href="tel:${escapeHtml(card.phone)}" class="profile-action-btn"
                style="background:${accent}12;border-color:${accent}35;color:${accent}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.42 2 2 0 0 1 3.62 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.94a16 16 0 0 0 6.06 6.06l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.74 16.92z"/></svg>
                Call
              </a>` : ''}
            ${card.email ? `
              <a href="mailto:${escapeHtml(card.email)}" class="profile-action-btn"
                style="background:${accent}12;border-color:${accent}35;color:${accent}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email
              </a>` : ''}
            ${card.website ? `
              <a href="${sanitizeUrl(card.website)}" class="profile-action-btn" target="_blank" rel="noopener noreferrer"
                style="background:${accent}12;border-color:${accent}35;color:${accent}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Website
              </a>` : ''}
          </div>` : ''}

        <!-- Location -->
        ${card.location ? `
          <div style="text-align:center;padding:0 var(--sp-lg) var(--sp-md)">
            <div class="location-chip" style="display:inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHtml(card.location)}
            </div>
          </div>` : ''}

        <!-- Social Links -->
        ${hasSocials ? `
          <div class="section-divider"><span>Connect</span></div>
          <div class="social-links-grid">
            ${buildSocialPills(card.social, accent)}
          </div>` : ''}

        <!-- Custom Links -->
        ${hasLinks ? `
          <div class="section-divider"><span>Links</span></div>
          <div class="custom-links-section">
            ${card.links.map(l => `
              <a href="${sanitizeUrl(l.url)}" class="custom-link-pill" target="_blank" rel="noopener noreferrer"
                style="background:${accent}10;border-color:${accent}35;color:var(--clr-text)">
                ${escapeHtml(l.label)}
              </a>`).join('')}
          </div>` : ''}

        <!-- About -->
        ${card.about ? `
          <div class="section-divider"><span>About</span></div>
          <div class="about-section">
            <div class="about-title" style="color:${accent}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              About
            </div>
            <p class="about-text">${escapeHtml(card.about)}</p>
          </div>` : ''}

        <!-- Share link bar -->
        <div class="section-divider"><span>Share</span></div>
        <div class="copy-link-bar">
          <input type="text" readonly id="shareLinkInput" value="${pageUrl}" />
          <button id="copyLinkBtn">Copy Link</button>
        </div>

        <!-- QR button -->
        <button class="qr-btn" id="openQrBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Show QR Code
        </button>

        <!-- Footer branding -->
        <div class="profile-footer">
          <a href="index.html">
            <div class="logo-icon">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#lg-pf)"/>
                <path d="M14 6v16M6 14h16" stroke="#030d06" stroke-width="3" stroke-linecap="round"/>
                <defs><linearGradient id="lg-pf" x1="0" y1="0" x2="28" y2="28">
                  <stop stop-color="#00ff88"/><stop offset="1" stop-color="#00cc66"/>
                </linearGradient></defs>
              </svg>
            </div>
            Create your own Taplink card — Free
          </a>
        </div>

      </div>
    </div>`;

  // Bind interactive elements
  document.getElementById('saveContactBtn')?.addEventListener('click', async () => {
    downloadVCard(card);
    try {
      card.saves = (card.saves || 0) + 1;
      await saveCard(card);
    } catch (e) {}
  });

  document.getElementById('openQrHeaderBtn')?.addEventListener('click', () => openQR(card));
  document.getElementById('copyLinkHeaderBtn')?.addEventListener('click', copyLink);
  document.getElementById('copyLinkBtn')?.addEventListener('click', copyLink);
  document.getElementById('openQrBtn')?.addEventListener('click', () => openQR(card));
}

// ── Social pills builder ───────────────────────────────────
function buildSocialPills(social, accent) {
  if (!social) return '';
  return Object.entries(social)
    .filter(([, v]) => v)
    .map(([key, value]) => {
      const meta = SOCIAL_META[key] || { label: key, icon: '', fill: 'none', color: accent };
      let href = value;
      if (key === 'whatsapp') href = `https://wa.me/${value.replace(/\D/g, '')}`;
      return `
        <a href="${href}" class="social-link-pill" target="_blank" rel="noopener"
          style="background:${meta.color}15;border-color:${meta.color}40;color:${meta.color}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${meta.fill}" stroke="${meta.fill === 'none' ? 'currentColor' : 'none'}" stroke-width="2">
            ${meta.icon}
          </svg>
          ${meta.label}
        </a>`;
    }).join('');
}

// ── Not Found ─────────────────────────────────────────────
function renderNotFound(root) {
  root.innerHTML = `
    <div class="not-found">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-3)" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h2>Card Not Found</h2>
      <p>This digital card doesn't exist or may have been deleted.</p>
      <a href="index.html" class="btn btn-primary btn-lg">Go to Taplink</a>
    </div>`;
}

// ── QR Code ───────────────────────────────────────────────
let qrInstance = null;

function openQR(card) {
  if (!card) return;

  document.getElementById('qrPersonName').textContent = `${card.name || 'Card'}'s QR Code`;
  const container = document.getElementById('qrBoxContainer');
  container.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    qrInstance = new QRCode(container, {
      text: location.href,
      width: 220,
      height: 220,
      colorDark: '#030d06',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    container.innerHTML = `<p style="word-break:break-all;font-size:12px;padding:8px">${location.href}</p>`;
  }

  document.getElementById('qrModal').classList.add('open');

  try {
    card.scans = (card.scans || 0) + 1;
    saveCard(card); // intentionally NOT awaited
  } catch (e) {}
}

function closeQR() {
  document.getElementById('qrModal').classList.remove('open');
}

// ── Download QR ────────────────────────────────────────────
document.getElementById('downloadQrBtn')?.addEventListener('click', () => {
  const canvas = document.querySelector('#qrBoxContainer canvas');
  if (canvas) {
    const a = document.createElement('a');
    a.download = 'taplink-qr.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('QR Code downloaded!', 'success');
  }
});

// ── QR Modal close ────────────────────────────────────────
document.getElementById('qrModal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeQR();
});
document.getElementById('closeQrBtn')?.addEventListener('click', closeQR);

// ── Copy link ─────────────────────────────────────────────
function copyLink() {
  navigator.clipboard.writeText(location.href)
    .then(() => showToast('Link copied to clipboard!', 'success'))
    .catch(() => {
      const inp = document.getElementById('shareLinkInput');
      if (inp) { inp.select(); document.execCommand('copy'); }
      showToast('Link copied!', 'success');
    });
}

// ── Init ──────────────────────────────────────────────────
loadAndRenderProfile();
