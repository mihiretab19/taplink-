import { supabase } from './supabase-client.js';
import { getUser, signOut, showToast, escapeHtml } from './main.js';

let usersList = [];

// ── Auth Guard & Init ──────────────────────────────────────
async function initAdmin() {
  const user = await getUser();
  
  if (!user || user.email !== 'mihiretabbedilu@gmail.com') {
    // Show access denied screen
    document.getElementById('deniedScreen').style.display = 'flex';
    return;
  }

  // Authorized Admin — display dashboard
  document.getElementById('adminLayout').style.display = 'flex';
  
  // Set details in sidebar
  document.getElementById('sidebarUserName').textContent = user.user_metadata?.full_name || 'Admin';
  const av = document.getElementById('sidebarAvatar');
  if (av) av.textContent = user.email[0].toUpperCase();

  // Load telemetry data
  await loadAdminStats();
}

// ── Load Stats via secure RPC ─────────────────────────────
async function loadAdminStats() {
  const tableBody = document.getElementById('usersTableBody');
  
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_data');
    
    if (error) throw error;

    const totalUsers = data.total_users || 0;
    const totalCards = data.total_cards || 0;
    const conversion = totalUsers > 0 ? Math.round((totalCards / totalUsers) * 100) : 0;

    // Update stat cards
    document.getElementById('statTotalUsers').textContent = totalUsers;
    document.getElementById('statTotalCards').textContent = totalCards;
    document.getElementById('statConversion').textContent = `${conversion}%`;

    usersList = data.users_list || [];
    renderUsersTable(usersList);

  } catch (err) {
    console.error('Failed to fetch admin stats:', err);
    showToast('Failed to load system logs', 'error');
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:var(--clr-danger)">
          Error querying database. Ensure you ran the get_admin_dashboard_data SQL migrations in Supabase.
        </td>
      </tr>
    `;
  }
}

// ── Render Registry Table ─────────────────────────────────
function renderUsersTable(list) {
  const tableBody = document.getElementById('usersTableBody');
  
  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color:var(--clr-text-3)">No registered users found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = list.map(item => {
    const joinedDate = new Date(item.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    const statusBadge = item.has_card
      ? `<span class="badge-card-status badge-card-active">Active</span>`
      : `<span class="badge-card-status badge-card-inactive">None</span>`;

    const actionButton = item.has_card
      ? `<a href="profile.html?id=${item.card_id}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:11px">View Card</a>`
      : `<span style="color:var(--clr-text-3); font-size:11px">—</span>`;

    return `
      <tr>
        <td style="font-weight:600; color:var(--clr-text)">${escapeHtml(item.email)}</td>
        <td style="font-family:monospace; font-size:12px; color:var(--clr-text-3)">${item.id}</td>
        <td>${joinedDate}</td>
        <td>${statusBadge}</td>
        <td>${actionButton}</td>
      </tr>
    `;
  }).join('');
}

// ── Search Registry Filter ────────────────────────────────
document.getElementById('adminSearchInput')?.addEventListener('input', e => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = usersList.filter(u => u.email?.toLowerCase().includes(query));
  renderUsersTable(filtered);
});

// ── Sign Out ───────────────────────────────────────────────
document.getElementById('signOutBtn')?.addEventListener('click', () => signOut());

// ── Responsive mobile sidebar ──────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function checkMobile() {
  const toggle = document.getElementById('sidebarToggle');
  if (!toggle) return;
  toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
}

window.addEventListener('resize', checkMobile);
checkMobile();

initAdmin();
