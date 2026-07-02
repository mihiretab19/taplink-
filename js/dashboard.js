// ============================================================
// TAPLINK — DASHBOARD JS (Supabase Integrated)
// ============================================================
import { getCards, getCard, deleteCard, getUser, openModal, closeModal, showToast, signOut } from './main.js';

let pendingDeleteId = null;
let currentQrCard = null;
let qrCodeInstance = null;

// ── Sign Out ───────────────────────────────────────────────
document.getElementById('signOutBtn')?.addEventListener('click', () => signOut());


// ── Render Cards ───────────────────────────────────────────
async function renderCards(filter = '') {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '<p style="text-align:center;width:100%;color:var(--clr-text-2)">Loading cards...</p>';
  
  const allCards = await getCards();
  const cards = allCards.filter(c =>
    !filter || c.name?.toLowerCase().includes(filter.toLowerCase()) ||
    c.title?.toLowerCase().includes(filter.toLowerCase())
  );

  updateStats(cards);

  if (cards.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        </div>
        <h3>No cards yet</h3>
        <p>Create your first digital business card and start networking like a pro.</p>
        <a href="builder.html" class="btn btn-primary btn-lg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Your First Card
        </a>
      </div>`;
    return;
  }

  grid.innerHTML = cards.map(card => cardItemHTML(card)).join('');
  attachCardActions();
}

function cardItemHTML(card) {
  const coverStyle = card.cover
    ? `background-image:url('${card.cover}');background-size:cover;background-position:center`
    : `background:${card.design?.gradient || 'linear-gradient(135deg,#00ff88,#004d2c)'}`;

  const avatarContent = card.avatar
    ? `<img src="${card.avatar}" alt="${card.name}">`
    : `<span style="color:${card.design?.accent||'var(--clr-primary)'}">${(card.name||'?')[0]?.toUpperCase()||'U'}</span>`;

  const avatarBorder = card.design?.accent || 'var(--clr-primary)';

  return `
    <div class="card-item" data-id="${card.id}">
      <div class="card-item-cover" style="${coverStyle}">
        <div class="card-item-avatar" style="border-color:${avatarBorder};background:var(--clr-bg-2)">
          ${avatarContent}
        </div>
      </div>
      <div class="card-item-body">
        <div class="card-item-name">${card.name || 'Unnamed Card'}</div>
        <div class="card-item-title">${card.title || ''}${card.company ? ' · ' + card.company : ''}</div>
        <div class="card-item-meta">
          <span class="badge badge-green">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${new Date(card.updatedAt || card.createdAt || Date.now()).toLocaleDateString()}
          </span>
          ${card.template !== undefined ? `<span class="badge badge-gray">${getTemplateName(card.template)}</span>` : ''}
        </div>
        <div class="card-item-actions">
          <button class="btn btn-primary btn-sm flex-1 edit-card-btn" data-id="${card.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn btn-secondary btn-sm preview-card-btn" data-id="${card.id}" data-tooltip="Preview profile">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-outline btn-sm qr-card-btn" data-id="${card.id}" data-name="${card.name||'Card'}" data-tooltip="Show QR Code">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button class="btn btn-outline btn-sm share-card-btn" data-id="${card.id}" data-tooltip="Copy link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button class="btn btn-danger btn-sm delete-card-btn" data-id="${card.id}" data-tooltip="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

function getTemplateName(tpl) {
  const names = ['Neon', 'Midnight', 'Aurora', 'Frost', 'Ember', 'Minimal'];
  return names[tpl] || 'Neon';
}

function attachCardActions() {
  document.querySelectorAll('.edit-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      window.location.href = `builder.html?id=${btn.dataset.id}`;
    });
  });
  document.querySelectorAll('.preview-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      window.open(`profile.html?id=${btn.dataset.id}`, '_blank');
    });
  });
  document.querySelectorAll('.delete-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      pendingDeleteId = btn.dataset.id;
      openModal('deleteModal');
    });
  });
  document.querySelectorAll('.qr-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showQR(btn.dataset.id, btn.dataset.name);
    });
  });
  document.querySelectorAll('.share-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const url = `${location.origin}${location.pathname.replace('dashboard.html','profile.html')}?id=${btn.dataset.id}`;
      navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard!', 'success'));
    });
  });
  document.querySelectorAll('.card-item').forEach(item => {
    item.addEventListener('click', () => {
      window.location.href = `builder.html?id=${item.dataset.id}`;
    });
  });
}

// ── Stats ──────────────────────────────────────────────────
function updateStats(cards) {
  document.getElementById('totalCards').textContent = cards.length;
  document.getElementById('totalViews').textContent = cards.reduce((s, c) => s + (c.views || 0), 0);
  document.getElementById('totalSaves').textContent = cards.reduce((s, c) => s + (c.saves || 0), 0);
  document.getElementById('totalScans').textContent = cards.reduce((s, c) => s + (c.scans || 0), 0);
}

// ── Sidebar card list ──────────────────────────────────────
async function renderSidebarCards() {
  const list = document.getElementById('sidebarCardsList');
  const allCards = await getCards();
  const cards = allCards.slice(0, 5);
  list.innerHTML = cards.map(c => `
    <a href="builder.html?id=${c.id}" class="sidebar-link">
      <div class="avatar" style="width:28px;height:28px;font-size:11px;border-color:${c.design?.accent||'var(--clr-primary)'}">${(c.name||'?')[0]?.toUpperCase()||'U'}</div>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.name||'Untitled'}</span>
    </a>`).join('');
}

// ── QR Modal ───────────────────────────────────────────────
async function showQR(id, name) {
  const card = await getCard(id);
  if (!card) return;

  currentQrCard = card;
  const url = `${location.origin}${location.pathname.replace('dashboard.html','profile.html')}?id=${id}`;
  document.getElementById('qrCardName').textContent = name || 'Card QR Code';

  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    qrCodeInstance = new QRCode(container, {
      text: url,
      width: 220,
      height: 220,
      colorDark: '#030d06',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    container.innerHTML = `<p style="color:var(--clr-text-3);font-size:var(--fs-sm)">QR: ${url}</p>`;
  }

  openModal('qrModal');
}

// ── Download QR ────────────────────────────────────────────
document.getElementById('downloadQrBtn')?.addEventListener('click', () => {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (canvas) {
    const a = document.createElement('a');
    a.download = `taplink-qr-${currentQrCard?.name || 'card'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('QR Code downloaded!', 'success');
  }
});

// ── Delete ─────────────────────────────────────────────────
document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
  if (pendingDeleteId) {
    await deleteCard(pendingDeleteId);
    pendingDeleteId = null;
    closeModal('deleteModal');
    renderCards();
    renderSidebarCards();
    showToast('Card deleted', 'success');
  }
});

// ── Search ─────────────────────────────────────────────────
document.getElementById('searchInput')?.addEventListener('input', e => {
  renderCards(e.target.value);
});

// ── Sidebar toggle (mobile) ────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── Responsive sidebar toggle button visibility ────────────
function checkMobile() {
  const toggle = document.getElementById('sidebarToggle');
  if (!toggle) return;
  toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
}

// ── User info & Auth Redirect ──────────────────────────────
async function populateUser() {
  const user = await getUser();
  if (!user) {
    // Redirect to login if not logged in
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('sidebarUserName').textContent = user.user_metadata?.full_name || 'User';
  document.getElementById('sidebarUserEmail').textContent = user.email || '';
  const av = document.getElementById('sidebarAvatar');
  if (av) av.textContent = (user.email || 'U')[0].toUpperCase();
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('resize', checkMobile);
checkMobile();

async function initDashboard() {
  await populateUser();
  await renderCards();
  await renderSidebarCards();
}

initDashboard();
