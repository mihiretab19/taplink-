// ============================================================
// TAPLINK — CARD BUILDER JS (Supabase Integrated)
// Real-time preview, drag-drop, template selection, save
// ============================================================

import { getCard, getCards, saveCard, generateId, showToast, fileToBase64, getUser, escapeHtml, sanitizeUrl } from './main.js';

// ── State ─────────────────────────────────────────────────
let cardState = {
  id: null,
  name: '', title: '', company: '', phone: '', email: '',
  website: '', location: '', bio: '', about: '',
  avatar: null, cover: null,
  social: {},
  links: [],
  template: 0,
  design: { accent: '#00ff88', btnText: '#030d06', font: 'Space Grotesk' },
  views: 0, saves: 0, scans: 0
};

// ── Template definitions ───────────────────────────────────
const TEMPLATES = [
  { name: 'Neon',     gradient: 'linear-gradient(135deg,#00ff88,#004d2c)', dark: true  },
  { name: 'Midnight', gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)', dark: false },
  { name: 'Aurora',   gradient: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', dark: false },
  { name: 'Frost',    gradient: 'linear-gradient(135deg,#0ea5e9,#0369a1)', dark: false },
  { name: 'Ember',    gradient: 'linear-gradient(135deg,#f97316,#dc2626)', dark: false },
  { name: 'Minimal',  gradient: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', dark: false },
];

// ── Load existing card (edit mode) ────────────────────────
async function loadFromQuery() {
  const user = await getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (id) {
    // Edit mode — load the specific card
    const existing = await getCard(id);
    if (existing) {
      cardState = { ...cardState, ...existing };
      populateFields();
    } else {
      showToast('Card not found', 'error');
    }
  } else {
    // New card mode — enforce one card per account
    const allCards = await getCards();
    if (allCards.length > 0) {
      // User already has a card — redirect them to edit it instead
      showToast('You already have a card — editing it now', 'info');
      history.replaceState(null, '', `builder.html?id=${allCards[0].id}`);
      cardState = { ...cardState, ...allCards[0] };
      populateFields();
    } else {
      // No card yet — allow creation
      cardState.id = generateId();
    }
  }
}


function populateFields() {
  const fields = ['name','title','company','bio','phone','email','website','location','about'];
  fields.forEach(f => {
    const el = document.getElementById(`inp-${f}`);
    if (el && cardState[f]) el.value = cardState[f];
  });

  // Social
  const socials = ['facebook','instagram','linkedin','tiktok','telegram','twitter','youtube','whatsapp'];
  socials.forEach(s => {
    const el = document.getElementById(`soc-${s}`);
    if (el && cardState.social?.[s]) el.value = cardState.social[s];
  });

  // Avatar
  if (cardState.avatar) {
    const circle = document.getElementById('avatarPreview');
    const initial = document.getElementById('avatarInitial');
    circle.innerHTML = `<img src="${cardState.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    if (initial) initial.remove();
  }

  // Cover
  if (cardState.cover) {
    const wrap = document.getElementById('coverPreviewWrap');
    wrap.innerHTML = `<img src="${cardState.cover}" class="preview-img" alt="cover">`;
  }

  // Design
  if (cardState.design?.accent) {
    document.getElementById('colorAccent').value = cardState.design.accent;
  }
  if (cardState.design?.btnText) {
    document.getElementById('colorBtnText').value = cardState.design.btnText;
  }

  // Template
  document.querySelectorAll('.template-option').forEach((el, i) => {
    el.classList.toggle('selected', i === cardState.template);
  });

  // Font
  if (cardState.design?.font) {
    document.querySelectorAll('.font-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.font === cardState.design.font);
    });
  }

  // Links
  renderCustomLinks();
  updateAboutCount();
  renderPreview();
}

// ── Tabs ──────────────────────────────────────────────────
document.querySelectorAll('.builder-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.builder-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
});

// ── Field bindings ─────────────────────────────────────────
function bindFields() {
  const textFields = ['name','title','company','bio','phone','email','website','location','about'];
  textFields.forEach(f => {
    const el = document.getElementById(`inp-${f}`);
    if (!el) return;
    el.addEventListener('input', () => {
      cardState[f] = el.value;
      if (f === 'about') updateAboutCount();
      renderPreview();
    });
  });

  const socials = ['facebook','instagram','linkedin','tiktok','telegram','twitter','youtube','whatsapp'];
  socials.forEach(s => {
    const el = document.getElementById(`soc-${s}`);
    if (!el) return;
    el.addEventListener('input', () => {
      cardState.social = cardState.social || {};
      cardState.social[s] = el.value;
      renderPreview();
    });
  });
}

function updateAboutCount() {
  const el = document.getElementById('aboutCount');
  const inp = document.getElementById('inp-about');
  if (el && inp) el.textContent = inp.value.length;
}

// ── Avatar upload ─────────────────────────────────────────
document.getElementById('avatarInput')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const b64 = await fileToBase64(file);
  cardState.avatar = b64;
  const circle = document.getElementById('avatarPreview');
  circle.innerHTML = `<img src="${b64}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  renderPreview();
  showToast('Profile photo uploaded', 'success');
});

// ── Cover upload ──────────────────────────────────────────
document.getElementById('coverInput')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const b64 = await fileToBase64(file);
  cardState.cover = b64;
  const wrap = document.getElementById('coverPreviewWrap');
  wrap.innerHTML = `<img src="${b64}" class="preview-img" alt="cover">`;
  renderPreview();
  showToast('Cover image uploaded', 'success');
});

// ── Template grid ─────────────────────────────────────────
function renderTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  if (!grid) return;
  grid.innerHTML = TEMPLATES.map((tpl, i) => `
    <div class="template-option ${i === cardState.template ? 'selected' : ''}" data-index="${i}">
      <div class="tpl-opt-cover" style="background:${tpl.gradient}"></div>
      <div class="tpl-opt-label">${tpl.name}</div>
    </div>`).join('');

  grid.querySelectorAll('.template-option').forEach(el => {
    el.addEventListener('click', () => {
      cardState.template = parseInt(el.dataset.index);
      grid.querySelectorAll('.template-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      renderPreview();
    });
  });
}

// ── Color pickers ─────────────────────────────────────────
document.getElementById('colorAccent')?.addEventListener('input', e => {
  cardState.design.accent = e.target.value;
  renderPreview();
});
document.getElementById('colorBtnText')?.addEventListener('input', e => {
  cardState.design.btnText = e.target.value;
  renderPreview();
});

document.querySelectorAll('.color-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    cardState.design.accent = color;
    document.getElementById('colorAccent').value = color;
    const isDark = isColorDark(color);
    const btnText = isDark ? '#ffffff' : '#030d06';
    cardState.design.btnText = btnText;
    document.getElementById('colorBtnText').value = btnText;
    renderPreview();
  });
});

function isColorDark(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

// ── Font selection ────────────────────────────────────────
document.querySelectorAll('.font-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.font-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    cardState.design.font = btn.dataset.font;
    renderPreview();
  });
});

// ── Custom Links ──────────────────────────────────────────
let sortableInstance = null;

function renderCustomLinks() {
  const list = document.getElementById('customLinksList');
  if (!list) return;

  if (cardState.links.length === 0) {
    list.innerHTML = `<p style="text-align:center;font-size:var(--fs-sm);color:var(--clr-text-3);padding:var(--sp-lg)">No custom links yet. Add one below.</p>`;
    return;
  }

  list.innerHTML = cardState.links.map((link, i) => `
    <div class="custom-link-item" data-index="${i}">
      <div class="drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <div class="custom-link-label">${link.label}</div>
        <div class="custom-link-url">${link.url}</div>
      </div>
      <button class="btn btn-icon btn-danger btn-sm remove-link-btn" data-index="${i}" style="width:32px;height:32px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`).join('');

  list.querySelectorAll('.remove-link-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      cardState.links.splice(idx, 1);
      renderCustomLinks();
      renderPreview();
    });
  });

  if (sortableInstance) sortableInstance.destroy();
  if (typeof Sortable !== 'undefined') {
    sortableInstance = new Sortable(list, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: evt => {
        const moved = cardState.links.splice(evt.oldIndex, 1)[0];
        cardState.links.splice(evt.newIndex, 0, moved);
        renderPreview();
      }
    });
  }
}

document.getElementById('addLinkBtn')?.addEventListener('click', () => {
  const label = document.getElementById('newLinkLabel').value.trim();
  const url   = document.getElementById('newLinkUrl').value.trim();
  if (!label || !url) { showToast('Please enter both label and URL', 'error'); return; }
  cardState.links.push({ id: generateId(), label, url });
  document.getElementById('newLinkLabel').value = '';
  document.getElementById('newLinkUrl').value = '';
  renderCustomLinks();
  renderPreview();
  showToast('Link added!', 'success');
});

// ── Preview renderer ──────────────────────────────────────
function renderPreview() {
  const screen = document.getElementById('previewScreen');
  if (!screen) return;

  const tpl = TEMPLATES[cardState.template] || TEMPLATES[0];
  const accent = cardState.design?.accent || '#00ff88';
  const btnText = cardState.design?.btnText || '#030d06';
  const font = cardState.design?.font || 'Space Grotesk';
  const coverStyle = cardState.cover
    ? `background-image:url('${cardState.cover}');background-size:cover;background-position:center`
    : `background:${tpl.gradient}`;

  const avatarContent = cardState.avatar
    ? `<img src="${cardState.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover">`
    : `<span style="color:${accent};font-weight:700;font-size:1.2rem">${escapeHtml((cardState.name || '?')[0]?.toUpperCase()||'')}</span>`;

  const hasSocials = Object.values(cardState.social || {}).some(v => v);
  const socialIcons = buildSocialIcons(cardState.social || {}, accent, btnText);

  const linksHTML = cardState.links.map(l => `
    <a href="${sanitizeUrl(l.url)}" class="pv-link-btn" style="background:rgba(0,0,0,0.25);border-color:${accent}40;color:var(--clr-text)" target="_blank" rel="noopener noreferrer">
      ${escapeHtml(l.label)}
    </a>`).join('');

  screen.innerHTML = `
    <div class="profile-preview-inner" style="font-family:'${font}',sans-serif">
      <div class="pv-cover" style="${coverStyle};position:relative">
        <div class="pv-avatar" style="border-color:var(--clr-bg)">
          ${avatarContent}
        </div>
      </div>
      <div class="pv-body">
        <p class="pv-name">${escapeHtml(cardState.name) || 'Your Name'}</p>
        ${cardState.title   ? `<p class="pv-title">${escapeHtml(cardState.title)}</p>` : ''}
        ${cardState.company ? `<p class="pv-company">@ ${escapeHtml(cardState.company)}</p>` : ''}
        ${cardState.bio     ? `<p class="pv-bio">${escapeHtml(cardState.bio)}</p>` : ''}

        <div class="pv-contact-btns">
          ${cardState.phone ? `
            <a href="tel:${escapeHtml(cardState.phone)}" class="pv-contact-btn" style="background:${accent}18;border-color:${accent}40;color:${accent}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.42A2 2 0 0 1 3.62 1.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.94a16 16 0 0 0 6.06 6.06l.97-.97a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.74 16.92z"/></svg>
              Call
            </a>` : ''}
          ${cardState.email ? `
            <a href="mailto:${escapeHtml(cardState.email)}" class="pv-contact-btn" style="background:${accent}18;border-color:${accent}40;color:${accent}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email
            </a>` : ''}
          ${cardState.website ? `
            <a href="${sanitizeUrl(cardState.website)}" class="pv-contact-btn" style="background:${accent}18;border-color:${accent}40;color:${accent}" target="_blank" rel="noopener noreferrer">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Web
            </a>` : ''}
          ${cardState.location ? `
            <span class="pv-contact-btn" style="background:${accent}18;border-color:${accent}40;color:${accent}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHtml(cardState.location.split(',')[0])}
            </span>` : ''}
        </div>

        ${hasSocials ? `<div class="pv-socials">${socialIcons}</div>` : ''}
        ${cardState.links.length ? `<div class="pv-links">${linksHTML}</div>` : ''}

        ${cardState.about ? `
          <div style="width:100%;margin-top:10px;background:rgba(0,0,0,0.2);border-radius:8px;padding:10px">
            <p style="font-size:0.6rem;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px">About</p>
            <p style="font-size:0.62rem;color:var(--clr-text-2);line-height:1.5">${escapeHtml(cardState.about)}</p>
          </div>` : ''}

        <button class="pv-save-btn" style="background:linear-gradient(135deg,${accent},${accent}cc);color:${btnText}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
          Save Contact
        </button>
      </div>
    </div>`;
}

function buildSocialIcons(social, accent, btnText) {
  const defs = {
    facebook:  { label: 'fb', color: '#1877f2', bg: 'rgba(24,119,242,0.15)' },
    instagram: { label: 'ig', color: '#e1306c', bg: 'rgba(225,48,108,0.15)' },
    linkedin:  { label: 'in', color: '#0a66c2', bg: 'rgba(10,102,194,0.15)' },
    tiktok:    { label: 'tt', color: '#fff',    bg: 'rgba(255,255,255,0.1)'  },
    telegram:  { label: 'tg', color: '#0088cc', bg: 'rgba(0,136,204,0.15)'  },
    twitter:   { label: 'x',  color: '#fff',    bg: 'rgba(255,255,255,0.1)'  },
    youtube:   { label: 'yt', color: '#ff0000', bg: 'rgba(255,0,0,0.15)'    },
    whatsapp:  { label: 'wa', color: '#25d366', bg: 'rgba(37,211,102,0.15)' },
  };

  return Object.entries(social)
    .filter(([,v]) => v)
    .map(([k, v]) => {
      const def = defs[k] || { label: k.slice(0,2), color: accent, bg: 'rgba(255,255,255,0.1)' };
      const href = k === 'whatsapp' ? `https://wa.me/${v.replace(/\D/g,'')}` : v;
      return `<a href="${href}" class="pv-social-btn" style="background:${def.bg};border-color:${def.color}40;color:${def.color}" target="_blank" title="${k}">${def.label.toUpperCase()}</a>`;
    }).join('');
}

// ── Save card ─────────────────────────────────────────────
document.getElementById('saveCardBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('saveCardBtn');
  if (!cardState.name) {
    showToast('Please enter a name for your card', 'error');
    document.querySelector('[data-tab="profile"]')?.click();
    document.getElementById('inp-name')?.focus();
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  cardState.updatedAt = new Date().toISOString();
  if (!cardState.createdAt) cardState.createdAt = cardState.updatedAt;
  
  try {
    await saveCard(cardState);
    showToast('Card saved!', 'success');
    if (!location.search.includes('id=')) {
      history.replaceState(null, '', `builder.html?id=${cardState.id}`);
    }
  } catch (err) {
    showToast('Failed to save card', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Save Changes`;
  }
});

// ── Preview public ────────────────────────────────────────
document.getElementById('previewPublicBtn')?.addEventListener('click', async () => {
  if (!cardState.name) {
    showToast('Please add a name first', 'error');
    return;
  }
  
  cardState.updatedAt = new Date().toISOString();
  if (!cardState.createdAt) cardState.createdAt = cardState.updatedAt;
  
  try {
    await saveCard(cardState);
    window.open(`profile.html?id=${cardState.id}`, '_blank');
  } catch(err) {
    showToast('Please save the card before previewing', 'error');
  }
});

// ── Preview toolbar ───────────────────────────────────────
document.getElementById('viewMobile')?.addEventListener('click', e => {
  document.querySelectorAll('.preview-toolbar button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  const phone = document.getElementById('previewPhone');
  phone.style.width = '300px';
  phone.style.height = '580px';
});
document.getElementById('viewDesktop')?.addEventListener('click', e => {
  document.querySelectorAll('.preview-toolbar button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  const phone = document.getElementById('previewPhone');
  phone.style.width = '480px';
  phone.style.height = '540px';
  phone.style.borderRadius = '16px';
});

// ── Init ──────────────────────────────────────────────────
async function initBuilder() {
  await loadFromQuery();
  bindFields();
  renderTemplateGrid();
  renderCustomLinks();
  renderPreview();
}

initBuilder();
